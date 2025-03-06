import { ChangeEvent, useEffect, useState } from "react";
import { fetchGeoLocations } from "../../services/dataService";
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
      if (!selectedValue || selectedValue.trim() === "") {
        console.log("Valor selecionado vazio, ignorando");
        return;
      }

      //FIXME - corrigir bug do filtro de endereço
      // Para debug
      console.log("Valor recebido para parse:", selectedValue);

      const locationData = JSON.parse(selectedValue);

      const mockEvent = {
        target: {
          value: locationData.name,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleInputChange(mockEvent, "addressQuery");
    } catch (e) {
      console.error("Erro ao processar valor selecionado:", e);
      console.log("Valor que causou erro:", selectedValue);

      // Se falhar o parsing, use o valor bruto como fallback
      if (selectedValue) {
        const mockEvent = {
          target: {
            value: selectedValue,
          },
        } as ChangeEvent<HTMLInputElement>;

        handleInputChange(mockEvent, "addressQuery");
      }
    }
  };

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const options = await fetchGeoLocations();
        setAddressOptions(options);
      } catch (error) {
        console.error("Erro ao buscar localizações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();
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
