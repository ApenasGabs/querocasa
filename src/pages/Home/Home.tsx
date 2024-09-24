import { useMemo, useRef, useState } from "react";

import Card from "../../components/Card/Card";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import { useFetchData } from "../../hooks/useFetchData";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { data, loading, error } = useFetchData();
  console.log("error: ", error);
  const { olxResults, zapResults } = data;
  const size = loading && !data ? 0 : olxResults.length + zapResults.length;
  const OlxHouseList = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {olxResults.length > 1 ? (
          olxResults.map((house) => (
            <Card
              description={house.description}
              price={house.price}
              title={house.address}
              link={house.link}
              publishDate={house.publishDate}
            />
          ))
        ) : (
          <Card />
        )}
      </div>
    ),
    [olxResults]
  );

  const ZapHouseList = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {zapResults.length > 1 ? (
          zapResults.map((house) => (
            <Card
              description={`${house.description.floorSize} - ${house.description.numberOfRooms} - ${house.description.numberOfBathroomsTotal}`}
              price={house.price}
              title={house.address}
              link={house.link}
              publishDate={`${house.description.numberOfParkingSpaces} vagas`}
            />
          ))
        ) : (
          <Card />
        )}
      </div>
    ),
    [zapResults]
  );
  return (
    <div className="w-full ">
      <Navbar links={[<p>{size} casas encontradas</p>]} />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />

      <div>{ZapHouseList}</div>
      <div>{OlxHouseList}</div>
      <div
        className="flex flex-wrap justify-between gap-2 p-5"
        ref={scrollContainerRef}
      ></div>
    </div>
  );
};

export default Home;
