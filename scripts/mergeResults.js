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
 * Verifica e cria a estrutura de diretórios e arquivos necessários
 */
async function checkAndCreateResultsDirectory() {
  try {
    // Cria diretórios se não existirem
    if (!fs.existsSync(EXISTING_RESULTS_PATH)) {
      await fs.promises.mkdir(EXISTING_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${EXISTING_RESULTS_PATH}`);
    }

    if (!fs.existsSync(NEW_RESULTS_PATH)) {
      await fs.promises.mkdir(NEW_RESULTS_PATH, { recursive: true });
      console.log(`Diretório criado: ${NEW_RESULTS_PATH}`);
    }

    // Verifica e cria arquivos vazios se não existirem
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
 * Valida e completa os dados da propriedade
 */
function prepareProperty(prop, isNew = false) {
  const now = new Date().toISOString();

  // Se for uma propriedade existente, mantém os dados originais
  if (!isNew) {
    return {
      ...prop,
      lastSeenAt: now, // Apenas atualiza a data do último visto
    };
  }

  // Para novas propriedades, cria um novo objeto completo
  return {
    ...prop,
    id: `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    firstSeenAt: now,
    lastSeenAt: now,
    scrapedAt: now,
    images: prop.images || [],
    description: prop.description || "",
    hasDuplicates: prop.hasDuplicates || false,
  };
}

/**
 * Valida se o JSON é válido e retorna os dados parseados ou array vazio
 */
async function safeReadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      return [];
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");

    // Verifica se o arquivo está vazio
    if (!fileContent.trim()) {
      console.warn(`Arquivo vazio: ${filePath}`);
      return [];
    }

    const parsedData = JSON.parse(fileContent);

    // Verifica se o conteúdo parseado é um array
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
 * Processa os resultados de uma plataforma
 */
async function processPlatformResults(platform) {
  const now = new Date().toISOString();

  try {
    console.log(`\nProcessando resultados da plataforma: ${platform}`);

    // Caminhos dos arquivos
    const existingFile = path.join(
      EXISTING_RESULTS_PATH,
      `${platform}Results.json`
    );
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);

    // Carrega dados existentes (array vazio se não existir ou for inválido)
    const existingData = await safeReadJsonFile(existingFile);
    console.log(`Propriedades existentes carregadas: ${existingData.length}`);

    // Carrega novos dados (array vazio se não existir ou for inválido)
    const newData = await safeReadJsonFile(newFile);
    console.log(`Novas propriedades encontradas: ${newData.length}`);

    // Cria mapa de propriedades existentes por link
    const existingPropertiesByLink = new Map();
    existingData.forEach((prop) => {
      if (prop.link) {
        existingPropertiesByLink.set(prop.link, prop);
      }
    });

    // Processa os novos dados
    const mergedData = [];
    const newProperties = [];
    const updatedProperties = [];

    newData.forEach((newProp) => {
      if (!newProp.link) {
        // Se não tem link, trata como nova propriedade
        newProperties.push(prepareProperty(newProp, true));
        return;
      }

      const existingProp = existingPropertiesByLink.get(newProp.link);

      if (existingProp) {
        // Mantém a propriedade existente com todos seus dados originais
        updatedProperties.push(prepareProperty(existingProp, false));
      } else {
        // Adiciona como nova propriedade
        newProperties.push(prepareProperty(newProp, true));
      }
    });

    // Combina os dados (mantém propriedades não encontradas também)
    const remainingProperties = existingData.filter(
      (prop) => !newData.some((newProp) => newProp.link === prop.link)
    );

    mergedData.push(
      ...updatedProperties,
      ...newProperties,
      ...remainingProperties
    );

    // Log de resultados
    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`Propriedades existentes: ${existingData.length}`);
    console.log(`Novas propriedades encontradas: ${newData.length}`);
    console.log(`Propriedades atualizadas: ${updatedProperties.length}`);
    console.log(`Novas propriedades adicionadas: ${newProperties.length}`);
    console.log(
      `Propriedades não reencontradas: ${remainingProperties.length}`
    );
    console.log(`Total após merge: ${mergedData.length}`);

    // Salva os dados mesclados
    await fs.promises.writeFile(
      existingFile,
      JSON.stringify(mergedData, null, 2)
    );
    console.log(`Dados mesclados salvos em: ${existingFile}`);
  } catch (error) {
    console.error(`Erro no processamento de ${platform}:`, error);
    throw error; // Propaga o erro para o GitHub Actions
  }
}

// Processa todas as plataformas
(async () => {
  try {
    console.log("\nIniciando processo de merge baseado em links...");

    // Verifica e cria estrutura de diretórios/arquivos se necessário
    await checkAndCreateResultsDirectory();

    for (const platform of PLATFORMS) {
      await processPlatformResults(platform);
    }

    console.log("\n✅ Merge concluído com sucesso");
  } catch (error) {
    console.error("\n❌ Erro durante o merge:", error.message);
    process.exit(1); // Falha o workflow
  }
})();
