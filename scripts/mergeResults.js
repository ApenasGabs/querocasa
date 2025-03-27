import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXISTING_RESULTS_PATH = path.join(
  __dirname,
  "../../querocasa/data/results"
);
const NEW_RESULTS_PATH = path.join(__dirname, "../../data/results");
const PLATFORMS = ["olx", "zap"];

/**
 * Normaliza os dados da propriedade para comparação segura
 */
function normalizeProperty(prop) {
  return {
    address: prop.address || "Sem endereço",
    price: prop.price || "Sem preço",
    description: prop.description || [],
    link: prop.link || null,
    hasDuplicates: prop.hasDuplicates || false,
  };
}

/**
 * Comparação robusta entre propriedades
 */
function isSameProperty(prop1, prop2) {
  try {
    const norm1 = normalizeProperty(prop1);
    const norm2 = normalizeProperty(prop2);

    const basicMatch =
      norm1.address === norm2.address && norm1.price === norm2.price;

    const desc1 = norm1.description
      .map((d) => JSON.stringify(d))
      .sort()
      .join("|");
    const desc2 = norm2.description
      .map((d) => JSON.stringify(d))
      .sort()
      .join("|");
    const descMatch = desc1 === desc2;

    return basicMatch && descMatch;
  } catch (error) {
    console.error("Erro na comparação de propriedades:", error);
    return false;
  }
}

/**
 * Valida e completa os dados da propriedade
 */
function validateProperty(prop, isNew = false) {
  const now = new Date().toISOString();
  const defaults = {
    id: `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    scrapedAt: now,
    firstSeenAt: isNew ? now : prop.firstSeenAt || now,
    lastSeenAt: now,
    images: prop.images || [],
    description: prop.description || [],
    hasDuplicates: prop.hasDuplicates || false,
  };

  return { ...defaults, ...prop };
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
      try {
        existingData =
          JSON.parse(await fs.promises.readFile(existingFile, "utf8")) || [];
      } catch (e) {
        console.error(
          `Erro ao ler arquivo existente de ${platform}:`,
          e.message
        );
        existingData = [];
      }
    }

    // Carrega novos dados
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);
    let newData = [];
    if (fs.existsSync(newFile)) {
      try {
        newData = JSON.parse(await fs.promises.readFile(newFile, "utf8")) || [];
      } catch (e) {
        console.error(`Erro ao ler novos dados de ${platform}:`, e.message);
        return;
      }
    } else {
      console.error(`Arquivo de novos dados não encontrado para ${platform}`);
      return;
    }

    // Processamento
    const mergedData = [];
    const newProperties = [];
    const matchedProperties = [];

    newData.forEach((newProp) => {
      try {
        const validatedNew = validateProperty(newProp, true);
        const existingProp = existingData.find((existing) =>
          isSameProperty(existing, validatedNew)
        );

        if (existingProp) {
          matchedProperties.push({
            ...existingProp,
            ...validatedNew,
            id: existingProp.id,
            firstSeenAt: existingProp.firstSeenAt || validatedNew.firstSeenAt,
            lastSeenAt: now,
          });
        } else {
          newProperties.push(validatedNew);
        }
      } catch (e) {
        console.error("Erro ao processar propriedade:", e.message);
      }
    });

    mergedData.push(...matchedProperties, ...newProperties);

    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`Propriedades existentes: ${existingData.length}`);
    console.log(`Novas propriedades encontradas: ${newData.length}`);
    console.log(`Propriedades correspondentes: ${matchedProperties.length}`);
    console.log(`Novas propriedades adicionadas: ${newProperties.length}`);
    console.log(`Total após merge: ${mergedData.length}`);

    await fs.promises.writeFile(
      path.join(EXISTING_RESULTS_PATH, `${platform}Results.json`),
      JSON.stringify(mergedData, null, 2)
    );
  } catch (error) {
    console.error(`Erro geral no processamento de ${platform}:`, error.message);
  }
}

// Processa todas as plataformas
(async () => {
  console.log("\nIniciando processo de merge...");
  for (const platform of PLATFORMS) {
    await processPlatformResults(platform);
  }
  console.log("\n✅ Merge concluído com sucesso");
})();
