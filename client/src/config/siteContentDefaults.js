/**
 * Built-in copy for the editable site-content blocks.
 *
 * The storefront renders these defaults until an admin saves a block in
 * Admin → Site Content; saved values are merged over them, so a block only
 * half-filled in the admin panel still renders completely.
 */

export const SEO_DEFAULTS = {
  // General
  siteName: 'ORIVIDA',
  titleTemplate: '%title% | %siteName%',
  metaTitle: 'ORIVIDA — Our Passion, UR Luxury | Premium Plants, Gifting & Décor',
  metaDescription:
    'ORIVIDA offers handcrafted botanical luxury, rare indoor plants, bespoke plant hampers, balcony makeovers, and authentic bell metal & ceramic decor — delivered across India.',
  metaKeywords: '',
  defaultRobots: 'index, follow',

  // Social sharing
  ogImage: '',
  twitterImage: '',
  twitterCardType: 'summary_large_image',

  // Organization (feeds Organization/OnlineStore structured data)
  organizationName: 'ORIVIDA',
  organizationLogo: '/logo.png',
  organizationDescription:
    'Hand-nurtured rare botanicals, bespoke plant hampers and heritage Bastar bell metal craft, delivered across India.',
  organizationPhone: '+91 70957 56434',
  organizationEmail: 'support@orvida.com',
  organizationAddress: '3-4-610/1, Narayanguda, Hyderabad, Telangana 500029, India',
  organizationSocialLinks: '',

  // Google integrations — blank means "not configured", nothing is injected.
  googleSiteVerification: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
};

export const ANNOUNCEMENTS_DEFAULTS = {
  messages: [
    'Complimentary shipping on orders above ₹1,999',
    'Any 4 plants at ₹999 — limited botanical offer',
    '7-day plant health guarantee on every specimen',
  ],
};

export const HOME_BRAND_STORY_DEFAULTS = {
  eyebrow: 'Ancestral craft, botanical mastery',
  heading: 'Where botanical passion meets',
  headingAccent: 'uncompromising luxury',
  paragraph1:
    'At ORIVIDA we believe true luxury is organic, enduring and deeply connected to nature. Our botanists hand-nurture every variegated Monstera and Sansevieria for more than eighteen months in organic soil blends before it reaches your home.',
  paragraph2:
    "Our arts collection honours Chhattisgarh's four-thousand-year-old Bastar bell metal tradition and Jaipur's ceramic artists — planters and sculptures made to be inherited.",
  buttonText: 'Read our story',
  image: '',
};

export const ABOUT_PAGE_DEFAULTS = {
  heroEyebrow: 'Our story',
  heroTitle: 'Our passion,',
  heroAccent: 'ur luxury',
  heroIntro:
    'ORIVIDA exists for people who treat living things as heirlooms — rare botanicals raised slowly, and craft made by hands that learned it from the generation before.',
  heroImage: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=2000&q=80',
  pillars: [
    {
      title: 'Eighteen months of care',
      copy: 'Every variegated specimen is nurtured in our temperature-controlled Coorg nursery until its fenestrations mature and its aerial root architecture is established.',
    },
    {
      title: 'Four thousand years of craft',
      copy: 'Our arts collection is cast by Bastar bell metal families in Chhattisgarh using the lost-wax Dhokra method, and thrown by ceramic artists in Jaipur.',
    },
    {
      title: 'Delivered as living things',
      copy: 'White-glove, temperature-controlled transport with a seven-day health guarantee. If a plant does not settle, we replace it.',
    },
  ],
  craftEyebrow: 'The Bastar workshops',
  craftHeading: 'Craft that predates the wheel it is cast on',
  craftParagraph1:
    'Dhokra casting has been practised in central India for roughly four thousand years. A beeswax model is sheathed in clay, fired until the wax runs out, and the void filled with molten bell metal. The mould is broken to release the piece, so no two are ever identical.',
  craftParagraph2:
    'We commission directly from the families who hold this knowledge, and every piece ships with a signed lineage certificate naming the artisan who made it.',
  craftImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
  milestones: [
    { value: '15,000+', label: 'Botanicals hand-nurtured' },
    { value: '120+', label: 'Artisan families supported' },
    { value: '18 mo', label: 'Average nursery maturation' },
  ],
  ctaTitle: 'Begin your collection',
  ctaSubtitle: 'Rare specimens, artisan planters and heritage craft — curated and delivered with care.',
};

/** Deep-ish merge: saved scalars win, arrays win wholesale when present. */
export const mergeContent = (defaults, saved) => {
  if (!saved || typeof saved !== 'object') return defaults;
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[key] = value;
  }
  return merged;
};
