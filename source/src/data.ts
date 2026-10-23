// Every piece of copy on the site lives here.

export const person = {
  first: 'Swad',
  full: 'Swad',
  roleTop: 'D2C FOUNDER',
  roleBottom: '& AI BUILDER.',
  tagline:
    '8+ years turning ideas into revenue. I scaled an Ayurvedic D2C brand to ₹20 Cr in sales, built a 40-person team, and now ship AI tools that pull 10,000+ users in a month.',
  email: 'marketingswad@gmail.com',
  emailName: 'marketingswad',
  emailDomain: '@gmail.com',
  location: 'Navi Mumbai, India',
  links: [
    { label: 'Ecom Profix', href: 'https://ecomprofix.com' },
    { label: 'GitHub', href: 'https://github.com/heyswad' },
    { label: 'Résumé', href: './resume.pdf' },
  ],
};

export const manifesto = {
  text:
    'I started in 2018 selling software. Then I built my own companies from zero: ₹26 Cr+ in sales, ₹4 Cr+ in ad spend at an average 8–9x ROAS, and a team of 40. Now I build AI products with the same obsession for revenue, and I want a startup to go all in on.',
  keywords: ['₹26', 'Cr+', '8–9x', 'ROAS,', '40.', 'AI', 'products', 'startup'],
};

export const stats = [
  { value: 20, prefix: '₹', suffix: ' Cr', label: 'Sales at Saviour Cosmetic' },
  { value: 40, prefix: '', suffix: '', label: 'People hired & led' },
  { value: 9, prefix: '', suffix: 'x', label: 'Average ROAS on ads' },
];

export type Visual = 'bars' | 'gauge' | 'chat' | 'heat';
export const projects: {
  n: string; cat: string; name: string; desc: string; chips: string[]; link: { label: string; href: string } | null; visual: Visual;
}[] = [
  {
    n: '01', cat: 'D2C · Ayurveda', name: 'Saviour Cosmetic',
    desc: '100+ Ayurvedic products on my own formulations. ₹20 Cr in sales on ₹3 Cr+ ad spend.',
    chips: ['Shopify', 'Meta Ads', 'WhatsApp sales', 'Team of 40'],
    link: { label: 'Visit store', href: 'https://saviourcosmetic.com' }, visual: 'bars',
  },
  {
    n: '02', cat: 'Supplements · Pvt Ltd', name: 'Healthy Cube Herbal',
    desc: 'Weight-loss and dietary supplements. ₹5 Cr in sales on ₹1 Cr of ad spend.',
    chips: ['Performance ads', 'COD ops', 'Fulfilment', 'P&L'],
    link: null, visual: 'gauge',
  },
  {
    n: '03', cat: 'AI products', name: '40+ AI Tools',
    desc: 'A suite of AI tools earning every month. One pulled 10,000+ users in its first month.',
    chips: ['Claude API', 'Supabase', 'Lovable', 'Razorpay'],
    link: { label: 'Try Kuchupuchu', href: 'https://kuchupuchu.ecomprofix.com' }, visual: 'chat',
  },
  {
    n: '04', cat: 'Agency · Software', name: 'Ecom Profix & OMS',
    desc: 'My in-house agency building sites and software for clients, plus my own order management system.',
    chips: ['Websites', 'OMS', 'Courier APIs', 'Automation'],
    link: { label: 'Visit Ecom Profix', href: 'https://ecomprofix.com' }, visual: 'heat',
  },
];

// newest first
export const journey = [
  { year: 'NOW', title: 'AI products & Ecom Profix', org: '40+ AI tools, in-house agency, own OMS' },
  { year: 'SAVIOUR', title: '₹20 Cr D2C brand', org: 'Saviour Cosmetic · 100+ products · team of 40' },
  { year: 'HEALTHY CUBE', title: '₹5 Cr in supplements', org: 'Healthy Cube Herbal Pvt Ltd' },
  { year: 'POST-2020', title: '₹1 Cr in digital products', org: 'Own platform for e-books & marketing courses' },
  { year: '2018', title: 'Sales expert', org: 'Software company, where I learned to sell' },
];
export const journeyYears = { from: 2018, to: 2026 };

export const skills = [
  'Meta Ads', 'Conversion API', 'Shopify', 'WhatsApp Funnels', 'Performance Marketing', 'D2C Growth',
  'RTO Reduction', 'Claude API', 'AI Agents', 'Supabase', 'Lovable', 'Razorpay',
  'Sales', 'Team Building', 'P&L', 'Automation',
];

export const counters = [
  { value: 26, pre: '₹', suffix: '+', unit: 'Cr', label: 'Total sales' },
  { value: 4, pre: '₹', suffix: '+', unit: 'Cr', label: 'Ad spend managed' },
  { value: 40, pre: '', suffix: '+', unit: '', label: 'AI tools built' },
  { value: 10, pre: '', suffix: 'K+', unit: '', label: 'Users in one month' },
];

export const ventures = [
  { title: 'Saviour Cosmetic', issuer: 'Ayurvedic D2C brand' },
  { title: 'Healthy Cube Herbal', issuer: 'Private Limited' },
  { title: 'Ecom Profix', issuer: 'Marketing agency' },
  { title: 'Ayurworks OMS', issuer: 'Order management' },
  { title: 'Kuchupuchu', issuer: 'AI pet care app' },
  { title: 'Chhotu', issuer: 'AI e-commerce agent' },
  { title: 'AyurBurn', issuer: 'Saviour Group brand' },
  { title: 'Narie Bloom', issuer: 'Saviour Group brand' },
  { title: 'Glowveda', issuer: 'Saviour Group brand' },
  { title: 'Men Need', issuer: 'Saviour Group brand' },
];

export const year = 2026;
