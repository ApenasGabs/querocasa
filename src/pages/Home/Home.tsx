import { useMemo, useRef, useState } from "react";

import Card from "../../components/Card/Card";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import { useFetchData } from "../../hooks/useFetchData";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { data, loading, error } = useFetchData();
  const size = loading ? 0 : data.length;
  console.log("error: ", error);

  const HouseList = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {data.length > 1 ? (
          data.map((house) => (
            <Card
              description={house.price}
              title={house.address}
              link={house.link}
            />
          ))
        ) : (
          <Card />
        )}
      </div>
    ),
    [data]
  );
  return (
    <div className="w-full ">
      <Navbar links={[<p> {size}</p>]} />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />

      <div>{HouseList}</div>
      <div
        className="flex flex-wrap justify-between gap-2 p-5"
        ref={scrollContainerRef}
      ></div>
    </div>
  );
};

export default Home;
