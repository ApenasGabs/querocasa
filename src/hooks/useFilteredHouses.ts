import { useEffect, useState } from "react";
import { Filters } from "../components/Filters/PropertyFilters.types";
import { DataPops } from "../services/dataService";
import { calculateDistance } from "../utils/calculateDistance";

const centralRegion = [-22.9103015, -47.0595007];

const useFilteredHouses = (
  houseList: DataPops["olxResults"],
  selectedDistances: string[]
) => {
  const [filteredHouseList, setFilteredHouseList] = useState(houseList);

  const handleFilterChange = (filters: Filters) => {
    if (houseList.length === 0) return;
    const filteredList = houseList.filter((house) => {
      const price = parseInt(house.price.replace(/[^\d]+/g, ""), 10);
      const floor = parseInt(
        house.description.find((d) => d.floorSize)?.floorSize || "0",
        10
      );
      const rooms = parseInt(
        house.description.find((d) => d.numberOfRooms)?.numberOfRooms || "0",
        10
      );
      const bathrooms = parseInt(
        house.description.find((d) => d.numberOfBathroomsTotal)
          ?.numberOfBathroomsTotal || "0",
        10
      );
      const parking = parseInt(
        house.description.find((d) => d.numberOfParkingSpaces)
          ?.numberOfParkingSpaces || "0",
        10
      );

      const distance = calculateDistance(
        centralRegion[0],
        centralRegion[1],
        house.coords?.lat!,
        house.coords?.lon!
      );

      const isWithinSelectedDistance =
        selectedDistances.length === 0 ||
        selectedDistances.some((d) => distance <= parseInt(d, 10));

      return (
        price >= filters.priceRange.min &&
        price <= filters.priceRange.max &&
        floor >= filters.floorSize &&
        rooms >= filters.numberOfRooms &&
        bathrooms >= filters.numberOfBathrooms &&
        parking >= filters.numberOfParkingSpaces &&
        house.address
          .toLowerCase()
          .includes(filters.addressQuery.toLowerCase()) &&
        isWithinSelectedDistance
      );
    });
    setFilteredHouseList(filteredList);
  };

  useEffect(() => {
    setFilteredHouseList(houseList);
  }, [houseList]);

  return { filteredHouseList, handleFilterChange };
};

export default useFilteredHouses;
