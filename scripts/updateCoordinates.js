import axios from "axios";
import { promises as fs } from "fs";
import { join, parse } from "path";

// Coordenadas do centro da cidade de Campinas
const CITY_CENTER = {
  lat: -22.9103015,
  lon: -47.0595007,
};

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine.
 *
 * @param {number} lat1 - Latitude do primeiro ponto.
 * @param {number} lon1 - Longitude do primeiro ponto.
 * @param {number} lat2 - Latitude do segundo ponto.
 * @param {number} lon2 - Longitude do segundo ponto.
 * @returns {number} A distância em quilômetros.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distância em km
  return Number(distance.toFixed(2));
};

/**
 * Fetches coordinates for a given neighborhood using the Nominatim API.
 *
 * @param {string} neighborhood - The name of the neighborhood to fetch coordinates for.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates of the neighborhood, or null if not found.
 */
const getCoordinates = async (neighborhood) => {
  let retries = 5;
  let delay = 2500;

  // Garantir que sempre busque com o nome da cidade para maior precisão
  const locationQuery = `${neighborhood}, Campinas, SP, Brasil`;

  while (retries > 0) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            format: "json",
            q: locationQuery,
            // Adicionando bounded=1 para priorizar resultados dentro da área definida
            bounded: 1,
            // Definir um viewbox para limitar as buscas à região de Campinas
            viewbox: "-47.2,-22.8,-46.9,-23.0",
            // Limite o tipo de resultados para bairros/subúrbios
            featuretype: "suburb",
          },
          headers: {
            "User-Agent": "Querocasa/1.0 (https://querocasa.apenasgabs.dev/)",
          },
        }
      );

      const data = response.data;
      console.log(`Busca por ${locationQuery}:`, data);

      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } else {
        // Fallback para Here Maps se o Nominatim não encontrar
        console.log(
          `Nominatim não encontrou o bairro ${neighborhood}, ativando fallback hereapi...`
        );
        const hereData = await getCoordinatesFromHereMaps(neighborhood);
        return hereData;
      }
    } catch (error) {
      console.error(`Erro ao buscar coordenadas para ${neighborhood}:`, error);

      if (error.response && error.response.status === 403) {
        console.warn("Bloqueado pelo Nominatim. Aumentando tempo de espera...");
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Dobrar o tempo de espera em caso de bloqueio
        retries -= 1;
      } else {
        return null;
      }
    }
  }

  console.error(
    `Falha ao obter coordenadas para ${neighborhood} após várias tentativas.`
  );
  return null;
};

/**
 * Fetches coordinates from Here Maps API as a fallback.
 *
 * @param {string} neighborhood - The name of the neighborhood.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates from Here Maps or null if not found.
 */
const getCoordinatesFromHereMaps = async (neighborhood) => {
  const apiKey = process.argv[2];
  if (!apiKey) {
    console.error(
      "Chave da API Here Maps não fornecida. Não é possível usar o fallback."
    );
    return null;
  }

  try {
    // Incluir sempre o nome completo da cidade para maior precisão
    const locationQuery = `${neighborhood}, Campinas, São Paulo, Brasil`;

    const response = await axios.get(
      "https://geocode.search.hereapi.com/v1/geocode",
      {
        params: {
          q: locationQuery,
          apiKey: apiKey,
          // Adicionar in para limitar resultados a Campinas
          in: "city:Campinas",
        },
      }
    );

    const data = response.data.items;
    console.log(`Resultado Here Maps para ${locationQuery}:`, data);

    if (data && data.length > 0) {
      const location = data[0].position;
      return { lat: location.lat, lon: location.lng };
    } else {
      console.error(`Geocodificação falhou para ${neighborhood}:`, data);
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao buscar coordenadas do Here Maps para ${neighborhood}:`,
      error
    );
    return null;
  }
};

/**
 * Calcula a distância a pé entre dois pontos usando a API do Here Maps.
 *
 * @param {number} lat1 - Latitude do primeiro ponto.
 * @param {number} lon1 - Longitude do primeiro ponto.
 * @param {number} lat2 - Latitude do segundo ponto.
 * @param {number} lon2 - Longitude do segundo ponto.
 * @param {string} apiKey - Chave da API do Here Maps.
 * @returns {Promise<number|null>} A distância a pé em quilômetros ou null em caso de erro.
 */
const calculateWalkingDistance = async (lat1, lon1, lat2, lon2, apiKey) => {
  try {
    const response = await axios.get("https://router.hereapi.com/v8/routes", {
      params: {
        transportMode: "pedestrian",
        origin: `${lat1},${lon1}`,
        destination: `${lat2},${lon2}`,
        return: "summary",
        apiKey: apiKey,
      },
    });

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0 &&
      response.data.routes[0].sections &&
      response.data.routes[0].sections.length > 0
    ) {
      // A distância retornada é em metros, convertemos para quilômetros
      const distanceInMeters =
        response.data.routes[0].sections[0].summary.length;
      return Number((distanceInMeters / 1000).toFixed(2));
    }

    console.warn(
      `Não foi possível calcular a distância a pé para as coordenadas (${lat1},${lon1}) -> (${lat2},${lon2})`
    );
    return null;
  } catch (error) {
    console.error("Erro ao calcular distância a pé:", error.message);
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

    // Adicionar distância até o centro da cidade para cada bairro
    const apiKey = process.argv[2];
    for (const neighborhood in coordinates) {
      if (
        coordinates[neighborhood] &&
        coordinates[neighborhood].lat &&
        coordinates[neighborhood].lon
      ) {
        // Verificar se precisamos calcular a distância em linha reta
        if (coordinates[neighborhood].distanceToCenter === undefined) {
          console.log(`Calculando distância direta para ${neighborhood}...`);
          const directDistance = calculateDistance(
            coordinates[neighborhood].lat,
            coordinates[neighborhood].lon,
            CITY_CENTER.lat,
            CITY_CENTER.lon
          );
          coordinates[neighborhood].distanceToCenter = directDistance;
        }

        // Verificar se precisamos calcular a distância a pé
        if (
          coordinates[neighborhood].walkingDistanceToCenter === undefined &&
          apiKey
        ) {
          console.log(`Calculando distância a pé para ${neighborhood}...`);
          try {
            const walkingDistance = await calculateWalkingDistance(
              coordinates[neighborhood].lat,
              coordinates[neighborhood].lon,
              CITY_CENTER.lat,
              CITY_CENTER.lon,
              apiKey
            );

            if (walkingDistance) {
              coordinates[neighborhood].walkingDistanceToCenter =
                walkingDistance;
              // Para não sobrecarregar a API, apenas aguarde se realmente fizer uma chamada
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(
              `Erro ao calcular distância a pé para ${neighborhood}:`,
              error
            );
          }
        }
      }
    }

    // Estatísticas
    const totalNeighborhoods = neighborhoodsArray.length;
    const updatedCoordinates = Object.keys(coordinates).length;

    // Exporta estatísticas para GitHub Actions
    if (process.env.GITHUB_ENV) {
      const envVars = [
        `TOTAL_NEIGHBORHOODS=${totalNeighborhoods}`,
        `COORDINATES_UPDATED=${updatedCoordinates}`,
      ];
      await fs.appendFile(process.env.GITHUB_ENV, envVars.join("\n") + "\n");
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
              distanceToCenter: coords.distanceToCenter || null,
              walkingDistanceToCenter: coords.walkingDistanceToCenter || null,
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

    console.log("Coordinates and distances updated successfully.");
  } catch (error) {
    console.error("Error updating coordinates and distances:", error);
  }
};

updateCoordinates();
