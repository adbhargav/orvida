/**
 * Customer-facing company details.
 *
 * Mirrors server/src/config/company.js — keep the two in step. The server copy
 * is authoritative for invoices, labels and email; this one covers the
 * storefront chrome.
 */
export const COMPANY = {
  name: 'ORIVIDA',
  tagline: 'Our Passion, UR Luxury',

  address: {
    line1: '3-4-610/1, Narayanguda',
    line2: 'Pillar No B 1152 Lane, Opp Narayanguda Bus Stop Lane',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500029',
    country: 'India',
  },

  phone: '+91 70957 56434',
  phoneHref: 'tel:+917095756434',
  whatsapp: 'https://wa.me/917095756434',
  email: 'support@orivida.in',
};

export const companyAddressLines = () => {
  const { line1, line2, city, state, pincode } = COMPANY.address;
  return [line1, line2, `${city}, ${state} ${pincode}`];
};

export default COMPANY;
