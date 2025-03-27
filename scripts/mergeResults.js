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
    description: prop.description || [],
    hasDuplicates: prop.hasDuplicates || false,
  };
}

/**
 * Processa os resultados de uma plataforma
 */
async function processPlatformResults(platform) {
  const now = new Date().toISOString();

  try {
    // Carrega dados existentes
    const existingFile = path.join(
      EXISTING_RESULTS_PATH,
      `${platform}Results.json`
    );
    let existingData = [];
    if (fs.existsSync(existingFile)) {
      existingData =
        JSON.parse(await fs.promises.readFile(existingFile, "utf8")) || [];
    }

    // Carrega novos dados
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);
    const newData =
      JSON.parse(await fs.promises.readFile(newFile, "utf8")) || [];

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
      path.join(EXISTING_RESULTS_PATH, `${platform}Results.json`),
      JSON.stringify(mergedData, null, 2)
    );
  } catch (error) {
    console.error(`Erro no processamento de ${platform}:`, error);
    throw error; // Propaga o erro para o GitHub Actions
  }
}

// Processa todas as plataformas
(async () => {
  try {
    console.log("\nIniciando processo de merge baseado em links...");

    for (const platform of PLATFORMS) {
      await processPlatformResults(platform);
    }

    console.log("\n✅ Merge concluído com sucesso");
  } catch (error) {
    console.error("\n❌ Erro durante o merge:", error.message);
    process.exit(1); // Falha o workflow
  }
})();
