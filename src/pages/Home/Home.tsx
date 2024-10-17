import { useEffect, useRef, useState } from "react";
import PropertyFilters, {
  Filters,
} from "../../components/Filters/PropertyFilters";
import Map from "../../components/Map/Map";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import PropertyList from "../../components/PropertyList/PropertyList";
import TagFilter from "../../components/TagFilter/TagFilter"; // Import the tag filter
import { useFetchData } from "../../hooks/useFetchData";
import { DataPops } from "../../services/dataService";
import { calculateDistance } from "../../utils/calculateDistance";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [houseList, setHouseList] = useState<DataPops["olxResults"]>([]);
  const [filteredHouseList, setFilteredHouseList] = useState(houseList);
  const [hasData, setHasData] = useState(true);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([
    "4",
    "5",
    "8",
    "10",
    "12",
  ]);

  const { data, loading, error } = useFetchData();
  console.error("error: ", error);

  useEffect(() => {
    if (!loading) {
      if ((data && data.olxResults.length > 0) || data.zapResults.length > 0) {
        const { olxResults, zapResults } = data;
        console.log("data: ", data);
        const combinedList = [...(olxResults || []), ...(zapResults || [])];

        const parsePrice = (priceString: string) => {
          const price = priceString.replace(/[^\d]+/g, "");
          return parseInt(price, 10) || 0;
        };

        const sortedList = combinedList.sort((a, b) => {
          return parsePrice(a.price) - parsePrice(b.price);
        });

        setHouseList(sortedList);
        setFilteredHouseList(sortedList);
      } else {
        setHasData(false);
      }
    }
  }, [data, loading]);

  const centralRegion = [-22.9103015, -47.0595007];



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
        house.coords.lat!,
        house.coords.lon!
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

  const size = loading ? 0 : filteredHouseList.length;
  const Skeleton = Array.from({ length: 3 }).map((_, index) => (
    <div className="flex w-96 flex-col gap-4" key={index}>
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full mt-6" />
      <div className="skeleton h-14 w-1/2 self-end mt-14 btn" />
    </div>
  ));

  return (
    <div>
      <Navbar links={[<p>{size} casas encontradas</p>]} />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />

      <div className="flex flex-col lg:flex-row">
        <PropertyFilters onFilterChange={handleFilterChange} />

        {/* Tag filter for distances */}
        <TagFilter
          activeTags={selectedDistances}
          setActiveTags={setSelectedDistances}
        />

        <div
          className="flex flex-wrap justify-between gap-2 p-5 lg:w-2/3"
          ref={scrollContainerRef}
        >
          {loading && <p>Carregando...</p>}
          {!loading && hasData && filteredHouseList.length === 0 && (
            <p>Nenhum resultado encontrado com os filtros aplicados.</p>
          )}
          {!loading ? (
            <div className="flex">
              <PropertyList properties={filteredHouseList} />
            </div>
          ) : (
            <>{Skeleton}</>
          )}
        </div>
        {!loading && (
          <div className="flex w-2/3 lg:w-1/3 pr-4">
            <Map
              properties={filteredHouseList}
              distances={selectedDistances.map(Number)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
