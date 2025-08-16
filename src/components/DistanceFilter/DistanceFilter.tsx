import { useEffect, useState } from "react";
import { FilterDropdownProps } from "../FilterDropdown/FilterDropdown";
import TagFilter from "../TagFilter/TagFilter";

const DISTANCE_OPTIONS = ["1", "2", "3", "5", "8", "10", "15", "20"];

interface DistanceFilterProps extends FilterDropdownProps {
  handleDistanceChange?: (distances: string[]) => void;
}

const DistanceFilter = ({
  filters,
  handleApplyFilters,
  handleResetFilters,
  filter,
}: DistanceFilterProps) => {
  const [selectedDistances, setSelectedDistances] = useState<string[]>(
    filters.distances || []
  );

  useEffect(() => {
    if (filters.distances.length === 0 && selectedDistances.length > 0) {
      setSelectedDistances([]);
    }
  }, [filters.distances, selectedDistances.length]);

  const handleDistanceChange = (tags: string[]) => {
    setSelectedDistances(tags);

    if (handleDistanceChange) {
      handleDistanceChange(tags);
    } else if (filter && filter.propName) {
      handleApplyFilters();
    }
  };

  const resetDistanceFilter = () => {
    setSelectedDistances([]);

    if (handleResetFilters) {
      handleResetFilters();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="block">Distância até o centro (km):</label>
        {selectedDistances.length > 0 && (
          <button
            onClick={resetDistanceFilter}
            className="btn btn-xs btn-ghost text-error"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {DISTANCE_OPTIONS.map((distance) => (
          <div
            key={distance}
            onClick={() => {
              const isSelected = selectedDistances.includes(distance);
              let newDistances;

              if (isSelected) {
                newDistances = selectedDistances.filter((d) => d !== distance);
              } else {
                newDistances = [...selectedDistances, distance];
              }

              handleDistanceChange(newDistances);
            }}
            className={`badge cursor-pointer ${
              selectedDistances.includes(distance)
                ? "badge-primary"
                : "badge-outline"
            }`}
          >
            {distance} km
          </div>
        ))}
      </div>
      <div className="mt-2">
        <TagFilter
          activeTags={selectedDistances}
          setActiveTags={handleDistanceChange}
        />
      </div>
    </div>
  );
};

export default DistanceFilter;
