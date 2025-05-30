import React, { useState, useEffect } from 'react';

export const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes', 'Nissan', 'Ram', 'Subaru', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

export const carModels: { [key: string]: string[] } = {
  'Acura': ['MDX', 'RDX', 'TSX', 'TLX', 'ILX', 'Other'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron', 'Other'],
  'BMW': ['3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i3', 'i4', 'iX', 'Other'],
  'Chevrolet': ['Bolt', 'Camaro', 'Colorado', 'Equinox', 'Malibu', 'Silverado', 'Suburban', 'Tahoe', 'Traverse', 'Trax', 'Other'],
  'Chrysler': ['300', 'Pacifica', 'Voyager', 'Other'],
  'Dodge': ['Challenger', 'Charger', 'Durango', 'Journey', 'Other'],
  'Ford': ['F-150', 'F-250', 'F-350', 'Maverick', 'Ranger', 'Mustang', 'Mustang Mach-E', 'Explorer', 'Escape', 'Edge', 'Bronco', 'Bronco Sport', 'Expedition', 'Transit', 'Transit Connect', 'Fusion', 'Focus', 'Taurus', 'Flex', 'EcoSport', 'Other'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Clarity', 'Fit', 'HR-V', 'Odyssey', 'Pilot', 'Ridgeline', 'Other'],
  'Hyundai': ['Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster', 'Other'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler', 'Wagoneer', 'Other'],
  'Kia': ['Forte', 'K5', 'Niro', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Telluride', 'EV6', 'Other'],
  'Lexus': ['CT 200', 'ES 350', 'GS 350', 'GX 460', 'IS 300', 'IS 350', 'NX 200', 'NX 300', 'RX 350', 'RX 500', 'UX 250', 'Other'],
  'Mazda': ['Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'Other'],
  'Mercedes': ['C-Class', 'E-Class', 'GLA 250', 'GLB 250', 'GLC 300', 'GLE 350', 'GLS 450', 'EQB', 'EQE', 'Other'],
  'Nissan': ['Altima', 'Leaf', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Versa', 'Titan', 'Frontier', 'Other'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'Other'],
  'Subaru': ['Ascent', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'Other'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Other'],
  'Toyota': ['4Runner', 'Camry', 'Corolla', 'Highlander', 'Land Cruiser', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Scion', 'Venza', 'Other'],
  'Volkswagen': ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Passat', 'Tiguan', 'Taos', 'Other'],
  'Volvo': ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90', 'Other'],
  'Other': ['Other']
};

interface Vehicle {
  id?: string;
  contact: string;
  phone_number: string;
  license_plate: string;
  make: string;
  model: string;
  color: string;
}

interface VehicleFormProps {
  spot?: { id: string };
  existingVehicle?: Vehicle;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
  onRemove?: () => void;
  knownVehicles?: Vehicle[];
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  spot,
  existingVehicle,
  onSave,
  onCancel,
  onRemove,
  knownVehicles
}) => {
  const [vehicle, setVehicle] = useState<Vehicle>({
    contact: '',
    phone_number: '',
    license_plate: '',
    make: '',
    model: '',
    color: '',
    ...existingVehicle
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    if (vehicle.make) {
      setAvailableModels(carModels[vehicle.make] || []);
    }
  }, [vehicle.make]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(vehicle);
  };

  const handleMakeChange = (make: string) => {
    setVehicle(prev => ({
      ...prev,
      make,
      model: '' // Reset model when make changes
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Contact Name
          <input
            type="text"
            value={vehicle.contact}
            onChange={(e) => setVehicle({ ...vehicle, contact: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
          <input
            type="tel"
            value={vehicle.phone_number}
            onChange={(e) => setVehicle({ ...vehicle, phone_number: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          License Plate
          <input
            type="text"
            value={vehicle.license_plate}
            onChange={(e) => setVehicle({ ...vehicle, license_plate: e.target.value.toUpperCase() })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Make
          <select
            value={vehicle.make}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Make</option>
            {carManufacturers.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Model
          <select
            value={vehicle.model}
            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            disabled={!vehicle.make}
          >
            <option value="">Select Model</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Color
          <input
            type="text"
            value={vehicle.color}
            onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;