const fs = require("fs");
const path = require("path");

// Configurações
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
    // Outros campos relevantes para comparação
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

    // Comparação básica com fallbacks
    const basicMatch =
      norm1.address === norm2.address && norm1.price === norm2.price;

    // Comparação de descrição com tratamento para campos ausentes
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
function processPlatformResults(platform) {
  const now = new Date().toISOString();

  try {
    // Carrega dados existentes com fallback
    const existingFile = path.join(
      EXISTING_RESULTS_PATH,
      `${platform}Results.json`
    );
    let existingData = [];
    if (fs.existsSync(existingFile)) {
      try {
        existingData = JSON.parse(fs.readFileSync(existingFile, "utf8")) || [];
      } catch (e) {
        console.error(
          `Erro ao ler arquivo existente de ${platform}:`,
          e.message
        );
        existingData = [];
      }
    }

    // Carrega novos dados com tratamento de erro
    const newFile = path.join(NEW_RESULTS_PATH, `${platform}Results.json`);
    let newData = [];
    if (fs.existsSync(newFile)) {
      try {
        newData = JSON.parse(fs.readFileSync(newFile, "utf8")) || [];
      } catch (e) {
        console.error(`Erro ao ler novos dados de ${platform}:`, e.message);
        return;
      }
    } else {
      console.error(`Arquivo de novos dados não encontrado para ${platform}`);
      return;
    }

    // Processamento dos dados
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
          // Mantém o ID existente e atualiza campos
          matchedProperties.push({
            ...existingProp,
            ...validatedNew,
            id: existingProp.id, // Mantém ID original
            firstSeenAt: existingProp.firstSeenAt || validatedNew.firstSeenAt,
            lastSeenAt: now,
          });
        } else {
          // Adiciona nova propriedade
          newProperties.push(validatedNew);
        }
      } catch (e) {
        console.error("Erro ao processar propriedade:", e.message);
      }
    });

    // Combina os dados
    mergedData.push(...matchedProperties, ...newProperties);

    // Log de resultados
    console.log(`\n[${platform.toUpperCase()} Results]`);
    console.log(`Propriedades existentes: ${existingData.length}`);
    console.log(`Novas propriedades encontradas: ${newData.length}`);
    console.log(`Propriedades correspondentes: ${matchedProperties.length}`);
    console.log(`Novas propriedades adicionadas: ${newProperties.length}`);
    console.log(`Total após merge: ${mergedData.length}`);

    // Salva os dados mesclados
    fs.writeFileSync(
      path.join(EXISTING_RESULTS_PATH, `${platform}Results.json`),
      JSON.stringify(mergedData, null, 2)
    );
  } catch (error) {
    console.error(`Erro geral no processamento de ${platform}:`, error.message);
  }
}

// Processa todas as plataformas com tratamento de erros
PLATFORMS.forEach((platform) => {
  console.log(`\nIniciando processamento de ${platform.toUpperCase()}...`);
  processPlatformResults(platform);
});
