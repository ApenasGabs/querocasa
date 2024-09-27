import React from "react";
import { FixedSizeList as List } from "react-window";
import PropertyCard, { PropertyCardProps } from "../PropertyCard/PropertyCard";

interface PropertyListProps {
  properties: PropertyCardProps["property"][];
}
interface RowProps {
  index: number;
  style: React.CSSProperties;
}
const PropertyList: React.FC<PropertyListProps> = ({ properties }) => {
  const Row = ({ index, style }: RowProps) => (
    <div
      style={{
        ...style,
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: ".5rem",
        padding: "1.5rem",
      }}
      className="flex flex-wrap justify-between gap-2 p-5"
    >
      <PropertyCard property={properties[index]} />
    </div>
  );

  return (
    <List
      height={window.innerHeight}
      itemCount={properties.length}
      itemSize={450}
      width={"100%"}
    >
      {Row}
    </List>
  );
};

export default PropertyList;
