/**
 * SEO completeness score for a landing page.
 *
 * This measures whether a page has the metadata search engines expect — it is
 * a checklist, not a ranking prediction. A page can score 100 and still not
 * rank; the score only says nothing obvious is missing.
 *
 * Used both live in the editor and to colour the admin list, so the number an
 * admin sees while typing is the same one stored decisions are judged by.
 */

const has = (value) => Boolean(String(value ?? '').trim());
const wordsOf = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;

/** Whole-phrase, case-insensitive — "plants" must not match "transplants". */
const containsKeyword = (haystack, keyword) => {
  if (!has(haystack) || !has(keyword)) return false;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
};

export const RECOMMENDED = {
  titleMin: 50,
  titleMax: 60,
  descriptionMin: 150,
  descriptionMax: 160,
  contentMinWords: 300,
};

/**
 * @param {object} page  The editor's form state (camelCase)
 * @returns {{ score: number, band: string, checks: Array, warnings: Array }}
 */
export function calculateSeoScore(page = {}) {
  const title = page.seoTitle || '';
  const description = page.metaDescription || '';
  const keyword = page.focusKeyword || '';
  const contentWords = wordsOf(page.content) + wordsOf(page.intro);
  const links = Array.isArray(page.internalLinks) ? page.internalLinks.filter((l) => l?.url) : [];
  const faqs = Array.isArray(page.faqs) ? page.faqs.filter((f) => f?.question) : [];

  // weight reflects how much each item actually matters for a landing page.
  const checks = [
    { key: 'title', label: 'SEO title', weight: 3, pass: has(title) },
    {
      key: 'titleLength',
      label: `Title length (${RECOMMENDED.titleMin}–${RECOMMENDED.titleMax})`,
      weight: 2,
      pass: title.length >= RECOMMENDED.titleMin && title.length <= RECOMMENDED.titleMax,
      hint: has(title)
        ? title.length < RECOMMENDED.titleMin
          ? `${title.length} characters — a little short`
          : title.length > RECOMMENDED.titleMax
            ? `${title.length} characters — Google may truncate it`
            : ''
        : '',
    },
    { key: 'description', label: 'Meta description', weight: 3, pass: has(description) },
    {
      key: 'descriptionLength',
      label: `Description length (${RECOMMENDED.descriptionMin}–${RECOMMENDED.descriptionMax})`,
      weight: 2,
      pass:
        description.length >= RECOMMENDED.descriptionMin &&
        description.length <= RECOMMENDED.descriptionMax,
      hint: has(description)
        ? description.length < RECOMMENDED.descriptionMin
          ? `${description.length} characters — room for more`
          : description.length > RECOMMENDED.descriptionMax
            ? `${description.length} characters — likely truncated`
            : ''
        : '',
    },
    { key: 'keyword', label: 'Focus keyword', weight: 2, pass: has(keyword) },
    {
      key: 'keywordInTitle',
      label: 'Focus keyword appears in the title',
      weight: 2,
      pass: containsKeyword(title, keyword),
    },
    {
      key: 'keywordInH1',
      label: 'Focus keyword appears in the H1',
      weight: 1,
      pass: containsKeyword(page.h1, keyword),
    },
    { key: 'h1', label: 'H1 heading', weight: 3, pass: has(page.h1) },
    {
      key: 'content',
      label: `Content (${RECOMMENDED.contentMinWords}+ words)`,
      weight: 3,
      pass: contentWords >= RECOMMENDED.contentMinWords,
      hint: contentWords > 0 ? `${contentWords} words` : '',
    },
    { key: 'image', label: 'Featured image', weight: 2, pass: has(page.featuredImage) },
    {
      key: 'imageAlt',
      label: 'Image alt text',
      weight: 2,
      // Only meaningful once there is an image to describe.
      pass: has(page.featuredImage) ? has(page.imageAltText) : true,
    },
    { key: 'internalLinks', label: 'Internal links', weight: 2, pass: links.length > 0 },
    { key: 'sitemap', label: 'Included in sitemap', weight: 1, pass: page.includeInSitemap !== false },
    { key: 'indexable', label: 'Set to index', weight: 1, pass: page.robotsIndex !== false },
    {
      key: 'schema',
      label: 'Structured data',
      weight: 1,
      // FAQPage claims FAQ rich results, so it must actually have questions.
      pass: page.schemaType === 'FAQPage' ? faqs.length > 0 : has(page.schemaType),
    },
  ];

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);

  const band =
    score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 35 ? 'Needs improvement' : 'Missing SEO data';

  // Quality warnings that are advisory — they never block publishing.
  const warnings = [];
  if (page.status === 'published' && (!has(title) || !has(description))) {
    warnings.push('This page is published without a title or description.');
  }
  if (page.robotsIndex === false) {
    warnings.push('Set to “no index” — search engines will not list this page.');
  }
  if (contentWords > 0 && contentWords < 150) {
    warnings.push('Very little content — thin pages rarely rank.');
  }
  if (page.schemaType === 'FAQPage' && faqs.length === 0) {
    warnings.push('Schema is FAQPage but no questions have been added.');
  }
  if (page.status === 'scheduled' && !page.scheduledAt) {
    warnings.push('Scheduled, but no publishing date has been set.');
  }

  return { score, band, checks, warnings };
}

export const scoreBandTone = (score) =>
  score >= 85
    ? 'text-emerald-default'
    : score >= 65
      ? 'text-emerald-deep'
      : score >= 35
        ? 'text-amber-600'
        : 'text-rose-600';

/** Maps an API row (snake_case) onto the shape the calculator expects. */
export const scoreFromRow = (row = {}) =>
  calculateSeoScore({
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    h1: row.h1,
    intro: row.intro,
    content: row.content,
    featuredImage: row.featured_image,
    imageAltText: row.image_alt_text,
    internalLinks: row.internal_links,
    faqs: row.faqs,
    includeInSitemap: row.include_in_sitemap,
    robotsIndex: row.robots_index,
    schemaType: row.schema_type,
    status: row.status,
    scheduledAt: row.scheduled_at,
  });
