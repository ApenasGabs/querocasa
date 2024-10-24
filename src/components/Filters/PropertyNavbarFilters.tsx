import { ChangeEvent, useReducer } from "react";
import Card from "../Card/Card";
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

const PropertyNavbarFilters = ({
  onFilterChange,
}: PropertyNavbarFiltersProps) => {
  const initialFilters: Filters = {
    priceRange: { min: 0, max: 1000000 },
    floorSize: 0,
    numberOfRooms: 0,
    numberOfBathrooms: 0,
    numberOfParkingSpaces: 0,
    addressQuery: "",
    distances: [],
  };

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
        return {
          ...state,
          [action.payload.name]: action.payload.value,
        };
      case "RESET_FILTERS":
        return initialFilters;
      default:
        return state;
    }
  }

  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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
    document.getElementById("filter-drawer")?.click();
  };

  const handleResetFilters = () => {
    dispatch({ type: "RESET_FILTERS" });
  };

  const CardFilterList = filterObjects.map((filter) => {
    if (filter.propName === "priceRange") {
      return (
        <details className="dropdown">
          <summary className="btn m-1">{filter.label}</summary>
          <div className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <Card key={filter.propName}>
              <label>{filter.label}:</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder={filter.placeholder[0]}
                  className="input input-bordered input-primary w-full max-w-xs"
                  name="min"
                  value={
                    (
                      filters[filter.propName] as {
                        min: number;
                        max: number;
                      }
                    ).min
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, filter.propName)
                  }
                />
                <input
                  value={
                    (
                      filters[filter.propName] as {
                        min: number;
                        max: number;
                      }
                    ).max
                  }
                  placeholder={filter.placeholder[1]}
                  className="input input-bordered input-primary w-full max-w-xs"
                  name="max"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, filter.propName)
                  }
                />
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyFilters}
                >
                  Aplicar Filtros
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleResetFilters}
                >
                  Resetar Filtros
                </button>
              </div>
            </Card>
          </div>
        </details>
      );
    } else {
      return (
        <details className="dropdown">
          <summary className="btn m-1">{filter.label}</summary>
          <div className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <Card key={filter.propName}>
              <label>{filter.label}:</label>
              <input
                className="input input-bordered input-primary w-full max-w-xs"
                type={filter.type}
                placeholder={
                  typeof filter.placeholder === "string"
                    ? filter.placeholder
                    : ""
                }
                value={filters[filter.propName]}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(e, filter.propName)
                }
              />
              <div className="mt-4 flex justify-between">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyFilters}
                >
                  Aplicar Filtros
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleResetFilters}
                >
                  Resetar Filtros
                </button>
              </div>
            </Card>
          </div>
        </details>
      );
    }
  });

  return <Navbar links={CardFilterList} />;
};

export default PropertyNavbarFilters;
