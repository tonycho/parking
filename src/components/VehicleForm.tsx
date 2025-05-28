import React, { useState, useEffect, useRef } from 'react';
import { ParkingSpot, Vehicle } from '../types';
import { CarFront, User, Phone, Tag, Palette, RotateCcw } from 'lucide-react';

const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 
  'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 
  'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

interface VehicleFormProps {
  spot: ParkingSpot;
  existingVehicle?: Vehicle;
  onSave: (vehicleData: Omit<Vehicle, 'id' | 'timeParked'>, spotId: string) => void;
  onCancel: () => void;
  onRemove?: (spotId: string) => void;
  knownVehicles: Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[];
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  spot,
  existingVehicle,
  onSave,
  onCancel,
  onRemove,
  knownVehicles,
}) => {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>>({
    driverName: '',
    phoneNumber: '',
    licensePlate: '',
    make: '',
    color: '',
  });

  const [suggestions, setSuggestions] = useState<typeof knownVehicles>([]);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [filteredManufacturers, setFilteredManufacturers] = useState<string[]>([]);
  const makeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingVehicle) {
      const { driverName, phoneNumber, licensePlate, make, color } = existingVehicle;
      setFormData({ driverName, phoneNumber, licensePlate, make, color });
    }
  }, [existingVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (makeInputRef.current && !makeInputRef.current.contains(event.target as Node)) {
        setShowMakeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'licensePlate') {
      const matchingSuggestions = knownVehicles.filter(v => 
        v.licensePlate.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matchingSuggestions);
    } else if (name === 'make') {
      const filtered = carManufacturers.filter(manufacturer =>
        manufacturer.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredManufacturers(filtered);
      setShowMakeSuggestions(true);
    }
  };

  const handleManufacturerSelect = (manufacturer: string) => {
    setFormData(prev => ({ ...prev, make: manufacturer }));
    setShowMakeSuggestions(false);
  };

  const handleSuggestionClick = (vehicle: typeof knownVehicles[0]) => {
    setFormData(vehicle);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, spot.id);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(spot.id);
    }
  };

  const isFormComplete = () => {
    return (
      formData.driverName.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.licensePlate.trim() !== '' &&
      formData.make.trim() !== '' &&
      formData.color.trim() !== ''
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in">
      <div className="bg-blue-500 p-4 text-white">
        <h3 className="text-xl font-semibold flex items-center">
          <CarFront className="mr-2" size={20} />
          {spot.status === 'occupied' ? 'Edit Vehicle Information' : 'Register New Vehicle'}
        </h3>
        <p className="text-sm text-blue-100">Spot {spot.label}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Tag className="mr-2" size={16} />
              License Plate
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter license plate"
              required
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {suggestions.map((vehicle, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(vehicle)}
                  >
                    <div className="font-medium">{vehicle.licensePlate}</div>
                    <div className="text-sm text-gray-600">
                      {vehicle.driverName} - {vehicle.make} ({vehicle.color})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="mr-2" size={16} />
              Driver Name
            </label>
            <input
              type="text"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter driver's name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Phone className="mr-2" size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                ref={makeInputRef}
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                onFocus={() => {
                  const filtered = carManufacturers.filter(manufacturer =>
                    manufacturer.toLowerCase().includes(formData.make.toLowerCase())
                  );
                  setFilteredManufacturers(filtered.length > 0 ? filtered : carManufacturers);
                  setShowMakeSuggestions(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vehicle make"
                required
              />
              {showMakeSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredManufacturers.map((manufacturer, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleManufacturerSelect(manufacturer)}
                    >
                      {manufacturer}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Palette className="mr-2" size={16} />
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vehicle color"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex space-x-2">
            {existingVehicle && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            )}
            
            <button
              type="submit"
              disabled={!isFormComplete()}
              className={`px-4 py-2 rounded-md transition-colors ${
                isFormComplete()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {existingVehicle ? 'Update' : 'Register'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;