// components/Filters/PropertyFilters.tsx
import { ChangeEvent, useEffect, useState } from "react";

interface PropertyFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

interface Filters {
  priceRange: { min: number; max: number };
  floorSize: number;
  numberOfRooms: number;
  numberOfBathrooms: number;
  numberOfParkingSpaces: number;
  addressQuery: string;
}

const PropertyFilters = ({ onFilterChange }: PropertyFiltersProps) => {
  const [filters, setFilters] = useState<Filters>({
    priceRange: { min: 0, max: 1000000 },
    floorSize: 0,
    numberOfRooms: 0,
    numberOfBathrooms: 0,
    numberOfParkingSpaces: 0,
    addressQuery: "",
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof Filters
  ) => {
    const value = e.target.value;
    if (key === "priceRange") {
      setFilters((prev: Filters) => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [e.target.name]: parseInt(value, 10) || 0,
        },
      }));
    } else {
      setFilters((prev: Filters) => ({
        ...prev,
        [key]: key === "addressQuery" ? value : parseInt(value, 10) || 0,
      }));
    }
  };

  return (
    <div className="w-full lg:w-1/3 p-4 bg-white rounded shadow-md lg:sticky lg:top-16">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
        <div>
          <label>Faixa de Preço:</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              name="min"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e, "priceRange")
              }
            />
            <input
              type="number"
              placeholder="Max"
              name="max"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(e, "priceRange")
              }
            />
          </div>
        </div>

        <div>
          <label>Tamanho do Imóvel (m²):</label>
          <input
            type="number"
            placeholder="Tamanho"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "floorSize")
            }
          />
        </div>

        <div>
          <label>Quartos:</label>
          <input
            type="number"
            placeholder="Quartos"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "numberOfRooms")
            }
          />
        </div>

        <div>
          <label>Banheiros:</label>
          <input
            type="number"
            placeholder="Banheiros"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "numberOfBathrooms")
            }
          />
        </div>

        <div>
          <label>Vagas de Garagem:</label>
          <input
            type="number"
            placeholder="Vagas"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "numberOfParkingSpaces")
            }
          />
        </div>

        <div>
          <label>Endereço:</label>
          <input
            type="text"
            placeholder="Pesquisar por endereço"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(e, "addressQuery")
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;
