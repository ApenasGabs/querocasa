import { ChangeEvent, useEffect, useRef, useState } from "react";
import { fetchGeoLocations } from "../../services/dataService";
import DistanceFilter from "../DistanceFilter/DistanceFilter";
import { FilterDropdownProps } from "../FilterDropdown/FilterDropdown";
import { Option, SelectSearch } from "../SelectSearch/SelectSearch";

const FilterInput = ({
  filter,
  filters,
  handleInputChange,
  handleApplyFilters,
  resetCounter = 0,
}: FilterDropdownProps) => {
  // Estados existentes
  const [addressOptions, setAddressOptions] = useState<Option[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAddressSelection, setHasAddressSelection] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Adicionando estado para distâncias selecionadas
  const [selectedDistances, setSelectedDistances] = useState<string[]>(
    filters.distances || []
  );

  // Handler para mudanças no filtro de endereço - código existente
  const handleAddressSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!value || value !== filters.addressQuery) {
      setHasAddressSelection(false);
    }

    if (value.length > 1) {
      const filtered = addressOptions.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }

    const mockEvent = {
      target: {
        value: value,
      },
    } as ChangeEvent<HTMLInputElement>;

    handleInputChange(mockEvent, "addressQuery");
  };

  // Handler para seleção de endereço - código existente
  const handleSelectChange = (selectedValue: string) => {
    try {
      if (!selectedValue || selectedValue.trim() === "") {
        console.log("Valor selecionado vazio, ignorando");
        return;
      }

      console.log("Valor recebido para parse:", selectedValue);

      const locationData = JSON.parse(selectedValue);
      setHasAddressSelection(true);

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

  // Handler para resetar filtro de distância
  const handleDistanceReset = () => {
    setSelectedDistances([]);

    const resetEvent: ChangeEvent<HTMLInputElement> = {
      target: {
        value: JSON.stringify([]),
      },
    };

    handleInputChange(resetEvent, "distances");
    handleApplyFilters();
  };

  // Efeitos existentes...
  useEffect(() => {
    if (
      filter.propName === "addressQuery" &&
      filters.addressQuery === "" &&
      searchInputRef.current
    ) {
      setHasAddressSelection(false);
    }

    // Sincronizar o estado local de distâncias com o estado global
    if (
      filter.propName === "distances" &&
      JSON.stringify(filters.distances) !== JSON.stringify(selectedDistances)
    ) {
      setSelectedDistances(filters.distances || []);
    }
  }, [filters, filter.propName, selectedDistances]);

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

  useEffect(() => {
    if (resetCounter > 0) {
      if (filter.propName === "addressQuery") {
        setHasAddressSelection(false);
      }

      if (filter.propName === "distances" && selectedDistances.length > 0) {
        setSelectedDistances([]);
      }
    }
  }, [resetCounter, filter.propName, selectedDistances.length]);

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
          hasSelection={hasAddressSelection}
          value={filters.addressQuery}
          inputRef={searchInputRef}
          onReset={() => setHasAddressSelection(false)}
        />
      );
    case "distances":
      return (
        <DistanceFilter
          filter={filter}
          filters={filters}
          handleInputChange={handleInputChange}
          handleApplyFilters={handleApplyFilters}
          handleResetFilters={handleDistanceReset}
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
