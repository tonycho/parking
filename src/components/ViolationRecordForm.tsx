import React, { useState, useEffect } from 'react';
import { AlertTriangle, Tag, CarFront, Palette, FileText } from 'lucide-react';
import { Vehicle, Violation } from '../types';
import { formatLicensePlate } from '../lib/formatLicensePlate';

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
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  knownVehicles: Omit<Vehicle, 'id' | 'timeParked' | 'parkingSpotId'>[];
  violations: Violation[];
}

const ViolationRecordForm: React.FC<ViolationRecordFormProps> = ({
  onSubmit,
  onCancel,
  knownVehicles,
  violations,
}) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    notes: '',
  });

  const [suggestions, setSuggestions] = useState<Array<{
    licensePlate: string;
    make?: string;
    model?: string;
    color?: string;
    contact?: string;
    source: 'vehicle' | 'violation';
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [filteredMakes, setFilteredMakes] = useState(carManufacturers);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [filteredColors, setFilteredColors] = useState(carColors);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'licensePlate' && value.trim()) {
      // Get suggestions from both known vehicles and previous violations
      const vehicleSuggestions = knownVehicles
        .filter(v => v.licensePlate.toLowerCase().includes(value.toLowerCase()))
        .map(v => ({ ...v, source: 'vehicle' as const }));
      
      // Get unique violations by license plate
      const violationMap = new Map<string, Violation>();
      violations.forEach(v => {
        const key = v.licensePlate.toLowerCase();
        if (key.includes(value.toLowerCase())) {
          // Keep the most recent violation for each license plate
          if (!violationMap.has(key) || new Date(v.violationTime) > new Date(violationMap.get(key)!.violationTime)) {
            violationMap.set(key, v);
          }
        }
      });
      
      const violationSuggestions = Array.from(violationMap.values()).map(v => ({
        licensePlate: v.licensePlate,
        make: v.make,
        model: v.model,
        color: v.color,
        contact: v.contact,
        source: 'violation' as const,
      }));
      
      // Combine and deduplicate by license plate (prefer vehicle directory over violations)
      const combinedMap = new Map();
      violationSuggestions.forEach(v => combinedMap.set(v.licensePlate.toLowerCase(), v));
      vehicleSuggestions.forEach(v => combinedMap.set(v.licensePlate.toLowerCase(), v));
      
      setSuggestions(Array.from(combinedMap.values()));
    } else if (name === 'licensePlate') {
      setSuggestions([]);
    }
  };

  const handleMakeClick = () => {
    setShowMakeDropdown(true);
    setShowModelDropdown(false);
    setShowColorDropdown(false);
    setMakeSearch('');
  };

  const handleModelClick = () => {
    if (formData.make) {
      setShowModelDropdown(true);
      setShowMakeDropdown(false);
      setShowColorDropdown(false);
      setModelSearch('');
    }
  };

  const handleColorClick = () => {
    setShowColorDropdown(true);
    setShowMakeDropdown(false);
    setShowModelDropdown(false);
    setColorSearch('');
  };

  const handleMakeSelect = (make: string) => {
    setFormData(prev => ({ ...prev, make, model: '' }));
    const models = carModels[make] || [];
    setAvailableModels(models);
    setFilteredModels(models);
    setShowMakeDropdown(false);
    setMakeSearch('');
  };

  const handleModelSelect = (model: string) => {
    setFormData(prev => ({ ...prev, model }));
    setShowModelDropdown(false);
    setModelSearch('');
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setShowColorDropdown(false);
    setColorSearch('');
  };

  useEffect(() => {
    const filtered = carManufacturers.filter(make => 
      make.toLowerCase().includes(makeSearch.toLowerCase())
    );
    setFilteredMakes(filtered.length > 0 ? filtered : carManufacturers);
  }, [makeSearch]);

  useEffect(() => {
    if (formData.make) {
      const models = carModels[formData.make] || [];
      const filtered = models.filter(model =>
        model.toLowerCase().includes(modelSearch.toLowerCase())
      );
      setFilteredModels(filtered.length > 0 ? filtered : models);
    }
  }, [modelSearch, formData.make]);

  useEffect(() => {
    const filtered = carColors.filter(color =>
      color.toLowerCase().includes(colorSearch.toLowerCase())
    );
    setFilteredColors(filtered.length > 0 ? filtered : carColors);
  }, [colorSearch]);

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    const models = carModels[suggestion.make || ''] || [];
    setAvailableModels(models);
    setFilteredModels(models);
    
    setFormData({
      licensePlate: suggestion.licensePlate,
      make: suggestion.make || '',
      model: suggestion.model || '',
      color: suggestion.color || '',
      notes: '',
    });
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        licensePlate: formatLicensePlate(formData.licensePlate),
        make: formData.make || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        notes: formData.notes || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.licensePlate.trim() !== '';

  return (
    <div className="bg-primary">
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
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatLicensePlate(suggestion.licensePlate)}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {suggestion.source === 'vehicle' ? 'Registered' : 'Violation'}
                      </span>
                    </div>
                    {(suggestion.make || suggestion.model) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {suggestion.make} {suggestion.model} {suggestion.color && `(${suggestion.color})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <CarFront className="mr-2 inline" size={16} />
                Make
              </label>
              <div
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onClick={handleMakeClick}
              >
                {formData.make || 'Select make'}
              </div>
              {showMakeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <input
                      type="text"
                      value={makeSearch}
                      onChange={(e) => setMakeSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Search make..."
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredMakes.map((make) => (
                      <div
                        key={make}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                        onClick={() => handleMakeSelect(make)}
                      >
                        {make}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <div
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${formData.make ? 'cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'}`}
                onClick={handleModelClick}
              >
                {formData.model || (formData.make ? 'Select model' : 'Select make first')}
              </div>
              {showModelDropdown && formData.make && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Search model..."
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredModels.map((model) => (
                      <div
                        key={model}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                        onClick={() => handleModelSelect(model)}
                      >
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Palette className="mr-2 inline" size={16} />
              Color
            </label>
            <div
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              onClick={handleColorClick}
            >
              {formData.color || 'Select color'}
            </div>
            {showColorDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60">
                <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                  <input
                    type="text"
                    value={colorSearch}
                    onChange={(e) => setColorSearch(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Search color..."
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredColors.map((color) => (
                    <div
                      key={color}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                      onClick={() => handleColorSelect(color)}
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
