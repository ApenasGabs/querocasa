import { ChangeEvent } from "react";
import Card from "../Card/Card";
import FilterActions from "../FilterActions/FilterActions";
import { Filters } from "../Filters/PropertyFilters.types";
import { filterListProps } from "../Filters/PropertyNavbarFilters.types";

interface FilterDropdownProps {
  filter: filterListProps;
  filters: Filters;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement>,
    key: keyof Filters
  ) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
}

const FilterDropdown = ({
  filter,
  filters,
  handleInputChange,
  handleApplyFilters,
  handleResetFilters,
}: FilterDropdownProps) => {
  return (
    <details className="dropdown">
      <summary className="btn m-1">{filter.label}</summary>
      <div className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <Card key={filter.propName}>
          <label>{filter.label}:</label>
          {filter.propName === "priceRange" ? (
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder={filter.placeholder[0]}
                className="input input-bordered input-primary w-full max-w-xs"
                name="min"
                value={
                  (filters[filter.propName] as { min: number; max: number }).min
                }
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(e, filter.propName)
                }
              />
              <input
                type="number"
                placeholder={filter.placeholder[1]}
                className="input input-bordered input-primary w-full max-w-xs"
                name="max"
                value={
                  (filters[filter.propName] as { min: number; max: number }).max
                }
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(e, filter.propName)
                }
              />
            </div>
          ) : (
            <input
              className="input input-bordered input-primary w-full max-w-xs"
              type={filter.type}
              placeholder={
                typeof filter.placeholder === "string" ? filter.placeholder : ""
              }
              value={filters[filter.propName] as string | number}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e, filter.propName)
              }
            />
          )}
          <FilterActions
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </Card>
      </div>
    </details>
  );
};

export default FilterDropdown;
