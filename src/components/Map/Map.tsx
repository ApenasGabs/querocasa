import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconShadowPng from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Property } from "../../services/dataService";
import { calculateDistance } from "../../utils/calculateDistance";

const defaultIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerIconShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  properties: Property[];
  distances?: number[];
}

const interpolateMultiColor = (colors: string[], factor: number) => {
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex = (x: number) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };

  const segment = 1 / (colors.length - 1);
  const index = Math.min(Math.floor(factor / segment), colors.length - 2);
  const localFactor = (factor - index * segment) / segment;

  return interpolateColor(colors[index], colors[index + 1], localFactor);
};

const createColoredIcon = (color: string) => {
  return new L.Icon({
    iconUrl: markerIconPng,
    shadowUrl: markerIconShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: `leaflet-marker-icon-${color.replace("#", "")}`,
  });
};

const Map: React.FC<MapProps> = ({
  properties,
  distances = [4, 5, 8, 10, 12],
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [groupedProperties, setGroupedProperties] = useState<{
    [key: string]: Property[];
  }>({});
  const maxDistance = Math.max(...distances);
  const defaultCenter = React.useMemo<[number, number]>(
    () => [-22.9103015, -47.0595007],
    []
  );

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition([position.coords?.latitude, position.coords?.longitude]);
      },
      () => {
        setPosition(defaultCenter);
      }
    );
  }, [defaultCenter]);

  useEffect(() => {
    const grouped = properties.reduce((acc, property) => {
      if (
        property.coords?.lat !== undefined &&
        property.coords?.lon !== undefined
      ) {
        const key = `${property.coords?.lat}-${property.coords?.lon}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(property);
      }
      return acc;
    }, {} as { [key: string]: Property[] });

    setGroupedProperties(grouped);
  }, [properties]);

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={13}
      style={{ height: "84vh", width: "100%", overflow: "hidden" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {position && (
        <Marker position={position} icon={defaultIcon}>
          <Popup>Você está aqui</Popup>
        </Marker>
      )}

      {distances &&
        distances.map((distance, index) => {
          const factor = distance / maxDistance;
          const color = interpolateMultiColor(
            ["#075800", "#00FF00", "#FFFF00", "#FFA500", "#c44949", "#FF0000"],
            factor
          );
          return (
            <Circle
              key={index}
              center={position || defaultCenter}
              radius={distance * 1000}
              color={color}
              fill={false}
            />
          );
        })}
      {Object.entries(groupedProperties).map(([, properties], index) => {
        const { lat, lon } = properties[0].coords;
        const neighborhood = properties[0].address;

        // Calcular a distância da propriedade ao ponto central
        if (lat !== undefined && lon !== undefined) {
          const distance = calculateDistance(
            position ? position[0] : defaultCenter[0],
            position ? position[1] : defaultCenter[1],
            lat,
            lon
          );
          // Calcular a cor do marcador com base na distância
          const factor = distance / maxDistance;
          const color = interpolateMultiColor(
            ["#075800", "#00FF00", "#FFFF00", "#FFA500", "#FF0000"],
            factor
          );
          const coloredIcon = createColoredIcon(color);

          return (
            <div key={index}>
              <Circle
                center={[lat, lon]}
                radius={50}
                color={color}
                fillColor={color}
                fillOpacity={0.2}
              >
                <Popup>
                  <div>
                    <p>Bairro: {neighborhood}</p>
                    <p>Quantidade de casas: {properties.length}</p>
                    {properties.map((property, i) => (
                      <div key={i}>
                        <p>Endereço: {property.address}</p>
                        <p>Preço: {property.price}</p>
                        <p>
                          Tamanho:{" "}
                          {
                            property.description.find((d) => d.floorSize)
                              ?.floorSize
                          }{" "}
                          m²
                        </p>
                        <p>
                          Quartos:{" "}
                          {
                            property.description.find((d) => d.numberOfRooms)
                              ?.numberOfRooms
                          }
                        </p>
                        <p>
                          Banheiros:{" "}
                          {
                            property.description.find(
                              (d) => d.numberOfBathroomsTotal
                            )?.numberOfBathroomsTotal
                          }
                        </p>
                        <a
                          href={property.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver mais
                        </a>
                        <hr />
                      </div>
                    ))}
                  </div>
                </Popup>
              </Circle>
              <Marker position={[lat, lon]} icon={coloredIcon}>
                <Popup>
                  <div>
                    <p>Bairro: {neighborhood}</p>
                    <p>Quantidade de casas: {properties.length}</p>
                    {properties.map((property, i) => (
                      <div key={i}>
                        <p>Endereço: {property.address}</p>
                        <p>Preço: {property.price}</p>
                        <p>
                          Tamanho:{" "}
                          {
                            property.description.find((d) => d.floorSize)
                              ?.floorSize
                          }{" "}
                          m²
                        </p>
                        <p>
                          Quartos:{" "}
                          {
                            property.description.find((d) => d.numberOfRooms)
                              ?.numberOfRooms
                          }
                        </p>
                        <p>
                          Banheiros:{" "}
                          {
                            property.description.find(
                              (d) => d.numberOfBathroomsTotal
                            )?.numberOfBathroomsTotal
                          }
                        </p>
                        <a
                          href={property.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver mais
                        </a>
                        <hr />
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        }
      })}
    </MapContainer>
  );
};

export default Map;
