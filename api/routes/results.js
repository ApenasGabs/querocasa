import { Router } from "express";
import { promises as fs } from "fs";
import { join, parse } from "path";

const router = Router();

router.get("/results", async (req, res) => {
  try {
    const dataDir = join(process.cwd(), "data", "results");
    const files = await fs.readdir(dataDir);
    console.log("files: ", files);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        console.log("file: ", file);
        const filePath = join(dataDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const fileNameWithoutExt = parse(file).name;
        return { [fileNameWithoutExt]: JSON.parse(content) };
      })
    );

    const formattedResults = results.reduce((acc, curr) => {
      return { ...acc, ...curr };
    }, {});

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Error reading JSON files:", error);
    res.status(500).json({ message: "Error reading JSON files" });
  }
});

export default router;
