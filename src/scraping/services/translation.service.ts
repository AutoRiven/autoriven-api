/**
 * Polish to English Category Translation Service
 * Maps Polish category names to their English equivalents
 */

export class CategoryTranslationService {
  private static readonly categoryTranslations: Record<string, string> = {
    // Main Categories (Level 0)
    'Motoryzacja': 'Automotive',
    'Dom i ogród': 'Home & Garden',
    'Elektronika': 'Electronics',
    'Moda': 'Fashion',
    'Dziecko': 'Baby & Kids',
    'Sport i turystyka': 'Sports & Recreation',
    'Zdrowie': 'Health',
    'Uroda': 'Beauty',
    'Kultura i rozrywka': 'Culture & Entertainment',
    'Allegro lokalnie': 'Allegro Local',
    'Przemysł': 'Industry',
    'Kolekcje i sztuka': 'Collections & Art',

    // Car Parts Main Category (Level 1)
    'Części samochodowe': 'Car Parts',

    // Car Parts Subcategories (Level 2)
    'Części karoserii': 'Body Parts',
    'Filtry': 'Filters',
    'Oświetlenie': 'Lighting',
    'Silniki i osprzęt': 'Engines & Equipment',
    'Układ chłodzenia silnika': 'Engine Cooling System',
    'Układ elektryczny, zapłon': 'Electrical System & Ignition',
    'Układ hamulcowy': 'Brake System',
    'Układ kierowniczy': 'Steering System',
    'Układ klimatyzacji': 'Air Conditioning System',
    'Układ napędowy': 'Drive System',
    'Układ paliwowy': 'Fuel System',
    'Układ pneumatyczny': 'Pneumatic System',
    'Układ wentylacji': 'Ventilation System',
    'Układ wydechowy': 'Exhaust System',
    'Układ zawieszenia': 'Suspension System',
    'Wycieraczki i spryskiwacze': 'Wipers & Washers',
    'Wyposażenie wnętrza': 'Interior Equipment',
    'Ogrzewanie postojowe i chłodnictwo samochodowe': 'Parking Heaters & Car Refrigeration',
    'Tuning mechaniczny': 'Mechanical Tuning',
    'Wyposażenie i chemia OE': 'OE Equipment & Chemicals',
    'Pozostałe': 'Other',

    // Body Parts Subcategories (Level 3)
    'Atrapy chłodnicy': 'Radiator Grilles',
    'Belki': 'Beams',
    'Blachy': 'Sheet Metal',
    'Błotniki': 'Fenders',
    'Części montażowe': 'Assembly Parts',
    'Dachy': 'Roofs',
    'Drzwi': 'Doors',
    'Kabiny': 'Cabins',
    'Klapki wlewu paliwa': 'Fuel Filler Flaps',
    'Klapy bagażnika': 'Trunk Lids',
    'Listwy': 'Trim Strips',
    'Lusterka zewnętrzne': 'External Mirrors',
    'Maski': 'Hoods',
    'Nadkola': 'Mudguards',
    'Osłony przeciwbłotne': 'Splash Guards',
    'Pasy przednie': 'Front Panels',
    'Pasy tylne': 'Rear Panels',
    'Podłogi': 'Floors',
    'Podszybia': 'Windshield Panels',
    'Progi': 'Side Skirts',
    'Ramy': 'Frames',
    'Słupki': 'Pillars',
    'Spoilery': 'Spoilers',
    'Stopnie': 'Running Boards',
    'Szyby': 'Glass',
    'Ściany, panele': 'Walls & Panels',
    'Wsporniki, mocowania': 'Brackets & Mountings',
    'Zabudowy': 'Builds',
    'Zderzaki': 'Bumpers',
    'Zestawy części blacharskich': 'Body Part Sets',

    // Fenders Subcategories (Level 4)
    'Uszczelki': 'Seals',
    'Listwy, nakładki': 'Strips & Overlays',
    'Reperaturki': 'Repair Parts',
    'Wygłuszenie': 'Sound Dampening',
    'Elementy mocujące': 'Mounting Elements',
    
    // Common automotive terms
    'Lewy': 'Left',
    'Prawy': 'Right',
    'Przedni': 'Front',
    'Tylny': 'Rear',
    'Górny': 'Upper',
    'Dolny': 'Lower',
    'Wewnętrzny': 'Inner',
    'Zewnętrzny': 'Outer'
  };

  /**
   * Translate a Polish category name to English
   * Uses exact match first, then attempts partial matching
   */
  static translateToEnglish(polishName: string): string | null {
    // Clean the input
    const cleanName = polishName.trim();
    
    // Try exact match first
    if (this.categoryTranslations[cleanName]) {
      return this.categoryTranslations[cleanName];
    }

    // Try case-insensitive exact match
    const lowerName = cleanName.toLowerCase();
    for (const [polish, english] of Object.entries(this.categoryTranslations)) {
      if (polish.toLowerCase() === lowerName) {
        return english;
      }
    }

    // Try partial matching for compound names
    for (const [polish, english] of Object.entries(this.categoryTranslations)) {
      if (cleanName.includes(polish) || polish.includes(cleanName)) {
        return english;
      }
    }

    // Return null if no translation found
    return null;
  }

  /**
   * Attempt to extract English name from URL or context
   * Some Allegro URLs might contain English equivalents
   */
  static extractEnglishFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
      
      // Look for English words in URL segments
      const englishSegments = pathSegments.filter(segment => 
        /^[a-zA-Z-]+$/.test(segment) && // Only contains letters and hyphens
        segment.length > 2 && // At least 3 characters
        !['kategoria', 'oferta', 'allegro'].includes(segment.toLowerCase()) // Exclude known Polish terms
      );

      if (englishSegments.length > 0) {
        // Convert kebab-case to title case
        return englishSegments
          .map(segment => segment.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
          )
          .join(' / ');
      }
    } catch (error) {
      // Invalid URL, ignore
    }

    return null;
  }

  /**
   * Get the most appropriate English name using multiple strategies
   */
  static getBestEnglishName(polishName: string, url?: string): string | null {
    // Strategy 1: Direct translation
    let englishName = this.translateToEnglish(polishName);
    if (englishName) {
      return englishName;
    }

    // Strategy 2: Extract from URL if available
    if (url) {
      englishName = this.extractEnglishFromUrl(url);
      if (englishName) {
        return englishName;
      }
    }

    // Strategy 3: Generate based on common patterns
    return this.generateEnglishName(polishName);
  }

  /**
   * Generate English name based on common Polish naming patterns
   */
  private static generateEnglishName(polishName: string): string | null {
    // Remove Polish-specific characters and try pattern matching
    const normalized = polishName
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ł/g, 'l')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ź/g, 'z')
      .replace(/ż/g, 'z');

    // Look for partial matches in the normalized name
    for (const [polish, english] of Object.entries(this.categoryTranslations)) {
      const normalizedPolish = polish
        .replace(/ą/g, 'a')
        .replace(/ć/g, 'c')
        .replace(/ę/g, 'e')
        .replace(/ł/g, 'l')
        .replace(/ń/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ś/g, 's')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z');

      if (normalized.toLowerCase().includes(normalizedPolish.toLowerCase())) {
        return english;
      }
    }

    return null;
  }
}
