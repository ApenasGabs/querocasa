import { ChangeEvent, useEffect, useState } from "react";
import { FilterDropdownProps } from "../FilterDropdown/FilterDropdown";
import { Option, SelectSearch } from "../SelectSearch/SelectSearch";

const FilterInput = ({
  //TODO - centralizar tipagens de filtros
  filter,
  filters,
  handleInputChange,
}: FilterDropdownProps) => {
  const [addressOptions, setAddressOptions] = useState<Option[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleAddressSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > 1) {
      const filtered = addressOptions.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    try {
      const locationData = JSON.parse(selectedValue);

      const mockEvent = {
        target: {
          value: locationData.name,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleInputChange(mockEvent, "addressQuery");
    } catch (e) {
      const mockEvent = {
        target: {
          value: selectedValue,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleInputChange(mockEvent, "addressQuery");
      console.error("Erro ao processar valor selecionado:", e);
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      const cached = localStorage.getItem("geolocations");
      const cacheTimestamp = localStorage.getItem("geolocations_timestamp");
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (
        cached &&
        cacheTimestamp &&
        Date.now() - Number(cacheTimestamp) < oneWeek
      ) {
        const options = JSON.parse(cached);
        setAddressOptions(options);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/geolocations");
        const data = await response.json();

        const options = Object.keys(data).map((location) => ({
          label: location,
          value: JSON.stringify({
            name: location,
            lat: data[location].lat,
            lon: data[location].lon,
          }),
        }));

        setAddressOptions(options);
        localStorage.setItem("geolocations", JSON.stringify(options));
        localStorage.setItem("geolocations_timestamp", Date.now().toString());
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao buscar localizações:", error);
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

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
    case "addressQuery":
      return (
        <SelectSearch
          name="addressQuery"
          className="w-full max-w-xs"
          placeholder={
            typeof filter.placeholder === "string"
              ? filter.placeholder
              : "Buscar bairro ou região"
          }
          contentText="Digite para buscar bairros"
          inputChange={handleAddressSearch}
          options={filteredOptions.length > 0 ? filteredOptions : []}
          loading={isLoading}
          onChange={handleSelectChange}
        />
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
