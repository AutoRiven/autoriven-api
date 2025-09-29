/**
 * Predefined category URLs from user requirements
 * These should be checked and included in the scraping process
 */

export const PREDEFINED_CATEGORY_URLS = [
  // Main category
  'https://allegro.pl/kategoria/czesci-samochodowe-620',
  
  // Level 2 - Main subcategories
  'https://allegro.pl/kategoria/czesci-samochodowe-czesci-karoserii-4094',
  'https://allegro.pl/kategoria/czesci-samochodowe-oswietlenie-623',
  'https://allegro.pl/kategoria/czesci-samochodowe-silniki-i-osprzet-50821',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-chlodzenia-silnika-18689',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-elektryczny-zaplon-4141',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-hamulcowy-18834',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-klimatyzacji-49183',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-napedowy-50863',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-paliwowy-18844',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-wydechowy-18862',
  'https://allegro.pl/kategoria/czesci-samochodowe-uklad-zawieszenia-8683',
  'https://allegro.pl/kategoria/czesci-samochodowe-wyposazenie-wnetrza-622',
  'https://allegro.pl/kategoria/czesci-samochodowe-tuning-mechaniczny-8695',
  'https://allegro.pl/kategoria/czesci-samochodowe-ogrzewanie-postojowe-i-chlodnictwo-samochodowe-258669',

  // Level 3 - Parts categories (Body parts)
  'https://allegro.pl/kategoria/czesci-karoserii-blotniki-254682',
  'https://allegro.pl/kategoria/czesci-karoserii-dachy-254658',
  'https://allegro.pl/kategoria/czesci-karoserii-drzwi-254579',
  'https://allegro.pl/kategoria/czesci-karoserii-klapki-wlewu-paliwa-254641',
  'https://allegro.pl/kategoria/czesci-karoserii-klapy-bagaznika-254547',
  'https://allegro.pl/kategoria/czesci-karoserii-lusterka-zewnetrzne-4099',
  'https://allegro.pl/kategoria/czesci-karoserii-maski-254558',
  'https://allegro.pl/kategoria/czesci-karoserii-progi-254520',
  'https://allegro.pl/kategoria/czesci-karoserii-szyby-4101',
  'https://allegro.pl/kategoria/czesci-karoserii-zderzaki-254698',

  // Level 3 - Lighting categories
  'https://allegro.pl/kategoria/oswietlenie-lampy-przednie-i-elementy-255098',
  'https://allegro.pl/kategoria/oswietlenie-lampy-tylne-i-elementy-255118',
  'https://allegro.pl/kategoria/oswietlenie-czujniki-256138',

  // Level 3 - Engine categories
  'https://allegro.pl/kategoria/silniki-i-osprzet-blok-silnika-50823',
  'https://allegro.pl/kategoria/silniki-i-osprzet-elementy-napedu-paska-osprzetu-50832',
  'https://allegro.pl/kategoria/silniki-i-osprzet-glowice-cylindrow-50836',
  'https://allegro.pl/kategoria/silniki-i-osprzet-oslony-silnika-255518',
  'https://allegro.pl/kategoria/silniki-i-osprzet-recyrkulacja-spalin-egr-147904',
  'https://allegro.pl/kategoria/silniki-i-osprzet-rozrzad-50842',
  'https://allegro.pl/kategoria/silniki-i-osprzet-smarowanie-silnika-50852',
  'https://allegro.pl/kategoria/silniki-i-osprzet-turbosprezarki-50857',
  'https://allegro.pl/kategoria/silniki-i-osprzet-zawieszenie-silnika-50858',

  // Level 3 - Cooling system categories
  'https://allegro.pl/kategoria/uklad-chlodzenia-silnika-chlodnice-18690',
  'https://allegro.pl/kategoria/uklad-chlodzenia-silnika-pompy-wody-18692',
  'https://allegro.pl/kategoria/uklad-chlodzenia-silnika-przewody-ukladow-chlodzenia-18696',
  'https://allegro.pl/kategoria/uklad-chlodzenia-silnika-termostaty-18693',
  'https://allegro.pl/kategoria/uklad-chlodzenia-silnika-wentylatory-chlodnicy-18695',

  // Level 3 - Electrical system categories
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-centralne-zamki-4144',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-czujniki-50744',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-materialy-instalacyjne-50751',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-stacyjki-i-kluczyki-50756',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-swiece-18833',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-uklad-elektryczny-silnika-50761',
  'https://allegro.pl/kategoria/uklad-elektryczny-zaplon-wyposazenie-elektryczne-50764',

  // Level 3 - Brake system categories
  'https://allegro.pl/kategoria/uklad-hamulcowy-hamulce-bebnowe-250422',
  'https://allegro.pl/kategoria/uklad-hamulcowy-hamulce-pneumatyczne-260577',
  'https://allegro.pl/kategoria/uklad-hamulcowy-hamulce-postojowe-260607',
  'https://allegro.pl/kategoria/uklad-hamulcowy-hamulce-tarczowe-250402',
  'https://allegro.pl/kategoria/uklad-hamulcowy-uklad-abs-i-esp-260576',
  'https://allegro.pl/kategoria/uklad-hamulcowy-wspomaganie-hamulca-260609',

  // Level 3 - A/C system categories
  'https://allegro.pl/kategoria/uklad-klimatyzacji-kompresory-klimatyzacji-258684',

  // Level 3 - Drivetrain categories
  'https://allegro.pl/kategoria/uklad-napedowy-dyferencjaly-50865',
  'https://allegro.pl/kategoria/uklad-napedowy-mosty-50866',
  'https://allegro.pl/kategoria/uklad-napedowy-polosie-przeguby-waly-256000',
  'https://allegro.pl/kategoria/uklad-napedowy-skrzynie-biegow-50871',
  'https://allegro.pl/kategoria/uklad-napedowy-sprzegla-50880',

  // Level 3 - Fuel system categories
  'https://allegro.pl/kategoria/uklad-paliwowy-adblue-260933',
  'https://allegro.pl/kategoria/uklad-paliwowy-lpg-18846',

  // Level 3 - Exhaust system categories
  'https://allegro.pl/kategoria/uklad-wydechowy-tlumiki-18867',

  // Level 3 - Suspension system categories
  'https://allegro.pl/kategoria/uklad-zawieszenia-amortyzatory-i-elementy-8684',
  'https://allegro.pl/kategoria/uklad-zawieszenia-belki-zawieszenia-250866',
  'https://allegro.pl/kategoria/uklad-zawieszenia-resory-i-elementy-250870',
  'https://allegro.pl/kategoria/uklad-zawieszenia-stabilizatory-i-elementy-250875',
  'https://allegro.pl/kategoria/uklad-zawieszenia-wahacze-i-elementy-250882',
  'https://allegro.pl/kategoria/uklad-zawieszenia-zawieszenie-hydrauliczne-i-pneumatyczne-256097',

  // Level 3 - Interior categories
  'https://allegro.pl/kategoria/wyposazenie-wnetrza-galki-i-mieszki-256028',
  'https://allegro.pl/kategoria/wyposazenie-wnetrza-sprzet-audio-fabryczny-250547',

  // Level 3 - Tuning categories
  'https://allegro.pl/kategoria/tuning-mechaniczny-filtry-i-obudowy-322214',
  'https://allegro.pl/kategoria/tuning-mechaniczny-podzespoly-elektroniczne-322219',
  'https://allegro.pl/kategoria/tuning-mechaniczny-silnik-i-osprzet-255614',
  'https://allegro.pl/kategoria/tuning-mechaniczny-uklad-hamulcowy-322206',
  'https://allegro.pl/kategoria/tuning-mechaniczny-uklad-wydechowy-255620',
  'https://allegro.pl/kategoria/tuning-mechaniczny-uklad-zawieszenia-255624',

  // Level 3 - Heating/cooling categories
  'https://allegro.pl/kategoria/ogrzewanie-postojowe-i-chlodnictwo-samochodowe-chlodnictwo-samochodowe-258671',
  'https://allegro.pl/kategoria/ogrzewanie-postojowe-i-chlodnictwo-samochodowe-ogrzewanie-postojowe-258670',

  // Level 4 - Specific body parts
  'https://allegro.pl/kategoria/blotniki-blotniki-254683',
  'https://allegro.pl/kategoria/blotniki-uszczelki-261290',
  'https://allegro.pl/kategoria/blotniki-listwy-nakladki-254685',
  'https://allegro.pl/kategoria/blotniki-reperaturki-254686',
  'https://allegro.pl/kategoria/blotniki-wygluszenie-254687',
  'https://allegro.pl/kategoria/blotniki-elementy-mocujace-254684',
  'https://allegro.pl/kategoria/blotniki-pozostale-254688',
  
  'https://allegro.pl/kategoria/dachy-dachy-254659',
  'https://allegro.pl/kategoria/dachy-silniki-261292',
  'https://allegro.pl/kategoria/dachy-uszczelki-261289',
  'https://allegro.pl/kategoria/dachy-listwy-zaslepki-254661',
  'https://allegro.pl/kategoria/dachy-relingi-dachowe-254662',
  'https://allegro.pl/kategoria/dachy-pozostale-254663',
  
  'https://allegro.pl/kategoria/drzwi-drzwi-254580',
  'https://allegro.pl/kategoria/drzwi-ciegna-254599',
  'https://allegro.pl/kategoria/drzwi-klamki-zewnetrzne-254601',
  'https://allegro.pl/kategoria/drzwi-listwy-254602',
  'https://allegro.pl/kategoria/drzwi-ograniczniki-254603',
  'https://allegro.pl/kategoria/drzwi-reperaturki-254604',
  'https://allegro.pl/kategoria/drzwi-rygle-254605',
  'https://allegro.pl/kategoria/drzwi-uszczelki-254606',
  'https://allegro.pl/kategoria/drzwi-wkladki-zamka-254607',
  'https://allegro.pl/kategoria/drzwi-wozki-prowadnice-254608',
  'https://allegro.pl/kategoria/drzwi-wygluszenie-254638',
  'https://allegro.pl/kategoria/drzwi-zamki-254639',
  'https://allegro.pl/kategoria/drzwi-zawiasy-254640',
  'https://allegro.pl/kategoria/drzwi-elementy-mocujace-254600',
  'https://allegro.pl/kategoria/drzwi-pozostale-254581',

  // Continue with all other level 4 categories...
  // (The list is extensive, continuing with key categories)

  // Fuel caps
  'https://allegro.pl/kategoria/klapki-wlewu-paliwa-klapki-254642',
  'https://allegro.pl/kategoria/klapki-wlewu-paliwa-ciegna-254643',
  'https://allegro.pl/kategoria/klapki-wlewu-paliwa-zamki-i-silowniki-254644',
  'https://allegro.pl/kategoria/klapki-wlewu-paliwa-pozostale-254645',

  // Trunk lids
  'https://allegro.pl/kategoria/klapy-bagaznika-klapy-bagaznika-254548',
  'https://allegro.pl/kategoria/klapy-bagaznika-silniki-261295',
  'https://allegro.pl/kategoria/klapy-bagaznika-ciegna-254549',
  'https://allegro.pl/kategoria/klapy-bagaznika-klamki-254551',
  'https://allegro.pl/kategoria/klapy-bagaznika-rygle-254552',
  'https://allegro.pl/kategoria/klapy-bagaznika-silowniki-254553',
  'https://allegro.pl/kategoria/klapy-bagaznika-uszczelki-254554',
  'https://allegro.pl/kategoria/klapy-bagaznika-zamki-254555',
  'https://allegro.pl/kategoria/klapy-bagaznika-zawiasy-254556',
  'https://allegro.pl/kategoria/klapy-bagaznika-elementy-mocujace-254550',
  'https://allegro.pl/kategoria/klapy-bagaznika-pozostale-254557',

  // External mirrors
  'https://allegro.pl/kategoria/lusterka-zewnetrzne-czesci-montazowe-261296',
  'https://allegro.pl/kategoria/lusterka-zewnetrzne-kompletne-18711',
  'https://allegro.pl/kategoria/lusterka-zewnetrzne-obudowy-18712',
  'https://allegro.pl/kategoria/lusterka-zewnetrzne-wklady-18713',
  'https://allegro.pl/kategoria/lusterka-zewnetrzne-pozostale-18710',

  // Hoods
  'https://allegro.pl/kategoria/maski-maski-254559',
  'https://allegro.pl/kategoria/maski-ciegna-254560',
  'https://allegro.pl/kategoria/maski-silowniki-254562',
  'https://allegro.pl/kategoria/maski-uszczelki-254563',
  'https://allegro.pl/kategoria/maski-wygluszenie-254564',
  'https://allegro.pl/kategoria/maski-zamki-254565',
  'https://allegro.pl/kategoria/maski-zawiasy-254578',
  'https://allegro.pl/kategoria/maski-elementy-mocujace-254561',
  'https://allegro.pl/kategoria/maski-pozostale-254566',

  // Sills
  'https://allegro.pl/kategoria/progi-progi-254521',
  'https://allegro.pl/kategoria/progi-listwy-progowe-nakladki-254522',
  'https://allegro.pl/kategoria/progi-reperaturki-254523',
  'https://allegro.pl/kategoria/progi-pozostale-254524',

  // Windows
  'https://allegro.pl/kategoria/szyby-boczne-drzwi-18720',
  'https://allegro.pl/kategoria/szyby-karoseryjne-146544',
  'https://allegro.pl/kategoria/szyby-listwy-261297',
  'https://allegro.pl/kategoria/szyby-przednie-18719',
  'https://allegro.pl/kategoria/szyby-tylne-18717',
  'https://allegro.pl/kategoria/szyby-uszczelki-szyb-146543',
  'https://allegro.pl/kategoria/szyby-szyberdachy-18718',
  'https://allegro.pl/kategoria/szyby-elementy-mocujace-254526',
  'https://allegro.pl/kategoria/szyby-pozostale-18716',

  // Bumpers
  'https://allegro.pl/kategoria/zderzaki-zderzaki-254699',
  'https://allegro.pl/kategoria/zderzaki-absorbery-254700',
  'https://allegro.pl/kategoria/zderzaki-atrapy-zaslepki-254701',
  'https://allegro.pl/kategoria/zderzaki-listwy-254703',
  'https://allegro.pl/kategoria/zderzaki-spoilery-254704',
  'https://allegro.pl/kategoria/zderzaki-wzmocnienia-zderzakow-belki-254705',
  'https://allegro.pl/kategoria/zderzaki-elementy-mocujace-254702',
  'https://allegro.pl/kategoria/zderzaki-pozostale-254706',

  // Continue with all level 4 lighting categories
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-lampy-przednie-255099',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-lampy-przeciwmgielne-255100',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-lampy-dalekosiezne-255101',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-swiatla-do-jazdy-dziennej-drl-255102',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-przetwornice-255103',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-silniczki-regulacji-255104',
  'https://allegro.pl/kategoria/lampy-przednie-i-elementy-pozostale-255105',

  'https://allegro.pl/kategoria/lampy-tylne-i-elementy-lampy-tylne-255119',
  'https://allegro.pl/kategoria/lampy-tylne-i-elementy-lampy-cofania-255120',
  'https://allegro.pl/kategoria/lampy-tylne-i-elementy-lampy-przeciwmgielne-255121',
  'https://allegro.pl/kategoria/lampy-tylne-i-elementy-swiatla-stop-255122',
  'https://allegro.pl/kategoria/lampy-tylne-i-elementy-pozostale-255123',

  // Level 4 - Sensors
  'https://allegro.pl/kategoria/czujniki-poziomowania-256999',
  'https://allegro.pl/kategoria/czujniki-swiatel-cofania-320446',
  'https://allegro.pl/kategoria/czujniki-swiatel-stop-257000',
  'https://allegro.pl/kategoria/czujniki-zmierzchu-256998',
  'https://allegro.pl/kategoria/czujniki-pozostale-256997',

  // Level 4 - Engine block
  'https://allegro.pl/kategoria/blok-silnika-bloki-50825',
  'https://allegro.pl/kategoria/blok-silnika-czujniki-polozenia-walu-korbowego-256143',
  'https://allegro.pl/kategoria/blok-silnika-korbowody-255440',
  'https://allegro.pl/kategoria/blok-silnika-lozyska-261150',
  'https://allegro.pl/kategoria/blok-silnika-odma-255441',
  'https://allegro.pl/kategoria/blok-silnika-panewki-50828',
  'https://allegro.pl/kategoria/blok-silnika-pierscienie-tlokowe-50829',
  'https://allegro.pl/kategoria/blok-silnika-tloki-50830',
  'https://allegro.pl/kategoria/blok-silnika-tuleje-cylindra-261131',
  'https://allegro.pl/kategoria/blok-silnika-uszczelniacze-walu-255442',
  'https://allegro.pl/kategoria/blok-silnika-waly-korbowe-50831',
  'https://allegro.pl/kategoria/blok-silnika-pozostale-50824',

  // Level 4 - Belt drive components
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-kola-pasowe-255443',
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-napinacze-paska-klinowego50834',
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-paski-klinowe-50835',
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-rolki-paska-klinowego-255444',
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-zestawy-261132',
  'https://allegro.pl/kategoria/elementy-napedu-paska-osprzetu-pozostale-50833',

  // Level 4 - Cylinder heads
  'https://allegro.pl/kategoria/glowice-cylindrow-dzwigienki-255445',
  'https://allegro.pl/kategoria/glowice-cylindrow-glowice-50838',
  'https://allegro.pl/kategoria/glowice-cylindrow-pokrywy-zaworow-50839',
  'https://allegro.pl/kategoria/glowice-cylindrow-popychacze-255446',
  'https://allegro.pl/kategoria/glowice-cylindrow-prowadnice-255447',
  'https://allegro.pl/kategoria/glowice-cylindrow-sprezyny-zaworow-261133',
  'https://allegro.pl/kategoria/glowice-cylindrow-sruby-glowicy-255451',
  'https://allegro.pl/kategoria/glowice-cylindrow-uszczelki-glowicy-50840',
  'https://allegro.pl/kategoria/glowice-cylindrow-uszczelki-kolektorow-255629',
  'https://allegro.pl/kategoria/glowice-cylindrow-uszczelki-pokrywy-zaworow-255448',
  'https://allegro.pl/kategoria/glowice-cylindrow-uszczelniacze-zaworow-255449',
  'https://allegro.pl/kategoria/glowice-cylindrow-zawory-255450',
  'https://allegro.pl/kategoria/glowice-cylindrow-zestawy-uszczelek-261148',
  'https://allegro.pl/kategoria/glowice-cylindrow-pozostale-50837',

  // Level 4 - Engine covers
  'https://allegro.pl/kategoria/oslony-silnika-czesci-montazowe-261134',
  'https://allegro.pl/kategoria/oslony-silnika-dolne-256224',
  'https://allegro.pl/kategoria/oslony-silnika-gorne-256223',

  // Level 4 - EGR system
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-chlodnice-spalin-255457',
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-pompy-powietrza-wtornego-255458',
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-przewody-egr-261135',
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-uszczelki-261093',
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-zawory-egr-255456',
  'https://allegro.pl/kategoria/recyrkulacja-spalin-egr-pozostale-255459',

  // Level 4 - Timing system
  'https://allegro.pl/kategoria/rozrzad-czesci-montazowe-261136',
  'https://allegro.pl/kategoria/rozrzad-czujniki-polozenia-walka-rozrzadu-256144',
  'https://allegro.pl/kategoria/rozrzad-kola-zebate-255477',
  'https://allegro.pl/kategoria/rozrzad-kompletne-rozrzady-50844',
  'https://allegro.pl/kategoria/rozrzad-lancuchy-rozrzadu-255478',
  'https://allegro.pl/kategoria/rozrzad-lozyska-261149',
  'https://allegro.pl/kategoria/rozrzad-napinacze-lancucha-255479',
  'https://allegro.pl/kategoria/rozrzad-napinacze-paska-rozrzadu-50845',
  'https://allegro.pl/kategoria/rozrzad-obudowy-50847',
  'https://allegro.pl/kategoria/rozrzad-paski-rozrzadu-50846',
  'https://allegro.pl/kategoria/rozrzad-prowadnice-lancuchow-255480',
  'https://allegro.pl/kategoria/rozrzad-rolki-paska-rozrzadu-255481',
  'https://allegro.pl/kategoria/rozrzad-uszczelki-261129',
  'https://allegro.pl/kategoria/rozrzad-walki-rozrzadu-50848',
  'https://allegro.pl/kategoria/rozrzad-zawory-261137',
  'https://allegro.pl/kategoria/rozrzad-pozostale-50843',

  // Level 4 - Engine lubrication
  'https://allegro.pl/kategoria/smarowanie-silnika-bagnety-147923',
  'https://allegro.pl/kategoria/smarowanie-silnika-czesci-napedu-261130',
  'https://allegro.pl/kategoria/smarowanie-silnika-czujniki-cisnienia-oleju-50854',
  'https://allegro.pl/kategoria/smarowanie-silnika-czujniki-poziomu-oleju-259309',
  'https://allegro.pl/kategoria/smarowanie-silnika-czujniki-temperatury-oleju-256159',
  'https://allegro.pl/kategoria/smarowanie-silnika-dysze-olejowe-261138',
  'https://allegro.pl/kategoria/smarowanie-silnika-korki-spustu-oleju-255506',
  'https://allegro.pl/kategoria/smarowanie-silnika-korki-wlewu-oleju-147924',
  'https://allegro.pl/kategoria/smarowanie-silnika-miski-olejowe-50855',
  'https://allegro.pl/kategoria/smarowanie-silnika-obudowy-filtrow-oleju-255507',
  'https://allegro.pl/kategoria/smarowanie-silnika-pompy-oleju-147922',
  'https://allegro.pl/kategoria/smarowanie-silnika-przewody-oleju-255508',
  'https://allegro.pl/kategoria/smarowanie-silnika-smoki-ssaki-oleju-261139',
  'https://allegro.pl/kategoria/smarowanie-silnika-uszczelki-261140',
  'https://allegro.pl/kategoria/smarowanie-silnika-uszczelki-miski-50856',
  'https://allegro.pl/kategoria/smarowanie-silnika-wlewy-oleju-261142',
  'https://allegro.pl/kategoria/smarowanie-silnika-pozostale-50853',

  // Level 4 - Turbochargers
  'https://allegro.pl/kategoria/turbosprezarki-czesci-montazowe-260943',
  'https://allegro.pl/kategoria/turbosprezarki-czujniki-cisnienia-256160',
  'https://allegro.pl/kategoria/turbosprezarki-kompletne-turbosprezarki-255509',
  'https://allegro.pl/kategoria/turbosprezarki-przewody-powietrza-turbosprezarki-255511',
  'https://allegro.pl/kategoria/turbosprezarki-smarowanie-260944',
  'https://allegro.pl/kategoria/turbosprezarki-sterowniki-255512',
  'https://allegro.pl/kategoria/turbosprezarki-uszczelki-255513',
  'https://allegro.pl/kategoria/turbosprezarki-zawory-255514',
  'https://allegro.pl/kategoria/turbosprezarki-zestawy-naprawcze-261141',
  'https://allegro.pl/kategoria/turbosprezarki-pozostale-255515',

  // Level 4 - Engine mounts
  'https://allegro.pl/kategoria/zawieszenie-silnika-poduszki-silnika-50860',
  'https://allegro.pl/kategoria/zawieszenie-silnika-wozki-i-belki-silnika-255516',
  'https://allegro.pl/kategoria/zawieszenie-silnika-wsporniki-i-lapy-50861',
  'https://allegro.pl/kategoria/zawieszenie-silnika-pozostale-50859',

  // Level 4 - Radiators
  'https://allegro.pl/kategoria/chlodnice-chlodnice-oleju-251083',
  'https://allegro.pl/kategoria/chlodnice-chlodnice-powietrza-intercoolery-251084',
  'https://allegro.pl/kategoria/chlodnice-chlodnice-wody-251082',
  'https://allegro.pl/kategoria/chlodnice-korki-chlodnic-251085',
  'https://allegro.pl/kategoria/chlodnice-czesci-montazowe-260783',

  // Level 4 - Water pumps
  'https://allegro.pl/kategoria/pompy-wody-kola-pasowe-pomp-wody-251087',
  'https://allegro.pl/kategoria/pompy-wody-pompy-wody-251086',
  'https://allegro.pl/kategoria/pompy-wody-czesci-montazowe-260785',

  // Level 4 - Cooling pipes
  'https://allegro.pl/kategoria/przewody-ukladow-chlodzenia-przewody-chlodnic-oleju-251122',
  'https://allegro.pl/kategoria/przewody-ukladow-chlodzenia-przewody-chlodnic-powietrza256242',
  'https://allegro.pl/kategoria/przewody-ukladow-chlodzenia-przewody-chlodnic-wody-251124',

  // Level 4 - Thermostats
  'https://allegro.pl/kategoria/termostaty-obudowy-termostatow-251103',
  'https://allegro.pl/kategoria/termostaty-termostaty-251102',
  'https://allegro.pl/kategoria/termostaty-uszczelki-260786',

  // Level 4 - Cooling fans
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-obudowy-wentylatorow-251105',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-silniki-i-lozyska-wentylatorow-251106',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-sprzegla-wiskotyczne-251107',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-wentylatory-251104',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-wiatraki-wentylatorow-251108',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-wlaczniki-sterowniki-251109',
  'https://allegro.pl/kategoria/wentylatory-chlodnicy-czesci-montazowe-260787',

  // Level 4 - Central locking
  'https://allegro.pl/kategoria/centralne-zamki-pompy-255608',
  'https://allegro.pl/kategoria/centralne-zamki-silowniki-18823',
  'https://allegro.pl/kategoria/centralne-zamki-sterowniki-18824',
  'https://allegro.pl/kategoria/centralne-zamki-zestawy-18822',
  'https://allegro.pl/kategoria/centralne-zamki-pozostale-18821',

  // Level 4 - Sensors (electrical)
  'https://allegro.pl/kategoria/czujniki-czujniki-drzwi-256165',
  'https://allegro.pl/kategoria/czujniki-czujniki-parkowania-256161',
  'https://allegro.pl/kategoria/czujniki-czujniki-pasa-ruchu-261299',
  'https://allegro.pl/kategoria/czujniki-czujniki-polozenia-260606',
  'https://allegro.pl/kategoria/czujniki-czujniki-predkosci-256164',
  'https://allegro.pl/kategoria/czujniki-czujniki-przyspieszenia-260605',
  'https://allegro.pl/kategoria/czujniki-czujniki-temperatury-261072',
  'https://allegro.pl/kategoria/czujniki-czujniki-temperatury-wewnetrznej-261073',
  'https://allegro.pl/kategoria/czujniki-czujniki-temperatury-zewnetrznej-256162',
  'https://allegro.pl/kategoria/czujniki-czujniki-uderzenia-256163',
  'https://allegro.pl/kategoria/czujniki-czujniki-zasysanego-powietrza-259306',
  'https://allegro.pl/kategoria/czujniki-pozostale-50745',

  // Level 4 - Installation materials
  'https://allegro.pl/kategoria/materialy-instalacyjne-bezpieczniki-50768',
  'https://allegro.pl/kategoria/materialy-instalacyjne-klemy-255609',
  'https://allegro.pl/kategoria/materialy-instalacyjne-kostki-zlaczki-50753',
  'https://allegro.pl/kategoria/materialy-instalacyjne-oslony-izolacje-przewodow-261065',
  'https://allegro.pl/kategoria/materialy-instalacyjne-wiazki-przewodow-50754',
  'https://allegro.pl/kategoria/materialy-instalacyjne-pozostale-50752',

  // Level 4 - Ignition switches and keys
  'https://allegro.pl/kategoria/stacyjki-i-kluczyki-kluczyki-255611',
  'https://allegro.pl/kategoria/stacyjki-i-kluczyki-stacyjki-255610',

  // Level 4 - Spark plugs
  'https://allegro.pl/kategoria/swiece-sterowniki-261079',
  'https://allegro.pl/kategoria/swiece-zaplonowe-50759',
  'https://allegro.pl/kategoria/swiece-zarowe-50760',

  // Level 4 - Engine electrical system
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-alternatory-50769',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-aparaty-zaplonowe-50770',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-cewki-zaplonowe-50771',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-moduly-zaplonowe-50763',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-przewody-zaplonowe-50772',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-rozruszniki-50773',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-tulejki-lozyska-261085',
  'https://allegro.pl/kategoria/uklad-elektryczny-silnika-pozostale-50762',

  // Level 4 - Electrical equipment
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-gniazda-zapalniczki-50779',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-kamery-320761',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-klaksony-50766',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-moduly-drzwi-256283',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-moduly-immobilizera-256284',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-moduly-komfortu-256285',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-moduly-poduszek-powietrznych-256282',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-moduly-tempomatu-261376',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-podnosniki-szyb-256182',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-przetwornice-261074',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-silniczki-regulacji-fotela-50775',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-silniczki-szyb-50776',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-silniczki-szyberdachu-50777',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-sterowniki-261300',
  'https://allegro.pl/kategoria/wyposazenie-elektryczne-pozostale-50765',

  // Level 4 - Drum brakes
  'https://allegro.pl/kategoria/hamulce-bebnowe-bebny-hamulcowe-250423',
  'https://allegro.pl/kategoria/hamulce-bebnowe-cylinderki-250424',
  'https://allegro.pl/kategoria/hamulce-bebnowe-czesci-montazowe-260575',
  'https://allegro.pl/kategoria/hamulce-bebnowe-okladziny-szczek-hamulcowych-260578',
  'https://allegro.pl/kategoria/hamulce-bebnowe-szczeki-hamulcowe-250425',
  'https://allegro.pl/kategoria/hamulce-bebnowe-zestawy-bebny-szczeki-cylinderki-250426',

  // Level 4 - Pneumatic brakes
  'https://allegro.pl/kategoria/hamulce-pneumatyczne-czesci-montazowe-260604',
  'https://allegro.pl/kategoria/hamulce-pneumatyczne-pompy-260582',
  'https://allegro.pl/kategoria/hamulce-pneumatyczne-silowniki-260581',

  // Level 4 - Parking brake
  'https://allegro.pl/kategoria/hamulce-postojowe-czesci-montazowe-260608',
  'https://allegro.pl/kategoria/hamulce-postojowe-dzwignie-hamulca-recznego-260615',
  'https://allegro.pl/kategoria/hamulce-postojowe-linki-hamulca-recznego-260614',

  // Level 4 - Disc brakes
  'https://allegro.pl/kategoria/hamulce-tarczowe-czesci-montazowe-i-naprawcze-260579',
  'https://allegro.pl/kategoria/hamulce-tarczowe-czujniki-zuzycia-klockow-250403',
  'https://allegro.pl/kategoria/hamulce-tarczowe-jarzma-250404',
  'https://allegro.pl/kategoria/hamulce-tarczowe-klocki-hamulcowe-250405',
  'https://allegro.pl/kategoria/hamulce-tarczowe-tarcze-hamulcowe-250406',
  'https://allegro.pl/kategoria/hamulce-tarczowe-zaciski-250427',
  'https://allegro.pl/kategoria/hamulce-tarczowe-zestawy-tarcze-klocki-zaciski-250407',

  // Level 4 - ABS and ESP
  'https://allegro.pl/kategoria/uklad-abs-i-esp-czujniki-abs-260616',
  'https://allegro.pl/kategoria/uklad-abs-i-esp-czujniki-esp-260617',
  'https://allegro.pl/kategoria/uklad-abs-i-esp-sterowniki-abs-260618',
  'https://allegro.pl/kategoria/uklad-abs-i-esp-pozostale-260580',

  // Level 4 - Brake assistance
  'https://allegro.pl/kategoria/wspomaganie-hamulca-czesci-montazowe-260611',
  'https://allegro.pl/kategoria/wspomaganie-hamulca-hamulec-pracy-ciaglej-260612',
  'https://allegro.pl/kategoria/wspomaganie-hamulca-pompy-podcisnieniowe-260610',
  'https://allegro.pl/kategoria/wspomaganie-hamulca-serwa-hamulca-260619',

  // Level 4 - A/C compressors
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-czesci-montazowe-260950',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-glowice-260952',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-kompresory-klimatyzacji-258697',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-uszczelki-260954',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-cewki-kompresorow-258698',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-lozyska-kompresorow-258700',
  'https://allegro.pl/kategoria/kompresory-klimatyzacji-sprzegla-kompresorow-258699',

  // Level 4 - Differentials
  'https://allegro.pl/kategoria/dyferencjaly-czesci-montazowe-260925',
  'https://allegro.pl/kategoria/dyferencjaly-kola-zebate-260924',
  'https://allegro.pl/kategoria/dyferencjaly-kompletne-dyferencjaly-260923',
  'https://allegro.pl/kategoria/dyferencjaly-lozyska-260926',
  'https://allegro.pl/kategoria/dyferencjaly-obudowy-260927',
  'https://allegro.pl/kategoria/dyferencjaly-uszczelki-260928',
  'https://allegro.pl/kategoria/dyferencjaly-zestawy-naprawcze-260929',

  // Level 4 - Axles
  'https://allegro.pl/kategoria/mosty-przednie-50867',
  'https://allegro.pl/kategoria/mosty-tylne-50868',

  // Level 4 - Half shafts, joints, and shafts
  'https://allegro.pl/kategoria/polosie-przeguby-waly-czesci-montazowe-260902',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-krzyzaki-walu-256001',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-lozyska-260903',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-nakretki-polosi-260904',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-oslony-przegubow-256002',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-podpory-polosi-256003',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-podpory-walu-256004',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-polosie-256006',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-przeguby-256005',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-skrzynie-rozdzielacza-260908',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-tlumiki-drgan-260905',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-uszczelniacze-polosi-256007',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-uszczelniacze-walu-260906',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-waly-napedowe-256008',
  'https://allegro.pl/kategoria/polosie-przeguby-waly-pozostale-256009',

  // Level 4 - Gearboxes
  'https://allegro.pl/kategoria/skrzynie-biegow-czesci-montazowe-260909',
  'https://allegro.pl/kategoria/skrzynie-biegow-czujniki-skrzyni-260910',
  'https://allegro.pl/kategoria/skrzynie-biegow-kola-zebate-260911',
  'https://allegro.pl/kategoria/skrzynie-biegow-kompletne-skrzynie-50873',
  'https://allegro.pl/kategoria/skrzynie-biegow-lewarki-i-wybieraki-256018',
  'https://allegro.pl/kategoria/skrzynie-biegow-linki-zmiany-biegow-256010',
  'https://allegro.pl/kategoria/skrzynie-biegow-lapy-podpory-256011',
  'https://allegro.pl/kategoria/skrzynie-biegow-lozyska-260912',
  'https://allegro.pl/kategoria/skrzynie-biegow-obudowy-256012',
  'https://allegro.pl/kategoria/skrzynie-biegow-poduszki-256013',
  'https://allegro.pl/kategoria/skrzynie-biegow-przelaczniki-260898',
  'https://allegro.pl/kategoria/skrzynie-biegow-przewody-260913',
  'https://allegro.pl/kategoria/skrzynie-biegow-reduktory-256014',
  'https://allegro.pl/kategoria/skrzynie-biegow-skrzynie-rozdzielacza-260907',
  'https://allegro.pl/kategoria/skrzynie-biegow-smarowanie-256015',
  'https://allegro.pl/kategoria/skrzynie-biegow-sterowniki-skrzyni-256016',
  'https://allegro.pl/kategoria/skrzynie-biegow-synchronizatory-256017',
  'https://allegro.pl/kategoria/skrzynie-biegow-uszczelki-260899',
  'https://allegro.pl/kategoria/skrzynie-biegow-walki-skrzyni-260900',
  'https://allegro.pl/kategoria/skrzynie-biegow-zawory-260914',
  'https://allegro.pl/kategoria/skrzynie-biegow-zestawy-naprawcze-260915',
  'https://allegro.pl/kategoria/skrzynie-biegow-pozostale-50872',

  // Level 4 - Clutches
  'https://allegro.pl/kategoria/sprzegla-czesci-montazowe-260916',
  'https://allegro.pl/kategoria/sprzegla-dociski-sprzegla-50882',
  'https://allegro.pl/kategoria/sprzegla-dzwignie-sprzegla-lapy-260917',
  'https://allegro.pl/kategoria/sprzegla-kola-dwumasowe-i-zamachowe-50883',
  'https://allegro.pl/kategoria/sprzegla-komplety-sprzegiel-50884',
  'https://allegro.pl/kategoria/sprzegla-linki-sprzegla-255986',
  'https://allegro.pl/kategoria/sprzegla-lozyska-oporowe-50885',
  'https://allegro.pl/kategoria/sprzegla-obudowy-260918',
  'https://allegro.pl/kategoria/sprzegla-pompy-sprzegla-50886',
  'https://allegro.pl/kategoria/sprzegla-przewody-255987',
  'https://allegro.pl/kategoria/sprzegla-tarcze-50887',
  'https://allegro.pl/kategoria/sprzegla-wysprzegliki-255988',
  'https://allegro.pl/kategoria/sprzegla-pozostale-50881',

  // Level 4 - AdBlue
  'https://allegro.pl/kategoria/adblue-czesci-montazowe-260936',
  'https://allegro.pl/kategoria/adblue-czujniki-260934',
  'https://allegro.pl/kategoria/adblue-moduly-260937',
  'https://allegro.pl/kategoria/adblue-podgrzewacze-260935',
  'https://allegro.pl/kategoria/adblue-przewody-260938',
  'https://allegro.pl/kategoria/adblue-wlewy-korki-260939',
  'https://allegro.pl/kategoria/adblue-wtryskiwacze-260940',
  'https://allegro.pl/kategoria/adblue-zbiorniki-260941',

  // Level 4 - LPG
  'https://allegro.pl/kategoria/lpg-adaptery-przejsciowki-18856',
  'https://allegro.pl/kategoria/lpg-czujniki-255910',
  'https://allegro.pl/kategoria/lpg-elektrozawory-319691',
  'https://allegro.pl/kategoria/lpg-emulatory-255911',
  'https://allegro.pl/kategoria/lpg-filtry-18858',
  'https://allegro.pl/kategoria/lpg-instalacje-kompletne-18859',
  'https://allegro.pl/kategoria/lpg-przelaczniki-255914',
  'https://allegro.pl/kategoria/lpg-przewody-255912',
  'https://allegro.pl/kategoria/lpg-reduktory-18860',
  'https://allegro.pl/kategoria/lpg-sterowniki-255913',
  'https://allegro.pl/kategoria/lpg-wielozawory-319694',
  'https://allegro.pl/kategoria/lpg-wlewy-korki-255915',
  'https://allegro.pl/kategoria/lpg-wtryskiwacze-255916',
  'https://allegro.pl/kategoria/lpg-zbiorniki-18857',
  'https://allegro.pl/kategoria/lpg-zestawy-naprawcze-18861',
  'https://allegro.pl/kategoria/lpg-pozostale-18855',

  // Level 4 - Exhaust silencers
  'https://allegro.pl/kategoria/tlumiki-koncowe-255658',
  'https://allegro.pl/kategoria/tlumiki-przednie-255659',
  'https://allegro.pl/kategoria/tlumiki-srodkowe-255660',
  'https://allegro.pl/kategoria/tlumiki-komplety-255661',
  'https://allegro.pl/kategoria/tlumiki-sportowe-258760',

  // Level 4 - Shock absorbers and components
  'https://allegro.pl/kategoria/amortyzatory-i-elementy-amortyzatory-19063',
  'https://allegro.pl/kategoria/amortyzatory-i-elementy-oslony-i-odboje-amortyzatorow-250863',
  'https://allegro.pl/kategoria/amortyzatory-i-elementy-poduszki-i-lozyska-amortyzatorow250864',
  'https://allegro.pl/kategoria/amortyzatory-i-elementy-tuleje-amortyzatorow-250865',
  'https://allegro.pl/kategoria/amortyzatory-i-elementy-czesci-montazowe-260723',

  // Level 4 - Suspension beams
  'https://allegro.pl/kategoria/belki-zawieszenia-belki-przednie-250867',
  'https://allegro.pl/kategoria/belki-zawieszenia-belki-tylne-250868',
  'https://allegro.pl/kategoria/belki-zawieszenia-czesci-montazowe-260731',

  // Level 4 - Springs and components
  'https://allegro.pl/kategoria/resory-i-elementy-odboje-i-jarzma-resorow-250871',
  'https://allegro.pl/kategoria/resory-i-elementy-piora-resorow-250872',
  'https://allegro.pl/kategoria/resory-i-elementy-tuleje-resorow-250873',
  'https://allegro.pl/kategoria/resory-i-elementy-czesci-montazowe-260728',

  // Level 4 - Stabilizers and components
  'https://allegro.pl/kategoria/stabilizatory-i-elementy-drazki-stabilizatora-250876',
  'https://allegro.pl/kategoria/stabilizatory-i-elementy-gumy-drazkow-stabilizatora-250877',
  'https://allegro.pl/kategoria/stabilizatory-i-elementy-laczniki-drazkow-stabilizatora-250878',
  'https://allegro.pl/kategoria/stabilizatory-i-elementy-czesci-montazowe-260730',

  // Level 4 - Wishbones and components
  'https://allegro.pl/kategoria/wahacze-i-elementy-sworznie-wahaczy-250883',
  'https://allegro.pl/kategoria/wahacze-i-elementy-tuleje-wahaczy-250884',
  'https://allegro.pl/kategoria/wahacze-i-elementy-wahacze-250885',
  'https://allegro.pl/kategoria/wahacze-i-elementy-czesci-montazowe-260729',

  // Level 4 - Hydraulic and pneumatic suspension
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-amortyzator-260727',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-kompresory-256099',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-poduszki-i-miechy256100',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-sfery-gruszki-256098',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-sterowniki-261082',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-zawory-260725',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-czesci-montazowe260722',
  'https://allegro.pl/kategoria/zawieszenie-hydrauliczne-i-pneumatyczne-pozostale-256101',

  // Level 4 - Interior knobs and boots
  'https://allegro.pl/kategoria/galki-i-mieszki-galki-256029',
  'https://allegro.pl/kategoria/galki-i-mieszki-mieszki-256030',
  'https://allegro.pl/kategoria/galki-i-mieszki-komplety-256031',

  // Level 4 - Factory audio equipment
  'https://allegro.pl/kategoria/sprzet-audio-fabryczny-glosniki-250550',
  'https://allegro.pl/kategoria/sprzet-audio-fabryczny-radioodtwarzacze-250548',
  'https://allegro.pl/kategoria/sprzet-audio-fabryczny-wzmacniacze-250549',
  'https://allegro.pl/kategoria/sprzet-audio-fabryczny-zmieniarki-cd-250551',
  'https://allegro.pl/kategoria/sprzet-audio-fabryczny-pozostale-250552',

  // Level 4 - Tuning filters and housings
  'https://allegro.pl/kategoria/filtry-i-obudowy-sportowe-filtry-powietrza-255616',
  'https://allegro.pl/kategoria/filtry-i-obudowy-tuningowe-filtry-paliwa-322215',
  'https://allegro.pl/kategoria/filtry-i-obudowy-tuningowe-filtry-odmy-322216',
  'https://allegro.pl/kategoria/filtry-i-obudowy-tuningowe-obudowy-filtrow-322217',

  // Level 4 - Electronic tuning components
  'https://allegro.pl/kategoria/podzespoly-elektroniczne-chiptuning-255617',
  'https://allegro.pl/kategoria/podzespoly-elektroniczne-komputery-i-moduly-tuningowe-322222',
  'https://allegro.pl/kategoria/podzespoly-elektroniczne-przewody-wiazki-wtyczki-322221',
  'https://allegro.pl/kategoria/podzespoly-elektroniczne-turbo-timer-322220',
  'https://allegro.pl/kategoria/podzespoly-elektroniczne-wyswietlacze-i-wskazniki-tuningowe322223',

  // Level 4 - Tuning engine and accessories
  'https://allegro.pl/kategoria/silnik-i-osprzet-intercoolery-tuningowe-255618',
  'https://allegro.pl/kategoria/silnik-i-osprzet-kolektory-ssace-tuningowe-322196',
  'https://allegro.pl/kategoria/silnik-i-osprzet-korbowody-kute-322200',
  'https://allegro.pl/kategoria/silnik-i-osprzet-laczniki-i-oploty-przewodow-tuningowych-322201',
  'https://allegro.pl/kategoria/silnik-i-osprzet-oil-catch-322198',
  'https://allegro.pl/kategoria/silnik-i-osprzet-przepustnice-tuningowe-322202',
  'https://allegro.pl/kategoria/silnik-i-osprzet-przewody-powietrza-tuningowe-255615',
  'https://allegro.pl/kategoria/silnik-i-osprzet-rozrzad-i-czesci-tuningowe-322199',
  'https://allegro.pl/kategoria/silnik-i-osprzet-turbosprezarki-tuningowe-322197',
  'https://allegro.pl/kategoria/silnik-i-osprzet-tuningowe-zawieszenie-silnika-322203',
  'https://allegro.pl/kategoria/silnik-i-osprzet-uklady-dolotowe-tuningowe-322205',
  'https://allegro.pl/kategoria/silnik-i-osprzet-zawory-tuningowe-322204',
  'https://allegro.pl/kategoria/silnik-i-osprzet-pozostale-255619',

  // Level 4 - Tuning brake system
  'https://allegro.pl/kategoria/uklad-hamulcowy-sportowe-klocki-hamulcowe-322207',
  'https://allegro.pl/kategoria/uklad-hamulcowy-pozostale-322209',

  // Level 4 - Tuning exhaust system
  'https://allegro.pl/kategoria/uklad-wydechowy-downpipe-322212',
  'https://allegro.pl/kategoria/uklad-wydechowy-sportowe-kolektory-wydechowe-322211',
  'https://allegro.pl/kategoria/uklad-wydechowy-sportowe-przepustnice-wydechu-322210',
  'https://allegro.pl/kategoria/uklad-wydechowy-strumienice-sportowe-255622',
  'https://allegro.pl/kategoria/uklad-wydechowy-tlumiki-sportowe-255621',
  'https://allegro.pl/kategoria/uklad-wydechowy-tuningowe-oslony-termoizolacyjne-322213',
  'https://allegro.pl/kategoria/uklad-wydechowy-pozostale-255623',

  // Level 4 - Tuning suspension system
  'https://allegro.pl/kategoria/uklad-zawieszenia-amortyzatory-sportowe-255626',
  'https://allegro.pl/kategoria/uklad-zawieszenia-oslony-i-odboje-tuningowe-322227',
  'https://allegro.pl/kategoria/uklad-zawieszenia-plyty-camber-322234',
  'https://allegro.pl/kategoria/uklad-zawieszenia-ramy-stabilizatora-322231',
  'https://allegro.pl/kategoria/uklad-zawieszenia-rozporki-322233',
  'https://allegro.pl/kategoria/uklad-zawieszenia-sprezyny-sportowe-255625',
  'https://allegro.pl/kategoria/uklad-zawieszenia-stabilizatory-tuningowe-322232',
  'https://allegro.pl/kategoria/uklad-zawieszenia-tuleje-sportowe-322235',
  'https://allegro.pl/kategoria/uklad-zawieszenia-tuningowe-laczniki-stabilizatora-322230',
  'https://allegro.pl/kategoria/uklad-zawieszenia-wahacze-sportowe-322228',
  'https://allegro.pl/kategoria/uklad-zawieszenia-zawieszenie-gwintowane-322226',
  'https://allegro.pl/kategoria/uklad-zawieszenia-zestawy-zawieszenia-sportowego-255627',
  'https://allegro.pl/kategoria/uklad-zawieszenia-pozostale-255628',

  // Level 4 - Automotive refrigeration
  'https://allegro.pl/kategoria/chlodnictwo-samochodowe-agregaty-chlodnicze-258672',
  'https://allegro.pl/kategoria/chlodnictwo-samochodowe-rejestratory-temperatury-258673',
  'https://allegro.pl/kategoria/chlodnictwo-samochodowe-czesci-i-elementy-montazowe-258674',

  // Level 4 - Auxiliary heating
  'https://allegro.pl/kategoria/ogrzewanie-postojowe-kompletne-instalacje-258675',
  'https://allegro.pl/kategoria/ogrzewanie-postojowe-czesci-258676'
];

/**
 * Extract category hierarchy information from URL
 */
export function getCategoryHierarchyFromUrl(url: string): {
  level: number;
  allegroId: string | null;
  categoryPath: string[];
} {
  const urlPath = url.replace('https://allegro.pl/kategoria/', '');
  const idMatch = urlPath.match(/-(\d+)$/);
  const allegroId = idMatch ? idMatch[1] : null;
  
  // Determine level based on URL structure
  let level = 1;
  const pathParts = urlPath.split('-');
  
  if (urlPath.includes('czesci-samochodowe-') && !urlPath.startsWith('czesci-samochodowe-620')) {
    level = 2; // Main subcategories
  } else if (urlPath.match(/^[^-]+-[^-]+-\d+$/)) {
    level = 3; // Part categories like "czesci-karoserii-blotniki-254682"
  } else if (urlPath.match(/^[^-]+-[^-]+-\d+$/) === null && pathParts.length > 2) {
    level = 4; // Specific parts like "blotniki-blotniki-254683"
  }
  
  return {
    level,
    allegroId,
    categoryPath: pathParts.slice(0, -1) // Remove the ID part
  };
}