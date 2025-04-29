import React, { memo } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import defaultImage from "../../assets/mcmv.png";
import { DescriptionFields, Property } from "../../services/dataService";
import getBrasiliaTime from "../../utils/getBrasiliaTime";

export interface PropertyCardProps {
  property: Property;
  index: number;
}

/**
 * Component representing a card that displays property details.
 *
 * @component
 * @param {PropertyCardProps} props - The properties for the PropertyCard component.
 * @param {Object} props.property - The property details.
 * @param {string} props.property.address - The address of the property.
 * @param {Array<string>} props.property.images - The images of the property.
 * @param {Array<Object>} props.property.description - The description fields of the property.
 * @param {string} props.property.link - The link to the property details.
 * @param {string} props.property.price - The price of the property.
 * @param {number} props.index - The index of the property card.
 *
 * @returns {JSX.Element} The rendered PropertyCard component.
 *
 * @example
 * <PropertyCard
 *   property={{
 *     address: "123 Main St",
 *     images: ["image1.jpg", "image2.jpg"],
 *     description: [{ FloorSize: "100" }, { NumberOfRooms: "3" }],
 *     link: "http://example.com",
 *     price: "1000000"
 *   }}
 *   index={0}
 * />
 */
const PropertyCard: React.FC<PropertyCardProps> = memo(
  ({ property, index }) => {
    const { address, images, description, link, price, scrapedAt } = property;

    const isNew = () => {
      if (!scrapedAt) return null;

      const currentDate = new Date(getBrasiliaTime());
      const scrapedDate = new Date(scrapedAt);

      // Calcular a diferença em dias
      const diffTime = currentDate.getTime() - scrapedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 7) {
        const formattedDate = scrapedDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });

        return `New ${formattedDate}`;
      }

      return null;
    };

    const getDescriptionValue = (field: DescriptionFields) => {
      return description?.find((item) => item[field])?.[field] || undefined;
    };

    const floorSize = getDescriptionValue(DescriptionFields.FloorSize);
    const numberOfRooms = getDescriptionValue(DescriptionFields.NumberOfRooms);
    const numberOfBathrooms = getDescriptionValue(
      DescriptionFields.NumberOfBathroomsTotal
    );
    const numberOfParkingSpaces = getDescriptionValue(
      DescriptionFields.NumberOfParkingSpaces
    );

    const validImages =
      Array.isArray(images) && images.length > 0 ? images : [defaultImage];

    const renderDescription = () => {
      return [
        floorSize && `${floorSize} m²`,
        numberOfRooms &&
          `${numberOfRooms} ${
            parseInt(numberOfRooms) > 1 ? "quartos" : "quarto"
          }`,
        numberOfBathrooms &&
          `${numberOfBathrooms} ${
            parseInt(numberOfBathrooms) > 1 ? "banheiros" : "banheiro"
          }`,
        numberOfParkingSpaces &&
          `${numberOfParkingSpaces} ${
            parseInt(numberOfParkingSpaces) > 1 ? "vagas" : "vaga"
          }`,
      ]
        .filter(Boolean)
        .join(" • ");
    };
    const renderDistance = () => {
      // Verificar se o imóvel tem coordenadas e dados de distância
      if (
        !property.coords ||
        (!property.coords.distanceToCenter &&
          !property.coords.walkingDistanceToCenter)
      ) {
        return null;
      }

      // Formatar a distância em linha reta
      const directDistance = property.coords.distanceToCenter
        ? `${property.coords.distanceToCenter} km`
        : null;

      // Formatar a distância a pé
      const walkingDistance = property.coords.walkingDistanceToCenter
        ? `${property.coords.walkingDistanceToCenter} km a pé`
        : null;

      // Determinar qual ícone usar baseado na distância até o centro
      let distanceIcon = "🏙️";
      let distanceClass = "text-blue-600";

      if (property.coords.distanceToCenter) {
        if (property.coords.distanceToCenter <= 4) {
          distanceIcon = "🏙️";
          distanceClass = "text-green-600 font-medium";
        } else if (property.coords.distanceToCenter <= 8) {
          distanceIcon = "🚌";
          distanceClass = "text-blue-600";
        } else if (property.coords.distanceToCenter <= 15) {
          distanceIcon = "🚗";
          distanceClass = "text-yellow-600";
        } else {
          distanceIcon = "✈️";
          distanceClass = "text-red-600";
        }
      }

      // Criar a string de distância
      let distanceText = "";

      if (directDistance && walkingDistance) {
        distanceText = `${directDistance} (${walkingDistance})`;
      } else if (directDistance) {
        distanceText = directDistance;
      } else if (walkingDistance) {
        distanceText = walkingDistance;
      }

      return (
        <div className={`flex items-center gap-1 ${distanceClass}`}>
          <span>{distanceIcon}</span>
          <span className="text-sm">{distanceText} do centro</span>
        </div>
      );
    };
    const renderCarousel = () => {
      return validImages.map((image, imgIndex) => {
        const uniqImgID = `slide-${index}-${imgIndex}`;

        return (
          <div
            id={uniqImgID}
            className="carousel-item relative w-full"
            key={uniqImgID}
          >
            <LazyLoadImage
              src={image || defaultImage}
              alt={`Imagem da propriedade ${imgIndex + 1}`}
              className="w-full h-48 object-cover"
              onError={(e) => (e.currentTarget.src = defaultImage)}
              loading="lazy"
            />

            <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
              <a
                href={`#slide-${index}-${
                  imgIndex === 0 ? validImages.length - 1 : imgIndex - 1
                }`}
                className="btn btn-circle"
              >
                ❮
              </a>
              <a
                href={`#slide-${index}-${(imgIndex + 1) % validImages.length}`}
                className="btn btn-circle"
              >
                ❯
              </a>
            </div>
          </div>
        );
      });
    };

    return (
      <div className="card w-80 bg-base-100 shadow-xl">
        <figure>
          <div className="carousel w-full">{renderCarousel()}</div>
        </figure>

        <div className="card-body">
          <h2 className="card-title">
            {parseInt(price).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }) || "Preço não disponível"}
            {isNew() && <div className="badge badge-success">{isNew()}</div>}
          </h2>
          {renderDistance() && <p className="text-sm">{renderDistance()}</p>}
          <p className="text-sm">{renderDescription()}</p>
          <p className="text-sm text-gray-500">
            {address || "Endereço não disponível"}
          </p>
          <div className="card-actions justify-end">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Ver Detalhes
              </a>
            ) : (
              <a href="#" className="btn btn-primary disabled">
                Detalhes não disponíveis
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default PropertyCard;
