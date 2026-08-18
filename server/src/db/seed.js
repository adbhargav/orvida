import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { syncSequences } from './syncSequences.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_DATA = [
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

const PRODUCTS_DATA = [
  {
    id: 1,
    name: 'Royal Monstera Deliciosa (Variegated Alba)',
    slug: 'royal-monstera-deliciosa-variegated-alba',
    categoryId: 1,
    subcategoryId: 105,
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
    description: `The Variegated Monstera Deliciosa Alba is the undisputed crown jewel of indoor botanical collections. Each leaf presents a unique, hand-painted pattern of crisp white variegation against deep forest green foliage.\n\nNurtured in our temperature-controlled organic nursery in Coorg for 18 months, every specimen possesses mature fenestrations and healthy aerial root architecture. Delivered pre-potted in premium aeration mix inside an ORIVIDA artisan gold-trimmed planter.`,
    careInstructions: `☀️ **Light:** Bright indirect sunlight.\n💧 **Watering:** Allow top 2 inches of soil to dry out between waterings.\n🌡️ **Humidity:** Thrives in 60%+ humidity.\n🌱 **Feeding:** Feed with ORIVIDA Organic Botanical Serum once a month.`,
    craftsmanshipStory: null,
    images: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1617173944883-6ffbd35d584d?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { type: 'size', value: 'Medium (18-22 inches)', priceDelta: 0, stock: 4 },
      { type: 'size', value: 'Large (28-34 inches)', priceDelta: 1200, stock: 3 }
    ]
  },
  {
    id: 2,
    name: 'Heritage Dhokra Brass Tree of Life Statue',
    slug: 'heritage-dhokra-brass-tree-of-life-statue',
    categoryId: 4,
    subcategoryId: 401,
    price: 8499,
    discountPrice: 6999,
    sku: 'ORI-ART-002',
    stock: 4,
    avgRating: 5.0,
    reviewCount: 18,
    tags: ['Handcrafted', 'Bastar Art', 'Collector Item'],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    shortDescription: 'Cast using 4,000-year-old lost-wax bell metal techniques by master tribal artisans of Bastar.',
    description: `An heirloom masterpiece depicting the sacred Tree of Life, intricately detailed with miniature perching birds and delicate foliage patterns. Crafted entirely by hand using ancient Dhokra lost-wax casting methods in rural Chhattisgarh.`,
    careInstructions: `✨ **Care:** Gently dust with a soft microfibre cloth. Apply a thin layer of natural beeswax polish annually to preserve warm antique brass patina.`,
    craftsmanshipStory: `Hand-sculpted in beeswax, encased in clay molds, and fired in open charcoal kilns. Every single piece is one-of-a-kind as the clay mold must be broken to release the molten brass artwork within.`,
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: [
      { type: 'finish', value: 'Antique Brass', priceDelta: 0, stock: 2 },
      { type: 'finish', value: 'Verdigris Patina', priceDelta: 500, stock: 2 }
    ]
  },
  {
    id: 3,
    name: 'Verdant Haven Balcony Transformation Hamper',
    slug: 'verdant-haven-balcony-transformation-hamper',
    categoryId: 2,
    subcategoryId: 201,
    price: 12999,
    discountPrice: 9999,
    sku: 'ORI-GFT-003',
    stock: 12,
    avgRating: 4.8,
    reviewCount: 31,
    tags: ['Curated Set', 'Luxury Gift', 'Bestseller'],
    isFeatured: true,
    isNew: true,
    isBestseller: true,
    shortDescription: 'An exclusive 7-piece botanical hamper featuring hand-potted rare succulents, solid brass watering can, and artisan garden shears.',
    description: `Designed for connoisseurs of green living, the Verdant Haven Hamper is packaged inside a custom handcrafted pine wood trunk lined with organic linen. Contains 3 potted air-purifying succulents in glazed stoneware, an ergonomic brass mist sprayer, solid brass watering pot, artisanal pruning shears, and ORIVIDA organic plant nutrients.`,
    careInstructions: `📦 Includes step-by-step care booklet and personalized greeting card hand-calligraphed on handmade cotton rag paper.`,
    craftsmanshipStory: null,
    images: [
      'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80'
    ],
    variants: []
  }
];

// Points at ORIVIDA's own hero artwork in server/uploads rather than stock
// photography, so a reseed does not replace the designed brand banners.
const ASSET_BASE = process.env.PUBLIC_ASSET_URL || `http://localhost:${process.env.PORT || 5001}`;

const BANNERS_DATA = [
  {
    title: 'Any 4 plants at ₹999',
    subtitle: 'Add life to every room with our curated botanical starter set.',
    image: `${ASSET_BASE}/assets/brand/hero-banner-1.png`,
    link: '/category/plants',
    button_text: 'Explore now',
    display_order: 1,
    is_active: true
  },
  {
    title: 'Your space deserves more green',
    subtitle: 'Up to 50% off, plus an extra 10% on orders above ₹1,999.',
    image: `${ASSET_BASE}/assets/brand/hero-banner-2.png`,
    link: '/category/plants',
    button_text: 'Shop now',
    display_order: 2,
    is_active: true
  }
];

const COUPONS_DATA = [
  { code: 'ORVIDA10', discount_type: 'percentage', discount_value: 10, min_spend: 2000, max_discount: 1000, valid_until: '2026-12-31', is_active: true },
  { code: 'WELCOME15', discount_type: 'percentage', discount_value: 15, min_spend: 3000, max_discount: 1500, valid_until: '2026-12-31', is_active: true },
  { code: 'LUXURY500', discount_type: 'fixed', discount_value: 500, min_spend: 5000, max_discount: 500, valid_until: '2026-12-31', is_active: true }
];

export const seedDatabase = async () => {
  try {
    console.log('Reading database schema SQL file...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    console.log('Executing schema initialization...');
    await pool.query(schemaSql);
    console.log('Database schema created successfully.');

    // Seed Admin Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin, member_since)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET is_admin = TRUE`,
      ['Master Atelier Admin', 'admin@orvida.com', adminPasswordHash, true, 'August 2025']
    );
    await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin, member_since)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET is_admin = TRUE`,
      ['Princess Radhika', 'radhika@orvida-luxury.com', adminPasswordHash, true, 'August 2025']
    );

    // Seed Categories & Subcategories
    for (const cat of CATEGORIES_DATA) {
      const catRes = await pool.query(
        `INSERT INTO categories (id, name, slug, tagline, banner, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, tagline = EXCLUDED.tagline, banner = EXCLUDED.banner
         RETURNING id`,
        [cat.id, cat.name, cat.slug, cat.tagline, cat.banner, cat.description]
      );

      for (const sub of cat.subcategories) {
        await pool.query(
          `INSERT INTO subcategories (id, category_id, name, slug, image, count)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, image = EXCLUDED.image`,
          [sub.id, catRes.rows[0].id, sub.name, sub.slug, sub.image, sub.count]
        );
      }
    }

    // Seed Products
    for (const prod of PRODUCTS_DATA) {
      const prodRes = await pool.query(
        `INSERT INTO products (id, name, slug, category_id, subcategory_id, price, discount_price, sku, stock, avg_rating, review_count, tags, is_featured, is_new, is_bestseller, short_description, description, care_instructions, craftsmanship_story)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock
         RETURNING id`,
        [
          prod.id, prod.name, prod.slug, prod.categoryId, prod.subcategoryId,
          prod.price, prod.discountPrice, prod.sku, prod.stock, prod.avgRating,
          prod.reviewCount, prod.tags, prod.isFeatured, prod.isNew, prod.isBestseller,
          prod.shortDescription, prod.description, prod.careInstructions, prod.craftsmanshipStory
        ]
      );

      const productId = prodRes.rows[0].id;

      // Seed Product Images
      await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      for (let i = 0; i < prod.images.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, url, display_order) VALUES ($1, $2, $3)',
          [productId, prod.images[i], i + 1]
        );
      }

      // Seed Product Variants
      await pool.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
      for (const variant of prod.variants) {
        await pool.query(
          'INSERT INTO product_variants (product_id, type, value, price_delta, stock) VALUES ($1, $2, $3, $4, $5)',
          [productId, variant.type, variant.value, variant.priceDelta, variant.stock]
        );
      }
    }

    // Seed Banners
    await pool.query('TRUNCATE TABLE banners RESTART IDENTITY CASCADE');
    for (const ban of BANNERS_DATA) {
      await pool.query(
        'INSERT INTO banners (title, subtitle, image, link, button_text, display_order, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [ban.title, ban.subtitle, ban.image, ban.link, ban.button_text, ban.display_order, ban.is_active]
      );
    }

    // Seed Coupons
    for (const c of COUPONS_DATA) {
      await pool.query(
        `INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_discount, valid_until, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (code) DO NOTHING`,
        [c.code, c.discount_type, c.discount_value, c.min_spend, c.max_discount, c.valid_until, c.is_active]
      );
    }

    // Seeded rows carry explicit ids, which leaves the SERIAL sequences at 1.
    // Without this the first admin-created product collides on the primary key.
    const seqResults = await syncSequences();
    const seqFailures = seqResults.filter((r) => r.error);
    if (seqFailures.length > 0) {
      console.warn('Some sequences could not be synced:', seqFailures);
    } else {
      console.log('Primary key sequences realigned.');
    }

    console.log('ORVIDA Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding ORVIDA database:', error);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => pool.end());
}
