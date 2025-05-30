const carManufacturers = [
  'Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes', 'Nissan', 'Ram', 'Subaru', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo', 'Other'
];

const carModels: { [key: string]: string[] } = {
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

export default carModels