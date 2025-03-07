import { ChangeEvent, useReducer, useState } from "react";
import FilterActions from "../FilterActions/FilterActions";
import FilterDropdown from "../FilterDropdown/FilterDropdown";
import Navbar from "../Navbar/Navbar";
import { FilterAction, Filters } from "./PropertyFilters.types";
import {
  filterListProps,
  PropertyNavbarFiltersProps,
} from "./PropertyNavbarFilters.types";

const filterObjects: filterListProps[] = [
  {
    label: "Faixa de Preço",
    type: "range",
    propName: "priceRange",
    placeholder: ["Min", "Max"],
  },
  {
    label: "Tamanho do Imóvel (m²)",
    type: "number",
    propName: "floorSize",
    placeholder: "Tamanho",
  },
  {
    label: "Quartos",
    type: "number",
    propName: "numberOfRooms",
    placeholder: "Quartos",
  },
  {
    label: "Banheiros",
    type: "number",
    propName: "numberOfBathrooms",
    placeholder: "Banheiros",
  },
  {
    label: "Vagas de Garagem",
    type: "number",
    propName: "numberOfParkingSpaces",
    placeholder: "Vagas",
  },
  {
    label: "Endereço",
    type: "text",
    propName: "addressQuery",
    placeholder: "Pesquisar por endereço",
  },
];

const initialFilters: Filters = {
  priceRange: { min: 0, max: 1000000 },
  floorSize: 0,
  numberOfRooms: 0,
  numberOfBathrooms: 0,
  numberOfParkingSpaces: 0,
  addressQuery: "",
  distances: [],
};

const PropertyNavbarFilters = ({
  onFilterChange,
  navbarEndButton,
}: PropertyNavbarFiltersProps) => {
  const [resetCounter, setResetCounter] = useState(0);
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  function filterReducer(state: Filters, action: FilterAction): Filters {
    switch (action.type) {
      case "SET_PRICE_RANGE":
        return {
          ...state,
          priceRange: {
            ...state.priceRange,
            [action.payload.name]: action.payload.value,
          },
        };
      case "SET_FILTER":
        return { ...state, [action.payload.name]: action.payload.value };
      case "RESET_FILTERS":
        return initialFilters;
      default:
        return state;
    }
  }

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof Filters
  ) => {
    const value = e.target.value;
    if (key === "priceRange") {
      dispatch({
        type: "SET_PRICE_RANGE",
        payload: {
          name: e.target.name as "min" | "max",
          value: parseInt(value, 10) || 0,
        },
      });
    } else {
      dispatch({
        type: "SET_FILTER",
        payload: {
          name: key,
          value: key === "addressQuery" ? value : parseInt(value, 10) || 0,
        },
      });
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setResetCounter((prev) => prev + 1);

    dispatch({ type: "RESET_FILTERS" });
    onFilterChange(initialFilters);
  };

  const CardFilterList = filterObjects.map((filter) => (
    <FilterDropdown
      key={filter.propName}
      filter={filter}
      filters={filters}
      handleInputChange={handleInputChange}
      handleApplyFilters={handleApplyFilters}
      handleResetFilters={handleResetFilters}
      resetCounter={resetCounter}
    />
  ));

  CardFilterList.push(
    <FilterActions key="filter-actions" onReset={handleResetFilters} />
  );
  return (
    <Navbar
      navbarEndButton={navbarEndButton}
      removeHomeButton
      links={CardFilterList}
    />
  );
};

export default PropertyNavbarFilters;
