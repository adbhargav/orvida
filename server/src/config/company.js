import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for ORIVIDA's legal and contact details.
 *
 * Everything customer-facing that names the business — invoices, shipping
 * labels, transactional email — reads from here, so an address or GSTIN
 * change happens in exactly one place.
 */
export const COMPANY = {
  name: 'ORIVIDA',
  tagline: 'Our Passion, UR Luxury',
  legalName: process.env.COMPANY_LEGAL_NAME || 'ORIVIDA',

  address: {
    line1: '3-4-610/1, Narayanguda',
    line2: 'Pillar No B 1152 Lane, Opp Narayanguda Bus Stop Lane',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500029',
    country: 'India',
  },

  phone: process.env.COMPANY_PHONE || '+91 70957 56434',
  email: process.env.COMPANY_EMAIL || 'support@orvida.com',
  website: process.env.COMPANY_WEBSITE || 'orvida.in',

  // Tax identifiers are rendered only when configured, so an invoice never
  // shows a placeholder or another business's number.
  gstin: process.env.COMPANY_GSTIN || null,
  pan: process.env.COMPANY_PAN || null,

  // Absolute URL — email clients and PDF renderers cannot resolve relative
  // paths. Served from /assets, which ships with the code rather than living
  // in the runtime uploads volume.
  logoUrl: `${(process.env.PUBLIC_ASSET_URL || 'http://localhost:5001').replace(/\/+$/, '')}/assets/brand/logo.png`,

  supportHours: 'Mon–Sat, 10am – 7pm IST',
};

/** Address as an array of display lines, blanks removed. */
export const companyAddressLines = () => {
  const { line1, line2, city, state, pincode, country } = COMPANY.address;
  return [line1, line2, `${city}, ${state} ${pincode}`, country].filter(Boolean);
};

/** Single-line address, for compact contexts. */
export const companyAddressOneLine = () => companyAddressLines().join(', ');

export default COMPANY;
