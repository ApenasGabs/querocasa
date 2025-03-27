const fs = require("fs");
const path = require("path");

// Configurações
const RESULTS_PATH = path.join(__dirname, "../../data/results");
const PLATFORMS = ["olx", "zap"];

/**
 * Validação básica de uma propriedade
 */
function validateProperty(prop, platform) {
  const errors = [];

  // Campos obrigatórios
  if (!prop.address || prop.address.trim() === "") {
    errors.push("Endereço ausente ou inválido");
  }

  if (!prop.price || typeof prop.price !== "string") {
    errors.push("Preço ausente ou inválido");
  }

  // Validação específica por plataforma
  if (platform === "olx") {
    if (!prop.link || !prop.link.includes("olx.com.br")) {
      errors.push("Link OLX inválido");
    }
  } else if (platform === "zap") {
    if (!prop.description || !Array.isArray(prop.description)) {
      errors.push("Descrição inválida");
    }
  }

  // Validação de imagens
  if (!prop.images || !Array.isArray(prop.images)) {
    errors.push("Lista de imagens inválida");
  } else if (prop.images.length === 0) {
    errors.push("Nenhuma imagem encontrada");
  } else {
    prop.images.forEach((img, index) => {
      if (!img.startsWith("http")) {
        errors.push(`Imagem ${index + 1} com URL inválida`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    property: prop,
  };
}

/**
 * Processa os resultados de uma plataforma
 */
function validatePlatformResults(platform) {
  const filePath = path.join(RESULTS_PATH, `${platform}Results.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo de resultados não encontrado para ${platform}`);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      errors: [],
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data)) {
      throw new Error("Formato de dados inválido - esperado array");
    }

    const validationResults = data.map((prop) =>
      validateProperty(prop, platform)
    );

    const validProperties = validationResults.filter((r) => r.isValid);
    const invalidProperties = validationResults.filter((r) => !r.isValid);

    // Gerar relatório consolidado
    const errorReport = invalidProperties.reduce((acc, curr) => {
      curr.errors.forEach((error) => {
        acc[error] = (acc[error] || 0) + 1;
      });
      return acc;
    }, {});

    console.log(`\n[${platform.toUpperCase()} Validation]`);
    console.log(`Total de propriedades: ${data.length}`);
    console.log(`Válidas: ${validProperties.length}`);
    console.log(`Inválidas: ${invalidProperties.length}`);
    console.log("\nErros encontrados:");
    console.table(errorReport);

    // Salvar relatório detalhado
    const reportPath = path.join(
      RESULTS_PATH,
      `${platform}ValidationReport.json`
    );
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          platform,
          total: data.length,
          valid: validProperties.length,
          invalid: invalidProperties.length,
          errorSummary: errorReport,
          invalidProperties: invalidProperties.map((p) => ({
            id: p.property.id || "unknown",
            address: p.property.address || "unknown",
            errors: p.errors,
          })),
        },
        null,
        2
      )
    );

    return {
      total: data.length,
      valid: validProperties.length,
      invalid: invalidProperties.length,
      errors: errorReport,
    };
  } catch (error) {
    console.error(`Erro ao validar dados de ${platform}:`, error.message);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      errors: [error.message],
    };
  }
}

// Processa todas as plataformas
function runValidation() {
  console.log("Iniciando validação dos dados...");
  let hasCriticalErrors = false;

  PLATFORMS.forEach((platform) => {
    const result = validatePlatformResults(platform);

    // Considerar erro crítico se mais de 30% dos dados forem inválidos
    if (result.total > 0 && result.invalid / result.total > 0.3) {
      console.error(`⚠️ ERRO CRÍTICO: ${platform} tem muitos dados inválidos`);
      hasCriticalErrors = true;
    }
  });

  if (hasCriticalErrors) {
    console.error("\n🚨 Problemas críticos encontrados na validação!");
    process.exit(1); // Falha no processo
  } else {
    console.log("\n✅ Validação concluída com sucesso");
  }
}

runValidation();
