import { useRef, useState } from "react";

import Modal from "../../components/Modal/Modal";
import Navbar from "../../components/Navbar/Navbar";

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="w-full ">
      <Navbar />
      <Modal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen((prev) => !prev)}
      />
      <div className="bg-info flex flex-col p-4">
        <div className="flex gap-4 flex-wrap items-center justify-center">
          <p className="text-xl">Languages: </p>,
        </div>
      </div>
      <div>
        <div className="card bg-base-100 image-full w-96 shadow-xl">
          <figure>
            <img
              src={"https://pacaembu.com/svg/ic-mcmv.svg"}
              className="logo react"
              alt="i"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Loren!</h2>
            <p>Loren ipslun?</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Quero 🏡</button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex flex-wrap justify-between gap-2 p-5"
        ref={scrollContainerRef}
      ></div>
    </div>
  );
};

export default Home;
