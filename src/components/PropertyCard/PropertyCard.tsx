import React from "react";
import { DescriptionFields, Property } from "../../services/dataService";

export interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { address, description, link, price } = property;

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
    <div className="card bg-base-100 w-96 shadow-xl">
      <figure>
        <img
          src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
          alt="Property"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{price}</h2>
        <p className="text-sm">
          {floorSize} m² • {numberOfRooms} quartos • {numberOfBathrooms}{" "}
          banheiros • {numberOfParkingSpaces} vagas
        </p>
        <p className="text-sm text-gray-500">{address}</p>
        <div className="card-actions justify-end">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Ver mais
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
