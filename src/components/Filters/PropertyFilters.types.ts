export interface Filters {
  priceRange: { min: number; max: number };
  floorSize: number;
  numberOfRooms: number;
  numberOfBathrooms: number;
  numberOfParkingSpaces: number;
  addressQuery: string;
  distances: string[];
}

export interface PropertyFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

export interface SetPriceRangeAction {
  type: "SET_PRICE_RANGE";
  payload: {
    name: "min" | "max";
    value: number;
  };
}

export interface SetFilterAction {
  type: "SET_FILTER";
  payload: {
    name: keyof Filters;
    value: number | string | string[];
  };
}

export interface ResetFiltersAction {
  type: "RESET_FILTERS";
}

export type FilterAction =
  | SetPriceRangeAction
  | SetFilterAction
  | ResetFiltersAction;
