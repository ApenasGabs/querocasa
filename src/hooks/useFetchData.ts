import { useEffect, useState } from "react";
import { dataPops, emptyData, fetchDataFiles } from "../services/dataService";

export const useFetchData = () => {
  const [data, setData] = useState<dataPops>(emptyData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedData = await fetchDataFiles();
        console.log("fetchedData: ", fetchedData);
        setData(fetchedData);
      } catch (err: unknown) {
        console.error("err: ", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};
