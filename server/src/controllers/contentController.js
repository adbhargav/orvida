import { query } from '../config/db.js';

const KEY_PATTERN = /^[a-z0-9_-]{1,80}$/;

/**
 * GET /api/content            → every block
 * GET /api/content?keys=a,b   → just those blocks
 *
 * Public read: these blocks are the storefront's own copy. Responds with a
 * map of key → content so pages can merge over their built-in defaults.
 */
export const getContent = async (req, res, next) => {
  try {
    const keysParam = String(req.query.keys || '').trim();
    let rows;
    if (keysParam) {
      const keys = keysParam.split(',').map((k) => k.trim()).filter((k) => KEY_PATTERN.test(k));
      if (keys.length === 0) return res.json({ success: true, content: {} });
      rows = (await query('SELECT key, content FROM site_content WHERE key = ANY($1)', [keys])).rows;
    } else {
      rows = (await query('SELECT key, content FROM site_content')).rows;
    }

    const content = {};
    for (const row of rows) content[row.key] = row.content;
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/content/:key — admin upsert of one block. */
export const upsertContent = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!KEY_PATTERN.test(key)) {
      return res.status(400).json({ success: false, message: 'Invalid content key.' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'Content must be an object.' });
    }

    const result = await query(
      `INSERT INTO site_content (key, content)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
       RETURNING key, content`,
      [key, JSON.stringify(content)]
    );

    res.json({ success: true, key: result.rows[0].key, content: result.rows[0].content });
  } catch (error) {
    next(error);
  }
};
