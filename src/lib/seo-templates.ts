export interface GeneratedSeoData {
  h1_title: string;
  paragraph: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export function slugifyLocation(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildTag(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

const CITY_H1_TEMPLATES: ((c: string) => string)[] = [
  (c) => `Complete Home Interior Solutions in ${c}`,
  (c) => `Best Interior Designers & Turnkey Home Interiors in ${c}`,
  (c) => `Luxury & Modular Home Interiors in ${c}`,
  (c) => `Modern Modular Kitchen & Wardrobe Experts in ${c}`,
  (c) => `Trusted Residential Interior Design Studio in ${c}`,
  (c) => `Custom Home Renovation & Interior Contractors in ${c}`,
  (c) => `Affordable Turnkey Interior Design Services in ${c}`,
  (c) => `Bespoke Apartment & Villa Interiors in ${c}`,
  (c) => `End-to-End Home Interior Execution in ${c}`,
  (c) => `Top-Rated Interior Design & Carpentry Team in ${c}`,
  (c) => `Contemporary Living Room, Kitchen & Bedroom Interiors in ${c}`,
  (c) => `Precision-Crafted Home Interiors Across ${c}`,
  (c) => `Full-Home Interior Makeover & Woodwork in ${c}`,
  (c) => `Smart Space-Saving Modular Interiors in ${c}`,
  (c) => `Premium 1BHK, 2BHK & 3BHK Interior Packages in ${c}`,
  (c) => `Tailored Architectural & Interior Solutions in ${c}`,
  (c) => `Experienced In-House Interior Craftsmen in ${c}`,
  (c) => `Transform Your Flat or Villa with ${c}'s Interior Studio`,
  (c) => `Designer Modular Kitchens, Wardrobes & TV Units in ${c}`,
  (c) => `Reliable Home Interior Design & Material Supply in ${c}`,
  (c) => `Vastu-Friendly Modern Home Interiors in ${c}`,
  (c) => `Commercial & Residential Interior Design Specialists in ${c}`,
  (c) => `Transparent Pricing Home Interior Execution in ${c}`,
  (c) => `Crafted Wooden Furniture & False Ceiling Experts in ${c}`,
  (c) => `On-Time Turnkey Apartment Interiors in ${c}`,
  (c) => `Curated Luxury Home Decor & Interiors in ${c}`,
  (c) => `Quality-Checked Home Interior Renovation in ${c}`,
  (c) => `Minimalist & Warm Contemporary Interiors in ${c}`,
  (c) => `Dedicated Interior Design & Carpentry Services in ${c}`,
  (c) => `Elevate Your Everyday Living Space in ${c}`,
  (c) => `Complete Flat Interior Setup & Finishing in ${c}`,
  (c) => `Custom Home Woodwork, Lighting & Interiors in ${c}`,
];

const CITY_PARAGRAPH_TEMPLATES: ((c: string, country: string) => string)[] = [
  (c, co) => `Looking for reliable interior designers near you in ${c}, ${co}? Our in-house carpenters, designers, and project managers deliver modular kitchens, wardrobes, TV units, and full home interiors with transparent pricing and on-time handover.`,
  (c) => `We bring thoughtful interior architecture and turnkey execution to homes near you across ${c}. From custom modular kitchens and sliding wardrobes to lighting and false ceilings, every detail is built in-house.`,
  (c) => `Searching for top interior designers near me in ${c}? Transform your 1BHK, 2BHK, 3BHK apartment or villa in ${c} with durable materials, trusted fittings, and skilled craftsmanship handled from 3D concept to final walkthrough.`,
  (c) => `Our ${c} interior studio combines functional space planning with warm, timeless aesthetics—covering design, material supply, carpentry, electrical, plumbing, and painting under one roof.`,
  (c) => `Discover hassle-free home interiors in ${c} without middlemen or outsourcing. We craft bespoke wardrobes, ergonomic kitchens, and living spaces tailored to your family's lifestyle.`,
  (c) => `Whether you are moving into a new flat or renovating an existing home in ${c}, our team delivers factory-grade finishes, moisture-resistant plywood, and branded hardware built to last.`,
  (c) => `From compact studio apartments to spacious luxury villas in ${c}, we design and execute customized interiors with clear timelines, itemized quotes, and dedicated site supervision.`,
  (c) => `Upgrade your ${c} home with custom TV units, modular kitchens, study desks, and bedroom storage designed for everyday comfort and long-term durability.`,
  (c) => `Experience stress-free turnkey interiors in ${c}. Our specialists manage everything—design consultation, 3D visualization, material procurement, woodwork, and final deep-cleaned handover.`,
  (c) => `Trusted by homeowners across ${c} for clean workmanship, honest pricing, and on-schedule delivery. Book a free site visit to plan your dream home interior.`,
];

const CITY_META_TITLE_TEMPLATES: ((c: string) => string)[] = [
  (c) => `Best Interior Designers in ${c} | Interior Near You`,
  (c) => `Home Interior Design in ${c} | Modular Kitchen & Wardrobes`,
  (c) => `Top Interior Design Studio Near Me in ${c} | Home Renovation`,
  (c) => `${c} Interior Designers | Affordable 2BHK & 3BHK Interiors`,
  (c) => `Luxury Home Interiors in ${c} | Modular Kitchens & Woodwork`,
  (c) => `Turnkey Interior Contractors Near You in ${c} | Free Visit`,
  (c) => `Modular Kitchen & Wardrobe Designers in ${c}`,
  (c) => `Apartment & Villa Interior Design in ${c} | On-Time Delivery`,
  (c) => `Custom Home Interiors & Carpentry in ${c}`,
  (c) => `Residential Interior Solutions Near Me in ${c} | FixBro`,
];

const CITY_META_DESC_TEMPLATES: ((c: string) => string)[] = [
  (c) => `Book trusted interior designers near you in ${c} for modular kitchens, wardrobes, TV units, and complete home interiors. In-house team, branded materials & on-time delivery.`,
  (c) => `Looking for affordable turnkey home interiors near me in ${c}? Get custom 1BHK, 2BHK & 3BHK interior design, carpentry, electrical & full execution. Request a free quote.`,
  (c) => `Transform your flat or villa in ${c} with our expert interior design studio near you. Custom wardrobes, modular kitchens, false ceilings & transparent project pricing.`,
  (c) => `Top-rated residential and commercial interior designers in ${c}. End-to-end design, material supply, and skilled execution near you with zero outsourcing.`,
  (c) => `Upgrade your living space in ${c} with bespoke furniture, space-saving storage, and modern modular kitchens crafted by experienced interior specialists near you.`,
];

const AREA_H1_TEMPLATES: ((a: string, c: string) => string)[] = [
  (a, c) => `Best Interior Designers in ${a}, ${c}`,
  (a, c) => `Home Interior Solutions & Modular Kitchens in ${a}, ${c}`,
  (a, c) => `Turnkey Apartment & Villa Interiors in ${a}, ${c}`,
  (a, c) => `Custom Wardrobes, TV Units & Home Interiors in ${a}, ${c}`,
  (a, c) => `Affordable Home Interior Designers Near ${a}, ${c}`,
  (a, c) => `Trusted Interior Carpentry & Renovation in ${a}, ${c}`,
  (a, c) => `Luxury Residential Interior Studio Serving ${a}, ${c}`,
  (a, c) => `Complete 1BHK, 2BHK & 3BHK Interiors in ${a}, ${c}`,
  (a, c) => `Modern Modular Kitchen & Wardrobe Makers in ${a}, ${c}`,
  (a, c) => `End-to-End Flat Interior Execution in ${a}, ${c}`,
  (a, c) => `Bespoke Living Room & Bedroom Interiors in ${a}, ${c}`,
  (a, c) => `On-Time Home Interior Setup in ${a}, ${c}`,
  (a, c) => `Experienced In-House Interior Team in ${a}, ${c}`,
  (a, c) => `Smart Space-Saving Home Interiors for ${a}, ${c}`,
  (a, c) => `Quality Woodwork & Interior Finishing in ${a}, ${c}`,
  (a, c) => `Vastu-Compliant Modern Home Interiors in ${a}, ${c}`,
  (a, c) => `Full Home Makeover & Renovation Experts in ${a}, ${c}`,
  (a, c) => `Custom Furniture, Lighting & False Ceiling in ${a}, ${c}`,
  (a, c) => `Transparent-Pricing Interior Designers in ${a}, ${c}`,
  (a, c) => `Premium Apartment Interior Design Near ${a}, ${c}`,
  (a, c) => `Your Local Turnkey Interior Partner in ${a}, ${c}`,
  (a, c) => `Crafted Modular Kitchens & Storage in ${a}, ${c}`,
  (a, c) => `Contemporary Home Decor & Interior Execution in ${a}, ${c}`,
  (a, c) => `Dedicated Site-Supervised Home Interiors in ${a}, ${c}`,
  (a, c) => `Transform Your New Home in ${a}, ${c}`,
  (a, c) => `Top-Rated Interior Contractors in ${a}, ${c}`,
  (a, c) => `Tailored Residential Design & Carpentry in ${a}, ${c}`,
  (a, c) => `Warm Minimalist Home Interiors in ${a}, ${c}`,
  (a, c) => `Reliable Material Supply & Interior Work in ${a}, ${c}`,
  (a, c) => `Complete Home Interior Packages in ${a}, ${c}`,
  (a, c) => `Expert Interior Consultation Near ${a}, ${c}`,
  (a, c) => `Precision-Built Kitchens & Wardrobes in ${a}, ${c}`,
];

const AREA_PARAGRAPH_TEMPLATES: ((a: string, c: string) => string)[] = [
  (a, c) => `Searching for dependable interior designers in ${a}, ${c}? Our local in-house team handles modular kitchens, sliding wardrobes, TV units, electrical, and full home execution with zero outsourcing.`,
  (a, c) => `Upgrade your apartment or independent home in ${a}, ${c} with tailored interior design, branded plywood and hardware, transparent quotations, and guaranteed on-time handover.`,
  (a, c) => `We serve homeowners across ${a} and nearby ${c} neighborhoods with complete turnkey interiors—from 3D space planning and material selection to carpentry and final finishing.`,
  (a, c) => `Make your new home in ${a}, ${c} move-in ready without stress. Our skilled craftsmen build custom kitchens, wardrobes, false ceilings, and bedroom storage designed to last.`,
  (a, c) => `Get personalized interior solutions in ${a}, ${c} backed by clear timelines, factory-grade finishes, and direct site supervision from consultation to key handover.`,
  (a, c) => `Whether you own a 2BHK flat, 3BHK apartment, or villa in ${a}, ${c}, our design and execution experts craft functional, elegant interiors suited to your budget.`,
  (a, c) => `Book a free site visit in ${a}, ${c} for accurate measurements, custom 3D layouts, and itemized interior pricing for kitchens, wardrobes, and full home renovation.`,
  (a, c) => `From compact modern kitchens to luxurious master bedrooms in ${a}, ${c}, we deliver seamless woodwork, lighting, and interior finishing under one roof.`,
];

function pickRandom<T>(arr: T[], seed?: number): T {
  const idx =
    typeof seed === 'number'
      ? Math.abs(seed) % arr.length
      : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export function generateRandomCitySeo(
  cityName: string,
  country: string = 'India',
  seed?: number
): GeneratedSeoData {
  const cTag = buildTag(cityName);
  const h1_title = pickRandom(CITY_H1_TEMPLATES, seed)(cityName);
  const paragraph = pickRandom(
    CITY_PARAGRAPH_TEMPLATES,
    typeof seed === 'number' ? seed + 3 : undefined
  )(cityName, country);
  const meta_title = pickRandom(
    CITY_META_TITLE_TEMPLATES,
    typeof seed === 'number' ? seed + 7 : undefined
  )(cityName);
  const meta_description = pickRandom(
    CITY_META_DESC_TEMPLATES,
    typeof seed === 'number' ? seed + 11 : undefined
  )(cityName);

  const meta_keywords = [
    `interior in ${cityName}`,
    `interior designers in ${cityName}`,
    `interior near me`,
    `interior near you`,
    `interior designers near me in ${cityName}`,
    `home interiors ${cityName}`,
    `modular kitchen ${cityName}`,
    `wardrobe design ${cityName}`,
    `turnkey interior ${cityName}`,
    `home renovation ${cityName}`,
  ].join(', ');

  return {
    h1_title,
    paragraph,
    meta_title,
    meta_description,
    meta_keywords,
  };
}

export function generateRandomAreaSeo(
  areaName: string,
  cityName: string,
  seed?: number
): GeneratedSeoData {
  const h1_title = pickRandom(AREA_H1_TEMPLATES, seed)(areaName, cityName);
  const paragraph = pickRandom(
    AREA_PARAGRAPH_TEMPLATES,
    typeof seed === 'number' ? seed + 5 : undefined
  )(areaName, cityName);

  const metaTitleVariants = [
    `Best Interior Designers in ${areaName}, ${cityName} | Interior Near You`,
    `Modular Kitchen & Wardrobes in ${areaName}, ${cityName}`,
    `Turnkey Home Interiors in ${areaName}, ${cityName} | Near Me`,
    `Interior Designers Near ${areaName}, ${cityName} | Custom Woodwork`,
    `2BHK & 3BHK Home Interiors in ${areaName}, ${cityName}`,
  ];
  const metaDescVariants = [
    `Looking for trusted interior designers near you in ${areaName}, ${cityName}? Get modular kitchens, wardrobes, TV units & full home interiors with transparent pricing and on-time delivery.`,
    `Book expert home interior services near me in ${areaName}, ${cityName}. In-house carpentry, branded materials, and turnkey flat/villa execution. Schedule a free consultation.`,
    `Transform your home in ${areaName}, ${cityName} with custom modular kitchens, sliding wardrobes, and modern living room interiors crafted to last.`,
  ];

  const meta_title = pickRandom(
    metaTitleVariants,
    typeof seed === 'number' ? seed + 2 : undefined
  );
  const meta_description = pickRandom(
    metaDescVariants,
    typeof seed === 'number' ? seed + 9 : undefined
  );

  const meta_keywords = [
    `interior in ${areaName} ${cityName}`,
    `interior in ${cityName} ${areaName}`,
    `${areaName} ${cityName} interior designers`,
    `${cityName} ${areaName} home interiors`,
    `interior near me in ${areaName} ${cityName}`,
    `interior near you ${areaName} ${cityName}`,
    `modular kitchen in ${areaName} ${cityName}`,
    `wardrobe installation ${areaName} ${cityName}`,
    `turnkey interiors ${areaName} ${cityName}`,
  ].join(', ');

  return {
    h1_title,
    paragraph,
    meta_title,
    meta_description,
    meta_keywords,
  };
}

export interface GeoAreaLike {
  id: string;
  name: string;
  slug: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export function getNearbyAreasSorted<T extends GeoAreaLike>(
  target: { id?: string; latitude?: number | string | null; longitude?: number | string | null } | null | undefined,
  allAreas: T[],
  maxCount: number = 12
): T[] {
  const others = allAreas.filter((a) => a.id !== target?.id);
  if (!target) return others.slice(0, maxCount);

  const lat1 = typeof target.latitude === 'string' ? parseFloat(target.latitude) : target.latitude;
  const lon1 = typeof target.longitude === 'string' ? parseFloat(target.longitude) : target.longitude;

  if (lat1 === undefined || lat1 === null || isNaN(lat1) || lon1 === undefined || lon1 === null || isNaN(lon1)) {
    return others.slice(0, maxCount);
  }

  return others
    .map((area) => {
      const lat2 = typeof area.latitude === 'string' ? parseFloat(area.latitude) : area.latitude;
      const lon2 = typeof area.longitude === 'string' ? parseFloat(area.longitude) : area.longitude;
      if (lat2 === undefined || lat2 === null || isNaN(lat2) || lon2 === undefined || lon2 === null || isNaN(lon2)) {
        return { area, distance: Infinity };
      }
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { area, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount)
    .map((x) => x.area);
}
