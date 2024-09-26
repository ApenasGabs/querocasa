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
