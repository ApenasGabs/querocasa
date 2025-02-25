import React, { useCallback, useEffect, useRef, useState } from "react";
import PropertyCard, { PropertyCardProps } from "../PropertyCard/PropertyCard";

interface PropertyListProps {
  properties: PropertyCardProps["property"][];
}

/**
 * PropertyList component that displays a list of properties with infinite scrolling.
 *
 * @component
 * @param {PropertyListProps} props - The properties passed to the component.
 * @param {PropertyCardProps["property"][]} props.properties - The list of properties to display.
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * <PropertyList properties={properties} />
 *
 * @remarks
 * This component uses the IntersectionObserver API to implement infinite scrolling.
 * When the last visible item enters the viewport, more items are loaded and displayed.
 *
 * @function
 * @name PropertyList
 *
 * @typedef {Object} PropertyListProps
 * @property {PropertyCardProps["property"][]} properties - The list of properties to display.
 *
 * @typedef {Object} PropertyCardProps
 * @property {Object} property - The property details.
 *
 * @typedef {Object} PropertyCardProps["property"]
 *
 * @hook
 * @name useState
 * @description Manages the state of visible properties and the index of the last visible item.
 *
 * @hook
 * @name useRef
 * @description Creates a reference for the last visible item.
 *
 * @hook
 * @name useCallback
 * @description Memoizes the function to load more items.
 *
 * @hook
 * @name useEffect
 * @description Sets up the IntersectionObserver to detect when the last item enters the viewport.
 */
const PropertyList: React.FC<PropertyListProps> = ({
  properties,
}: PropertyListProps): JSX.Element => {
  const [visibleProperties, setVisibleProperties] = useState<
    PropertyCardProps["property"][]
  >([]);
  const [lastIndex, setLastIndex] = useState(20);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const loadMoreItems = useCallback(() => {
    const newIndex = lastIndex + 20;
    setVisibleProperties((prevItems) => [
      ...prevItems,
      ...properties.slice(lastIndex, newIndex),
    ]);
    setLastIndex(newIndex);
  }, [properties, lastIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      {
        rootMargin: "100px",
      }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [loadMoreItems]);

  return (
    <div className="flex flex-wrap justify-start gap-4">
      {visibleProperties.map((property, index) => (
        <div key={index} className="  h-auto p-2">
          <PropertyCard property={property} index={index} />
        </div>
      ))}

      <div ref={observerRef} className="w-full h-1"></div>
    </div>
  );
};

export default PropertyList;
