import { useEffect, useMemo, useRef, useState } from "react";

import Card from "../../components/Card/Card";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import { dataPops } from "../../hooks/useFetchData";
import { fetchDataFiles } from "../../services/dataService";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [data, setData] = useState<dataPops[]>([]);
  console.log("data: ", data);
  const size = data.length;

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedData = await fetchDataFiles();
        console.log("fetchedData: ", fetchedData);
        setData(fetchedData);
      } catch (err: unknown) {
        console.error("err: ", err);
      }
    };
    loadData();
  }, []);

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
