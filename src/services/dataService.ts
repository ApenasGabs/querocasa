import axios from "axios";

export enum DescriptionFields {
  FloorSize = "floorSize",
  NumberOfRooms = "numberOfRooms",
  NumberOfBathroomsTotal = "numberOfBathroomsTotal",
  NumberOfParkingSpaces = "numberOfParkingSpaces",
}

export interface PropertyDescription {
  [DescriptionFields.FloorSize]?: string;
  [DescriptionFields.NumberOfRooms]?: string;
  [DescriptionFields.NumberOfBathroomsTotal]?: string;
  [DescriptionFields.NumberOfParkingSpaces]?: string;
}

export interface Property {
  address: string;
  description: PropertyDescription[];
  images: string[];
  link: string;
  price: string;
  coords: Coords;
  id: string;
  hasDuplicates?: boolean;
  scrapedAt?: string;
  lastSeenAt?: string;
  elementId: string;
}
export interface Coords {
  lat?: number;
  lon?: number;
  distanceToCenter?: number;
  walkingDistanceToCenter?: number;
}

export interface Description {
  floorSize: string;
  numberOfRooms: string;
  numberOfBathroomsTotal: string;
  numberOfParkingSpaces?: string;
}

export interface DataPops {
  olxResults: Property[];
  zapResults: Property[];
}
export const emptyData: DataPops = {
  olxResults: [],
  zapResults: [],
};

export const fetchDataFiles = async (): Promise<DataPops> => {
  try {
    const response = await axios.get<DataPops>("/api/results");
    if (response.status !== 200) {
      throw new Error("Failed to fetch data");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return emptyData;
  }
};

export interface GeoLocation {
  lat: number;
  lon: number;
}

export interface GeoLocationsResponse {
  [location: string]: GeoLocation;
}

export interface LocationOption {
  label: string;
  value: string;
}

export const fetchGeoLocations = async (): Promise<LocationOption[]> => {
  const cached = localStorage.getItem("geolocations");
  const cacheTimestamp = localStorage.getItem("geolocations_timestamp");
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (
    cached &&
    cacheTimestamp &&
    Date.now() - Number(cacheTimestamp) < oneWeek
  ) {
    return JSON.parse(cached);
  }

  try {
    const response = await axios.get<GeoLocationsResponse>("/api/geolocations");

    if (response.status !== 200) {
      throw new Error("Failed to fetch geolocations");
    }

    const data = response.data;

    const options = Object.keys(data).map((location) => ({
      label: location,
      value: JSON.stringify({
        name: location,
        lat: data[location].lat,
        lon: data[location].lon,
      }),
    }));

    localStorage.setItem("geolocations", JSON.stringify(options));
    localStorage.setItem("geolocations_timestamp", Date.now().toString());

    return options;
  } catch (error) {
    console.error("Error fetching geolocations:", error);
    return [];
  }
};
