import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Remove error screenshots after a successful merge
 * @returns {Promise<void>}
 */
async function cleanupErrorScreenshots() {
  try {
    // Diretórios a serem verificados
    const screenshotsDir = path.join(process.cwd(), "screenshots");
    const dataDir = path.join(process.cwd(), "data/results");

    console.log("🧹 Iniciando limpeza das capturas de erro...");

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
        }))
      );
    } catch (error) {
      console.log("📂 Pasta de screenshots não encontrada.");
    }

    // Verificar e processar pasta data
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
          dir: "data",
        }))
      );
    } catch (error) {
      console.log("📂 Pasta de data não encontrada.");
    }

    if (allImageFiles.length === 0) {
      console.log(
        "✅ Nenhuma imagem de erro encontrada. Pastas já estão limpas."
      );
      return;
    }

    const backupLog = {
      date: new Date().toISOString(),
      deletedFiles: allImageFiles.map((file) => `${file.dir}/${file.name}`),
      count: allImageFiles.length,
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
    for (const file of allImageFiles) {
      await fs.unlink(file.path);
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
