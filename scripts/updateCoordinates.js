import axios from "axios";
import { promises as fs } from "fs";
import { join, parse } from "path";

const getCoordinates = async (neighborhood) => {
  let retries = 5;
  let delay = 2500;

  while (retries > 0) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            format: "json",
            q: `${neighborhood}, Campinas`,
          },
          headers: {
            "User-Agent": "Querocasa/1.0 (https://querocasa.apenasgabs.dev/)",
          },
        }
      );
      const data = response.data;
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching coordinates for ${neighborhood}:`, error);

      if (error.response && error.response.status === 403) {
        console.warn("Blocked by Nominatim. Increasing wait time...");
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        retries -= 1;
      } else {
        return null;
      }
    }
  }

  console.error(
    `Failed to fetch coordinates for ${neighborhood} after multiple attempts.`
  );
  return null;
};

const updateCoordinates = async () => {
  try {
    const dataDir = join(process.cwd(), "data", "results");
    const coordinatesDir = join(process.cwd(), "data", "coordinates");
    const coordinatesFilePath = join(coordinatesDir, "coordinates.json");

    if (!(await fs.stat(coordinatesDir).catch(() => false))) {
      await fs.mkdir(coordinatesDir, { recursive: true });
      console.log(`Directory ${coordinatesDir} created.`);
    }

    if (!(await fs.stat(dataDir).catch(() => false))) {
      throw new Error(`Directory ${dataDir} does not exist.`);
    }

    const dataFiles = await fs.readdir(dataDir);
    const jsonFiles = dataFiles.filter((file) => file.endsWith(".json"));

    let coordinates = {};
    try {
      const coordinatesContent = await fs.readFile(
        coordinatesFilePath,
        "utf-8"
      );
      coordinates = JSON.parse(coordinatesContent);
    } catch (err) {
      console.log("Coordinates file not found, creating a new one.");
    }

    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(dataDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const fileNameWithoutExt = parse(file).name;
        return { [fileNameWithoutExt]: JSON.parse(content) };
      })
    );

    const formattedResults = results.reduce((acc, curr) => {
      return { ...acc, ...curr };
    }, {});

    const neighborhoods = new Set();
    formattedResults.olxResults.forEach((property) => {
      const neighborhood = property.address
        .replace("Campinas", "")
        .replace(",", "")
        .trim();
      neighborhoods.add(neighborhood);
    });

    formattedResults.zapResults.forEach((property) => {
      const neighborhood = property.address
        .replace("Campinas", "")
        .replace(",", "")
        .trim();
      neighborhoods.add(neighborhood);
    });

    const neighborhoodsArray = Array.from(neighborhoods);
    for (const neighborhood of neighborhoodsArray) {
      if (!coordinates[neighborhood]) {
        const coords = await getCoordinates(neighborhood);
        if (coords) {
          coordinates[neighborhood] = coords;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    const addCoordinatesToProperties = (properties) => {
      properties.forEach((property) => {
        const neighborhood = property.address
          .replace("Campinas", "")
          .replace(",", "")
          .trim();
        const coords = coordinates[neighborhood];
        if (coords) {
          property.latitude = coords.lat;
          property.longitude = coords.lon;
        }
      });
      return properties;
    };

    formattedResults.olxResults = addCoordinatesToProperties(
      formattedResults.olxResults
    );
    formattedResults.zapResults = addCoordinatesToProperties(
      formattedResults.zapResults
    );

    for (const file in formattedResults) {
      const filePath = join(dataDir, `${file}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(formattedResults[file], null, 2)
      );
    }

    await fs.writeFile(
      coordinatesFilePath,
      JSON.stringify(coordinates, null, 2)
    );

    console.log("Coordinates updated successfully.");
  } catch (error) {
    console.error("Error updating coordinates:", error);
  }
};

updateCoordinates();
