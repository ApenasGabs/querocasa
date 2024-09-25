import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { DescriptionFields, Property } from "../../services/dataService";

export interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { address, images, description, link, price } = property;

  const getDescriptionValue = (field: DescriptionFields) => {
    return description.find((item) => item[field])?.[field] || "N/A";
  };

  const floorSize = getDescriptionValue(DescriptionFields.FloorSize);
  const numberOfRooms = getDescriptionValue(DescriptionFields.NumberOfRooms);
  const numberOfBathrooms = getDescriptionValue(
    DescriptionFields.NumberOfBathroomsTotal
  );
  const numberOfParkingSpaces = getDescriptionValue(
    DescriptionFields.NumberOfParkingSpaces
  );
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="carousel w-full">
        {images.map((image, index) => (
          <div
            id={`slide${index}`}
            className="carousel-item relative w-full"
            key={index}
          >
            <figure>
              <LazyLoadImage
                src={image}
                alt={`Imagem da propriedade ${index + 1}`}
                // className="w-full"
                // effect="blur"
              />
            </figure>

            <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
              <a
                href={`#slide${index === 0 ? images.length - 1 : index - 1}`}
                className="btn btn-circle"
              >
                ❮
              </a>
              <a
                href={`#slide${(index + 1) % images.length}`}
                className="btn btn-circle"
              >
                ❯
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="card-body">
        <h2 className="card-title">{price}</h2>
        <p className="text-sm">
          {floorSize} m² • {numberOfRooms} quartos • {numberOfBathrooms}{" "}
          banheiros • {numberOfParkingSpaces} vagas
        </p>
        <p className="text-sm text-gray-500"> {address}</p>
        <div className="card-actions justify-end">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Ver Detalhes
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
