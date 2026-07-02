import React, { useState, useEffect } from 'react';
import { AlertTriangle, Tag, User, CarFront, Palette, FileText } from 'lucide-react';
import { Vehicle } from '../types';

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
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Brown', 'Green', 
  'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Other'
];

interface ViolationRecordFormProps {
  onSubmit: (violationData: {
    licensePlate: string;
    make?: string;
    model?: string;
    color?: string;
    contact?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  knownVehicles: Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[];
}

const ViolationRecordForm: React.FC<ViolationRecordFormProps> = ({
  onSubmit,
  onCancel,
  knownVehicles,
}) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    contact: '',
    notes: '',
  });

  const [suggestions, setSuggestions] = useState<typeof knownVehicles>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'make') {
      setFormData(prev => ({ ...prev, make: value, model: '' }));
      const models = carModels[value] || [];
      setAvailableModels(models);
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
    }
  };

  const handleSuggestionClick = (vehicle: typeof knownVehicles[0]) => {
    setFormData({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model || '',
      color: vehicle.color,
      contact: vehicle.contact,
      notes: '',
    });
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        licensePlate: formData.licensePlate,
        make: formData.make || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        contact: formData.contact || undefined,
        notes: formData.notes || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.licensePlate.trim() !== '';

  return (
    <div className="bg-primary overflow-visible">
      <div className="bg-accent border-b border-weak px-4 py-4 text-inverse">
        <h3 className="text-lg font-semibold flex items-center">
          <AlertTriangle className="mr-2 shrink-0" size={20} aria-hidden />
          Record Loading Zone Violation
        </h3>
        <p className="text-sm opacity-90 mt-0.5">Document illegal parking in loading zone</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Tag className="mr-2 inline" size={16} />
              License Plate *
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <CarFront className="mr-2 inline" size={16} />
                Make
              </label>
              <select
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select make</option>
                {carManufacturers.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={!formData.make}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.make 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <option value="">{formData.make ? 'Select model' : 'Select make first'}</option>
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Palette className="mr-2 inline" size={16} />
              Color
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select color</option>
              {carColors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="mr-2 inline" size={16} />
              Contact Name
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FileText className="mr-2 inline" size={16} />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about the violation..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`px-4 py-2 rounded-md transition-colors ${
              isFormValid && !isSubmitting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Recording...' : 'Record Violation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViolationRecordForm;
