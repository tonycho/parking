import React, { useState, useEffect, useRef } from 'react';
import { apiFetchJson } from '../lib/apiFetch';
import { ParkingSpot, Vehicle } from '../types';
import { CarFront, User, Phone, Tag, Palette, MessageSquare, Loader2, AlertTriangle, BellRing } from 'lucide-react';
import { useViolations } from '../hooks/useViolations';
import { useParking } from '../hooks/useParking';

const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Lexus', 'Lucid', 'Mazda', 'Mercedes', 'Nissan', 'Ram', 'Rivian', 'Subaru', 
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

const carModels: { [key: string]: string[] } = {
  'Acura': ['Integra', 'MDX', 'RDX', 'TLX', 'ZDX', 'ILX', 'NSX', 'TSX', 'Other'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'e-tron', 'e-tron GT', 'RS e-tron GT', 'Other'],
  'BMW': ['2 Series', '3 Series', '4 Series', '5 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX3', 'Z4', 'Other'],
  'Chevrolet': ['Blazer', 'Blazer EV', 'Bolt', 'Bolt EUV', 'Camaro', 'Colorado', 'Corvette', 'Equinox', 'Equinox EV', 'Malibu', 'Silverado', 'Silverado EV', 'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax', 'Other'],
  'Chrysler': ['300', 'Pacifica', 'Pacifica Hybrid', 'Voyager', 'Other'],
  'Dodge': ['Challenger', 'Charger', 'Durango', 'Hornet', 'Journey', 'Other'],
  'Ford': ['Bronco', 'Bronco Sport', 'E-Transit', 'Edge', 'Escape', 'Escape Plug-In Hybrid', 'EcoSport', 'Expedition', 'Explorer', 'F-150', 'F-150 Lightning', 'F-250', 'F-350', 'Flex', 'Focus', 'Fusion', 'Maverick', 'Mustang', 'Mustang Mach-E', 'Ranger', 'Taurus', 'Transit', 'Transit Connect', 'Other'],
  'Honda': ['Accord', 'Accord Hybrid', 'Civic', 'Clarity', 'CR-V', 'CR-V Hybrid', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Prologue', 'Ridgeline', 'Other'],
  'Hyundai': ['Accent', 'Elantra', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Kona Electric', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Santa Fe Hybrid', 'Sonata', 'Tucson', 'Tucson Hybrid', 'Veloster', 'Venue', 'Other'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Cherokee 4xe', 'Grand Wagoneer', 'Renegade', 'Wagoneer', 'Wrangler', 'Wrangler 4xe', 'Other'],
  'Kia': ['Carnival', 'EV6', 'EV9', 'Forte', 'K5', 'Niro', 'Niro EV', 'Rio', 'Seltos', 'Sorento', 'Sorento Hybrid', 'Soul', 'Sportage', 'Sportage Hybrid', 'Stinger', 'Telluride', 'Other'],
  'Lexus': ['ES', 'ES 300h', 'ES 350', 'GS', 'GS 350', 'GX', 'GX 460', 'IS', 'IS 300', 'IS 350', 'IS 500', 'LC', 'LS', 'LX', 'NX', 'NX 250', 'NX 350', 'NX 350h', 'NX 450h+', 'RC', 'RX', 'RX 350', 'RX 450h', 'RX 500h', 'RZ 450e', 'TX', 'UX', 'UX 250h', 'Other'],
  'Lucid': ['Air', 'Air Pure', 'Air Touring', 'Air Grand Touring', 'Air Sapphire', 'Gravity', 'Other'],
  'Mazda': ['CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-70', 'CX-90', 'CX-9', 'Mazda3', 'Mazda6', 'MX-5 Miata', 'MX-30', 'Other'],
  'Mercedes': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'EQB', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV', 'G-Class', 'GLA', 'GLA 250', 'GLB', 'GLB 250', 'GLC', 'GLC 300', 'GLE', 'GLE 350', 'GLS', 'GLS 450', 'Maybach', 'Other'],
  'Nissan': ['Altima', 'Ariya', 'Armada', 'Frontier', 'Kicks', 'Leaf', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Rogue Sport', 'Sentra', 'Titan', 'Versa', 'Z', 'Other'],
  'Ram': ['1500', '1500 TRX', '2500', '3500', 'ProMaster', 'ProMaster City', 'Other'],
  'Rivian': ['R1S', 'R1T', 'EDV', 'Other'],
  'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Crosstrek Hybrid', 'Forester', 'Impreza', 'Legacy', 'Outback', 'Solterra', 'WRX', 'Other'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Roadster', 'Other'],
  'Toyota': ['4Runner', 'bZ4X', 'C-HR', 'Camry', 'Camry Hybrid', 'Corolla', 'Corolla Cross', 'Corolla Hybrid', 'Crown', 'GR Corolla', 'GR Supra', 'GR86', 'Grand Highlander', 'Highlander', 'Highlander Hybrid', 'Land Cruiser', 'Mirai', 'Prius', 'Prius Prime', 'RAV4', 'RAV4 Hybrid', 'RAV4 Prime', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra', 'Venza', 'Other'],
  'Volkswagen': ['Arteon', 'Atlas', 'Atlas Cross Sport', 'Golf', 'Golf GTI', 'ID.4', 'ID.Buzz', 'Jetta', 'Passat', 'Taos', 'Tiguan', 'Other'],
  'Volvo': ['C40 Recharge', 'S60', 'S90', 'V60', 'V90', 'XC40', 'XC40 Recharge', 'XC60', 'XC90', 'EX30', 'EX90', 'Other'],
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
  const { parkingLot } = useParking();
  const { getViolationCount } = useViolations(parkingLot?.id || null);
  
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>>({
    contact: '',
    phoneNumber: '',
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    notifyOnArrival: false,
    arrivalNote: '',
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
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [checkingViolations, setCheckingViolations] = useState(false);

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
      const { contact, phoneNumber, licensePlate, make, model, color, notifyOnArrival, arrivalNote } =
        existingVehicle;
      setFormData({
        contact,
        phoneNumber,
        licensePlate,
        make,
        model: model || '',
        color,
        notifyOnArrival: notifyOnArrival ?? false,
        arrivalNote: arrivalNote ?? '',
      });
    }
  }, [existingVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (licensePlateRef.current && !licensePlateRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setContactSuggestions([]);
      }
      if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
        setShowMakeSuggestions(false);
        setMakeSearch('');
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelSuggestions(false);
        setModelSearch('');
      }
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

  useEffect(() => {
    const checkViolations = async () => {
      if (formData.licensePlate.trim().length >= 3) {
        setCheckingViolations(true);
        const count = await getViolationCount(formData.licensePlate);
        setViolationCount(count);
        setCheckingViolations(false);
      } else {
        setViolationCount(0);
      }
    };

    const timeoutId = setTimeout(checkViolations, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.licensePlate, getViolationCount]);

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

    if (name === 'licensePlate') {
      const exactMatch = knownVehicles.find(
        (v) => v.licensePlate.toLowerCase() === value.trim().toLowerCase()
      );
      if (exactMatch) {
        setFormData((prev) => ({
          ...prev,
          notifyOnArrival: exactMatch.notifyOnArrival ?? false,
          arrivalNote: exactMatch.arrivalNote ?? '',
        }));
      }
    }

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
      color: vehicle.color,
      notifyOnArrival: vehicle.notifyOnArrival ?? false,
      arrivalNote: vehicle.arrivalNote ?? '',
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

  const handleSendReminder = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      setReminderStatus({ type: 'error', message: 'Valid phone number required' });
      return;
    }

    setIsSendingReminder(true);
    setReminderStatus(null);

    try {
      await apiFetchJson('/api/send-reminder', {
        method: 'POST',
        body: {
          phoneNumber: formData.phoneNumber,
          contact: formData.contact,
          licensePlate: formData.licensePlate,
          spotLabel: spot.label,
        },
      });

      setReminderStatus({ type: 'success', message: 'Reminder sent successfully!' });
    } catch (error) {
      setReminderStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send reminder' 
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="bg-primary overflow-visible">
      <div className="bg-accent border-b border-weak px-4 py-4 text-inverse">
        <h3 className="text-lg font-semibold flex items-center">
          <CarFront className="mr-2 shrink-0" size={20} aria-hidden />
          {spot.status === 'occupied' ? 'Edit vehicle' : 'Register vehicle'}
        </h3>
        <p className="text-sm opacity-90 mt-0.5">Spot {spot.label}</p>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="p-4">
        {violationCount > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Warning: This vehicle has {violationCount} previous loading zone {violationCount === 1 ? 'violation' : 'violations'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Check violation history before parking assignment.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="relative" ref={licensePlateRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Tag className="mr-2 inline" size={16} />
              License Plate
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter license plate"
              required
            />
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((vehicle, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSuggestionClick(vehicle)}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.licensePlate}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {vehicle.contact} - {vehicle.make} {vehicle.model} ({vehicle.color})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={contactRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <User className="mr-2 inline" size={16} />
              Contact
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact name"
            />
            {contactSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {contactSuggestions.map((vehicle, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSuggestionClick(vehicle)}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.contact}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {vehicle.phoneNumber} - {vehicle.licensePlate}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {vehicle.make} {vehicle.model} ({vehicle.color})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone className="mr-2 inline" size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              placeholder="Enter 10-digit phone number"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <div className="rounded-sm border border-weak bg-secondary p-3">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={formData.notifyOnArrival ?? false}
                onChange={(e) => setFormData((prev) => ({ ...prev, notifyOnArrival: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded-xs border-weak accent-blue-600"
              />
              <span>
                <span className="flex items-center text-sm font-medium text-primary">
                  <BellRing className="mr-1.5 shrink-0 text-accent" size={14} aria-hidden />
                  Notify welcome team when this vehicle parks
                </span>
                <span className="mt-0.5 block text-xs text-secondary">
                  Everyone on the welcome team gets a text each time this plate is parked (once per day).
                </span>
              </span>
            </label>
            {formData.notifyOnArrival && (
              <input
                type="text"
                value={formData.arrivalNote ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, arrivalNote: e.target.value }))}
                className="mt-2 w-full rounded-xs border border-weak bg-primary px-3 py-2 text-sm text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
                placeholder="Note for the welcome team (optional), e.g. new couple from Rainbow Village"
                maxLength={200}
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={makeRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Make</label>
              <div
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={handleMakeClick}
              >
                {formData.make || 'Select manufacturer'}
              </div>
              {showMakeSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <input
                      ref={makeSearchRef}
                      type="text"
                      value={makeSearch}
                      onChange={(e) => setMakeSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Search manufacturer..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredManufacturers.map((make, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
              <div
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${formData.make ? 'cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'}`}
                onClick={handleModelClick}
              >
                {formData.model || (formData.make ? 'Select model' : 'Select make first')}
              </div>
              {showModelSuggestions && formData.make && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <input
                      ref={modelSearchRef}
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Search model..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredModels.map((model, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Palette className="mr-2 inline" size={16} />
                Color
              </label>
              <div
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={handleColorClick}
              >
                {formData.color || 'Select color'}
              </div>
              {showColorSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <input
                      ref={colorSearchRef}
                      type="text"
                      value={colorSearch}
                      onChange={(e) => setColorSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Search color..."
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredColors.map((color, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center text-gray-900 dark:text-gray-100"
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
        
        {/* Reminder Status Message */}
        {reminderStatus && (
          <div className={`mt-4 p-3 rounded-md ${
            reminderStatus.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {reminderStatus.message}
          </div>
        )}

        <div className="mt-6 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full shrink-0 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:w-auto"
          >
            Cancel
          </button>

          <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
            {/* Send Reminder Button - only show for occupied spots with phone numbers */}
            {existingVehicle && formData.phoneNumber && formData.phoneNumber.length === 10 && (
              <button
                type="button"
                onClick={handleSendReminder}
                disabled={isSendingReminder}
                className="flex w-full min-w-0 items-center justify-center px-3 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-4"
              >
                {isSendingReminder ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                )}
                <span className="truncate sm:whitespace-normal">
                  {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                </span>
              </button>
            )}

            {existingVehicle && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors sm:w-auto"
              >
                Remove
              </button>
            )}

            <button
              type="submit"
              disabled={!isFormComplete()}
              className={`w-full px-4 py-2 rounded-md transition-colors sm:w-auto ${
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
