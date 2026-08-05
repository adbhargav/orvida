// ORIVIDA Master Mock Database

export const CATEGORIES = [
  {
    id: 1,
    name: 'Plants',
    slug: 'plants',
    tagline: 'Living Luxury for Elevated Spaces',
    banner: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=1600&q=80',
    description: 'Hand-nurtured indoor botanicals, rare variegated specimens, and air-purifying greenery presented in signature luxury arrangements.',
    subcategories: [
      { id: 101, name: 'Indoor Plants', slug: 'indoor-plants', count: 18, image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80' },
      { id: 102, name: 'Succulents & Cacti', slug: 'succulents-cacti', count: 12, image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80' },
      { id: 103, name: 'Flowering Plants', slug: 'flowering-plants', count: 15, image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80' },
      { id: 104, name: 'Air-Purifying Plants', slug: 'air-purifying-plants', count: 20, image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=600&q=80' },
      { id: 105, name: 'Rare & Exotic Plants', slug: 'rare-exotic-plants', count: 8, image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    id: 2,
    name: 'Gifting Solutions',
    slug: 'gifting-solutions',
    tagline: 'Unforgettable Botanical & Artisan Hampers',
    banner: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=1600&q=80',
    description: 'Bespoke plant gift hampers, handcrafted brass keepsakes, and personalized planter collections for celebrations, corporate milestones, and loved ones.',
    subcategories: [
      { id: 201, name: 'Plant Gift Hampers', slug: 'plant-gift-hampers', count: 14, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' },
      { id: 202, name: 'Corporate Gifting', slug: 'corporate-gifting', count: 10, image: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=600&q=80' },
      { id: 203, name: 'Occasion Gifts', slug: 'occasion-gifts', count: 16, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80' },
      { id: 204, name: 'Personalized Planters', slug: 'personalized-planters', count: 9, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    id: 3,
    name: 'Balcony Makeover',
    slug: 'balcony-makeover',
    tagline: 'Transform Outdoor Nooks into Private Sanctuaries',
    banner: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1600&q=80',
    description: 'Architectural railing planters, vertical wall greening systems, weatherproof teak furniture, and warm brass fairy accents for urban balconies.',
    subcategories: [
      { id: 301, name: 'Railing Planters', slug: 'railing-planters', count: 11, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80' },
      { id: 302, name: 'Vertical Gardens', slug: 'vertical-gardens', count: 7, image: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=600&q=80' },
      { id: 303, name: 'Balcony Furniture & Decor', slug: 'balcony-furniture-decor', count: 12, image: 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=600&q=80' },
      { id: 304, name: 'Lighting & Accessories', slug: 'lighting-accessories', count: 8, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80' },
    ]
  },
  {
    id: 4,
    name: 'Arts & Decor',
    slug: 'arts-decor',
    tagline: 'Heritage Craftsmanship Meets Modern Elegance',
    banner: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1600&q=80',
    description: 'Authentic Bastar bell metal (Dhokra) sculptures, hand-thrown studio pottery, brass-trimmed marble planters, and artisanal wall mountings.',
    subcategories: [
      { id: 401, name: 'Bell Metal Arts', slug: 'bell-metal-arts', count: 14, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80' },
      { id: 402, name: 'Pottery & Ceramics', slug: 'pottery-ceramics', count: 22, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80' },
      { id: 403, name: 'Handcrafted Planters', slug: 'handcrafted-planters', count: 18, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80' },
      { id: 404, name: 'Wall Art & Sculptures', slug: 'wall-art-sculptures', count: 10, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
    ]
  }
];

export const PRODUCTS = [
  {
    id: 1,
    name: 'Royal Monstera Deliciosa (Variegated Alba)',
    slug: 'royal-monstera-deliciosa-variegated-alba',
    categoryId: 1,
    categoryName: 'Plants',
    categorySlug: 'plants',
    subcategoryId: 105,
    subcategoryName: 'Rare & Exotic Plants',
    subcategorySlug: 'rare-exotic-plants',
    price: 4999,
    discountPrice: 3999,
    sku: 'ORI-PLNT-001',
    stock: 7,
    avgRating: 4.9,
    reviewCount: 42,
    tags: ['Rare & Exotic', 'Statement Piece', 'Air Purifying'],
    isFeatured: true,
    isNew: true,
    isBestseller: true,
    shortDescription: 'Prized for its dramatic marbled white fenestrations, set in our hand-polished matte emerald ceramic vessel with brass rim.',
    description: `The Variegated Monstera Deliciosa Alba is the undisputed crown jewel of indoor botanical collections. Each leaf presents a unique, hand-painted pattern of crisp white variegation against deep forest green foliage.

Nurtured in our temperature-controlled organic nursery in Coorg for 18 months, every specimen possesses mature fenestrations and healthy aerial root architecture. Delivered pre-potted in premium aeration mix inside an ORIVIDA artisan gold-trimmed planter.`,
    careInstructions: `☀️ **Light:** Bright indirect sunlight. Avoid direct mid-day sun to protect delicate white variegation from burning.
💧 **Watering:** Allow top 2 inches of soil to dry out between waterings. Use filtered or rainwater for optimum leaf vibrancy.
🌡️ **Humidity:** Thrives in 60%+ humidity. Mist leaves weekly with warm distilled water.
🌱 **Feeding:** Feed with ORIVIDA Organic Botanical Serum once a month during spring and summer.`,
    craftsmanshipStory: null,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80' },
      { id: 3, url: 'https://images.unsplash.com/photo-1617173944883-6ffbd35d584d?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 1, type: 'size', value: 'Medium (18-22 inches)', priceDelta: 0, stock: 4 },
      { id: 2, type: 'size', value: 'Large (28-34 inches)', priceDelta: 1200, stock: 3 },
      { id: 3, type: 'pot_style', value: 'Emerald & Gold Brass Vessel', priceDelta: 0, swatch: '#0B3D2E' },
      { id: 4, type: 'pot_style', value: 'Matte Ivory & Gold Foil', priceDelta: 300, swatch: '#F7F5EF' },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001', '380001']
  },
  {
    id: 2,
    name: 'Sansevieria Trifasciata "Gold Laurentii" Supreme',
    slug: 'sansevieria-trifasciata-gold-laurentii',
    categoryId: 1,
    categoryName: 'Plants',
    categorySlug: 'plants',
    subcategoryId: 104,
    subcategoryName: 'Air-Purifying Plants',
    subcategorySlug: 'air-purifying-plants',
    price: 1899,
    discountPrice: 1499,
    sku: 'ORI-PLNT-002',
    stock: 24,
    avgRating: 4.8,
    reviewCount: 68,
    tags: ['Low Maintenance', 'Pet Friendly', 'Air Purifying', 'Bestseller'],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    shortDescription: 'NASA-certified air purifying snake plant featuring vibrant golden yellow leaf margins in a textured metallic ceramic planter.',
    description: `Renowned for converting CO2 into clean oxygen during nighttime hours, the Snake Plant Laurentii is an effortless luxury addition to bedrooms and executive suites. Striking upright sword-like leaves display bold golden ribbons. Highly resilient to low light and occasional underwatering.`,
    careInstructions: `☀️ **Light:** Adapts to any light level, from low indoor corners to bright indirect rays.
💧 **Watering:** Water sparingly every 2-3 weeks; ensure soil completely dries out.
🌡️ **Temperature:** Thrives in standard room temperatures (18°C - 30°C).`,
    craftsmanshipStory: null,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 5, type: 'size', value: 'Compact (12 inches)', priceDelta: 0, stock: 15 },
      { id: 6, type: 'size', value: 'Tall (24 inches)', priceDelta: 500, stock: 9 },
      { id: 7, type: 'pot_style', value: 'Brushed Brass Metal Planter', priceDelta: 400, swatch: '#C9972B' },
      { id: 8, type: 'pot_style', value: 'Deep Emerald Matte Pot', priceDelta: 0, swatch: '#0B3D2E' },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001', '380001']
  },
  {
    id: 3,
    name: 'The Emperor’s Golden Harvest Plant Hamper',
    slug: 'the-emperors-golden-harvest-plant-hamper',
    categoryId: 2,
    categoryName: 'Gifting Solutions',
    categorySlug: 'gifting-solutions',
    subcategoryId: 201,
    subcategoryName: 'Plant Gift Hampers',
    subcategorySlug: 'plant-gift-hampers',
    price: 6499,
    discountPrice: 5499,
    sku: 'ORI-GIFT-001',
    stock: 12,
    avgRating: 5.0,
    reviewCount: 31,
    tags: ['Luxury Hamper', 'Corporate Gift', 'Housewarming', 'Limited Edition'],
    isFeatured: true,
    isNew: true,
    isBestseller: true,
    shortDescription: 'Curated luxury hamper: Ficus Lyrata in gold brass pot, artisanal bell metal tealight holder, organic botanical mister, and gold-embossed greeting card.',
    description: `Designed for life’s grandest celebrations. The Emperor’s Harvest Hamper combines living greenery with heirloom metal craftsmanship. Packaged in a velvet-lined emerald keepsake trunk secured with a gold metallic satin ribbon.

Included in Hamper:
• 1x Fiddle Leaf Fig (Ficus Lyrata) in Gold Brass Pot
• 1x Handcrafted Bastar Bell Metal Candle Votive
• 1x Solid Brass Fine-Mist Botanical Sprayer (250ml)
• 1x Organic Plant Elixir Concentrate
• 1x Gold-Foil Personalized Calligraphy Card`,
    careInstructions: `Detailed care booklets included inside the luxury hamper lid for both the live botanical and the handcrafted brass votive.`,
    craftsmanshipStory: `Hand-assembled by master curators in our Bengaluru atelier. The included bell metal candle votive is hand-cast by traditional tribal metal artisans using the 4,000-year-old lost-wax process in Chhattisgarh.`,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=1000&q=80' },
      { id: 3, url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 9, type: 'pot_style', value: 'Imperial Gold Trunk', priceDelta: 0, swatch: '#C9972B' },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001']
  },
  {
    id: 4,
    name: 'Bastar Tribal "Tree of Life" Bell Metal Sculpture',
    slug: 'bastar-tribal-tree-of-life-bell-metal-sculpture',
    categoryId: 4,
    categoryName: 'Arts & Decor',
    categorySlug: 'arts-decor',
    subcategoryId: 401,
    subcategoryName: 'Bell Metal Arts',
    subcategorySlug: 'bell-metal-arts',
    price: 8999,
    discountPrice: 7999,
    sku: 'ORI-ARTS-001',
    stock: 4,
    avgRating: 4.95,
    reviewCount: 19,
    tags: ['Artisan Crafted', 'Bastar Bell Metal', 'Heritage Craft', 'Collectors Item'],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    shortDescription: 'Authentic Dhokra bell metal sculpture hand-cast by master artisans of Chhattisgarh using 4000-year-old lost-wax casting.',
    description: `A collector's treasure embodying eternal growth and prosperity. Handcrafted individually without moulds, no two "Tree of Life" sculptures are identical. Features intricate tribal wire work depicting nesting birds and flourishing branches in warm antique golden bronze alloy.

Accompanied by a signed Certificate of Authenticity specifying the artisan family lineage.`,
    careInstructions: `Clean gently with a soft dry cotton cloth. Do not use harsh chemical metal polishes to retain the natural aged bronze patina.`,
    craftsmanshipStory: `Handcrafted in Kondagaon, Bastar district. Artisans mold bees' wax thread by thread onto a clay core, coat it in river mud, and replace the melted wax with molten bell metal brass at 1100°C.`,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 10, type: 'size', value: '12-inch Height', priceDelta: 0, stock: 2 },
      { id: 11, type: 'size', value: '18-inch Height', priceDelta: 3500, stock: 2 },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001', '380001']
  },
  {
    id: 5,
    name: 'Verdant Horizon Balcony Railing Planter Set (Triple Brass Trim)',
    slug: 'verdant-horizon-balcony-railing-planter-set',
    categoryId: 3,
    categoryName: 'Balcony Makeover',
    categorySlug: 'balcony-makeover',
    subcategoryId: 301,
    subcategoryName: 'Railing Planters',
    subcategorySlug: 'railing-planters',
    price: 3499,
    discountPrice: 2899,
    sku: 'ORI-BALC-001',
    stock: 18,
    avgRating: 4.85,
    reviewCount: 44,
    tags: ['Weatherproof', 'Balcony Essential', 'Gold Trim', 'Self-Watering'],
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    shortDescription: 'Set of 3 powder-coated emerald railing planters with heavy-duty adjustable brass mounts and integrated drainage trays.',
    description: `Elevate apartment railings with anti-rust galvanized steel planters finished in deep UV-resistant emerald gloss and solid gold hairline rim detailing. Suitable for railings up to 3 inches thick. Includes internal root-aeration grids.`,
    careInstructions: `Wipe clean with moist sponge. Rust-proof guaranteed for 5 years under outdoor weather exposure.`,
    craftsmanshipStory: null,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 12, type: 'color', value: 'Deep Emerald & Gold Rim', priceDelta: 0, swatch: '#0B3D2E' },
      { id: 13, type: 'color', value: 'Starlight Charcoal & Gold Rim', priceDelta: 0, swatch: '#1B1B1B' },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001']
  },
  {
    id: 6,
    name: 'Hand-Thrown Ceramic Urn "Terracotta Sunbeam"',
    slug: 'hand-thrown-ceramic-urn-terracotta-sunbeam',
    categoryId: 4,
    categoryName: 'Arts & Decor',
    categorySlug: 'arts-decor',
    subcategoryId: 402,
    subcategoryName: 'Pottery & Ceramics',
    subcategorySlug: 'pottery-ceramics',
    price: 2499,
    discountPrice: 1999,
    sku: 'ORI-ARTS-002',
    stock: 15,
    avgRating: 4.9,
    reviewCount: 27,
    tags: ['Pottery & Ceramics', 'Handcrafted', 'Studio Piece'],
    isFeatured: false,
    isNew: true,
    isBestseller: true,
    shortDescription: 'Wheel-thrown stoneware planter featuring an organic dual-tone reactive glaze in speckled gold ochre and warm ivory.',
    description: `Fired at 1250°C in small studio batches in Jaipur. The reactive glaze creates natural, unrepeatable gradient cascades reminiscent of morning sunlight breaking over clay hills. Includes rubber floor bumpers and a matching saucer.`,
    careInstructions: `Hand wash with gentle soapy water. Suitable for both indoor consoles and covered veranda placements.`,
    craftsmanshipStory: `Hand-shaped on traditional wooden potter's wheels by master ceramist Anita Sharma in Sanganer. Finished with lead-free non-toxic mineral glazes.`,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 14, type: 'size', value: '8-inch Diameter', priceDelta: 0, stock: 10 },
      { id: 15, type: 'size', value: '11-inch Diameter', priceDelta: 700, stock: 5 },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001', '380001']
  },
  {
    id: 7,
    name: 'Calathea Orbifolia "Velvet Empress"',
    slug: 'calathea-orbifolia-velvet-empress',
    categoryId: 1,
    categoryName: 'Plants',
    categorySlug: 'plants',
    subcategoryId: 101,
    subcategoryName: 'Indoor Plants',
    subcategorySlug: 'indoor-plants',
    price: 2199,
    discountPrice: 1799,
    sku: 'ORI-PLNT-003',
    stock: 14,
    avgRating: 4.75,
    reviewCount: 39,
    tags: ['Indoor Plants', 'Pet Friendly', 'Statement Foliage'],
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    shortDescription: 'Large round striped silver-green leaves that gently fold upwards at dusk like praying hands.',
    description: `Celebrated for its lush, wide fan-like foliage painted with metallic silver pin-stripes. Calathea Orbifolia brings living art into humid indoor spaces, dining rooms, and spa suites.`,
    careInstructions: `☀️ **Light:** Medium to bright indirect light. Direct sun will fade leaf patterns.
💧 **Watering:** Keep soil consistently moist but never soggy. Use mineral-free water.
🌡️ **Humidity:** Prefers high humidity (55%+).`,
    craftsmanshipStory: null,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 16, type: 'pot_style', value: 'Gold Foil Fluted Ceramic', priceDelta: 0, swatch: '#C9972B' },
      { id: 17, type: 'pot_style', value: 'Pure White Marble Pot', priceDelta: 400, swatch: '#F7F5EF' },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001']
  },
  {
    id: 8,
    name: 'Aureus Golden Pothos Totem (6 Feet)',
    slug: 'aureus-golden-pothos-totem-6-feet',
    categoryId: 1,
    categoryName: 'Plants',
    categorySlug: 'plants',
    subcategoryId: 104,
    subcategoryName: 'Air-Purifying Plants',
    subcategorySlug: 'air-purifying-plants',
    price: 3299,
    discountPrice: 2699,
    sku: 'ORI-PLNT-004',
    stock: 9,
    avgRating: 4.88,
    reviewCount: 52,
    tags: ['Air Purifying', 'Low Maintenance', 'Floor Standing'],
    isFeatured: false,
    isNew: true,
    isBestseller: true,
    shortDescription: 'Towering 6-foot moss pole totem adorned with gigantic golden-variegated pothos leaves.',
    description: `A dramatic floor-standing centerpiece trained up an organic coconut coir pole. Extremely hardy and forgiving, this architectural plant cascades heart-shaped leaves splashed with canary yellow streaks.`,
    careInstructions: `☀️ **Light:** Low to bright indirect light.
💧 **Watering:** Water when top half of soil feels dry. Moss pole should be misted weekly.`,
    craftsmanshipStory: null,
    images: [
      { id: 1, url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1000&q=80' },
      { id: 2, url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
    ],
    variants: [
      { id: 18, type: 'size', value: '5 Feet Totem', priceDelta: 0, stock: 5 },
      { id: 19, type: 'size', value: '6.5 Feet XL Totem', priceDelta: 800, stock: 4 },
    ],
    pincodes: ['110001', '400001', '560001', '700001', '600001', '500001']
  }
];

export const REVIEWS = [
  {
    id: 101,
    productId: 1,
    userName: 'Vikramaditya S.',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    date: '3 days ago',
    title: 'Breathtaking Variegation & Pristine Delivery',
    comment: 'I was hesitant to order a rare Monstera Alba online, but ORIVIDA exceeded all expectations. The plant arrived in a custom velvet-lined wooden crate with zero leaf damage. The gold trim pot looks divine in my living room!',
    images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80'],
    verified: true,
    helpfulCount: 14
  },
  {
    id: 102,
    productId: 1,
    userName: 'Ananya R.',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    date: '1 week ago',
    title: 'True Luxury Botanical Experience',
    comment: 'The plant is healthy, lush, and has a new leaf unfurling already. The customer service concierge sent a video before dispatching. 10/10 luxury!',
    images: [],
    verified: true,
    helpfulCount: 9
  },
  {
    id: 103,
    productId: 3,
    userName: 'Rohan & Gayatri M.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    date: '2 weeks ago',
    title: 'Unrivalled Gift for Housewarming',
    comment: 'Gifted this hamper to our clients for their new penthouse in Mumbai. They were blown away by the bell metal candle holder and gold trunk packaging.',
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'],
    verified: true,
    helpfulCount: 22
  }
];

export const BRAND_STATS = [
  { label: 'Hand-Nurtured Botanicals', value: '15,000+' },
  { label: 'Artisan Families Supported', value: '120+' },
  { label: 'Plant Health Guarantee', value: '7 Days' },
  { label: 'Five-Star Luxury Reviews', value: '99.4%' }
];
