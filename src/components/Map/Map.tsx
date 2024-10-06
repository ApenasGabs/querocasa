import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconShadowPng from "leaflet/dist/images/marker-shadow.png";
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
  console.log("properties: ", properties);
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log("position: ", position);
      setPosition([position.coords.latitude, position.coords.longitude]);
    });
  }, []);

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
          <Popup>Centro</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
