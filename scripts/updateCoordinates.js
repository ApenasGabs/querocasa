import axios from "axios";
import { promises as fs } from "fs";
import { join, parse } from "path";

/**
 * Fetches coordinates for a given neighborhood using the Nominatim API.
 *
 * @param {string} neighborhood - The name of the neighborhood to fetch coordinates for.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates of the neighborhood, or null if not found.
 */
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
      console.log(`response`, response);
      console.log(`${neighborhood}: `, data);
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } else {
        // Chama hereapi se o Nominatim não encontrar o bairro
        console.log(
          `Nominatim não encontrou o bairro ${neighborhood}, ativando fallback hereapi...`
        );
        const data = await getCoordinatesFromHereMaps(neighborhood);
        console.log("data: ", data);
        return data;
      }
    } catch (error) {
      console.error(`Error fetching coordinates for ${neighborhood}:`, error);

      if (error.response && error.response.status === 403) {
        console.warn("Blocked by Nominatim. Increasing wait time...");
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Dobrar o tempo de espera em caso de bloqueio
        retries -= 1;
      } else {
        return null; // Retornar null em caso de outros erros
      }
    }
  }

  console.error(
    `Failed to fetch coordinates for ${neighborhood} after multiple attempts.`
  );
  return null;
};

/**
 * Fetches coordinates from Here Maps  API as a fallback.
 *
 * @param {string} neighborhood - The name of the neighborhood.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates from Here Maps or null if not found.
 */
const getCoordinatesFromHereMaps = async (neighborhood) => {
  const apiKey = process.argv[2];
  try {
    const response = await axios.get(
      "https://geocode.search.hereapi.com/v1/geocode",
      {
        params: {
          q: `${neighborhood}, Campinas, Brazil`,
          apiKey: apiKey,
        },
      }
    );

    const data = response.data.items;
    console.log("data: ", data);
    if (data && data.length > 0) {
      const location = data[0].position;
      return { lat: location.lat, lon: location.lng };
    } else {
      console.error(`Geocoding failed for ${neighborhood}:`, data);
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching coordinates from Here Maps for ${neighborhood}:`,
      error
    );
    return null;
  }
};

/**
 * Updates the coordinates for neighborhoods in property data files.
 *
 * Reads property data from JSON files, fetches missing coordinates,
 * and updates both property data and the coordinates file.
 */
const updateCoordinates = async () => {
  try {
    const dataDir = join(process.cwd(), "data", "results");
    const coordinatesDir = join(process.cwd(), "data", "coordinates");
    const coordinatesFilePath = join(coordinatesDir, "coordinates.json");

    // Criação do diretório de coordenadas se não existir
    if (!(await fs.stat(coordinatesDir).catch(() => false))) {
      await fs.mkdir(coordinatesDir, { recursive: true });
      console.log(`Directory ${coordinatesDir} created.`);
    }

    if (!(await fs.stat(dataDir).catch(() => false))) {
      throw new Error(`Directory ${dataDir} does not exist.`);
    }

    const dataFiles = await fs.readdir(dataDir);
    const jsonFiles = dataFiles.filter((file) => file.endsWith(".json"));

    // Carregar as coordenadas existentes
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

    // Processar os arquivos JSON
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

    // Coletar bairros únicos das propriedades
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

    // Buscar coordenadas apenas para bairros que não possuem coordenadas
    for (const neighborhood of neighborhoodsArray) {
      if (!coordinates[neighborhood]) {
        const coords = await getCoordinates(neighborhood);
        if (coords) {
          coordinates[neighborhood] = coords;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500)); // Esperar entre as requisições
      }
    }

    /**
     * Adds coordinates to property objects.
     *
     * @param {Array<Object>} properties - An array of property objects.
     * @returns {Array<Object>} The properties with added coordinates.
     */
    const addCoordinatesToProperties = (properties) => {
      properties.forEach((property) => {
        const neighborhood = property.address
          .replace("Campinas", "")
          .replace(",", "")
          .trim();
        const coords = coordinates[neighborhood];
        property.coords = coords
          ? {
              lat: coords.lat,
              lon: coords.lon,
            }
          : {};
      });
      return properties;
    };

    formattedResults.olxResults = addCoordinatesToProperties(
      formattedResults.olxResults
    );
    formattedResults.zapResults = addCoordinatesToProperties(
      formattedResults.zapResults
    );

    // Salvar os resultados atualizados
    for (const file in formattedResults) {
      const filePath = join(dataDir, `${file}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(formattedResults[file], null, 2)
      );
    }

    // Salvar o arquivo de coordenadas atualizado
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
