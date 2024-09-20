import axios from "axios";

export const fetchDataFiles = async () => {
  try {
    const response = await axios.get("/api/results");
    if (response.status !== 200) {
      throw new Error("Failed to fetch data");
    }
    console.log("response: ", response);
    const data = await response.data;
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
