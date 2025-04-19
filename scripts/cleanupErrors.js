import { promises as fs } from "fs";
import path from "path";

/**
 * Remove error screenshots after a successful merge
 * @returns {Promise<void>}
 */
async function cleanupErrorScreenshots() {
  try {
    const screenshotsDir = path.join(process.cwd(), "screenshots");

    console.log("🧹 Iniciando limpeza das capturas de erro...");

    try {
      await fs.access(screenshotsDir);
    } catch (error) {
      console.log("📂 Pasta de screenshots não encontrada. Nada para limpar.");
      return;
    }

    const files = await fs.readdir(screenshotsDir);
    const imageFiles = files.filter(
      (file) =>
        file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")
    );

    if (imageFiles.length === 0) {
      console.log("✅ Nenhuma imagem de erro encontrada. Pasta já está limpa.");
      return;
    }

    const backupLog = {
      date: new Date().toISOString(),
      deletedFiles: imageFiles,
      count: imageFiles.length,
    };

    const logDir = path.join(process.cwd(), "logs");
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error("error: ", error);
    }

    const logPath = path.join(logDir, `cleanup-${Date.now()}.json`);
    await fs.writeFile(logPath, JSON.stringify(backupLog, null, 2));

    let deletedCount = 0;
    for (const file of imageFiles) {
      const filePath = path.join(screenshotsDir, file);
      await fs.unlink(filePath);
      deletedCount++;
    }

    console.log(`🗑️ Limpeza concluída! ${deletedCount} arquivos removidos.`);
    console.log(`📝 Log de backup salvo em: ${logPath}`);
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanupErrorScreenshots();
}

export default cleanupErrorScreenshots;
