import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconShadowPng from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Property } from "../../services/dataService";

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
}

const Map: React.FC<MapProps> = ({ properties }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [groupedProperties, setGroupedProperties] = useState<{
    [key: string]: Property[];
  }>({});

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setPosition([position.coords.latitude, position.coords.longitude]);
    });
  }, []);

  useEffect(() => {
    const grouped = properties.reduce((acc, property) => {
      const key = `${property.coords.lat}-${property.coords.lon}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(property);
      return acc;
    }, {} as { [key: string]: Property[] });

    setGroupedProperties(grouped);
  }, [properties]);

  return (
    <MapContainer
      center={position || [-22.9103015, -47.0595007]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
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
      {Object.entries(groupedProperties).map(([key, properties], index) => {
        console.log("key: ", key);
        const { lat, lon } = properties[0].coords;
        const neighborhood = properties[0].address;
        return (
          lat &&
          lon && (
            <div key={index}>
              <Circle
                center={[lat, lon]}
                radius={500}
                color="blue"
                fillColor="blue"
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
              <Marker position={[lat, lon]} icon={defaultIcon}>
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
          )
        );
      })}
    </MapContainer>
  );
};

export default Map;
