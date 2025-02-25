import { useEffect, useMemo, useState } from "react";

import PropertyNavbarFilters from "../../components/Filters/PropertyNavbarFilters";
import Map from "../../components/Map/Map";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import PropertyList from "../../components/PropertyList/PropertyList";
import ThemeSelector from "../../components/ThemeSelector/ThemeSelector";
import { useFetchData } from "../../hooks/useFetchData";
import useFilteredHouses from "../../hooks/useFilteredHouses";
import { DataPops } from "../../services/dataService";

const Home = () => {
  // const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [houseList, setHouseList] = useState<DataPops["olxResults"]>([]);
  const [hasData, setHasData] = useState(true);
  const selectedDistances = ["1", "2", "3", "5", "8", "10", "12"];

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
      } else {
        setHasData(false);
      }
    }
  }, [data, loading]);

  const { filteredHouseList, handleFilterChange } = useFilteredHouses(
    houseList,
    selectedDistances
  );
  const size = loading ? 0 : filteredHouseList.length;

  const defaultLinks = [
    <p>{size} casas encontradas</p>,
    <p className="text-xl">Outros links: </p>,
    <a
      className="btn btn-ghost text-xl"
      target="_blank"
      href="https://guia.apenasgabs.dev"
    >
      Guia de TI
      <span className="badge badge-sm badge-warning">NEW</span>
    </a>,
  ];

  const Skeleton = Array.from({ length: 3 }).map((_, index) => (
    <div className="flex w-96 flex-col gap-4" key={index}>
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full mt-6" />
      <div className="skeleton h-14 w-1/2 self-end mt-14 btn" />
    </div>
  ));

  const HouseListRendered = useMemo(() => {
    if (!loading) {
      return <PropertyList properties={filteredHouseList} />;
    }
    return <>{Skeleton}</>;
  }, [loading, filteredHouseList]);
  return (
    <div>
      <Navbar navbarEndButton={<ThemeSelector />} links={defaultLinks} />
      <PropertyNavbarFilters
        navbarEndButton={
          <button
            onClick={() => setShowMap((prev) => !prev)}
            className="btn btn-sm btn-ghost text-xl"
          >
            Mapa
          </button>
        }
        onFilterChange={handleFilterChange}
      />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />
      <div className="flex flex-col lg:flex-row">
        {/* <PropertyFilters onFilterChange={handleFilterChange} /> */}
        {/* TODO Implement the tag filter again */}
        {/* <TagFilter
          activeTags={selectedDistances}
          
          setActiveTags={setSelectedDistances}
        /> */}
        <div
          className={`flex flex-wrap justify-between gap-2 p-5 ${
            showMap ? "lg:w-2/3" : "lg:w-full"
          }`} // ref={scrollContainerRef}
        >
          {loading && <p>Carregando...</p>}
          {!loading && hasData && filteredHouseList.length === 0 && (
            <p>Nenhum resultado encontrado com os filtros aplicados.</p>
          )}
          {HouseListRendered}
        </div>
        {!loading && showMap && (
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
