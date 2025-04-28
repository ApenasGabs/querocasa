import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Remove excess error screenshots in PR branch, keeping only a few examples
 * @param {string|number} prNumber - PR number for logging
 * @returns {Promise<void>}
 */
async function cleanupPrErrorScreenshots(prNumber) {
  try {
    // Diretórios a serem verificados
    const screenshotsDir = path.join(process.cwd(), "screenshots");
    const dataDir = path.join(process.cwd(), "data/results");
    const logDir = path.join(process.cwd(), "logs");

    console.log(
      `🧹 Iniciando limpeza das capturas de erro no PR #${prNumber}...`
    );

    // Criar diretório de logs se não existir
    await fs.mkdir(logDir, { recursive: true });

    // Lista para armazenar todos os arquivos de imagem encontrados
    let allImageFiles = [];

    // Verificar e processar pasta screenshots
    try {
      await fs.access(screenshotsDir);
      const files = await fs.readdir(screenshotsDir);
      const imageFiles = files.filter(
        (file) =>
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg")
      );

      // Adicionar caminho completo para cada imagem
      allImageFiles.push(
        ...imageFiles.map((file) => ({
          path: path.join(screenshotsDir, file),
          name: file,
          dir: "screenshots",
          timestamp: fs
            .stat(path.join(screenshotsDir, file))
            .then((stat) => stat.mtime.getTime()),
        }))
      );
    } catch (error) {
      console.log("📂 Pasta de screenshots não encontrada.");
    }

    // Verificar e processar pasta data/results
    try {
      await fs.access(dataDir);
      const dataFiles = await fs.readdir(dataDir);
      const dataImageFiles = dataFiles.filter(
        (file) =>
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg")
      );

      // Adicionar caminho completo para cada imagem
      allImageFiles.push(
        ...dataImageFiles.map((file) => ({
          path: path.join(dataDir, file),
          name: file,
          dir: "data/results",
          timestamp: fs
            .stat(path.join(dataDir, file))
            .then((stat) => stat.mtime.getTime()),
        }))
      );
    } catch (error) {
      console.log("📂 Pasta data/results não encontrada.");
    }

    if (allImageFiles.length === 0) {
      console.log(
        "✅ Nenhuma imagem de erro encontrada. Pastas já estão limpas."
      );
      return;
    }

    // Resolver todas as timestamps
    for (let file of allImageFiles) {
      file.timestamp = await file.timestamp;
    }

    // Ordenar arquivos por timestamp (mais recentes primeiro)
    allImageFiles.sort((a, b) => b.timestamp - a.timestamp);

    // Definir quantas imagens manter
    const MAX_IMAGES_TO_KEEP = 3;
    let filesToKeep = allImageFiles.slice(0, MAX_IMAGES_TO_KEEP);
    let filesToDelete = allImageFiles.slice(MAX_IMAGES_TO_KEEP);

    const backupLog = {
      date: new Date().toISOString(),
      prNumber: prNumber,
      deletedFiles: filesToDelete.map((file) => `${file.dir}/${file.name}`),
      keptFiles: filesToKeep.map((file) => `${file.dir}/${file.name}`),
      count: filesToDelete.length,
    };

    const logPath = path.join(
      logDir,
      `pr-cleanup-${prNumber}-${Date.now()}.json`
    );
    await fs.writeFile(logPath, JSON.stringify(backupLog, null, 2));

    // Definir variável de ambiente para o GitHub Actions
    if (process.env.GITHUB_ENV) {
      await fs.appendFile(
        process.env.GITHUB_ENV,
        `CLEANUP_FILES_DELETED=${filesToDelete.length}\n`
      );
    }

    // Excluir arquivos excedentes
    let deletedCount = 0;
    for (const file of filesToDelete) {
      await fs.unlink(file.path);
      deletedCount++;
    }

    console.log(`🗑️ Limpeza concluída! ${deletedCount} arquivos removidos.`);
    console.log(`📝 Mantidos ${filesToKeep.length} arquivos mais recentes.`);
    console.log(`📝 Log de backup salvo em: ${logPath}`);
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
    process.exit(1);
  }
}

// Obter número do PR da linha de comando ou padrão
const prNumber = process.argv[2] || "unknown";

// Se o script estiver sendo executado diretamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanupPrErrorScreenshots(prNumber);
}

export default cleanupPrErrorScreenshots;
