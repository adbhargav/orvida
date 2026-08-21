// ORVIDA Frontend API Service Layer

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/* ------------------------------------------------------------------ *
 * Auth token helpers
 * ------------------------------------------------------------------ */

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('orvida_user'));
  } catch {
    return null;
  }
};

const getToken = () => getStoredUser()?.token || null;

/* ------------------------------------------------------------------ *
 * Core request helper
 *
 * Resolves with the parsed body on 2xx, and throws an Error carrying the
 * server's message on any other status. Callers get a real failure instead
 * of a silently-swallowed one.
 * ------------------------------------------------------------------ */

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const request = async (path, { method = 'GET', body, auth = false, isForm = false } = {}) => {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the ORVIDA server. Please check your connection.', 0, null);
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload ?? {};
};

/* ------------------------------------------------------------------ *
 * Normalizers
 *
 * The API returns PostgreSQL rows: snake_case keys, and NUMERIC columns
 * arrive as strings. Components read a camelCase shape with real numbers,
 * so every response is funnelled through here first.
 * ------------------------------------------------------------------ */

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const pick = (row, camel, snake) => (row[camel] !== undefined ? row[camel] : row[snake]);

export const normalizeProduct = (row) => {
  if (!row) return row;

  const price = toNumber(pick(row, 'price', 'price')) ?? 0;
  const rawDiscount = toNumber(pick(row, 'discountPrice', 'discount_price'));
  // Only treat it as a discount when it actually undercuts the list price.
  const discountPrice = rawDiscount && rawDiscount < price ? rawDiscount : null;

  const images = (row.images || [])
    .map((img) => (typeof img === 'string' ? { url: img } : img))
    .filter((img) => img && img.url);

  const variants = (row.variants || []).map((v) => ({
    ...v,
    priceDelta: toNumber(pick(v, 'priceDelta', 'price_delta')) ?? 0,
    stock: toNumber(v.stock) ?? 0,
  }));

  return {
    ...row,
    id: row.id,
    name: row.name,
    slug: row.slug,
    price,
    discountPrice,
    // The price a customer actually pays for the base variant.
    effectivePrice: discountPrice ?? price,
    stock: toNumber(row.stock) ?? 0,
    sku: row.sku || '',
    categoryId: pick(row, 'categoryId', 'category_id') ?? null,
    categoryName: pick(row, 'categoryName', 'category_name') || '',
    categorySlug: pick(row, 'categorySlug', 'category_slug') || '',
    subcategoryId: pick(row, 'subcategoryId', 'subcategory_id') ?? null,
    subcategoryName: pick(row, 'subcategoryName', 'subcategory_name') || '',
    subcategorySlug: pick(row, 'subcategorySlug', 'subcategory_slug') || '',
    avgRating: toNumber(pick(row, 'avgRating', 'avg_rating')) ?? 5,
    reviewCount: toNumber(pick(row, 'reviewCount', 'review_count')) ?? 0,
    isFeatured: Boolean(pick(row, 'isFeatured', 'is_featured')),
    isNew: Boolean(pick(row, 'isNew', 'is_new')),
    isBestseller: Boolean(pick(row, 'isBestseller', 'is_bestseller')),
    shortDescription: pick(row, 'shortDescription', 'short_description') || '',
    description: row.description || '',
    careInstructions: pick(row, 'careInstructions', 'care_instructions') || '',
    craftsmanshipStory: pick(row, 'craftsmanshipStory', 'craftsmanship_story') || '',
    tags: row.tags || [],
    images,
    variants,
    reviews: row.reviews || [],
    // SEO overrides. Null/empty means "fall back at render time", which is
    // what lets an admin take over any field later.
    seoTitle: pick(row, 'seoTitle', 'seo_title') || '',
    seoDescription: pick(row, 'seoDescription', 'seo_description') || '',
    seoKeywords: pick(row, 'seoKeywords', 'seo_keywords') || '',
    canonicalUrl: pick(row, 'canonicalUrl', 'canonical_url') || '',
    metaRobots: pick(row, 'metaRobots', 'meta_robots') || '',
    ogTitle: pick(row, 'ogTitle', 'og_title') || '',
    ogDescription: pick(row, 'ogDescription', 'og_description') || '',
    ogImage: pick(row, 'ogImage', 'og_image') || '',
    twitterTitle: pick(row, 'twitterTitle', 'twitter_title') || '',
    twitterDescription: pick(row, 'twitterDescription', 'twitter_description') || '',
    twitterImage: pick(row, 'twitterImage', 'twitter_image') || '',
    imageAltText: pick(row, 'imageAltText', 'image_alt_text') || '',
    // Final packed-parcel figures for courier rating (not raw product size).
    shippingWeightKg: toNumber(pick(row, 'shippingWeightKg', 'shipping_weight_kg')),
    packageLengthCm: toNumber(pick(row, 'packageLengthCm', 'package_length_cm')),
    packageWidthCm: toNumber(pick(row, 'packageWidthCm', 'package_width_cm')),
    packageHeightCm: toNumber(pick(row, 'packageHeightCm', 'package_height_cm')),
  };
};

export const normalizeCategory = (row) => {
  if (!row) return row;
  return {
    ...row,
    seoTitle: pick(row, 'seoTitle', 'seo_title') || '',
    seoDescription: pick(row, 'seoDescription', 'seo_description') || '',
    seoKeywords: pick(row, 'seoKeywords', 'seo_keywords') || '',
    canonicalUrl: pick(row, 'canonicalUrl', 'canonical_url') || '',
    metaRobots: pick(row, 'metaRobots', 'meta_robots') || '',
    ogTitle: pick(row, 'ogTitle', 'og_title') || '',
    ogDescription: pick(row, 'ogDescription', 'og_description') || '',
    ogImage: pick(row, 'ogImage', 'og_image') || '',
    imageAltText: pick(row, 'imageAltText', 'image_alt_text') || '',
    subcategories: (row.subcategories || []).map((sub) => ({
      ...sub,
      count: toNumber(sub.count) ?? 0,
      seoTitle: pick(sub, 'seoTitle', 'seo_title') || '',
      seoDescription: pick(sub, 'seoDescription', 'seo_description') || '',
      metaRobots: pick(sub, 'metaRobots', 'meta_robots') || '',
      ogImage: pick(sub, 'ogImage', 'og_image') || '',
      imageAltText: pick(sub, 'imageAltText', 'image_alt_text') || '',
    })),
  };
};

export const normalizeOrder = (row) => {
  if (!row) return row;
  return {
    ...row,
    orderNumber: pick(row, 'orderNumber', 'order_number') || String(row.id ?? ''),
    subtotal: toNumber(row.subtotal) ?? 0,
    shippingFee: toNumber(pick(row, 'shippingFee', 'shipping_fee')) ?? 0,
    discountAmount: toNumber(pick(row, 'discountAmount', 'discount_amount')) ?? 0,
    total: toNumber(row.total) ?? 0,
    paymentStatus: pick(row, 'paymentStatus', 'payment_status') || 'Pending',
    trackingNumber: pick(row, 'trackingNumber', 'tracking_number') || '',
    refundedAmount: toNumber(pick(row, 'refundedAmount', 'refunded_amount')) ?? 0,
    paymentFailedReason: pick(row, 'paymentFailedReason', 'payment_failed_reason') || '',
    courierName: pick(row, 'courierName', 'courier_name') || '',
    deliverySlot: pick(row, 'deliverySlot', 'delivery_slot') || '',
    deliveryProvider: pick(row, 'deliveryProvider', 'delivery_provider') || '',
    delhiveryAwb: pick(row, 'delhiveryAwb', 'delhivery_awb') || '',
    deliveryStatus: pick(row, 'deliveryStatus', 'delivery_status') || '',
    trackingUrl: pick(row, 'trackingUrl', 'tracking_url') || '',
    pickupStatus: pick(row, 'pickupStatus', 'pickup_status') || '',
    shipmentError: pick(row, 'shipmentError', 'shipment_error') || '',
    shipmentCreatedAt: pick(row, 'shipmentCreatedAt', 'shipment_created_at') || null,
    shippingAddress: pick(row, 'shippingAddress', 'shipping_address') || {},
    createdAt: pick(row, 'createdAt', 'created_at') || null,
    customerName: pick(row, 'customerName', 'customer_name') || '',
    customerEmail: pick(row, 'customerEmail', 'customer_email') || '',
    items: (row.items || []).map((item) => ({
      ...item,
      name: item.name || item.product_name || '',
      image: item.image || item.image_url || '',
      variantName: pick(item, 'variantName', 'variant_name') || '',
      price: toNumber(item.price) ?? 0,
      quantity: toNumber(item.quantity) ?? 1,
    })),
  };
};

/* ------------------------------------------------------------------ *
 * API surface
 * ------------------------------------------------------------------ */

export const api = {
  auth: {
    signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    googleLogin: (idToken, googleUser) =>
      request('/auth/google', { method: 'POST', body: { idToken, googleUser } }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (idToken, newPassword) =>
      request('/auth/reset-password', { method: 'POST', body: { idToken, newPassword } }),
    getProfile: () => request('/auth/me', { auth: true }),
    updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data, auth: true }),
  },

  products: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await request(`/products${query ? `?${query}` : ''}`);
      return { ...res, products: (res.products || []).map(normalizeProduct) };
    },
    getBySlug: async (slug) => {
      const res = await request(`/products/${encodeURIComponent(slug)}`);
      return { ...res, product: normalizeProduct(res.product) };
    },
    create: async (data) => {
      const res = await request('/products', { method: 'POST', body: data, auth: true });
      return { ...res, product: normalizeProduct(res.product) };
    },
    update: async (id, data) => {
      const res = await request(`/products/${id}`, { method: 'PUT', body: data, auth: true });
      return { ...res, product: normalizeProduct(res.product) };
    },
    remove: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
  },

  categories: {
    getAll: async () => {
      const res = await request('/categories');
      return { ...res, categories: (res.categories || []).map(normalizeCategory) };
    },
    getBySlug: async (slug) => {
      const res = await request(`/categories/${encodeURIComponent(slug)}`);
      return { ...res, category: normalizeCategory(res.category) };
    },
    create: (data) => request('/categories', { method: 'POST', body: data, auth: true }),
    update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data, auth: true }),
    remove: (id) => request(`/categories/${id}`, { method: 'DELETE', auth: true }),
    createSubcategory: (categoryId, data) =>
      request(`/categories/${categoryId}/subcategories`, { method: 'POST', body: data, auth: true }),
    updateSubcategory: (id, data) =>
      request(`/categories/subcategories/${id}`, { method: 'PUT', body: data, auth: true }),
    removeSubcategory: (id) =>
      request(`/categories/subcategories/${id}`, { method: 'DELETE', auth: true }),
  },

  seo: {
    // Public: resolve a renamed URL before the storefront shows a 404.
    resolveRedirect: (path) => request(`/seo/redirect?path=${encodeURIComponent(path)}`),

    audit: () => request('/seo/admin/audit', { auth: true }),
    listProducts: (missing) =>
      request(`/seo/admin/products${missing ? `?missing=${encodeURIComponent(missing)}` : ''}`, { auth: true }),
    bulk: (action, productIds) =>
      request('/seo/admin/bulk', { method: 'POST', body: { action, productIds }, auth: true }),
    listRedirects: () => request('/seo/admin/redirects', { auth: true }),
    createRedirect: (source, destination, statusCode = 301) =>
      request('/seo/admin/redirects', { method: 'POST', body: { source, destination, statusCode }, auth: true }),
    removeRedirect: (id) => request(`/seo/admin/redirects/${id}`, { method: 'DELETE', auth: true }),

    /* SEO landing pages */
    // Public — the API only serves pages that are actually live.
    getPage: (slug) => request(`/seo/pages/${encodeURIComponent(slug)}`),
    listLivePages: () => request('/seo/pages'),

    pageStats: () => request('/seo/admin/pages/stats', { auth: true }),
    listPages: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ).toString();
      return request(`/seo/admin/pages${q ? `?${q}` : ''}`, { auth: true });
    },
    getPageAdmin: (id) => request(`/seo/admin/pages/${id}`, { auth: true }),
    createPage: (data) => request('/seo/admin/pages', { method: 'POST', body: data, auth: true }),
    updatePage: (id, data) => request(`/seo/admin/pages/${id}`, { method: 'PUT', body: data, auth: true }),
    duplicatePage: (id) => request(`/seo/admin/pages/${id}/duplicate`, { method: 'POST', auth: true }),
    removePage: (id) => request(`/seo/admin/pages/${id}`, { method: 'DELETE', auth: true }),
    bulkPages: (action, ids) =>
      request('/seo/admin/pages/bulk', { method: 'POST', body: { action, ids }, auth: true }),

    listTemplates: () => request('/seo/admin/pages/templates', { auth: true }),
    saveTemplate: (name, description, defaults) =>
      request('/seo/admin/pages/templates', { method: 'POST', body: { name, description, defaults }, auth: true }),
    removeTemplate: (id) => request(`/seo/admin/pages/templates/${id}`, { method: 'DELETE', auth: true }),
  },

  blog: {
    // Public — only live posts are ever returned.
    list: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ).toString();
      return request(`/blog${q ? `?${q}` : ''}`);
    },
    getPost: (slug) => request(`/blog/${encodeURIComponent(slug)}`),

    stats: () => request('/blog/admin/stats', { auth: true }),
    listPosts: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ).toString();
      return request(`/blog/admin/posts${q ? `?${q}` : ''}`, { auth: true });
    },
    getPostAdmin: (id) => request(`/blog/admin/posts/${id}`, { auth: true }),
    createPost: (data) => request('/blog/admin/posts', { method: 'POST', body: data, auth: true }),
    updatePost: (id, data) => request(`/blog/admin/posts/${id}`, { method: 'PUT', body: data, auth: true }),
    duplicatePost: (id) => request(`/blog/admin/posts/${id}/duplicate`, { method: 'POST', auth: true }),
    removePost: (id) => request(`/blog/admin/posts/${id}`, { method: 'DELETE', auth: true }),
    bulkPosts: (action, ids) =>
      request('/blog/admin/posts/bulk', { method: 'POST', body: { action, ids }, auth: true }),
  },

  content: {
    // Returns { content: { key: {...} } }; pass keys to fetch specific blocks.
    get: (...keys) => request(`/content${keys.length ? `?keys=${keys.join(',')}` : ''}`),
    update: (key, content) => request(`/content/${key}`, { method: 'PUT', body: { content }, auth: true }),
  },

  orders: {
    createRazorpayOrder: (items, meta = {}) =>
      request('/orders/create-razorpay-order', { method: 'POST', body: { items, ...meta }, auth: true }),
    verifyPayment: async (payload) => {
      const res = await request('/orders/verify-payment', { method: 'POST', body: payload, auth: true });
      return { ...res, order: normalizeOrder(res.order) };
    },
    getMyOrders: async () => {
      const res = await request('/orders/my-orders', { auth: true });
      return { ...res, orders: (res.orders || []).map(normalizeOrder) };
    },
    getById: async (identifier) => {
      const res = await request(`/orders/detail/${encodeURIComponent(identifier)}`, { auth: true });
      return { ...res, order: normalizeOrder(res.order) };
    },
    cancelOrder: async (orderId) => {
      const res = await request(`/orders/cancel/${orderId}`, { method: 'PATCH', auth: true });
      return { ...res, order: normalizeOrder(res.order) };
    },
    getAllOrdersAdmin: async () => {
      const res = await request('/orders/admin/all', { auth: true });
      return { ...res, orders: (res.orders || []).map(normalizeOrder) };
    },
    updateStatus: (orderId, status) =>
      request(`/orders/admin/${orderId}/status`, { method: 'PATCH', body: { status }, auth: true }),
    createShipment: (orderId) =>
      request(`/shipping/admin/orders/${orderId}/create`, { method: 'POST', auth: true }),
    refreshShipmentTracking: (orderId) =>
      request(`/shipping/admin/orders/${orderId}/refresh`, { method: 'POST', auth: true }),

    /**
     * Invoice and label are server-rendered HTML behind an auth check, so they
     * cannot be linked directly. Fetch with the token, then hand the browser a
     * blob URL to open in a new tab.
     */
    openDocument: async (identifier, kind = 'invoice') => {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(identifier)}/${kind}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        let message = `Could not open the ${kind}.`;
        try {
          const body = await res.json();
          message = body.message || message;
        } catch {
          /* non-JSON error body */
        }
        throw new ApiError(message, res.status, null);
      }

      const blobUrl = URL.createObjectURL(await res.blob());
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        URL.revokeObjectURL(blobUrl);
        throw new ApiError('Please allow pop-ups to view this document.', 0, null);
      }
      // Give the new tab time to load before releasing the object URL.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return true;
    },
  },

  payments: {
    refund: (orderId, { amount, reason, speed } = {}) =>
      request(`/payments/orders/${orderId}/refund`, {
        method: 'POST',
        body: { amount, reason, speed },
        auth: true,
      }),
    getRefunds: (orderId) => request(`/payments/orders/${orderId}/refunds`, { auth: true }),
    getWebhookEvents: () => request('/payments/webhook-events', { auth: true }),
  },

  enquiries: {
    create: (data) => request('/enquiries', { method: 'POST', body: data }),
    getAllAdmin: () => request('/enquiries/admin', { auth: true }),
    updateStatus: (id, status) =>
      request(`/enquiries/admin/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    remove: (id) => request(`/enquiries/admin/${id}`, { method: 'DELETE', auth: true }),
  },

  newsletter: {
    subscribe: (email, source = 'footer') =>
      request('/newsletter/subscribe', { method: 'POST', body: { email, source } }),
    unsubscribe: (email) => request('/newsletter/unsubscribe', { method: 'POST', body: { email } }),
    getAllAdmin: () => request('/newsletter/admin', { auth: true }),
  },

  addresses: {
    getMine: () => request('/addresses', { auth: true }),
    create: (data) => request('/addresses', { method: 'POST', body: data, auth: true }),
    update: (id, data) => request(`/addresses/${id}`, { method: 'PUT', body: data, auth: true }),
    remove: (id) => request(`/addresses/${id}`, { method: 'DELETE', auth: true }),
  },

  shipping: {
    // items: [{productId, quantity}] — the server prices the parcel from the
    // database, so nothing about the courier account reaches the browser.
    quote: (items, pincode) =>
      request('/shipping/quote', { method: 'POST', body: { items, pincode } }),
  },

  banners: {
    getAll: () => request('/banners'),
    create: (data) => request('/banners/admin', { method: 'POST', body: data, auth: true }),
    update: (id, data) => request(`/banners/admin/${id}`, { method: 'PUT', body: data, auth: true }),
    remove: (id) => request(`/banners/admin/${id}`, { method: 'DELETE', auth: true }),
  },

  coupons: {
    validate: (code, cartSubtotal) =>
      request('/coupons/validate', { method: 'POST', body: { code, cartSubtotal } }),
    getAllAdmin: () => request('/coupons/admin/all', { auth: true }),
    create: (data) => request('/coupons/admin', { method: 'POST', body: data, auth: true }),
    remove: (id) => request(`/coupons/admin/${id}`, { method: 'DELETE', auth: true }),
  },

  reviews: {
    getRecent: (limit = 3) => request(`/reviews/recent?limit=${limit}`),
    getForProduct: (productId) => request(`/reviews/${productId}`),
    add: (data) => request('/reviews', { method: 'POST', body: data, auth: true }),
  },

  users: {
    getAll: () => request('/users/admin/all', { auth: true }),
    setRole: (id, isAdmin) =>
      request(`/users/admin/${id}/role`, { method: 'PATCH', body: { isAdmin }, auth: true }),
    createAdmin: (adminData) =>
      request('/users/admin/create-admin', { method: 'POST', body: adminData, auth: true }),
  },

  dashboard: {
    getMetrics: () => request('/dashboard/metrics', { auth: true }),
  },

  uploads: {
    // Accepts a FileList/array of File objects and returns hosted URLs.
    images: async (files) => {
      const list = Array.from(files || []);
      if (list.length === 0) return { success: true, urls: [] };

      const form = new FormData();
      list.forEach((file) => form.append('images', file));

      const res = await request('/upload/multiple', {
        method: 'POST',
        body: form,
        auth: true,
        isForm: true,
      });
      return { ...res, urls: res.urls || [] };
    },
  },
};

export { ApiError };
