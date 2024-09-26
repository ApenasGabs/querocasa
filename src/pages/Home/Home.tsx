import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";
import PropertyCard from "../../components/PropertyCard/PropertyCard";
import { useFetchData } from "../../hooks/useFetchData";
import { Property } from "../../services/dataService";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [houseList, setHouseList] = useState<Property[]>([]);
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

  const size = loading ? 0 : houseList.length;

  return (
    <div className="w-full">
      <Navbar links={[<p>{size} casas encontradas</p>]} />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />

      <div
        className="flex flex-wrap justify-between gap-2 p-5"
        ref={scrollContainerRef}
      >
        {houseList.map((property, index) => (
          <PropertyCard key={`house-${index}`} property={property} />
        ))}
      </div>
    </div>
  );
};

export default Home;
