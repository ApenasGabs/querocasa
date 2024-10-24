import { ChangeEvent, useReducer } from "react";
import Card from "../Card/Card";
import TagFilter from "../TagFilter/TagFilter";
import { FilterAction, Filters } from "./PropertyFilters.types";

interface PropertyNavbarFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

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
  type FilterPropName = keyof Filters;

  interface filterListProps {
    label: string;
    type: "number" | "text" | "range";
    propName: FilterPropName;
    placeholder: string | string[];
  }
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

  const CardFilterList = filterObjects.map((filter) => {
    if (filter.type === "range") {
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
                    filter.propName === "priceRange"
                      ? (
                          filters[filter.propName] as {
                            min: number;
                            max: number;
                          }
                        ).min
                      : undefined
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, filter.propName)
                  }
                />
                <input
                  value={
                    filter.propName === "priceRange"
                      ? (
                          filters[filter.propName] as {
                            min: number;
                            max: number;
                          }
                        ).max
                      : undefined
                  }
                  placeholder={filter.placeholder[1]}
                  className="input input-bordered input-primary w-full max-w-xs"
                  name="max"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(e, filter.propName)
                  }
                />
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
                value={
                  filter.propName === "priceRange"
                    ? undefined
                    : filters[filter.propName]
                }
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(e, filter.propName)
                }
              />
            </Card>
          </div>
        </details>
      );
    }
  });
  const oldFilters = (
    <>
      <div className="lg:hidden">
        <div className="drawer drawer-end">
          <input id="filter-drawer" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            <label htmlFor="filter-drawer" className="btn btn-primary btn-sm">
              Filtros
            </label>
          </div>
          <div className="drawer-side z-[1]">
            <label htmlFor="filter-drawer" className="drawer-overlay"></label>
            <div className="p-4 bg-base-300">
              <FilterForm
                filters={filters}
                handleInputChange={handleInputChange}
                handleApplyFilters={handleApplyFilters}
                handleResetFilters={handleResetFilters}
                setActiveTags={(tags: string[]) =>
                  dispatch({
                    type: "SET_FILTER",
                    payload: { name: "distances", value: tags },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="w-full max-w-72 p-4 rounded shadow-md sticky top-16">
          <FilterForm
            filters={filters}
            handleInputChange={handleInputChange}
            handleApplyFilters={handleApplyFilters}
            handleResetFilters={handleResetFilters}
            setActiveTags={(tags: string[]) =>
              dispatch({
                type: "SET_FILTER",
                payload: { name: "distances", value: tags },
              })
            }
          />
        </div>
      </div>
    </>
  );
  const newFilters = CardFilterList;
  return newFilters || oldFilters;
};
const FilterForm = ({
  filters,
  handleInputChange,
  handleApplyFilters,
  handleResetFilters,
  setActiveTags,
}: {
  filters: Filters;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof Filters
  ) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  setActiveTags: (tags: string[]) => void;
}) => (
  <div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
      <div>
        <label>Faixa de Preço:</label>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            className="input input-bordered input-primary w-full max-w-xs"
            name="min"
            value={filters.priceRange.min}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "priceRange")
            }
          />
          <input
            type="number"
            placeholder="Max"
            className="input input-bordered input-primary w-full max-w-xs"
            name="max"
            value={filters.priceRange.max}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "priceRange")
            }
          />
        </div>
      </div>

      <div>
        <label>Tamanho do Imóvel (m²):</label>
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type="number"
          placeholder="Tamanho"
          value={filters.floorSize}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange(e, "floorSize")
          }
        />
      </div>

      <div>
        <label>Quartos:</label>
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type="number"
          placeholder="Quartos"
          value={filters.numberOfRooms}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange(e, "numberOfRooms")
          }
        />
      </div>

      <div>
        <label>Banheiros:</label>
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type="number"
          placeholder="Banheiros"
          value={filters.numberOfBathrooms}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange(e, "numberOfBathrooms")
          }
        />
      </div>

      <div>
        <label>Vagas de Garagem:</label>
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type="number"
          placeholder="Vagas"
          value={filters.numberOfParkingSpaces}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange(e, "numberOfParkingSpaces")
          }
        />
      </div>

      <div>
        <label>Endereço:</label>
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type="text"
          placeholder="Pesquisar por endereço"
          value={filters.addressQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange(e, "addressQuery")
          }
        />
      </div>

      <div>
        <label>Distâncias (km):</label>
        <TagFilter
          activeTags={filters.distances}
          setActiveTags={setActiveTags}
        />
      </div>
    </div>

    <div className="mt-4 flex justify-between">
      <button className="btn btn-primary btn-sm" onClick={handleApplyFilters}>
        Aplicar Filtros
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleResetFilters}>
        Resetar Filtros
      </button>
    </div>
  </div>
);

export default PropertyNavbarFilters;
