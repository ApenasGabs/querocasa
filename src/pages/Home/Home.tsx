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
      <>
        {data.map((house) => (
          <Card description={house.price} title={house.address} />
        ))}
      </>
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

      <div>
        <Card />
        {HouseList}
      </div>
      <div
        className="flex flex-wrap justify-between gap-2 p-5"
        ref={scrollContainerRef}
      ></div>
    </div>
  );
};

export default Home;
