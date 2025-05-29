import React, { useState, useEffect, useRef } from 'react';
import { ParkingSpot, Vehicle } from '../types';
import { CarFront, User, Phone, Tag, Palette } from 'lucide-react';

const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 
  'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 
  'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

const carModels: { [key: string]: string[] } = {
  'Acura': ['ILX', 'MDX', 'RDX', 'TLX'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'Q3', 'Q5', 'Q7'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
  'Chevrolet': ['Camaro', 'Corvette', 'Malibu', 'Silverado', 'Tahoe'],
  'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Other': ['Other']
};

const carColors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Brown', hex: '#964B00' },
  { name: 'Green', hex: '#008000' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Other', hex: 'gradient' }
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
    contact: '',
    phoneNumber: '',
    licensePlate: '',
    make: '',
    model: '',
    color: '',
  });

  const [suggestions, setSuggestions] = useState<typeof knownVehicles>([]);
  const [contactSuggestions, setContactSuggestions] = useState<typeof knownVehicles>([]);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);
  const [filteredManufacturers, setFilteredManufacturers] = useState<string[]>(carManufacturers);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [filteredColors, setFilteredColors] = useState(carColors);
  const [phoneError, setPhoneError] = useState('');

  const makeInputRef = useRef<HTMLInputElement>(null);
  const makeDropdownRef = useRef<HTMLDivElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingVehicle) {
      const { contact, phoneNumber, licensePlate, make, model, color } = existingVehicle;
      setFormData({ contact, phoneNumber, licensePlate, make, model: model || '', color });
    }
  }, [existingVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (makeInputRef.current && 
          makeDropdownRef.current && 
          !makeInputRef.current.contains(event.target as Node) &&
          !makeDropdownRef.current.contains(event.target as Node)) {
        setShowMakeSuggestions(false);
      }
      if (modelInputRef.current && 
          modelDropdownRef.current && 
          !modelInputRef.current.contains(event.target as Node) &&
          !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelSuggestions(false);
      }
      if (colorInputRef.current && 
          colorDropdownRef.current && 
          !colorInputRef.current.contains(event.target as Node) &&
          !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.make) {
      const availableModels = carModels[formData.make] || carModels['Other'];
      setFilteredModels(availableModels);
    } else {
      setFilteredModels([]);
    }
  }, [formData.make]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, '');
      
      if (digitsOnly.length > 10) {
        setPhoneError('Phone number cannot exceed 10 digits');
        return;
      }

      setPhoneError('');
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      
      if (digitsOnly.length < 10 && digitsOnly.length > 0) {
        setPhoneError('Phone number must be 10 digits');
      }
      
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'licensePlate' && value.trim()) {
      const matchingSuggestions = knownVehicles.filter(v => 
        v.licensePlate.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matchingSuggestions);
    } else if (name === 'licensePlate') {
      setSuggestions([]);
    } else if ((name === 'contact' || name === 'phoneNumber') && value.trim()) {
      const matchingSuggestions = knownVehicles.filter(v => 
        v.contact.toLowerCase().includes(value.toLowerCase()) ||
        v.phoneNumber.includes(value)
      );
      setContactSuggestions(matchingSuggestions);
    } else if (name === 'contact' || name === 'phoneNumber') {
      setContactSuggestions([]);
    } else if (name === 'make') {
      const filtered = carManufacturers.filter(manufacturer =>
        manufacturer.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredManufacturers(filtered.length > 0 ? filtered : []);
      setShowMakeSuggestions(true);
    } else if (name === 'model' && formData.make) {
      const availableModels = carModels[formData.make] || carModels['Other'];
      const filtered = availableModels.filter(model =>
        model.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModels(filtered.length > 0 ? filtered : availableModels);
      setShowModelSuggestions(true);
    } else if (name === 'color') {
      const filtered = carColors.filter(color =>
        color.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredColors(filtered.length > 0 ? filtered : carColors);
      setShowColorSuggestions(true);
    }
  };

  const handleManufacturerSelect = (manufacturer: string) => {
    setFormData(prev => ({ ...prev, make: manufacturer }));
    setShowMakeSuggestions(false);
  };

  const handleModelSelect = (model: string) => {
    setFormData(prev => ({ ...prev, model }));
    setShowModelSuggestions(false);
  };

  const handleColorSelect = (colorName: string) => {
    setFormData(prev => ({ ...prev, color: colorName }));
    setShowColorSuggestions(false);
  };

  const handleSuggestionClick = (vehicle: typeof knownVehicles[0]) => {
    setFormData({
      contact: vehicle.contact,
      phoneNumber: vehicle.phoneNumber.replace(/\D/g, ''), // Strip any non-digits
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model || '',
      color: vehicle.color
    });
    setSuggestions([]);
    setContactSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number if provided
    if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
      setPhoneError('Phone number must be 10 digits');
      return;
    }

    onSave(formData, spot.id);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(spot.id);
    }
  };

  const isFormComplete = () => {
    if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
      return false;
    }
    return formData.licensePlate.trim() !== '';
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="mr-2 inline" size={16} />
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
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((vehicle, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(vehicle)}
                  >
                    <div className="font-medium">{vehicle.licensePlate}</div>
                    <div className="text-sm text-gray-600">
                      {vehicle.contact} - {vehicle.make} {vehicle.model} ({vehicle.color})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              <User className="mr-2 inline" size={16} />
              Contact
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact name"
            />
            {contactSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {contactSuggestions.map((vehicle, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(vehicle)}
                  >
                    <div className="font-medium">{vehicle.contact}</div>
                    <div className="text-sm text-gray-600">
                      {vehicle.phoneNumber} - {vehicle.licensePlate}
                    </div>
                    <div className="text-xs text-gray-500">
                      {vehicle.make} {vehicle.model} ({vehicle.color})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Phone className="mr-2 inline" size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter 10-digit phone number"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Make</label>
              <input
                ref={makeInputRef}
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                onFocus={() => {
                  setFilteredManufacturers(carManufacturers);
                  setShowMakeSuggestions(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vehicle make"
              />
              {showMakeSuggestions && (
                <div 
                  ref={makeDropdownRef}
                  className="absolute z-10 w-full bottom-[calc(100%+1px)] bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <input
                ref={modelInputRef}
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                onFocus={() => {
                  if (formData.make) {
                    setShowModelSuggestions(true);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.make ? "Vehicle model" : "Select make first"}
                disabled={!formData.make}
              />
              {showModelSuggestions && formData.make && (
                <div 
                  ref={modelDropdownRef}
                  className="absolute z-10 w-full bottom-[calc(100%+1px)] bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredModels.map((model, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleModelSelect(model)}
                    >
                      {model}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                <Palette className="mr-2 inline" size={16} />
                Color
              </label>
              <input
                ref={colorInputRef}
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                onFocus={() => {
                  setFilteredColors(carColors);
                  setShowColorSuggestions(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vehicle color"
              />
              {showColorSuggestions && (
                <div 
                  ref={colorDropdownRef}
                  className="absolute z-10 w-full bottom-[calc(100%+1px)] bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredColors.map((color, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleColorSelect(color.name)}
                    >
                      <div 
                        className="w-6 h-6 rounded-full mr-2" 
                        style={{ 
                          backgroundColor: color.hex,
                          border: color.name === 'White' ? '1px solid #e5e7eb' : 'none'
                        }} 
                      />
                      {color.name}
                    </div>
                  ))}
                </div>
              )}
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