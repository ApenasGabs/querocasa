import { useContext } from "react";
import { DataContext, DataContextProps } from "../context/DataContext";

export const useFetchData = (): DataContextProps => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};
