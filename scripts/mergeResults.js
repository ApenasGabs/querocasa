import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configurações de caminho
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXISTING_RESULTS_PATH = path.join(
  __dirname,
  "../../querocasa/data/results"
);
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
    if (!fs.existsSync(EXISTING_RESULTS_PATH)) {
      await fs.promises.mkdir(EXISTING_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${EXISTING_RESULTS_PATH}`);
    }

    if (!fs.existsSync(NEW_RESULTS_PATH)) {
      await fs.promises.mkdir(NEW_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${NEW_RESULTS_PATH}`);
    }

    for (const platform of PLATFORMS) {
      const existingFilePath = path.join(
        EXISTING_RESULTS_PATH,
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
async function processPlatformResults(platform) {
  const now = new Date().toISOString();

  try {
    console.log(`\nProcessando resultados da plataforma: ${platform}`);

    const existingFile = path.join(
      EXISTING_RESULTS_PATH,
      `${platform}Results.json`
    );
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);

    const existingData = await safeReadJsonFile(existingFile);
    console.log(`Propriedades existentes carregadas: ${existingData.length}`);

    const newData = await safeReadJsonFile(newFile);

    console.log(`Propriedades existentes: ${existingData.length}`);
    console.log(`Novas propriedades encontradas: ${newData.length}`);

    if (newData.length === 0) {
      console.log("⚠️ Nenhum dado novo encontrado - mantendo dados existentes");
      await fs.promises.writeFile(
        existingFile,
        JSON.stringify(existingData, null, 2)
      );
      return;
    }

    // Processamento normal do merge
    const existingPropertiesByLink = new Map();
    existingData.forEach(
      (prop) => prop.link && existingPropertiesByLink.set(prop.link, prop)
    );

    const mergedData = [];
    let updatedCount = 0;
    let newCount = 0;

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
        });
        return;
      }

      const existingProp = existingPropertiesByLink.get(newProp.link);
      if (existingProp) {
        updatedCount++;
        mergedData.push({
          ...existingProp,
          lastSeenAt: now,
          ...Object.fromEntries(
            Object.entries(newProp).filter(
              ([key]) =>
                !["id", "firstSeenAt", "lastSeenAt", "scrapedAt"].includes(key)
            )
          ),
        });
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
        });
      }
    });

    // Logs detalhados
    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`Propriedades atualizadas: ${updatedCount}`);
    console.log(`Novas propriedades adicionadas: ${newCount}`);
    console.log(`Total após merge: ${mergedData.length}`);

    await fs.promises.writeFile(
      existingFile,
      JSON.stringify(mergedData, null, 2)
    );
  } catch (error) {
    console.error(`Erro no processamento de ${platform}:`, error);
    throw error;
  }
}
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
