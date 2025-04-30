import axios from "axios";
import { promises as fs } from "fs";
import { join, parse } from "path";

// Coordenadas do centro da cidade de Campinas
const CITY_CENTER = {
  lat: -22.9103015,
  lon: -47.0595007,
  address: "Centro, Campinas, SP, Brasil"
};

// Caminho para o arquivo de cache de endereços
const ADDRESS_CACHE_FILE = join(process.cwd(), "data", "cache", "address-cache.json");

// Cache de endereços em memória
let addressCache = {};

/**
 * Carrega o cache de endereços do arquivo
 */
const loadAddressCache = async () => {
  try {
    const cacheDir = join(process.cwd(), "data", "cache");
    // Verificar se o diretório de cache existe
    if (!(await fs.stat(cacheDir).catch(() => false))) {
      await fs.mkdir(cacheDir, { recursive: true });
      console.log(`Diretório de cache criado: ${cacheDir}`);
    }
    
    // Carregar o cache existente
    try {
      const cacheContent = await fs.readFile(ADDRESS_CACHE_FILE, 'utf-8');
      addressCache = JSON.parse(cacheContent);
      console.log(`Cache de endereços carregado: ${Object.keys(addressCache).length} entradas encontradas.`);
    } catch (err) {
      // Arquivo não existe, criar um novo cache
      addressCache = {};
      console.log("Criando novo cache de endereços.");
    }
  } catch (error) {
    console.error("Erro ao carregar cache de endereços:", error.message);
    // Em caso de erro, continua com um cache vazio
    addressCache = {};
  }
};

/**
 * Salva o cache de endereços no arquivo
 */
const saveAddressCache = async () => {
  try {
    await fs.writeFile(
      ADDRESS_CACHE_FILE,
      JSON.stringify(addressCache, null, 2)
    );
    console.log(`Cache de endereços salvo com ${Object.keys(addressCache).length} entradas.`);
  } catch (error) {
    console.error("Erro ao salvar cache de endereços:", error.message);
  }
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
 * Busca coordenadas para um endereço completo usando a API do Nominatim.
 * Agora usa o cache para evitar consultas repetidas.
 * 
 * @param {string} address - O endereço completo para buscar coordenadas.
 * @returns {Promise<{ lat: number, lon: number } | null>} As coordenadas do endereço ou null se não encontrado.
 */
const getCoordinatesByAddress = async (address) => {
  let retries = 3;
  let delay = 2000;

  // Garante que sempre buscamos com o endereço completo
  const fullAddress = address.includes("Campinas") ? address : `${address}, Campinas, SP, Brasil`;
  
  // Verificar se o endereço já está no cache
  const cacheKey = fullAddress.toLowerCase().trim();
  if (addressCache[cacheKey]) {
    console.log(`🔄 Cache: Encontrado para "${fullAddress}": (${addressCache[cacheKey].lat}, ${addressCache[cacheKey].lon})`);
    return addressCache[cacheKey];
  }

  while (retries > 0) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            format: "json",
            q: fullAddress,
            addressdetails: 1,
            limit: 1,
            countrycodes: "br",
          },
          headers: {
            "User-Agent": "Querocasa/1.0 (https://querocasa.apenasgabs.dev/)",
          },
        }
      );

      const data = response.data;
      console.log(`Busca por endereço "${fullAddress}":`, 
        data.length > 0 ? `Encontrado (${data[0].lat}, ${data[0].lon})` : "Não encontrado");

      if (data && data.length > 0) {
        const result = { 
          lat: parseFloat(data[0].lat), 
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          source: "nominatim"
        };
        
        // Adicionar ao cache
        addressCache[cacheKey] = result;
        
        return result;
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar coordenadas para "${fullAddress}":`, error.message);
      
      if (error.response && (error.response.status === 403 || error.response.status === 429)) {
        console.warn("Limite de requisições atingido. Aumentando tempo de espera...");
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Dobrar o tempo de espera
        retries -= 1;
      } else {
        return null;
      }
    }
  }

  console.error(`Falha ao obter coordenadas para "${fullAddress}" após várias tentativas.`);
  return null;
};

/**
 * Fetches coordinates from Here Maps API as a fallback.
 * Now uses cache to avoid repeated API calls.
 *
 * @param {string} address - Full address string.
 * @param {string} apiKey - Here Maps API key.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates from Here Maps or null if not found.
 */
const getCoordinatesFromHereMaps = async (address, apiKey) => {
  if (!apiKey) {
    console.error(
      "Chave da API Here Maps não fornecida. Não é possível usar o fallback."
    );
    return null;
  }

  // Garantir que temos o endereço completo
  const fullAddress = address.includes("Campinas") ? address : `${address}, Campinas, São Paulo, Brasil`;
  
  // Verificar se o endereço já está no cache (com marca da fonte)
  const cacheKey = `heremaps:${fullAddress.toLowerCase().trim()}`;
  if (addressCache[cacheKey]) {
    console.log(`🔄 Cache HereMaps: Encontrado para "${fullAddress}"`);
    return addressCache[cacheKey];
  }

  try {
    const response = await axios.get(
      "https://geocode.search.hereapi.com/v1/geocode",
      {
        params: {
          q: fullAddress,
          apiKey: apiKey,
          // Adicionar in para limitar resultados a Campinas
          in: "city:Campinas",
        },
      }
    );

    const data = response.data.items;
    console.log(`Resultado Here Maps para "${fullAddress}":`, 
      data.length > 0 ? `Encontrado (${data[0].position.lat}, ${data[0].position.lng})` : "Não encontrado");

    if (data && data.length > 0) {
      const location = data[0].position;
      const result = { 
        lat: location.lat, 
        lon: location.lng,
        displayName: data[0].title || fullAddress,
        source: "heremaps"
      };
      
      // Adicionar ao cache
      addressCache[cacheKey] = result;
      
      return result;
    } else {
      console.error(`Geocodificação falhou para "${fullAddress}"`);
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao buscar coordenadas do Here Maps para "${address}":`,
      error.message
    );
    return null;
  }
};

/**
 * Fetches coordinates from Google Maps API as a secondary fallback.
 * Now uses cache to avoid repeated API calls.
 * 
 * @param {string} address - Full address string.
 * @param {string} apiKey - Google Maps API key.
 * @returns {Promise<{ lat: number, lon: number } | null>} The coordinates or null if not found.
 */
const getCoordinatesFromGoogleMaps = async (address, apiKey) => {
  if (!apiKey) {
    console.error("Chave da API Google Maps não fornecida. Não é possível usar este fallback.");
    return null;
  }

  // Garantir que temos o endereço completo
  const fullAddress = address.includes("Campinas") ? address : `${address}, Campinas, São Paulo, Brasil`;
  
  // Verificar se o endereço já está no cache (com marca da fonte)
  const cacheKey = `googlemaps:${fullAddress.toLowerCase().trim()}`;
  if (addressCache[cacheKey]) {
    console.log(`🔄 Cache GoogleMaps: Encontrado para "${fullAddress}"`);
    return addressCache[cacheKey];
  }
  
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: fullAddress,
          key: apiKey,
          region: "br",
        },
      }
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Resultado Google Maps para "${fullAddress}": Encontrado (${location.lat}, ${location.lng})`);
      
      const result = { 
        lat: location.lat, 
        lon: location.lng,
        displayName: response.data.results[0].formatted_address || fullAddress,
        source: "googlemaps"
      };
      
      // Adicionar ao cache
      addressCache[cacheKey] = result;
      
      return result;
    } else {
      console.error(`Geocodificação Google falhou para "${fullAddress}": ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao buscar coordenadas do Google Maps para "${address}":`,
      error.message
    );
    return null;
  }
};

// Cache para distâncias a pé
const walkingDistanceCache = {};

/**
 * Calcula a distância a pé entre dois pontos usando a API do Here Maps.
 * Agora usa cache para evitar reconsultas.
 *
 * @param {number} lat1 - Latitude do primeiro ponto.
 * @param {number} lon1 - Longitude do primeiro ponto.
 * @param {number} lat2 - Latitude do segundo ponto.
 * @param {number} lon2 - Longitude do segundo ponto.
 * @param {string} apiKey - Chave da API do Here Maps.
 * @returns {Promise<number|null>} A distância a pé em quilômetros ou null em caso de erro.
 */
const calculateWalkingDistance = async (lat1, lon1, lat2, lon2, apiKey) => {
  // Chave para o cache: coordenadas de origem e destino
  const cacheKey = `walk:here:${lat1},${lon1}-${lat2},${lon2}`;
  
  // Verificar se já temos esta rota no cache
  if (walkingDistanceCache[cacheKey]) {
    console.log(`🔄 Cache: Distância a pé HereMaps encontrada para (${lat1},${lon1}) -> (${lat2},${lon2})`);
    return walkingDistanceCache[cacheKey];
  }
  
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
      const walkingDistance = Number((distanceInMeters / 1000).toFixed(2));
      
      // Adicionar ao cache
      walkingDistanceCache[cacheKey] = walkingDistance;
      
      return walkingDistance;
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
 * Calcula a distância a pé entre dois endereços usando a API do Google Maps.
 * Agora usa cache para evitar reconsultas.
 * 
 * @param {number} lat1 - Latitude do primeiro ponto.
 * @param {number} lon1 - Longitude do primeiro ponto.
 * @param {number} lat2 - Latitude do segundo ponto.
 * @param {number} lon2 - Longitude do segundo ponto.
 * @param {string} apiKey - Chave da API do Google Maps.
 * @returns {Promise<number|null>} A distância a pé em quilômetros ou null em caso de erro.
 */
const calculateWalkingDistanceGoogle = async (lat1, lon1, lat2, lon2, apiKey) => {
  // Chave para o cache: coordenadas de origem e destino
  const cacheKey = `walk:google:${lat1},${lon1}-${lat2},${lon2}`;
  
  // Verificar se já temos esta rota no cache
  if (walkingDistanceCache[cacheKey]) {
    console.log(`🔄 Cache: Distância a pé Google encontrada para (${lat1},${lon1}) -> (${lat2},${lon2})`);
    return walkingDistanceCache[cacheKey];
  }
  
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin: `${lat1},${lon1}`,
          destination: `${lat2},${lon2}`,
          mode: "walking",
          key: apiKey
        }
      }
    );

    if (
      response.data.status === "OK" &&
      response.data.routes &&
      response.data.routes.length > 0 &&
      response.data.routes[0].legs &&
      response.data.routes[0].legs.length > 0
    ) {
      // A distância retornada é em metros, convertemos para quilômetros
      const distanceInMeters = response.data.routes[0].legs[0].distance.value;
      const walkingDistance = Number((distanceInMeters / 1000).toFixed(2));
      
      // Adicionar ao cache
      walkingDistanceCache[cacheKey] = walkingDistance;
      
      return walkingDistance;
    }

    console.warn(
      `Google Maps não pôde calcular a distância a pé para (${lat1},${lon1}) -> (${lat2},${lon2}): ${response.data.status}`
    );
    return null;
  } catch (error) {
    console.error("Erro ao calcular distância a pé via Google Maps:", error.message);
    return null;
  }
};

/**
 * Retorna uma estimativa da distância a pé multiplicando a distância em linha reta por um fator.
 * Usado apenas como último recurso.
 *
 * @param {number} directDistance - Distância em linha reta em km.
 * @returns {number} Estimativa de distância a pé em km.
 */
const estimateWalkingDistance = (directDistance) => {
  // Fator típico de desvio entre distância em linha reta e distância real de caminhada
  const WALKING_FACTOR = 1.3;
  return Number((directDistance * WALKING_FACTOR).toFixed(2));
};

/**
 * Updates the coordinates for neighborhoods in property data files.
 *
 * Reads property data from JSON files, fetches missing coordinates,
 * and updates both property data and the coordinates file.
 */
const updateCoordinates = async () => {
  try {
    // Carregar o cache de endereços
    await loadAddressCache();
    
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

    // Coletar endereços únicos das propriedades
    const neighborhoods = new Set();
    const completeAddresses = new Map();

    formattedResults.olxResults.forEach((property) => {
      const neighborhood = property.address
        .replace("Campinas", "")
        .replace(",", "")
        .trim();
      neighborhoods.add(neighborhood);
      completeAddresses.set(neighborhood, property.address);
    });

    formattedResults.zapResults.forEach((property) => {
      const neighborhood = property.address
        .replace("Campinas", "")
        .replace(",", "")
        .trim();
      neighborhoods.add(neighborhood);
      completeAddresses.set(neighborhood, property.address);
    });

    const neighborhoodsArray = Array.from(neighborhoods);

    // Obter as chaves das APIs a partir dos argumentos
    const hereApiKey = process.argv[2];
    const googleApiKey = process.argv[3];

    // Verificar e reportar bairros sem coordenadas ou distâncias
    const missingCoordinates = [];
    const missingDistance = [];
    const missingWalkingDistance = [];

    for (const neighborhood of neighborhoodsArray) {
      // Verificar se faltam coordenadas
      if (!coordinates[neighborhood]) {
        missingCoordinates.push(neighborhood);
      }
      // Verificar se tem coordenadas mas falta distância
      else if (coordinates[neighborhood] && coordinates[neighborhood].lat) {
        if (coordinates[neighborhood].distanceToCenter === undefined) {
          missingDistance.push(neighborhood);
        }
        if (coordinates[neighborhood].walkingDistanceToCenter === undefined) {
          missingWalkingDistance.push(neighborhood);
        }
      }
    }

    console.log("=== RELATÓRIO DE DADOS FALTANTES ===");
    console.log(`Bairros sem coordenadas: ${missingCoordinates.length}`);
    console.log(`Bairros sem distância direta: ${missingDistance.length}`);
    console.log(`Bairros sem distância a pé: ${missingWalkingDistance.length}`);
    console.log("====================================");

    // Buscar coordenadas apenas para bairros que não possuem coordenadas
    for (const neighborhood of missingCoordinates) {
      console.log(`Buscando coordenadas para: ${neighborhood}`);

      // Tenta usar o endereço completo quando disponível
      const fullAddress =
        completeAddresses.get(neighborhood) ||
        `${neighborhood}, Campinas, SP, Brasil`;

      // Tentativa 1: Nominatim com endereço completo
      let coords = await getCoordinatesByAddress(fullAddress);

      // Tentativa 2: Here Maps como fallback
      if (!coords && hereApiKey) {
        console.log(`Tentando Here Maps para ${neighborhood}...`);
        coords = await getCoordinatesFromHereMaps(fullAddress, hereApiKey);
      }

      // Tentativa 3: Google Maps como segundo fallback
      if (!coords && googleApiKey) {
        console.log(`Tentando Google Maps para ${neighborhood}...`);
        coords = await getCoordinatesFromGoogleMaps(fullAddress, googleApiKey);
      }

      if (coords) {
        coordinates[neighborhood] = coords;
      } else {
        console.error(
          `❌ Não foi possível obter coordenadas para: ${neighborhood}`
        );
      }

      // Esperar entre as requisições para evitar limitações de API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Adicionar distância até o centro da cidade para cada bairro
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
        if (coordinates[neighborhood].walkingDistanceToCenter === undefined) {
          console.log(`Calculando distância a pé para ${neighborhood}...`);

          // Tentativa 1: Here Maps API
          let walkingDistance = null;
          if (hereApiKey) {
            try {
              walkingDistance = await calculateWalkingDistance(
                coordinates[neighborhood].lat,
                coordinates[neighborhood].lon,
                CITY_CENTER.lat,
                CITY_CENTER.lon,
                hereApiKey
              );
            } catch (error) {
              console.error(
                `Erro na API Here para ${neighborhood}:`,
                error.message
              );
            }
          }

          // Tentativa 2: Google Maps API
          if (!walkingDistance && googleApiKey) {
            try {
              console.log(
                `Tentando Google Maps Directions para ${neighborhood}...`
              );
              walkingDistance = await calculateWalkingDistanceGoogle(
                coordinates[neighborhood].lat,
                coordinates[neighborhood].lon,
                CITY_CENTER.lat,
                CITY_CENTER.lon,
                googleApiKey
              );
            } catch (error) {
              console.error(
                `Erro na API Google para ${neighborhood}:`,
                error.message
              );
            }
          }

          // Fallback: Estimativa baseada na distância em linha reta
          if (!walkingDistance && coordinates[neighborhood].distanceToCenter) {
            console.log(
              `Usando estimativa para distância a pé para ${neighborhood}...`
            );
            walkingDistance = estimateWalkingDistance(
              coordinates[neighborhood].distanceToCenter
            );
          }

          if (walkingDistance) {
            coordinates[neighborhood].walkingDistanceToCenter = walkingDistance;
          }

          // Para não sobrecarregar as APIs, apenas aguarde se realmente fizer chamadas
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // Estatísticas
    const totalNeighborhoods = neighborhoodsArray.length;
    const updatedCoordinates = Object.keys(coordinates).length;

    // Contar quantos bairros têm dados de distância agora
    let withDistance = 0;
    let withWalkingDistance = 0;

    for (const neighborhood in coordinates) {
      if (coordinates[neighborhood].distanceToCenter !== undefined) {
        withDistance++;
      }
      if (coordinates[neighborhood].walkingDistanceToCenter !== undefined) {
        withWalkingDistance++;
      }
    }

    // Exporta estatísticas para GitHub Actions
    if (process.env.GITHUB_ENV) {
      const envVars = [
        `TOTAL_NEIGHBORHOODS=${totalNeighborhoods}`,
        `COORDINATES_UPDATED=${updatedCoordinates}`,
        `WITH_DISTANCE=${withDistance}`,
        `WITH_WALKING_DISTANCE=${withWalkingDistance}`,
      ];
      await fs.appendFile(process.env.GITHUB_ENV, envVars.join("\n") + "\n");
    }

    console.log("=== RELATÓRIO FINAL ===");
    console.log(`Total de bairros: ${totalNeighborhoods}`);
    console.log(`Bairros com coordenadas: ${updatedCoordinates}`);
    console.log(`Bairros com distância direta: ${withDistance}`);
    console.log(`Bairros com distância a pé: ${withWalkingDistance}`);
    console.log("======================");

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

    // Ao final da função, após salvar o arquivo de coordenadas
    console.log("Salvando cache de endereços...");
    await saveAddressCache();

    console.log("Coordinates and distances updated successfully.");
  } catch (error) {
    console.error("Error updating coordinates and distances:", error);
  }
};

updateCoordinates();
