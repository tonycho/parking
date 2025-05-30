import React, { useState, useEffect, useRef } from 'react';
import { ParkingSpot, Vehicle } from '../types';
import { CarFront, User, Phone, Tag, Palette } from 'lucide-react';

const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Honda', 'Lexus', 'Mazda', 'Mercedes', 
  'Nissan', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

const carModels: { [key: string]: string[] } = {
  'Acura': ['MDX', 'RDX', 'TSX', 'TLX', 'ILX', 'Other'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron', 'Other'],
  'BMW': ['3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i3', 'i4', 'iX', 'Other'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Clarity', 'Fit', 'HR-V', 'Odyssey', 'Pilot', 'Ridgeline', 'Other'],
  'Ford': ['F-150', 'F-250', 'F-350', 'Maverick', 'Ranger', 'Mustang', 'Mustang Mach-E', 'Explorer', 'Escape', 'Edge', 'Bronco', 'Bronco Sport', 'Expedition', 'Transit', 'Transit Connect', 'Fusion', 'Focus', 'Taurus', 'Flex', 'EcoSport', 'Other'],
  'Lexus': ['CT 200', 'ES 350', 'GS 350', 'GX 460', 'IS 300', 'IS 350', 'NX 200', 'NX 300', 'RX 350', 'RX 500', 'UX 250', 'Other'],
  'Mazda': ['Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'Other'],
  'Mercedes': ['C-Class', 'E-Class', 'GLA 250', 'GLB 250', 'GLC 300', 'GLE 350', 'GLS 450', 'EQB', 'EQE', 'Other'],
  'Nissan': ['Altima', 'Leaf', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Versa', 'Titan', 'Frontier', 'Other'],
  'Subaru': ['Ascent', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'Other'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Other'],
  'Toyota': ['4Runner', 'Camry', 'Corolla', 'Highlander', 'Land Cruiser', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Scion', 'Venza', 'Other'],
  'Volkswagen': ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Passat', 'Tiguan', 'Taos', 'Other'],
  'Volvo': ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90', 'Other'],
  'Chevrolet': ['Bolt', 'Camaro', 'Colorado', 'Equinox', 'Malibu', 'Silverado', 'Suburban', 'Tahoe', 'Traverse', 'Trax', 'Other'],
  'Hyundai': ['Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster', 'Other'],
  'Kia': ['Forte', 'K5', 'Niro', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Telluride', 'EV6', 'Other'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler', 'Wagoneer', 'Other'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'Other'],
  'Chrysler': ['300', 'Pacifica', 'Voyager', 'Other'],
  'Dodge': ['Challenger', 'Charger', 'Durango', 'Journey', 'Other'],
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
  const [filteredManufacturers, setFilteredManufacturers] = useState(carManufacturers);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [filteredColors, setFilteredColors] = useState(carColors);
  const [phoneError, setPhoneError] = useState('');
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const licensePlateRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const makeSearchRef = useRef<HTMLInputElement>(null);
  const modelSearchRef = useRef<HTMLInputElement>(null);
  const colorSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingVehicle) {
      const { contact, phoneNumber, licensePlate, make, model, color } = existingVehicle;
      setFormData({ contact, phoneNumber, licensePlate, make, model: model || '', color });
    }
  }, [existingVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle license plate suggestions
      if (licensePlateRef.current && !licensePlateRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }

      // Handle contact suggestions
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setContactSuggestions([]);
      }

      // Handle make dropdown
      if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
        setShowMakeSuggestions(false);
        setMakeSearch('');
      }

      // Handle model dropdown
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelSuggestions(false);
        setModelSearch('');
      }

      // Handle color dropdown
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setShowColorSuggestions(false);
        setColorSearch('');
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

  useEffect(() => {
    const filtered = carManufacturers.filter(make => 
      make.toLowerCase().includes(makeSearch.toLowerCase())
    );
    setFilteredManufacturers(filtered.length > 0 ? filtered : carManufacturers);
  }, [makeSearch]);

  useEffect(() => {
    if (formData.make) {
      const availableModels = carModels[formData.make] || carModels['Other'];
      const filtered = availableModels.filter(model =>
        model.toLowerCase().includes(modelSearch.toLowerCase())
      );
      setFilteredModels(filtered.length > 0 ? filtered : availableModels);
    }
  }, [modelSearch, formData.make]);

  useEffect(() => {
    const filtered = carColors.filter(color =>
      color.name.toLowerCase().includes(colorSearch.toLowerCase())
    );
    setFilteredColors(filtered.length > 0 ? filtered : carColors);
  }, [colorSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
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

    if (name === 'make' || name === 'model' || name === 'color') {
      return; // Prevent direct input for these fields
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
    }
  };

  const handleMakeClick = () => {
    setShowMakeSuggestions(true);
    setShowModelSuggestions(false);
    setShowColorSuggestions(false);
    setMakeSearch('');
    setTimeout(() => makeSearchRef.current?.focus(), 0);
  };

  const handleModelClick = () => {
    if (formData.make) {
      setShowModelSuggestions(true);
      setShowMakeSuggestions(false);
      setShowColorSuggestions(false);
      setModelSearch('');
      setTimeout(() => modelSearchRef.current?.focus(), 0);
    }
  };

  const handleColorClick = () => {
    setShowColorSuggestions(true);
    setShowMakeSuggestions(false);
    setShowModelSuggestions(false);
    setColorSearch('');
    setTimeout(() => colorSearchRef.current?.focus(), 0);
  };

  const handleSuggestionClick = (vehicle: typeof knownVehicles[0]) => {
    setFormData({
      contact: vehicle.contact,
      phoneNumber: vehicle.phoneNumber.replace(/\D/g, ''),
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
    return formData.licensePlate.trim() !== '' && formData.make !== '' && formData.model !== '';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-visible">
      <div className="bg-blue-500 p-4 text-white">
        <h3 className="text-xl font-semibold flex items-center">
          <CarFront className="mr-2" size={20} />
          {spot.status === 'occupied' ? 'Edit Vehicle Information' : 'Register New Vehicle'}
        </h3>
        <p className="text-sm text-blue-100">Spot {spot.label}</p>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div className="relative" ref={licensePlateRef}>
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

          <div className="relative" ref={contactRef}>
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
            <div className="relative" ref={makeRef}>
              <label className="block text-sm font-medium text-gray-700">Make</label>
              <div
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white"
                onClick={handleMakeClick}
              >
                {formData.make || 'Select manufacturer'}
              </div>
              {showMakeSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b">
                    <input
                      ref={makeSearchRef}
                      type="text"
                      value={makeSearch}
                      onChange={(e) => setMakeSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Search manufacturer..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredManufacturers.map((make, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, make, model: '' }));
                          setShowMakeSuggestions(false);
                          setMakeSearch('');
                        }}
                      >
                        {make}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={modelRef}>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <div
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${formData.make ? 'cursor-pointer bg-white' : 'bg-gray-100 text-gray-500'}`}
                onClick={handleModelClick}
              >
                {formData.model || (formData.make ? 'Select model' : 'Select make first')}
              </div>
              {showModelSuggestions && formData.make && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b">
                    <input
                      ref={modelSearchRef}
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Search model..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredModels.map((model, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, model }));
                          setShowModelSuggestions(false);
                          setModelSearch('');
                        }}
                      >
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative col-span-2" ref={colorRef}>
              <label className="block text-sm font-medium text-gray-700">
                <Palette className="mr-2 inline" size={16} />
                Color
              </label>
              <div
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white"
                onClick={handleColorClick}
              >
                {formData.color || 'Select color'}
              </div>
              {showColorSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b">
                    <input
                      ref={colorSearchRef}
                      type="text"
                      value={colorSearch}
                      onChange={(e) => setColorSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Search color..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredColors.map((color, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, color: color.name }));
                          setShowColorSuggestions(false);
                          setColorSearch('');
                        }}
                      >
                        {color.name !== 'Other' && (
                          <div 
                            className="w-6 h-6 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: color.hex,
                              border: color.name === 'White' ? '1px solid #e5e7eb' : 'none'
                            }} 
                          />
                        )}
                        {color.name}
                      </div>
                    ))}
                  </div>
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