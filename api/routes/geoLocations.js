import { Router } from "express";
import { promises as fs } from "fs";
import { join } from "path";

const router = Router();

router.get("/geolocations", async (req, res) => {
  try {
    const coordinatesFilePath = join(
      process.cwd(),
      "data",
      "coordinates",
      "coordinates.json"
    );

    const coordinatesContent = await fs.readFile(coordinatesFilePath, "utf-8");
    const coordinates = JSON.parse(coordinatesContent);

    res.status(200).json(coordinates);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error reading coordinates: ${error.message}` });
  }
});

export default router;
