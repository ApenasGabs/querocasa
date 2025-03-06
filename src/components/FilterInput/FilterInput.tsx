import { FilterDropdownProps } from "../FilterDropdown/FilterDropdown";

const FilterInput = ({
  //TODO - centralizar tipagens de filtros
  filter,
  filters,
  handleInputChange,
}: FilterDropdownProps) => {
  switch (filter.propName) {
    case "priceRange":
      return (
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder={filter.placeholder[0]}
            className="input input-bordered input-primary w-full max-w-xs"
            name="min"
            value={
              (filters[filter.propName] as { min: number; max: number }).min
            }
            onChange={(e) => handleInputChange(e, filter.propName)}
          />
          <input
            type="number"
            placeholder={filter.placeholder[1]}
            className="input input-bordered input-primary w-full max-w-xs"
            name="max"
            value={
              (filters[filter.propName] as { min: number; max: number }).max
            }
            onChange={(e) => handleInputChange(e, filter.propName)}
          />
        </div>
      );
    default:
      return (
        <input
          className="input input-bordered input-primary w-full max-w-xs"
          type={filter.type}
          placeholder={
            typeof filter.placeholder === "string" ? filter.placeholder : ""
          }
          value={filters[filter.propName] as string | number}
          onChange={(e) => handleInputChange(e, filter.propName)}
        />
      );
  }
};

export default FilterInput;
