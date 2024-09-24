import axios from "axios";

export interface olxDataPops {
  address: string;
  description: string;
  link: string;
  price: string;
  publishDate: string;
}

export interface zapDataPops {
  address: string;
  description: Description;
  price: string;
  link?: string;
}

export interface Description {
  floorSize: string;
  numberOfRooms: string;
  numberOfBathroomsTotal: string;
  numberOfParkingSpaces?: string;
}

export interface dataPops {
  olxResults: olxDataPops[];
  zapResults: zapDataPops[];
}
export const emptyData: dataPops = {
  olxResults: [],
  zapResults: [],
};

export const fetchDataFiles = async () => {
  try {
    const response = await axios.get<dataPops>("/api/results");
    console.log("response: ", response);
    if (response.status !== 200) {
      throw new Error("Failed to fetch data");
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return emptyData;
  }
};
