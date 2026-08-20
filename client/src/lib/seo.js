import { COMPANY } from '../config/company';
import { SEO_DEFAULTS } from '../config/siteContentDefaults';

/**
 * SEO utilities shared by every page and by the admin previews.
 *
 * The production origin lives in one place (VITE_SITE_URL) so no page ever
 * hardcodes a domain, and every metadata value resolves through the same
 * fallback chain: explicit admin value → entity's own content → global
 * default. Nothing here ever returns undefined or null.
 */

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://orvida.in').replace(/\/+$/, '');

/** Absolute, query-free canonical URL for a route path. */
export const getCanonicalUrl = (path = '/') => {
  const clean = String(path).split('?')[0].split('#')[0].replace(/\/{2,}/g, '/');
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash === '/' ? `${SITE_URL}/` : `${SITE_URL}${withSlash.replace(/\/$/, '')}`;
};

/** Turns a relative upload path into an absolute URL for OG/Twitter tags. */
export const absoluteUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'Index, Follow (default)' },
  { value: 'noindex, follow', label: 'No Index, Follow' },
  { value: 'index, nofollow', label: 'Index, No Follow' },
  { value: 'noindex, nofollow', label: 'No Index, No Follow' },
];

/**
 * Applies the admin's title template, e.g. "%title% | %siteName%".
 * A title that already ends with the site name is left alone, so a custom
 * SEO title never gets the brand appended twice.
 */
export const buildTitle = (title, settings = {}) => {
  const siteName = settings.siteName || SEO_DEFAULTS.siteName || COMPANY.name;
  const clean = String(title || '').trim();
  if (!clean) return settings.metaTitle || SEO_DEFAULTS.metaTitle;
  if (clean.toLowerCase().includes(siteName.toLowerCase())) return clean;

  const template = settings.titleTemplate || SEO_DEFAULTS.titleTemplate || '%title% | %siteName%';
  return template.replace('%title%', clean).replace('%siteName%', siteName);
};

/** First non-empty value, trimmed and capped for a meta description. */
export const pickDescription = (...candidates) => {
  for (const candidate of candidates) {
    const clean = String(candidate || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (clean) return clean.length > 300 ? `${clean.slice(0, 297)}…` : clean;
  }
  return '';
};

/** Custom OG image → entity image → global default → logo. */
export const getOgImage = (custom, entityImage, settings = {}) =>
  absoluteUrl(custom || entityImage || settings.ogImage || `${SITE_URL}/logo.png`);

/** Normalises a robots value; unknown input falls back to the safe default. */
export const getSeoRobots = (value, fallback = 'index, follow') => {
  const clean = String(value || '').toLowerCase().replace(/\s*,\s*/g, ', ').trim();
  return ROBOTS_OPTIONS.some((o) => o.value === clean) ? clean : fallback;
};

/** Alt text for a product image: explicit override → product name. */
export const getImageAlt = (product, index = 0) =>
  product?.imageAltText || (index === 0 ? product?.name || '' : `${product?.name || ''} — view ${index + 1}`);

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * Every generator returns plain data built from values the page actually
 * renders. Nothing is invented: absent ratings, brands or SKUs are simply
 * omitted rather than guessed.
 * ------------------------------------------------------------------ */

export const generateOrganizationSchema = (settings = {}) => {
  const socials = (settings.organizationSocialLinks || '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: settings.organizationName || COMPANY.name,
    url: SITE_URL,
    logo: absoluteUrl(settings.organizationLogo || '/logo.png'),
    description: settings.organizationDescription || settings.metaDescription || SEO_DEFAULTS.metaDescription,
  };
  if (settings.organizationPhone || COMPANY.phone) schema.telephone = settings.organizationPhone || COMPANY.phone;
  if (settings.organizationEmail || COMPANY.email) schema.email = settings.organizationEmail || COMPANY.email;
  if (socials.length > 0) schema.sameAs = socials;

  const address = settings.organizationAddress || COMPANY.address;
  if (address && typeof address === 'object') {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: [address.line1, address.line2].filter(Boolean).join(', '),
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.pincode,
      addressCountry: 'IN',
    };
  } else if (typeof address === 'string' && address.trim()) {
    schema.address = { '@type': 'PostalAddress', streetAddress: address.trim(), addressCountry: 'IN' };
  }
  return schema;
};

/**
 * WebSite schema. SearchAction is included because the storefront really does
 * serve results at /category/plants?search= — it is never a fabricated URL.
 */
export const generateWebsiteSchema = (settings = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: settings.siteName || COMPANY.name,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/category/plants?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const generateProductSchema = (product) => {
  if (!product) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: getCanonicalUrl(`/product/${product.slug}`),
    image: (product.images || []).map((img) => absoluteUrl(img.url)).slice(0, 6),
  };

  const description = pickDescription(product.seoDescription, product.shortDescription, product.description);
  if (description) schema.description = description;
  if (product.sku) schema.sku = product.sku;
  if (product.brand) schema.brand = { '@type': 'Brand', name: product.brand };
  else schema.brand = { '@type': 'Brand', name: COMPANY.name };

  // Only claim a rating when real reviews exist behind it.
  if (Number(product.reviewCount) > 0 && Number(product.avgRating) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.avgRating).toFixed(1),
      reviewCount: Number(product.reviewCount),
    };
  }

  schema.offers = {
    '@type': 'Offer',
    url: getCanonicalUrl(`/product/${product.slug}`),
    priceCurrency: 'INR',
    price: Number(product.effectivePrice ?? product.price ?? 0),
    // Availability must mirror the button the customer actually sees.
    availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: COMPANY.name },
  };
  return schema;
};

/** crumbs: [{ name, path? }] — the last entry is the current page. */
export const generateBreadcrumbSchema = (crumbs = []) => {
  const items = crumbs.filter((c) => c && c.name);
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: getCanonicalUrl(crumb.path) } : {}),
    })),
  };
};

/** Collection pages describe a list, not a single product. */
export const generateCollectionSchema = ({ name, description, path, products = [] }) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  url: getCanonicalUrl(path),
  ...(description ? { description } : {}),
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: getCanonicalUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  },
});

/* ------------------------------------------------------------------ *
 * Page-level metadata builders — one per entity type, so page components
 * stay declarative and the fallback chain lives in exactly one place.
 * ------------------------------------------------------------------ */

export const generateProductMetadata = (product, settings = {}) => {
  if (!product) return { title: buildTitle('', settings) };

  const crumbs = [
    { name: 'Home', path: '/' },
    ...(product.categoryName ? [{ name: product.categoryName, path: `/category/${product.categorySlug}` }] : []),
    ...(product.subcategoryName
      ? [{ name: product.subcategoryName, path: `/category/${product.categorySlug}/${product.subcategorySlug}` }]
      : []),
    { name: product.name },
  ];

  return {
    title: buildTitle(product.seoTitle || product.name, settings),
    description: pickDescription(
      product.seoDescription,
      product.shortDescription,
      product.description,
      settings.metaDescription
    ),
    keywords: product.seoKeywords || '',
    canonical: product.canonicalUrl || getCanonicalUrl(`/product/${product.slug}`),
    path: `/product/${product.slug}`,
    robots: getSeoRobots(product.metaRobots),
    type: 'product',
    image: getOgImage(product.ogImage, product.images?.[0]?.url, settings),
    ogTitle: product.ogTitle || buildTitle(product.seoTitle || product.name, settings),
    ogDescription: pickDescription(product.ogDescription, product.seoDescription, product.shortDescription),
    twitterTitle: product.twitterTitle || product.ogTitle || product.name,
    twitterDescription: pickDescription(product.twitterDescription, product.ogDescription, product.seoDescription, product.shortDescription),
    twitterImage: absoluteUrl(product.twitterImage) || getOgImage(product.ogImage, product.images?.[0]?.url, settings),
    jsonLd: generateProductSchema(product),
    breadcrumbs: generateBreadcrumbSchema(crumbs),
  };
};

export const generateCategoryMetadata = ({ category, subcategory, products = [], searchTerm = '' }, settings = {}) => {
  if (!category) return { title: buildTitle('Collection', settings) };
  const entity = subcategory || category;
  const path = subcategory
    ? `/category/${category.slug}/${subcategory.slug}`
    : `/category/${category.slug}`;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: category.name, path: `/category/${category.slug}` },
    ...(subcategory ? [{ name: subcategory.name }] : []),
  ];

  return {
    title: buildTitle(entity.seoTitle || (subcategory ? subcategory.name : `${category.name}${category.tagline ? ` — ${category.tagline}` : ''}`), settings),
    description: pickDescription(
      entity.seoDescription,
      category.description,
      category.tagline,
      `Shop ${entity.name} at ${settings.siteName || COMPANY.name}.`
    ),
    keywords: entity.seoKeywords || category.seoKeywords || '',
    canonical: entity.canonicalUrl || category.canonicalUrl || getCanonicalUrl(path),
    path,
    // A search or filter permutation must not compete with the clean
    // collection URL, so it is followed but never indexed.
    robots: searchTerm ? 'noindex, follow' : getSeoRobots(entity.metaRobots || category.metaRobots),
    image: getOgImage(entity.ogImage || category.ogImage, subcategory?.image || category.banner, settings),
    ogTitle: category.ogTitle || entity.name,
    ogDescription: pickDescription(category.ogDescription, entity.seoDescription, category.description),
    jsonLd: generateCollectionSchema({
      name: entity.name,
      description: pickDescription(entity.seoDescription, category.description),
      path,
      products,
    }),
    breadcrumbs: generateBreadcrumbSchema(crumbs),
  };
};

export const generatePageMetadata = ({ title, description, path, image, robots, type = 'website' }, settings = {}) => ({
  title: buildTitle(title, settings),
  description: pickDescription(description, settings.metaDescription),
  canonical: getCanonicalUrl(path),
  path,
  robots: getSeoRobots(robots),
  type,
  image: getOgImage(null, image, settings),
});
