import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import getBrasiliaTime from "./getBrasiliaTime.js";

// Configurações de caminho
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_RESULTS_PATH = path.join(__dirname, "../../querocasa/data/results");
const NEW_RESULTS_PATH = path.join(__dirname, "../../data/results");
const PLATFORMS = ["olx", "zap"];

/**
 * Função para leitura segura de arquivos JSON
 */
async function safeReadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      return [];
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");

    if (!fileContent.trim()) {
      console.warn(`Arquivo vazio: ${filePath}`);
      return [];
    }

    const parsedData = JSON.parse(fileContent);

    if (!Array.isArray(parsedData)) {
      console.warn(`Conteúdo inválido (não é array) em: ${filePath}`);
      return [];
    }

    return parsedData;
  } catch (error) {
    console.error(`Erro ao ler/parsear arquivo ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Verifica e cria a estrutura de diretórios e arquivos necessários
 */
async function checkAndCreateResultsDirectory() {
  try {
    if (!fs.existsSync(OLD_RESULTS_PATH)) {
      await fs.promises.mkdir(OLD_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${OLD_RESULTS_PATH}`);
    }

    if (!fs.existsSync(NEW_RESULTS_PATH)) {
      await fs.promises.mkdir(NEW_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${NEW_RESULTS_PATH}`);
    }

    for (const platform of PLATFORMS) {
      const existingFilePath = path.join(
        OLD_RESULTS_PATH,
        `${platform}Results.json`
      );
      const newFilePath = path.join(
        NEW_RESULTS_PATH,
        `${platform}Results.json`
      );

      if (!fs.existsSync(existingFilePath)) {
        await fs.promises.writeFile(
          existingFilePath,
          JSON.stringify([], null, 2)
        );
        console.log(`Arquivo existente criado: ${existingFilePath}`);
      }

      if (!fs.existsSync(newFilePath)) {
        await fs.promises.writeFile(newFilePath, JSON.stringify([], null, 2));
        console.log(`Arquivo novo criado: ${newFilePath}`);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar/criar diretórios/arquivos:", error);
    throw error;
  }
}

/**
 * Gera um ID único para novas propriedades
 */
function generateId() {
  return `prop_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Processa os resultados de uma plataforma
 */
const processPlatformResults = async (platform) => {
  const now = getBrasiliaTime();

  try {
    console.log(`\n🔄 Processando resultados da plataforma: ${platform}`);

    const oldFile = path.join(OLD_RESULTS_PATH, `${platform}Results.json`);
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);

    console.log(`📂 Carregando dados antigos de: ${oldFile}`);
    const oldData = await safeReadJsonFile(oldFile);
    console.log(`📂 Carregando novos dados de: ${newFile}`);
    const newData = await safeReadJsonFile(newFile);
    console.log(`📂 Dados antigos carregados (${platform}):`, oldData);
    console.log(`📂 Dados novos carregados (${platform}):`, newData);
    console.log(`📊 Propriedades antigas carregadas: ${oldData.length}`);
    console.log(`📊 Novas propriedades encontradas: ${newData.length}`);

    if (newData.length === 0) {
      console.log("⚠️ Nenhum dado novo encontrado - mantendo dados antigos");
      await fs.promises.writeFile(oldFile, JSON.stringify(oldData, null, 2));
      return;
    }

    // Processamento normal do merge
    const oldPropertiesByLink = new Map();
    oldData.forEach(
      (prop) => prop.link && oldPropertiesByLink.set(prop.link, prop)
    );

    const mergedData = [];
    let updatedCount = 0;
    let newCount = 0;
    let preservedCount = 0;

    // Primeiro adiciona todos os itens antigos que não têm link
    oldData.forEach((oldProp) => {
      if (!oldProp.link) {
        mergedData.push(oldProp);
        preservedCount++;
      }
    });

    // Cria um set com todos os links dos dados novos para verificação rápida
    const newLinks = new Set(newData.map((prop) => prop.link).filter(Boolean));

    // Adiciona itens antigos que não estão nos novos dados (marcados como removidos)
    oldData.forEach((oldProp) => {
      if (oldProp.link && !newLinks.has(oldProp.link)) {
        // Este item foi removido nos novos dados
        oldProp.__status = "removed";
        mergedData.push(oldProp);
      }
    });

    // Processa os novos dados
    newData.forEach((newProp) => {
      if (!newProp.link) {
        newCount++;
        mergedData.push({
          ...newProp,
          id: generateId(),
          firstSeenAt: now,
          lastSeenAt: now,
          scrapedAt: now,
          images: newProp.images || [],
          description: newProp.description || "",
          hasDuplicates: newProp.hasDuplicates || false,
          __status: "added",
        });
        return;
      }

      const oldProp = oldPropertiesByLink.get(newProp.link);
      if (oldProp) {
        updatedCount++;

        // Criamos uma cópia do objeto antigo para preservar todos os campos
        const mergedProp = { ...oldProp };

        // CAMPOS CRÍTICOS QUE DEVEM SER PRESERVADOS
        // 1. Garantimos que o ID original seja mantido
        mergedProp.id = oldProp.id;

        // 2. Garantimos que o scrapedAt original seja mantido
        mergedProp.scrapedAt = oldProp.scrapedAt;

        // 3. firstSeenAt deve ser mantido, pois é a data da primeira vez que o item foi visto
        mergedProp.firstSeenAt = oldProp.firstSeenAt;

        // 4. Atualizamos o lastSeenAt para a data atual
        mergedProp.lastSeenAt = now;

        // Log para debug (remover em produção se necessário)
        console.log(`Atualizando item com link: ${newProp.link}`);
        console.log(`  → ID original preservado: ${oldProp.id}`);
        console.log(`  → scrapedAt original preservado: ${oldProp.scrapedAt}`);

        // Atualiza os outros campos com as novas informações
        Object.keys(newProp).forEach((key) => {
          // Lista explícita de campos que não devem ser atualizados
          if (!["id", "firstSeenAt", "scrapedAt"].includes(key)) {
            mergedProp[key] = newProp[key];
          }
        });

        mergedProp.__status = "updated";

        mergedData.push(mergedProp);
      } else {
        newCount++;
        mergedData.push({
          ...newProp,
          id: generateId(),
          firstSeenAt: now,
          lastSeenAt: now,
          scrapedAt: now,
          images: newProp.images || [],
          description: newProp.description || "",
          hasDuplicates: newProp.hasDuplicates || false,
          __status: "added",
        });
      }
    });

    // Logs detalhados
    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`✅ Propriedades atualizadas: ${updatedCount}`);
    console.log(`✅ Novas propriedades adicionadas: ${newCount}`);
    console.log(`📊 Total após merge: ${mergedData.length}`);

    await fs.promises.writeFile(oldFile, JSON.stringify(mergedData, null, 2));

    if (process.env.GITHUB_ENV) {
      const envPath = process.env.GITHUB_ENV;
      const platformUpper = platform.toUpperCase();

      fs.appendFileSync(envPath, `${platformUpper}_UPDATED=${updatedCount}\n`);
      fs.appendFileSync(envPath, `${platformUpper}_NEW=${newCount}\n`);
      fs.appendFileSync(
        envPath,
        `${platformUpper}_REMOVED=${
          mergedData.filter((item) => item.__status === "removed").length
        }\n`
      );
      fs.appendFileSync(
        envPath,
        `${platformUpper}_TOTAL=${mergedData.length}\n`
      );
    }
  } catch (error) {
    console.error(`❌ Erro no processamento de ${platform}:`, error);
    throw error;
  }
};

// Processa todas as plataformas
(async () => {
  try {
    console.log("\nIniciando processo de merge baseado em links...");
    await checkAndCreateResultsDirectory();

    for (const platform of PLATFORMS) {
      await processPlatformResults(platform);
    }

    console.log("\n✅ Merge concluído com sucesso");
  } catch (error) {
    console.error("\n❌ Erro durante o merge:", error.message);
    process.exit(1);
  }
})();
