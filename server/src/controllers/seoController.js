import { query } from '../config/db.js';

const SITE = (process.env.SITE_URL || 'https://orvida.in').replace(/\/+$/, '');

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

/**
 * GET /sitemap.xml — generated from the live catalogue, so new products and
 * collections are discoverable without anyone maintaining a static file.
 * Private routes (cart, checkout, account) are deliberately absent.
 */
export const getSitemap = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      query('SELECT slug, updated_at FROM products ORDER BY updated_at DESC'),
      query(`SELECT c.slug,
                    (SELECT json_agg(sc.slug) FROM subcategories sc WHERE sc.category_id = c.id) AS subs
               FROM categories c ORDER BY c.id`),
    ]);

    const entries = [
      urlEntry({ loc: `${SITE}/`, changefreq: 'daily', priority: '1.0' }),
      urlEntry({ loc: `${SITE}/about`, changefreq: 'monthly', priority: '0.6' }),
      urlEntry({ loc: `${SITE}/gifting-concierge`, changefreq: 'monthly', priority: '0.7' }),
    ];

    for (const cat of categories.rows) {
      entries.push(
        urlEntry({ loc: `${SITE}/category/${cat.slug}`, changefreq: 'weekly', priority: '0.9' })
      );
      for (const sub of cat.subs || []) {
        entries.push(
          urlEntry({ loc: `${SITE}/category/${cat.slug}/${sub}`, changefreq: 'weekly', priority: '0.8' })
        );
      }
    }

    for (const product of products.rows) {
      entries.push(
        urlEntry({ loc: `${SITE}/product/${product.slug}`, lastmod: product.updated_at, changefreq: 'weekly', priority: '0.8' })
      );
    }

    for (const slug of ['privacy-policy', 'terms-and-conditions', 'shipping-policy', 'refund-policy']) {
      entries.push(urlEntry({ loc: `${SITE}/policies/${slug}`, changefreq: 'yearly', priority: '0.3' }));
    }

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
    );
  } catch (error) {
    next(error);
  }
};

/** GET /robots.txt */
export const getRobots = (req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /checkout',
      'Disallow: /cart',
      'Disallow: /account',
      'Disallow: /wishlist',
      'Disallow: /orders',
      'Disallow: /login',
      'Disallow: /signup',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      'Disallow: /api/',
      '',
      `Sitemap: ${SITE}/sitemap.xml`,
      '',
    ].join('\n')
  );
};
