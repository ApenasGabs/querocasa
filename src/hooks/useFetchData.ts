// src/hooks/useFetchData.ts
import { useContext } from "react";
import { DataContext, DataContextProps } from "../context/DataContext";

export const useFetchData = (): DataContextProps => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useFetchData must be used within a DataProvider");
  }
  return context;
};
