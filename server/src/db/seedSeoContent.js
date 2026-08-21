import dotenv from 'dotenv';
import { query, pool } from '../config/db.js';

dotenv.config();

/**
 * Fills the SEO fields that were never written — `npm run seo:seed`.
 *
 * Every statement is COALESCE-guarded on the existing value, so this only
 * ever fills a blank. Re-running it after an admin has edited something
 * changes nothing, which is the same rule the bulk tools in the admin panel
 * follow.
 *
 * The copy here is a starting point written from what each entity actually
 * is. Refine anything that matters commercially in Admin → Categories /
 * Products / Site Content.
 */

const CATEGORIES = {
  plants: {
    title: 'Buy Rare Indoor Plants & Botanicals Online in India',
    description:
      'Hand-nurtured indoor plants, rare variegated specimens and air-purifying greenery, raised slowly and delivered across India with a 7-day health guarantee.',
    alt: 'Rare indoor plants arranged in ORIVIDA signature planters',
  },
  'gifting-solutions': {
    title: 'Plant Gift Hampers & Corporate Gifting Sets | ORIVIDA',
    description:
      'Bespoke plant hampers, handcrafted brass keepsakes and personalised planters, composed for birthdays, housewarmings and corporate gifting across India.',
    alt: 'A curated ORIVIDA plant gift hamper with brass accents',
  },
  'balcony-makeover': {
    title: 'Balcony Makeover — Planters, Vertical Gardens & Decor',
    description:
      'Railing planters, vertical greening systems, weatherproof furniture and warm lighting to turn a small balcony into a private garden. Delivered across India.',
    alt: 'A city balcony transformed with railing planters and warm lighting',
  },
  'arts-decor': {
    title: 'Bastar Bell Metal, Studio Pottery & Handcrafted Decor',
    description:
      'Authentic Bastar bell metal sculptures, hand-thrown studio pottery and brass-trimmed wall art, made by artisan families and shipped across India.',
    alt: 'Bastar bell metal sculpture and studio pottery on a wooden shelf',
  },
};

const SUBCATEGORIES = {
  'indoor-plants': ['Indoor Plants for Homes & Offices | Buy Online', 'Low-maintenance indoor plants chosen for Indian homes — pothos, monstera, ZZ and more, potted, hardened off and delivered ready to place.'],
  'succulents-cacti': ['Succulents & Cacti — Small, Hardy, Easy to Keep', 'Succulents and cacti that forgive a missed watering: rosettes, trailing strings and architectural forms, each in a pot that drains properly.'],
  'flowering-plants': ['Flowering Indoor Plants for Colour Year-Round', 'Flowering plants that bloom indoors in Indian light — chosen for repeat flowering rather than a single season of colour.'],
  'air-purifying-plants': ['Air-Purifying Plants for Bedrooms & Workspaces', 'Plants that earn their place in a closed room: areca, snake plant, peace lily and other reliable air-purifiers, sized for desks and corners.'],
  'rare-exotic-plants': ['Rare & Exotic Plants — Variegated and Collectible', 'Collector specimens raised slowly: variegated monstera, unusual philodendron and rare aroids, sold as single plants with their own history.'],
  'plant-gift-hampers': ['Plant Gift Hampers — Ready to Send | ORIVIDA', 'Gift hampers built around a living plant, finished with a handmade planter, care card and a note in your words. Delivered anywhere in India.'],
  'corporate-gifting': ['Corporate Plant Gifting — Bulk Orders & Branding', 'Desk plants and artisan keepsakes for employee welcome kits, client gifting and festive dispatch, with branding and bulk pricing available.'],
  'occasion-gifts': ['Occasion Gifts — Housewarming, Birthdays, Diwali', 'Gifts chosen for the moment: housewarming greenery, birthday planters and festive brass, packed to arrive presentable.'],
  'personalized-planters': ['Personalised Planters — Names, Dates & Messages', 'Planters engraved or hand-painted with a name, date or short message, paired with a plant that suits the recipient and their light.'],
  'railing-planters': ['Railing Planters for Balconies — Secure & Weatherproof', 'Planters that clamp to a balcony railing without drilling, built to hold through monsoon wind and drain away from the floor below.'],
  'vertical-gardens': ['Vertical Garden Systems for Small Balconies', 'Wall-mounted greening systems that add planting area without taking floor space, with irrigation and drainage designed in.'],
  'balcony-furniture-decor': ['Balcony Furniture & Decor — Weatherproof Pieces', 'Teak seating, side tables and outdoor decor finished to survive sun and rain, scaled for balconies rather than gardens.'],
  'lighting-accessories': ['Balcony Lighting & Garden Accessories', 'Warm outdoor lighting, planters stands, watering tools and the small accessories that make a balcony usable after dark.'],
  'bell-metal-arts': ['Bastar Bell Metal (Dhokra) Art & Sculptures', 'Dhokra bell metal cast by Bastar artisan families using the lost-wax method — figures, bells and lamps, each one slightly different.'],
  'pottery-ceramics': ['Studio Pottery & Ceramics — Hand-Thrown in India', 'Hand-thrown studio pottery and glazed ceramics: planters, vases and serveware, thrown one at a time rather than moulded.'],
  'handcrafted-planters': ['Handcrafted Planters — Ceramic, Brass & Terracotta', 'Planters made by hand in ceramic, brass and terracotta, with real drainage — chosen to suit the plant, not just the shelf.'],
  'wall-art-sculptures': ['Wall Art & Sculptures — Handmade Indian Decor', 'Hand-painted panels, carved wood and metal sculpture for walls that need something made rather than printed.'],
};

/** Care copy for plants that arrived from the import with no text at all. */
const PLANTS = {
  'String of Pumpkins': ['A trailing succulent hung with plump, ridged beads that catch the light like tiny gourds.', 'A trailing succulent whose stems carry plump, ridged beads the shape of tiny gourds. It wants bright indirect light and a pot that drains fast — water only once the soil has dried right through, and let the strands fall from a shelf or hanging planter where nothing will brush against them.'],
  "Gasteria batesiana 'White'": ['A slow, patient succulent with tongue-shaped leaves in rough silver-white speckling.', 'Tongue-shaped leaves in rough silver-white speckling, stacked in a slow fan. Gasteria is one of the few succulents genuinely content away from a window, which makes it a rare option for a darker room. Water sparingly, and never leave it standing in a saucer.'],
  'Agave Ismenthis Mediopicta': ['A compact agave with a cream stripe running the length of every leaf.', 'A dwarf agave with a clean cream stripe running the length of every blue-green leaf, ending in a dark tip. It stays small enough for a table, wants as much direct sun as you can give it, and asks for water perhaps once a fortnight in summer and almost none in winter.'],
  'Wandering Jew Pink': ['Trailing Tradescantia in pink, silver and deep purple — fast, forgiving and easy to propagate.', 'A trailing Tradescantia striped in pink, silver and deep purple. It grows quickly in bright indirect light — the more light, the stronger the pink — and any piece you pinch off will root in water within a week. Trim it back when it goes leggy and it returns fuller.'],
  'Sansaveria': ['The snake plant: upright, architectural and nearly impossible to kill.', 'The snake plant, with stiff upright leaves banded in green and silver. It tolerates low light, irregular watering and long absences, which is why it ends up in offices and stairwells. The only real way to harm it is to water it too often — let the soil dry completely first.'],
  'Donkey Tail': ['A heavy trailing sedum packed with plump blue-green beads.', 'Sedum morganianum, whose stems thicken into ropes of plump blue-green beads and can hang half a metre or more. Hang it somewhere it will not be knocked, as the beads detach easily — though each one that falls will root itself into a new plant. Bright light, rare watering.'],
  'String of Hearts': ['Fine trailing vines strung with marbled heart-shaped leaves.', 'Ceropegia woodii sends down fine purple vines strung with small marbled hearts. It is happiest in bright indirect light with a thorough soak once the soil is dry, and it will trail for metres given a high shelf. The tubers that form along the stems can be pressed into soil to start another plant.'],
  'String of Pearls': ['A cascade of round green beads on fine trailing stems.', 'A cascade of round green beads on fine stems, one of the most recognisable trailing succulents there is. It needs more light than most people give it and far less water — soak it, then leave it until the beads just begin to soften. Shallow, wide pots suit its shallow roots.'],
  'String of Drops': ['Tear-shaped beads on trailing stems, each with a translucent window.', 'Senecio herreianus, whose beads are tear-shaped rather than round, each carrying a translucent stripe that lets light reach the leaf interior. Treat it as you would String of Pearls: bright light, fast-draining soil, and water only once it has fully dried.'],
  'Zygo': ['The Christmas cactus — flat segmented stems that flower when the days shorten.', 'Schlumbergera, the Christmas cactus, with flat segmented stems that arch over the pot edge and flower as the days shorten. Unlike desert cacti it likes humidity and regular water in growth. Leave it undisturbed once buds appear — moving it is the usual reason buds drop.'],
  'String of Dolphins': ['Curved leaves that genuinely look like a pod of leaping dolphins.', 'A cross between String of Pearls and a candle plant, with curved leaves that really do read as leaping dolphins once the plant settles. It needs bright light to keep the shape — in dim light the leaves flatten out and the effect is lost. Water only when thoroughly dry.'],
  'Howorthia cymbiformis': ['A soft rosette of plump, translucent-tipped leaves.', 'Haworthia cymbiformis forms a soft rosette of plump leaves with translucent windows at the tips, which in the wild sit at soil level to catch light. It is small, slow and undemanding — bright indirect light, a gritty mix, and water only once dry.'],
  'Gasteria': ['Thick tongue-shaped leaves in a slow, low fan — content away from a window.', 'Thick tongue-shaped leaves stacked in a low fan, textured and often speckled. Gasteria handles lower light than almost any other succulent, which makes it useful for a desk or a room with one small window. Water sparingly and give it a gritty, free-draining mix.'],
  'Kalanchoe tomentosa (Panda Plant)': ['Silver leaves in dense felt, edged with chocolate-brown freckles.', 'The panda plant, whose silver leaves are covered in dense felt and edged with chocolate-brown freckles. The fur is worth keeping dry, so water at the soil rather than over the plant. Bright light keeps the edges dark and the growth compact.'],
  'Haworthiopsis faciata': ['The zebra plant — dark leaves banded in raised white pearls.', 'The zebra plant, with dark upright leaves banded in raised white pearls. It stays small, grows slowly and is one of the easiest succulents to keep alive on a desk. Bright indirect light, a gritty mix, and water only once the soil has dried through.'],
};


/**
 * Shorter SEO titles for indexed products whose own name would be truncated.
 * Keyed by id because several of these names are not unique on their own —
 * this block is specific to the imported catalogue.
 */
const SHORT_TITLES = {
  97: 'Plant Stand for 10 Plants — Indoor & Outdoor',
  285: 'Hand-Painted Wooden Jewellery Box, Single Door',
  287: 'Hand-Painted Wooden Decorative Cart',
  250: 'Hand-Painted Jharokha Mirror — Wall Art',
  111: 'Copper Ethnic Hanging Bells for Doorways',
  90: 'Premium Plant Stand for 10 Plants',
  290: 'Wooden Pooja Baithak for Home Temples',
  99: 'Hand-Painted Wooden Elephant Head Decor',
  174: 'Hand-Painted Wooden Wall Plates',
  284: 'Hand-Painted Wooden Horse Figurine',
  162: 'Indian Handmade Watercolour Landscape Art',
  280: 'Hand-Painted Wooden Ganpati Idol',
  272: 'Hand-Painted Wooden Planter',
  205: 'Award-Winning Handmade Terracotta Pot',
  206: 'Award-Winning Handmade Terracotta Pot (Large)',
  148: 'Hanging Metal Bells for Vastu & Positivity',
  152: 'Indian Handmade Watercolour Paintings',
};

/**
 * Indexed products that shared one generic description with their siblings.
 *
 * Unlike everything else here, these overwrite the existing value: the import
 * wrote the same boilerplate paragraph onto every sibling, so "already has a
 * description" is exactly the problem rather than a reason to leave it alone.
 * The replacement only happens while the text is still one of those shared
 * ones — edit it in the admin panel and this stops touching it.
 */
const DISTINCT_DESCRIPTIONS = {
  264: 'A single-well bamboo planter that hangs from a hook or beam, woven by hand and finished to survive a balcony.',
  265: 'A multi-layer hanging bamboo planter that stacks several pots in the vertical space one hook can hold.',
  266: 'A double-well bamboo planter that pairs two plants at one height, hand-woven and lightly sealed.',
  267: 'A single-plant bamboo planter, hand-woven, sized for a table or a shelf edge.',
  268: 'A three-layer hanging bamboo planter for growing upward where floor space has run out.',
  269: 'A two-layer hanging bamboo planter, hand-woven, for a pair of trailing plants at different heights.',
  270: 'A single-plant hanging bamboo planter, light enough for a railing hook or a curtain rod bracket.',
  271: 'A tabletop bamboo planter for one plant, hand-woven and flat-based so it sits without a stand.',
  90: 'A ten-tier metal plant stand that turns a corner or balcony wall into a vertical garden, for indoor or outdoor use.',
  97: 'A ten-plant garden organiser in powder-coated metal — collects a scattered plant collection into one column.',
  341: 'A seated Buddha statue for a home shrine, mantelpiece or entrance, cast with a weathered antique finish.',
  352: 'A 15-inch seated Buddha statue, large enough to anchor an entryway or a meditation corner.',
  152: 'Original watercolour paintings by Indian artists, sold unframed so you can match the frame to your wall.',
  162: 'Original Indian watercolour landscapes, each painted by hand and sold unframed.',
  278: 'A hand-painted wooden candle stand carved as a pair of elephants — a warm, low light for a mantel or table.',
  279: 'A hand-painted wooden candle stand carved as a camel, in the folk style of Rajasthan.',
  281: 'A hand-painted wooden candle stand, carved and finished by hand in traditional folk colours.',
  15: 'Classic blue pottery in the Jaipur tradition — hand-thrown, glazed in cobalt and fired to a soft sheen.',
  17: 'A blue pottery bottle vase for single stems, hand-thrown and glazed in the Jaipur cobalt tradition.',
  16: 'Blue pottery with a hand-painted floral design, made in the Jaipur tradition of quartz-based ceramic.',
  199: 'A handmade terracotta pot, wheel-thrown and unglazed so the clay breathes with the plant.',
  205: 'A national-award-winning handmade terracotta pot, thrown and finished by a master potter.',
  198: 'A 27-inch handmade terracotta pot for a floor-standing plant or a small tree.',
  206: 'A national-award-winning terracotta pot in a larger size, wheel-thrown and unglazed.',
  354: 'A bucket-form indoor water fountain — moving water and a soft sound for an entrance or living room.',
  353: 'An indoor water fountain for a hallway or living room, cast and finished by hand.',
};

/** The planter family names its own shape, so each description is derived. */
const PLANTER_PREFIX = 'Handcrafted Plants Planter: ';

const run = async () => {
  console.log('\nSeeding SEO content (blank fields only)\n');

  // --- Global settings ---------------------------------------------------
  // These values already act as the defaults in the client bundle; writing
  // them makes the admin screen show real, editable content and lets the
  // dashboard report what is actually configured. Google fields stay blank.
  const existing = await query("SELECT content FROM site_content WHERE key = 'seo_settings'");
  const current = existing.rows[0]?.content || {};
  const defaults = {
    siteName: 'ORIVIDA',
    titleTemplate: '%title% | %siteName%',
    metaTitle: 'ORIVIDA — Our Passion, UR Luxury | Premium Plants, Gifting & Décor',
    metaDescription:
      'ORIVIDA offers handcrafted botanical luxury, rare indoor plants, bespoke plant hampers, balcony makeovers, and authentic bell metal & ceramic decor — delivered across India.',
    defaultRobots: 'index, follow',
    twitterCardType: 'summary_large_image',
    organizationName: 'ORIVIDA',
    organizationLogo: '/logo.png',
    organizationDescription:
      'Hand-nurtured rare botanicals, bespoke plant hampers and heritage Bastar bell metal craft, delivered across India.',
    organizationPhone: '+91 70957 56434',
    organizationEmail: 'support@orvida.com',
    organizationAddress: '3-4-610/1, Narayanguda, Hyderabad, Telangana 500029, India',
  };
  const merged = { ...defaults, ...current };
  await query(
    `INSERT INTO site_content (key, content) VALUES ('seo_settings', $1)
     ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(merged)]
  );
  console.log(`  global settings   → ${Object.keys(merged).length} keys saved`);

  // --- Categories --------------------------------------------------------
  let n = 0;
  for (const [slug, c] of Object.entries(CATEGORIES)) {
    const res = await query(
      `UPDATE categories
          SET seo_title = COALESCE(NULLIF(seo_title,''), $2),
              seo_description = COALESCE(NULLIF(seo_description,''), $3),
              image_alt_text = COALESCE(NULLIF(image_alt_text,''), $4)
        WHERE slug = $1
          AND (seo_title IS NULL OR seo_title = ''
            OR seo_description IS NULL OR seo_description = ''
            OR image_alt_text IS NULL OR image_alt_text = '')
        RETURNING id`,
      [slug, c.title, c.description, c.alt]
    );
    n += res.rowCount;
  }
  console.log(`  categories        → ${n} updated`);

  // --- Subcategories -----------------------------------------------------
  n = 0;
  for (const [slug, [title, description]] of Object.entries(SUBCATEGORIES)) {
    const res = await query(
      `UPDATE subcategories
          SET seo_title = COALESCE(NULLIF(seo_title,''), $2),
              seo_description = COALESCE(NULLIF(seo_description,''), $3),
              image_alt_text = COALESCE(NULLIF(image_alt_text,''), $4)
        WHERE slug = $1
          AND (seo_title IS NULL OR seo_title = ''
            OR seo_description IS NULL OR seo_description = ''
            OR image_alt_text IS NULL OR image_alt_text = '')
        RETURNING id`,
      [slug, title, description, `${title.split(/[—|]/)[0].trim()} at ORIVIDA`]
    );
    n += res.rowCount;
  }
  console.log(`  subcategories     → ${n} updated`);

  // --- Products that arrived with no copy at all -------------------------
  n = 0;
  for (const [name, [short, long]] of Object.entries(PLANTS)) {
    const res = await query(
      `UPDATE products
          SET short_description = COALESCE(NULLIF(short_description,''), $2),
              description = COALESCE(NULLIF(description,''), $3),
              image_alt_text = COALESCE(NULLIF(image_alt_text,''), $4)
        WHERE name = $1
          AND (short_description IS NULL OR short_description = ''
            OR description IS NULL OR description = ''
            OR image_alt_text IS NULL OR image_alt_text = '')
        RETURNING id`,
      [name, short, long, `${name} in an ORIVIDA planter`]
    );
    n += res.rowCount;
  }
  console.log(`  products          → ${n} updated`);

  // --- Shorter titles for names Google would truncate --------------------
  n = 0;
  for (const [id, title] of Object.entries(SHORT_TITLES)) {
    const res = await query(
      `UPDATE products SET seo_title = $2
        WHERE id = $1 AND (seo_title IS NULL OR seo_title = '') RETURNING id`,
      [Number(id), title]
    );
    n += res.rowCount;
  }
  console.log(`  short titles      → ${n} updated`);

  // --- Distinct descriptions where siblings shared one -------------------
  n = 0;
  for (const [id, description] of Object.entries(DISTINCT_DESCRIPTIONS)) {
    const res = await query(
      `UPDATE products p SET seo_description = $2
        WHERE p.id = $1
          AND p.seo_description IS DISTINCT FROM $2
          -- only while the current text is still shared with a sibling
          AND EXISTS (
            SELECT 1 FROM products q
             WHERE q.id <> p.id
               AND COALESCE(NULLIF(q.seo_description,''), NULLIF(q.short_description,''), NULLIF(q.description,''))
                 = COALESCE(NULLIF(p.seo_description,''), NULLIF(p.short_description,''), NULLIF(p.description,''))
          )
        RETURNING p.id`,
      [Number(id), description]
    );
    n += res.rowCount;
  }

  // The planter family states its own shape in the name, so each description
  // is derived rather than written out fifteen times.
  const planters = await query(
    `SELECT p.id, p.name FROM products p
      WHERE p.name LIKE $1 || '%'
        AND EXISTS (
          SELECT 1 FROM products q
           WHERE q.id <> p.id
             AND COALESCE(NULLIF(q.seo_description,''), NULLIF(q.short_description,''), NULLIF(q.description,''))
               = COALESCE(NULLIF(p.seo_description,''), NULLIF(p.short_description,''), NULLIF(p.description,''))
        )`,
    [PLANTER_PREFIX]
  );
  for (const row of planters.rows) {
    const shape = row.name.slice(PLANTER_PREFIX.length).trim();
    const res = await query('UPDATE products SET seo_description = $2 WHERE id = $1 RETURNING id', [
      row.id,
      `A handcrafted ${shape.toLowerCase()} — thrown and finished by hand, with drainage that actually works. Part of the ORIVIDA planter collection.`,
    ]);
    n += res.rowCount;
  }
  console.log(`  descriptions      → ${n} made distinct`);

  console.log('\nDone. Review and refine in the admin panel.\n');
  await pool.end();
};

run().catch(async (error) => {
  console.error('Failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
