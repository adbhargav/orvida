/**
 * Built-in policy copy, editable from Admin → Site Content.
 *
 * Body format: plain text — lines beginning with "## " render as section
 * headings, blank lines separate paragraphs, lines beginning with "- "
 * render as list items.
 */

export const POLICIES = {
  'privacy-policy': {
    title: 'Privacy Policy',
    body: `ORIVIDA ("we", "our") respects your privacy. This policy explains what information we collect when you use orvida.com and our services, and how we use and protect it.

## Information we collect

- Account details: your name, email address, phone number and password (stored only as a secure hash), or your Google account identity when you sign in with Google.
- Order details: shipping addresses, order history, and payment references. Card, UPI and banking details are processed entirely by Razorpay — we never see or store them.
- Delivery details: your address and pincode are shared with our courier partner, Delhivery, solely to quote delivery charges and fulfil your order.
- Technical data: basic device and usage information, and locally stored preferences such as your cart, kept in your browser.

## How we use it

- To process and deliver your orders, and to send order confirmations and delivery updates by email.
- To operate your account, wishlist and saved addresses.
- To respond to enquiries and provide customer support.
- To send our newsletter, only when you have subscribed; every email includes a way to unsubscribe.

## What we never do

- We never sell your personal information.
- We share data only with the partners needed to serve you: Razorpay (payments), Delhivery (shipping), Google Firebase (sign-in), and our hosting providers.

## Your rights

You may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete your account and associated data. Write to us at support@orvida.com and we will respond within a reasonable time.

## Contact

ORIVIDA, 3-4-610/1, Narayanguda, Hyderabad, Telangana 500029, India · support@orvida.com · +91 70957 56434`,
  },

  'terms-and-conditions': {
    title: 'Terms & Conditions',
    body: `By using this website and placing an order with ORIVIDA you agree to the terms below. Please read them before purchasing.

## Orders and accounts

- An account is required to place an order, so that you can track, manage and cancel your purchases.
- All prices are shown in Indian Rupees and include applicable taxes. Delivery charges are calculated at checkout based on your pincode and the parcel.
- We reserve the right to refuse or cancel an order — for example where a product is mispriced, out of stock, or the delivery address is unserviceable. Any amount already paid for a cancelled order is refunded in full.

## Payments

All payments are processed securely by Razorpay. We support UPI, cards, netbanking and wallets. Your order is confirmed only after the payment is verified.

## Living products

Plants are living things. Minor variations in size, shape and colour from the photographs are natural and are not defects. Every plant ships with our 7-day health guarantee described in the Refund & Cancellation Policy.

## Artisan products

Handcrafted pieces — Dhokra bell metal, blue pottery, terracotta and similar — are made individually by artisans. Small irregularities are characteristics of the craft, not flaws.

## Intellectual property

All content on this site, including photography, text and branding, belongs to ORIVIDA and may not be reproduced without permission.

## Governing law

These terms are governed by the laws of India. Any dispute is subject to the jurisdiction of the courts of Hyderabad, Telangana.

## Contact

Questions about these terms: support@orvida.com · +91 70957 56434`,
  },

  'shipping-policy': {
    title: 'Shipping Policy',
    body: `## Delivery partner

Orders are shipped from our Hyderabad atelier through Delhivery, with tracking provided for every parcel.

## Delivery charges

Delivery is charged at the live courier rate for your pincode and parcel, shown at checkout before you pay. Orders above ₹1,999 ship free.

## Serviceability

During checkout we confirm that your pincode is serviceable. If we cannot deliver to your area, the website will tell you before payment.

## Timelines

- Orders are typically handed to the courier within 1–2 business days.
- Delivery usually takes 3–7 business days depending on your location.
- Live plants are packed with extra care in ventilated, cushioned packaging; a day or two of settling after arrival is normal.

## Tracking

As soon as your shipment is created you receive an AWB (tracking) number on the order page, with a link to track the parcel on Delhivery.

## Damaged parcels

If a parcel arrives visibly damaged, please photograph it before opening and contact us at support@orvida.com within 48 hours.`,
  },

  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    body: `## Cancellations

You may cancel an order from your account page any time before it is dispatched. The full amount is refunded to your original payment method.

## Plant health guarantee

Every live plant is covered by our 7-day health guarantee. If a plant arrives damaged or fails to settle within 7 days of delivery despite reasonable care, contact us with photographs and we will replace it or refund it — your choice.

## Artisan and décor pieces

Handcrafted items may be returned within 7 days of delivery if they arrive damaged or materially different from their description. Given the handmade nature of these pieces, minor variations are not grounds for return.

## How refunds are processed

- Refunds are issued to the original payment method through Razorpay.
- Once initiated, refunds typically reach your account within 5–7 business days depending on your bank.
- Where an order is partially refunded (for example one item of several), the delivery charge is refunded proportionally only if the whole order is returned.

## How to raise a request

Email support@orvida.com with your order number, photographs where relevant, and a short description. We respond within 2 business days.`,
  },
};

export const POLICY_SLUGS = Object.keys(POLICIES);
