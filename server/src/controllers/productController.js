import { query, pool } from '../config/db.js';
import { collectSeoFields, uniqueSlug, recordSlugRedirect } from '../services/seoService.js';

export const getProducts = async (req, res, next) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, isFeatured, isBestseller, sortBy, ids, limit = 50, page = 1 } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, 
             sc.name as subcategory_name, sc.slug as subcategory_slug,
             (SELECT json_agg(json_build_object('id', img.id, 'url', img.url)) FROM product_images img WHERE img.product_id = p.id) as images,
             (SELECT json_agg(json_build_object('id', v.id, 'type', v.type, 'value', v.value, 'priceDelta', v.price_delta, 'stock', v.stock)) FROM product_variants v WHERE v.product_id = p.id) as variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    // An explicit id list — used by the wishlist, which needs exactly the
    // products a visitor saved rather than a page of the catalogue to filter
    // through.
    if (ids !== undefined) {
      const wanted = String(ids)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter(Number.isInteger)
        .slice(0, 200);
      if (wanted.length === 0) {
        return res.json({ success: true, count: 0, products: [] });
      }
      params.push(wanted);
      sql += ` AND p.id = ANY($${params.length}::int[])`;
    }

    if (category) {
      params.push(category);
      sql += ` AND c.slug = $${params.length}`;
    }

    if (subcategory) {
      params.push(subcategory);
      sql += ` AND sc.slug = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR $${params.length} = ANY(p.tags))`;
    }

    if (minPrice) {
      params.push(minPrice);
      sql += ` AND p.price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(maxPrice);
      sql += ` AND p.price <= $${params.length}`;
    }

    if (isFeatured === 'true') {
      sql += ` AND p.is_featured = TRUE`;
    }

    if (isBestseller === 'true') {
      sql += ` AND p.is_bestseller = TRUE`;
    }

    // Sorting logic
    if (sortBy === 'price_asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (sortBy === 'price_desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (sortBy === 'rating') {
      sql += ` ORDER BY p.avg_rating DESC`;
    } else {
      sql += ` ORDER BY p.created_at DESC`;
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      page: parseInt(page, 10),
      products: result.rows.map(row => ({
        ...row,
        images: row.images || [],
        variants: row.variants || []
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const isNumeric = !isNaN(identifier);
    const whereClause = isNumeric ? 'p.id = $1' : 'p.slug = $1';

    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, 
             sc.name as subcategory_name, sc.slug as subcategory_slug,
             (SELECT json_agg(json_build_object('id', img.id, 'url', img.url)) FROM product_images img WHERE img.product_id = p.id) as images,
             (SELECT json_agg(json_build_object('id', v.id, 'type', v.type, 'value', v.value, 'priceDelta', v.price_delta, 'stock', v.stock)) FROM product_variants v WHERE v.product_id = p.id) as variants,
             (SELECT json_agg(json_build_object('id', r.id, 'userName', r.user_name, 'rating', r.rating, 'title', r.title, 'comment', r.comment, 'verifiedPurchase', r.verified_purchase, 'createdAt', r.created_at)) FROM reviews r WHERE r.product_id = p.id) as reviews
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE ${whereClause}
    `;

    const result = await query(sql, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = result.rows[0];
    res.json({
      success: true,
      product: {
        ...product,
        images: product.images || [],
        variants: product.variants || [],
        reviews: product.reviews || []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      name, slug, categoryId, subcategoryId, price, discountPrice, sku, stock,
      tags, isFeatured, isNew, isBestseller, shortDescription, description,
      careInstructions, craftsmanshipStory, images, variants,
      shippingWeightKg, packageLengthCm, packageWidthCm, packageHeightCm
    } = req.body;

    // Slugs are the product's public URL, so uniqueness is enforced rather
    // than left to a database error.
    const generatedSlug = await uniqueSlug(client, 'products', slug || name);
    const seo = collectSeoFields(req.body);

    const prodRes = await client.query(
      `INSERT INTO products (name, slug, category_id, subcategory_id, price, discount_price, sku, stock, tags, is_featured, is_new, is_bestseller, short_description, description, care_instructions, craftsmanship_story, shipping_weight_kg, package_length_cm, package_width_cm, package_height_cm,
                             seo_title, seo_description, seo_keywords, canonical_url, meta_robots, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, image_alt_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
               $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
       RETURNING *`,
      [name, generatedSlug, categoryId, subcategoryId, price, discountPrice, sku, stock || 10, tags || [], isFeatured || false, isNew || false, isBestseller || false, shortDescription, description, careInstructions, craftsmanshipStory, shippingWeightKg ?? null, packageLengthCm ?? null, packageWidthCm ?? null, packageHeightCm ?? null,
       seo.seoTitle, seo.seoDescription, seo.seoKeywords, seo.canonicalUrl, seo.metaRobots, seo.ogTitle, seo.ogDescription, seo.ogImage, seo.twitterTitle, seo.twitterDescription, seo.twitterImage, seo.imageAltText]
    );

    const newProduct = prodRes.rows[0];

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = typeof images[i] === 'string' ? images[i] : images[i].url;
        await client.query('INSERT INTO product_images (product_id, url, display_order) VALUES ($1, $2, $3)', [newProduct.id, url, i + 1]);
      }
    }

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await client.query('INSERT INTO product_variants (product_id, type, value, price_delta, stock) VALUES ($1, $2, $3, $4, $5)', [newProduct.id, v.type, v.value, v.priceDelta || 0, v.stock || 10]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const updateProduct = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const {
      name, slug, categoryId, subcategoryId, price, discountPrice, sku, stock, tags,
      isFeatured, isNew, isBestseller, shortDescription, description,
      careInstructions, craftsmanshipStory, images,
      shippingWeightKg, packageLengthCm, packageWidthCm, packageHeightCm
    } = req.body;

    const existing = await client.query('SELECT slug FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const previousSlug = existing.rows[0].slug;

    // An edited slug changes a live URL, so the old one is preserved as a 301
    // rather than left to 404.
    const nextSlug = slug ? await uniqueSlug(client, 'products', slug, id) : previousSlug;
    const seo = collectSeoFields(req.body);

    // Booleans and discount_price are assigned directly rather than through
    // COALESCE so an admin can actually turn a flag off or clear a discount.
    const result = await client.query(
      `UPDATE products
          SET name = COALESCE($1, name),
              category_id = COALESCE($2, category_id),
              subcategory_id = $3,
              price = COALESCE($4, price),
              discount_price = $5,
              sku = COALESCE($6, sku),
              stock = COALESCE($7, stock),
              tags = COALESCE($8, tags),
              is_featured = COALESCE($9, is_featured),
              is_new = COALESCE($10, is_new),
              is_bestseller = COALESCE($11, is_bestseller),
              short_description = COALESCE($12, short_description),
              description = COALESCE($13, description),
              care_instructions = COALESCE($14, care_instructions),
              craftsmanship_story = COALESCE($15, craftsmanship_story),
              shipping_weight_kg = COALESCE($16, shipping_weight_kg),
              package_length_cm = COALESCE($17, package_length_cm),
              package_width_cm = COALESCE($18, package_width_cm),
              package_height_cm = COALESCE($19, package_height_cm),
              slug = $20,
              seo_title = $21,
              seo_description = $22,
              seo_keywords = $23,
              canonical_url = $24,
              meta_robots = $25,
              og_title = $26,
              og_description = $27,
              og_image = $28,
              twitter_title = $29,
              twitter_description = $30,
              twitter_image = $31,
              image_alt_text = $32,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $33
        RETURNING *`,
      [
        name, categoryId, subcategoryId ?? null, price, discountPrice ?? null, sku, stock, tags,
        isFeatured, isNew, isBestseller, shortDescription, description,
        careInstructions, craftsmanshipStory,
        shippingWeightKg ?? null, packageLengthCm ?? null, packageWidthCm ?? null, packageHeightCm ?? null,
        nextSlug,
        seo.seoTitle, seo.seoDescription, seo.seoKeywords, seo.canonicalUrl, seo.metaRobots,
        seo.ogTitle, seo.ogDescription, seo.ogImage,
        seo.twitterTitle, seo.twitterDescription, seo.twitterImage, seo.imageAltText,
        id
      ]
    );

    await recordSlugRedirect(client, {
      prefix: '/product',
      oldSlug: previousSlug,
      newSlug: nextSlug,
      entityType: 'product',
      entityId: Number(id),
    });

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Replace the gallery only when the caller supplied one.
    if (Array.isArray(images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (let i = 0; i < images.length; i++) {
        const url = typeof images[i] === 'string' ? images[i] : images[i]?.url;
        if (url) {
          await client.query(
            'INSERT INTO product_images (product_id, url, display_order) VALUES ($1, $2, $3)',
            [id, url, i + 1]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Product updated successfully', product: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
