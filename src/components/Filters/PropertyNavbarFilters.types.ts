import { Filters } from "./PropertyFilters.types";

type FilterPropName = keyof Filters;

export interface filterListProps {
  label: string;
  type: "number" | "text" | "range";
  propName: FilterPropName;
  placeholder: string | string[];
}

export interface PropertyNavbarFiltersProps {
  onFilterChange: (filters: Filters) => void;
  navbarEndButton?: JSX.Element;
}
