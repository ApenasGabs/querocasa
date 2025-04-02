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
 * Gera um ID único para novas propriedades
 */
function generateId() {
  return `prop_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Processa os resultados de uma plataforma com a nova lógica de merge
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
    let propertiesWithoutLink = 0;

    newData.forEach((newProp) => {
      if (!newProp.link) {
        propertiesWithoutLink++;
        newProperties.push({
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
        // Mantém TODOS os dados originais e apenas atualiza lastSeenAt
        updatedProperties.push({
          ...existingProp,
          lastSeenAt: now,
          // Atualiza campos que podem ter mudado (exceto os metadados)
          ...Object.fromEntries(
            Object.entries(newProp).filter(
              ([key]) =>
                !["id", "firstSeenAt", "lastSeenAt", "scrapedAt"].includes(key)
            )
          ),
        });
      } else {
        // Adiciona como nova propriedade com todos os metadados
        newProperties.push({
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

    // Apenas propriedades que foram reencontradas são mantidas
    mergedData.push(...updatedProperties, ...newProperties);

    const removedProperties = existingData.length - updatedProperties.length;

    // Log de resultados
    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`Propriedades existentes: ${existingData.length}`);
    console.log(
      `Novas propriedades encontradas: ${newData.length} (${propertiesWithoutLink} sem link)`
    );
    console.log(`Propriedades atualizadas: ${updatedProperties.length}`);
    console.log(`Novas propriedades adicionadas: ${newProperties.length}`);
    console.log(`Propriedades removidas: ${removedProperties}`);
    console.log(`Total após merge: ${mergedData.length}`);

    // Salva os dados mesclados
    await fs.promises.writeFile(
      existingFile,
      JSON.stringify(mergedData, null, 2)
    );
    console.log(`Dados mesclados salvos em: ${existingFile}`);
  } catch (error) {
    console.error(`Erro no processamento de ${platform}:`, error);
    throw error;
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
