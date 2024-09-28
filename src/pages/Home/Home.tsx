// pages/Home.tsx
import { useEffect, useRef, useState } from "react";
import PropertyFilters, { Filters } from "../../components/Filters/PropertyFilters";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import PropertyCard from "../../components/PropertyCard/PropertyCard";
import { useFetchData } from "../../hooks/useFetchData";
import { DataPops } from "../../services/dataService";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [houseList, setHouseList] = useState<DataPops["olxResults"]>([]);
  const [filteredHouseList, setFilteredHouseList] = useState(houseList);

  const { data, loading, error } = useFetchData();
  console.log("error: ", error);

  useEffect(() => {
    if (!loading) {
      const combinedList = [...data.olxResults, ...data.zapResults];

      const parsePrice = (priceString: string) => {
        const price = priceString.replace(/[^\d]+/g, "");
        return parseInt(price, 10) || 0;
      };

      const sortedList = combinedList.sort((a, b) => {
        return parsePrice(a.price) - parsePrice(b.price);
      });

      setHouseList(sortedList);
    }
  }, [data, loading]);

  const handleFilterChange = (filters: Filters) => {
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

      return (
        price >= filters.priceRange.min &&
        price <= filters.priceRange.max &&
        floor >= filters.floorSize &&
        rooms >= filters.numberOfRooms &&
        bathrooms >= filters.numberOfBathrooms &&
        parking >= filters.numberOfParkingSpaces &&
        house.address.toLowerCase().includes(filters.addressQuery.toLowerCase())
      );
    });
    setFilteredHouseList(filteredList);
  };

  const size = loading ? 0 : filteredHouseList.length;

  return (
    <div className="w-full">
      <Navbar links={[<p>{size} casas encontradas</p>]} />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />

      <div className="flex flex-col lg:flex-row">
        {/* Filtros */}
        <PropertyFilters onFilterChange={handleFilterChange} />

        <div
          className="flex flex-wrap justify-between gap-2 p-5 lg:w-2/3"
          ref={scrollContainerRef}
        >
          {filteredHouseList.map((property, index) => (
            <PropertyCard key={`house-${index}`} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
