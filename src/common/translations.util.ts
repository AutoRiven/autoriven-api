/**
 * Polish-English translations for automotive categories
 */
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  // Main categories
  'Motoryzacja': 'Automotive',
  'Części samochodowe': 'Car Parts',
  'Wyposażenie i akcesoria samochodowe': 'Car Equipment and Accessories',
  
  // Body parts
  'Części karoserii': 'Body Parts',
  'Zderzaki': 'Bumpers',
  'Drzwi': 'Doors',
  'Maski': 'Hoods',
  'Błotniki': 'Fenders',
  'Szyby': 'Glass',
  
  // Engine and mechanical
  'Silniki i osprzęt': 'Engines and Equipment',
  'Silniki kompletne': 'Complete Engines',
  'Blok silnika': 'Engine Block',
  'Głowice cylindrów': 'Cylinder Heads',
  'Rozrząd': 'Timing',
  'Turbosprężarki': 'Turbochargers',
  
  // Cooling system
  'Układ chłodzenia silnika': 'Engine Cooling System',
  'Chłodnice': 'Radiators',
  'Termostaty': 'Thermostats',
  'Pompy wody': 'Water Pumps',
  'Wentylatory chłodnicy': 'Radiator Fans',
  
  // Electrical system
  'Układ elektryczny, zapłon': 'Electrical System, Ignition',
  'Akumulatory': 'Batteries',
  'Świece': 'Spark Plugs',
  'Sterowniki silnika': 'Engine Control Units',
  'Centralne zamki': 'Central Locks',
  'Czujniki': 'Sensors',
  
  // Brake system
  'Układ hamulcowy': 'Brake System',
  'Hamulce tarczowe': 'Disc Brakes',
  'Hamulce bębnowe': 'Drum Brakes',
  'Klocki hamulcowe': 'Brake Pads',
  'Tarcze hamulcowe': 'Brake Discs',
  'Pompy hamulcowe': 'Brake Pumps',
  
  // Steering system
  'Układ kierowniczy': 'Steering System',
  'Kierownice': 'Steering Wheels',
  'Przekładnie kierownicze': 'Steering Gears',
  'Drążki kierownicze': 'Tie Rods',
  'Końcówki drążków kierowniczych': 'Tie Rod Ends',
  
  // Drivetrain
  'Układ napędowy': 'Drive System',
  'Skrzynie biegów': 'Transmissions',
  'Sprzęgła': 'Clutches',
  'Półosie, przeguby, wały': 'Axles, Joints, Shafts',
  'Dyferencjały': 'Differentials',
  
  // Fuel system
  'Układ paliwowy': 'Fuel System',
  'Wtryskiwacze': 'Injectors',
  'Pompy paliwa': 'Fuel Pumps',
  'Filtry paliwa': 'Fuel Filters',
  'LPG': 'LPG',
  
  // Exhaust system
  'Układ wydechowy': 'Exhaust System',
  'Tłumiki': 'Mufflers',
  'Katalizatory': 'Catalysts',
  'Kolektory wydechowe': 'Exhaust Manifolds',
  'Sondy lambda': 'Lambda Sensors',
  
  // Suspension
  'Układ zawieszenia': 'Suspension System',
  'Amortyzatory': 'Shock Absorbers',
  'Sprężyny zawieszenia': 'Suspension Springs',
  'Wahacze i elementy': 'Control Arms and Components',
  'Stabilizatory i elementy': 'Stabilizers and Components',
  
  // Climate control
  'Układ klimatyzacji': 'Air Conditioning System',
  'Kompresory klimatyzacji': 'AC Compressors',
  'Chłodnice klimatyzacji (skraplacze)': 'AC Condensers',
  'Parowniki': 'Evaporators',
  'Osuszacze': 'Dryers',
  
  // Lighting
  'Oświetlenie': 'Lighting',
  'Lampy przednie i elementy': 'Front Lights and Components',
  'Lampy tylne i elementy': 'Rear Lights and Components',
  'Kierunkowskazy': 'Turn Signals',
  'Światła do jazdy dziennej DRL': 'Daytime Running Lights DRL',
  
  // Filters
  'Filtry': 'Filters',
  'Filtry powietrza': 'Air Filters',
  'Filtry oleju': 'Oil Filters',
  'Filtry kabinowe': 'Cabin Filters',
  
  // Interior
  'Wyposażenie wnętrza': 'Interior Equipment',
  'Fotele, kanapy': 'Seats, Sofas',
  'Deski rozdzielcze, konsole': 'Dashboards, Consoles',
  'Pasy bezpieczeństwa': 'Seat Belts',
  
  // Heating
  'Ogrzewanie postojowe i chłodnictwo samochodowe': 'Parking Heating and Automotive Refrigeration',
  'Ogrzewanie postojowe': 'Parking Heating',
  'Kompletne instalacje': 'Complete Installations',
  'Części': 'Parts',
  'Chłodnictwo samochodowe': 'Automotive Refrigeration',
  'Nagrzewnice': 'Heaters',
  
  // Other common terms
  'Pozostałe': 'Other',
  'Zestawy': 'Sets',
  'Części montażowe': 'Mounting Parts',
  'Uszczelki': 'Gaskets',
  'Przewody': 'Cables',
  'Sterowniki': 'Controllers',
  'Silniczki': 'Motors',
  'Pompy': 'Pumps',
  'Zawory': 'Valves',
  'Regulatory': 'Regulators',
};

/**
 * Get English translation for Polish category name
 */
export function translateCategory(polishName: string): string {
  return CATEGORY_TRANSLATIONS[polishName] || polishName;
}

/**
 * Create slug from category name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
      };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
