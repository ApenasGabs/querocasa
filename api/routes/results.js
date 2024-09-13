import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router = Router();

router.get("/results", (req, res) => {
  try {
    const filePath = join(process.cwd(), "src", "results.json");
    const data = readFileSync(filePath, "utf-8");
    const results = JSON.parse(data);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error reading results.json:", error);
    res.status(500).json({ message: "Error reading results.json" });
  }
});

export default router;
