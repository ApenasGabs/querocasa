// mergeResults.js com AlaSQL e caminhos originais

import alasql from "alasql"; // Importa o AlaSQL
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import getBrasiliaTime from "./getBrasiliaTime.js";

// Configurações de caminho (mantidas conforme sua especificação)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definindo variáveis de caminho configuráveis
const DEFAULT_OLD_RESULTS_PATH = path.join(
  __dirname,
  "../../querocasa/data/results"
);
const DEFAULT_NEW_RESULTS_PATH = path.join(__dirname, "../../data/results");

// Variáveis que podem ser modificadas pela função configurePaths
let OLD_RESULTS_PATH = DEFAULT_OLD_RESULTS_PATH;
let NEW_RESULTS_PATH = DEFAULT_NEW_RESULTS_PATH;

const PLATFORMS = ["olx", "zap"];
const MAX_CONSECUTIVE_MISSES = 3; // Número de scrapes que um item pode faltar
const MAX_DAYS_TO_KEEP_REMOVED = 5; // Número de dias para manter itens removidos

/**
 * Função para configurar caminhos alternativos - usada principalmente para testes e CI
 */
export function configurePaths(oldPath, newPath) {
  OLD_RESULTS_PATH = oldPath || DEFAULT_OLD_RESULTS_PATH;
  NEW_RESULTS_PATH = newPath || DEFAULT_NEW_RESULTS_PATH;
  console.log(
    `[configurePaths] Caminhos configurados: OLD=${OLD_RESULTS_PATH}, NEW=${NEW_RESULTS_PATH}`
  );
}

/**
 * Função para leitura segura de arquivos JSON
 */
async function safeReadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[safeRead] Arquivo não encontrado: ${filePath}`);
      return [];
    }
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    if (!fileContent.trim()) {
      console.warn(`[safeRead] Arquivo vazio: ${filePath}`);
      return [];
    }
    const parsedData = JSON.parse(fileContent);
    if (!Array.isArray(parsedData)) {
      console.warn(
        `[safeRead] Conteúdo inválido (não é array) em: ${filePath}`
      );
      return [];
    }
    return parsedData;
  } catch (error) {
    console.error(
      `[safeRead] Erro ao ler/parsear arquivo ${filePath}:`,
      error.message
    );
    return [];
  }
}

/**
 * Verifica e cria a estrutura de diretórios e arquivos necessários (OPCIONAL)
 * Se seus arquivos já são garantidos pela pipeline, pode não ser necessário.
 * Mantido para consistência com seu script original.
 */
async function checkAndCreateResultsDirectory() {
  try {
    if (!fs.existsSync(OLD_RESULTS_PATH)) {
      await fs.promises.mkdir(OLD_RESULTS_PATH, { recursive: true });
      console.log(`Diretório antigo criado: ${OLD_RESULTS_PATH}`);
    }
    if (!fs.existsSync(NEW_RESULTS_PATH)) {
      await fs.promises.mkdir(NEW_RESULTS_PATH, { recursive: true });
      console.log(`Diretório de novos dados criado: ${NEW_RESULTS_PATH}`);
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
        console.log(
          `Arquivo existente de fallback criado: ${existingFilePath}`
        );
      }
      if (!fs.existsSync(newFilePath)) {
        await fs.promises.writeFile(newFilePath, JSON.stringify([], null, 2));
        console.log(`Arquivo novo de fallback criado: ${newFilePath}`);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar/criar diretórios/arquivos:", error);
    // Não relançar o erro aqui pode ser perigoso se os caminhos forem críticos.
    // Se os diretórios são essenciais, talvez devesse relançar.
  }
}

/**
 * Gera um ID único para novas propriedades
 */
function generateId() {
  return `prop_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Processa os resultados de uma plataforma usando AlaSQL
 */
export const processPlatformResults = async (platform) => {
  const now = getBrasiliaTime();

  const oldFilePath = path.join(OLD_RESULTS_PATH, `${platform}Results.json`);
  const newDataFromScraperPath = path.join(
    NEW_RESULTS_PATH,
    `${platform}Results.json`
  );

  console.log(`\n[${platform}] 🔄 Processando resultados com AlaSQL...`);
  console.log(
    `[${platform}] 📂 Carregando dados antigos de: ${path.resolve(oldFilePath)}`
  );
  let oldData = await safeReadJsonFile(oldFilePath);
  console.log(
    `[${platform}] 📂 Carregando novos dados do scraper de: ${path.resolve(
      newDataFromScraperPath
    )}`
  );
  let newData = await safeReadJsonFile(newDataFromScraperPath);

  console.log(`[${platform}] 📊 Itens antigos carregados: ${oldData.length}`);
  console.log(`[${platform}] 📊 Itens novos do scraper: ${newData.length}`);

  let stats = {
    added: 0,
    updated: 0,
    removed: 0,
    reactivated: 0,
    stillMissing: 0,
    preservedUnlinked: 0,
  };

  // Pré-processamento para adicionar um campo virtual 'identifier' que será usado para matching
  // Este campo usa o link original OU o primeiro link de imagem como fallback
  oldData = oldData.map((p, idx) => {
    const identifier =
      p.link || (p.images && p.images.length > 0 ? p.images[0] : null);
    return {
      ...p,
      platform: p.platform || platform,
      consecutiveMisses: p.consecutiveMisses || 0,
      tempId: `old_${idx}`,
      identifier,
    };
  });

  newData = newData.map((p, idx) => {
    const identifier =
      p.link || (p.images && p.images.length > 0 ? p.images[0] : null);
    return {
      ...p,
      platform: p.platform || platform,
      tempId: `new_${idx}`,
      identifier,
    };
  });

  // Separar itens com e sem identificador para tratamento diferenciado
  const oldUnlinkedItems = alasql("SELECT * FROM ? WHERE identifier IS NULL", [
    oldData,
  ]);
  const oldLinkedItems = alasql(
    "SELECT * FROM ? WHERE identifier IS NOT NULL",
    [oldData]
  );
  const newUnlinkedItems = alasql("SELECT * FROM ? WHERE identifier IS NULL", [
    newData,
  ]);
  const newLinkedItems = alasql(
    "SELECT * FROM ? WHERE identifier IS NOT NULL",
    [newData]
  );

  let mergedData = [
    ...oldUnlinkedItems.map((p) => {
      delete p.tempId;
      return p;
    }),
  ]; // Começa com os antigos sem link
  stats.preservedUnlinked = oldUnlinkedItems.length;

  newUnlinkedItems.forEach((newProp) => {
    stats.added++;
    const { tempId, ...finalProp } = newProp; // Remove tempId
    mergedData.push({
      ...finalProp,
      id: finalProp.id || generateId(),
      firstSeenAt: now,
      lastSeenAt: now,
      scrapedAt: finalProp.scrapedAt || now,
      __status: "added",
      consecutiveMisses: 0,
    });
  });

  // Caso 1: Scraper não retornou NADA COM IDENTIFICADOR, mas tínhamos dados antigos COM IDENTIFICADOR.
  if (newLinkedItems.length === 0 && oldLinkedItems.length > 0) {
    console.warn(
      `[${platform}] Nenhum dado novo COM IDENTIFICADOR do scraper. Verificando antigos COM IDENTIFICADOR para remoção por ausência.`
    );
    const updatedOldLinked = oldLinkedItems.map((oldProp) => {
      const misses = oldProp.consecutiveMisses + 1;
      let newStatus = oldProp.__status;
      if (oldProp.__status !== "removed" && misses >= MAX_CONSECUTIVE_MISSES) {
        newStatus = "removed";
        stats.removed++;
      } else if (oldProp.__status !== "removed") {
        stats.stillMissing++;
      }
      const { tempId, ...finalProp } = oldProp;
      return {
        ...finalProp,
        __status: newStatus,
        consecutiveMisses: misses,
        lastSeenAt: oldProp.lastSeenAt,
      }; // Mantém lastSeenAt anterior
    });
    mergedData.push(...updatedOldLinked);
  } else if (newLinkedItems.length > 0 || oldLinkedItems.length > 0) {
    // Caso 2: Processamento normal para itens com link
    // Usamos SQL para fazer o JOIN e determinar o status inicial
    const sql = `
      SELECT 
        COALESCE(o.identifier, n.identifier) AS identifier,
        o.tempId AS old_tempId,
        n.tempId AS new_tempId,
        CASE
          WHEN o.identifier IS NULL THEN 'added'       -- Só existe em new
          WHEN n.identifier IS NULL THEN 'missing'     -- Só existe em old
          ELSE 'updated'                        -- Existe em ambos
        END AS merge_status
      FROM ? AS o FULL OUTER JOIN ? AS n ON o.identifier = n.identifier AND o.platform = n.platform
      WHERE o.platform = '${platform}' OR n.platform = '${platform}'`;

    const joinedResult = alasql(sql, [oldLinkedItems, newLinkedItems]);

    for (const item of joinedResult) {
      let finalItemData = {};
      let oldProp = null;
      let newProp = null;

      if (item.old_tempId)
        oldProp = oldLinkedItems.find((p) => p.tempId === item.old_tempId);
      if (item.new_tempId)
        newProp = newLinkedItems.find((p) => p.tempId === item.new_tempId);

      if (item.merge_status === "added") {
        stats.added++;
        const { tempId, ...relevantNewPropFields } = newProp;
        finalItemData = {
          ...relevantNewPropFields,
          id: newProp.id || generateId(),
          firstSeenAt: now,
          lastSeenAt: now,
          scrapedAt: newProp.scrapedAt || now,
          __status: "added",
          consecutiveMisses: 0,
        };
      } else if (item.merge_status === "updated") {
        if (oldProp.__status === "removed") stats.reactivated++;
        stats.updated++;
        const { tempId: oldTempId, ...relevantOldPropFields } = oldProp;
        const { tempId: newTempId, ...relevantNewPropFields } = newProp;
        finalItemData = {
          ...relevantOldPropFields,
          ...relevantNewPropFields, // newProp sobrescreve campos comuns
          id: oldProp.id || newProp.id || generateId(), // Preserva ID antigo se possível
          firstSeenAt: oldProp.firstSeenAt || now,
          lastSeenAt: now,
          scrapedAt: oldProp.scrapedAt || newProp.scrapedAt || now, // Preserva scrapedAt original
          __status: "updated",
          consecutiveMisses: 0,
        };
      } else {
        // 'missing' - item estava em oldData, mas não em newData
        const misses = oldProp.consecutiveMisses + 1;
        let currentStatus = oldProp.__status;

        if (currentStatus !== "removed" && misses >= MAX_CONSECUTIVE_MISSES) {
          currentStatus = "removed";
          stats.removed++;
          console.log(
            `[${platform}] Item ${oldProp.link} (ID: ${oldProp.id}) marcado como REMOVIDO após ${misses} ausências.`
          );
        } else if (currentStatus !== "removed") {
          stats.stillMissing++;
          console.log(
            `[${platform}] Item ${oldProp.link} (ID: ${oldProp.id}) ausente (tentativa ${misses}/${MAX_CONSECUTIVE_MISSES}). Mantendo status anterior.`
          );
        }
        const { tempId, ...relevantOldPropFields } = oldProp;
        finalItemData = {
          ...relevantOldPropFields,
          __status: currentStatus,
          consecutiveMisses: misses,
          lastSeenAt: oldProp.lastSeenAt, // Mantém lastSeenAt da última vez que foi visto
        };
      }
      // Adicionar todos os campos que você precisa explicitamente para garantir a estrutura
      const cleanItem = {
        id: finalItemData.id,
        link: finalItemData.link,
        platform: finalItemData.platform || platform, // Garante plataforma
        address: finalItemData.address,
        description: finalItemData.description || [], // Padrões
        images: finalItemData.images || [],
        price: finalItemData.price,
        scrapedAt: finalItemData.scrapedAt,
        publishDate: finalItemData.publishDate,
        firstSeenAt: finalItemData.firstSeenAt,
        lastSeenAt: finalItemData.lastSeenAt,
        hasDuplicates: finalItemData.hasDuplicates || false,
        coords: finalItemData.coords, // Pode precisar de tratamento se for objeto
        __status: finalItemData.__status,
        consecutiveMisses: finalItemData.consecutiveMisses,
        // ... quaisquer outros campos que seu objeto 'prop' original tinha
      };
      mergedData.push(cleanItem);
    }
  }

  let finalUniqueData = Array.from(
    new Map(
      mergedData.filter((p) => p && p.id).map((item) => [item.id, item])
    ).values()
  );

  console.log(
    `[${platform.toUpperCase()} Merge Stats (AlaSQL)] Adicionados: ${
      stats.added
    }, Atualizados: ${stats.updated}, Removidos: ${
      stats.removed
    }, Reativados: ${stats.reactivated}, Ainda Ausentes: ${
      stats.stillMissing
    }, Preserv. Sem Link: ${stats.preservedUnlinked}`
  );
  console.log(
    `[${platform.toUpperCase()}] Total de itens após merge: ${
      finalUniqueData.length
    }`
  );

  const finalData = finalUniqueData.filter((item) => {
    if (item.__status !== "removed") return true;

    // Para itens removidos, verifica há quanto tempo foram vistos pela última vez
    if (!item.lastSeenAt) return true; // Se não tiver lastSeenAt, mantém por segurança

    const lastSeenDate = new Date(item.lastSeenAt);
    const currentDate = new Date(now);
    const diffTime = Math.abs(currentDate.getTime() - lastSeenDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Mantém apenas se o número de dias for menor ou igual ao limite configurado (5 dias)
    const keepItem = diffDays <= MAX_DAYS_TO_KEEP_REMOVED;
    if (!keepItem) {
      console.log(
        `[${platform}] 🧹 Removendo permanentemente item ${
          item.id || item.link || "sem ID"
        } - não visto há ${diffDays} dias`
      );
    }
    return keepItem;
  });

  if (finalData.length < finalUniqueData.length) {
    console.log(
      `[${platform}] 🧹 Limpeza: removidos ${
        finalUniqueData.length - finalData.length
      } itens antigos (após ${MAX_DAYS_TO_KEEP_REMOVED} dias)`
    );
    // Atualiza o arquivo com os dados limpos
    await fs.promises.writeFile(
      oldFilePath,
      JSON.stringify(finalData, null, 2)
    );

    // Atualiza variável para refletir nos logs finais
    finalUniqueData = finalData;
  }

  // Atualizar GITHUB_ENV
  if (process.env.GITHUB_ENV) {
    const envPath = process.env.GITHUB_ENV;
    const platformUpper = platform.toUpperCase();
    fs.appendFileSync(envPath, `${platformUpper}_ADDED=${stats.added}\n`);
    fs.appendFileSync(envPath, `${platformUpper}_UPDATED=${stats.updated}\n`);
    fs.appendFileSync(envPath, `${platformUpper}_REMOVED=${stats.removed}\n`);
    fs.appendFileSync(
      envPath,
      `${platformUpper}_TOTAL=${finalUniqueData.length}\n`
    );
  }

  // Salvar os dados finais no arquivo
  await fs.promises.writeFile(
    oldFilePath,
    JSON.stringify(finalUniqueData, null, 2)
  );

  console.log(
    `[${platform}] ✅ Dados salvos com sucesso: ${finalUniqueData.length} itens`
  );
};
