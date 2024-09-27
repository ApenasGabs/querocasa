import React, { useEffect, useState } from "react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import PropertyCard, { PropertyCardProps } from "../PropertyCard/PropertyCard";

interface PropertyListProps {
  properties: PropertyCardProps["property"][];
}

const PropertyList: React.FC<PropertyListProps> = ({ properties }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columnWidth = 300;
  const rowHeight = 500;
  const columnCount = Math.floor(windowWidth / columnWidth);

  const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= properties.length) return null;
    return (
      <div
        style={{
          ...style,
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          padding: "1rem",
        }}
      >
        <PropertyCard property={properties[index]} />
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={windowHeight}
      rowCount={Math.ceil(properties.length / columnCount)}
      rowHeight={rowHeight}
      width={windowWidth}
    >
      {Cell}
    </Grid>
  );
};

export default PropertyList;
