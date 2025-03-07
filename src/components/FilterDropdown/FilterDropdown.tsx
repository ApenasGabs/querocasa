import { ChangeEvent, useEffect, useRef, useState } from "react";
import Card from "../Card/Card";
import FilterActions from "../FilterActions/FilterActions";
import FilterInput from "../FilterInput/FilterInput";
import { Filters } from "../Filters/PropertyFilters.types";
import { filterListProps } from "../Filters/PropertyNavbarFilters.types";

export interface FilterDropdownProps {
  //TODO - centralizar tipagens de filtros
  filter: filterListProps;
  filters: Filters;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof Filters
  ) => void;
  resetCounter?: number;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
}

const FilterDropdown = ({
  filter,
  filters,
  handleInputChange,
  handleApplyFilters,
  handleResetFilters,
  resetCounter,
}: FilterDropdownProps) => {
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [appliedFilterValues, setAppliedFilterValues] = useState<any>(null);

  const handleApply = () => {
    dropdownRef.current?.removeAttribute("open");

    setFilterApplied(true);

    if (filter.propName === "priceRange") {
      setAppliedFilterValues({ ...filters.priceRange });
    } else {
      setAppliedFilterValues(filters[filter.propName]);
    }

    setTimeout(() => {
      handleApplyFilters();
    }, 150);
  };

  const handleReset = () => {
    setFilterApplied(false);
    setAppliedFilterValues(null);

    handleResetFilters();
    dropdownRef.current?.removeAttribute("open");
  };

  const isFilterActive = (): boolean => {
    if (!filterApplied) return false;

    const { propName } = filter;

    switch (propName) {
      case "priceRange":
        return (
          appliedFilterValues?.min > 0 || appliedFilterValues?.max < 1000000
        );
      case "floorSize":
      case "numberOfRooms":
      case "numberOfBathrooms":
      case "numberOfParkingSpaces":
        return appliedFilterValues > 0;
      case "addressQuery":
        return appliedFilterValues !== "";
      case "distances":
        return appliedFilterValues?.length > 0;
      default:
        return false;
    }
  };

  const filterActive = isFilterActive();

  const buttonClass = filterActive ? "btn-primary" : "btn-neutral";

  const getActiveCount = (): number => {
    if (!filterActive) return 0;

    if (filter.propName === "priceRange") {
      let count = 0;
      if (appliedFilterValues?.min > 0) count++;
      if (appliedFilterValues?.max < 1000000) count++;
      return count;
    }

    return 1;
  };

  const activeCount = getActiveCount();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dropdownRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Ignorar a primeira renderização
    if (resetCounter && resetCounter > 0) {
      setFilterApplied(false);
      setAppliedFilterValues(null);
    }
  }, [resetCounter]);

  return (
    <details ref={dropdownRef} className="dropdown">
      <summary
        className={`btn m-1 ${buttonClass}`}>
        {filter.label}
        {filterActive && (
          <div className="badge badge-accent">{activeCount}</div>
        )}
      </summary>
      <div className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2  shadow">
        <Card key={filter.propName}>
          <label>{filter.label}:</label>
          <FilterInput
            filter={filter}
            filters={filters}
            handleInputChange={handleInputChange}
            handleApplyFilters={handleApplyFilters}
            handleResetFilters={handleReset}
            resetCounter={resetCounter}
          />
          <FilterActions onApply={handleApply} onReset={handleReset} />
        </Card>
      </div>
    </details>
  );
};

export default FilterDropdown;
