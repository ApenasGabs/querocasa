import React, { createContext, useEffect, useState } from "react";
import { DataPops, emptyData, fetchDataFiles } from "../services/dataService";

export interface DataContextProps {
  data: DataPops;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const DataContext = createContext<DataContextProps>({
  data: emptyData,
  loading: true,
  error: null,
  refetch: () => {},
});

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<DataPops>(emptyData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedData = await fetchDataFiles();
      setData(fetchedData);
    } catch (err) {
      setError(`Failed to load data:${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return (
    <DataContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </DataContext.Provider>
  );
};
