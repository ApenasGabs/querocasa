import { useEffect, useState } from "react";
import { fetchDataFiles } from "../services/dataService";
interface dataPops {
  address: string;
  bedrooms: string;
  link: string;
  price: string;
  publishDate: string;
}


export const useFetchData = () => {
  const [data, setData] = useState<dataPops[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedData = await fetchDataFiles();
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
