require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs'), fs = require('fs'), path = require('path');
const { User, Color, Pattern } = require('./models');
const svg = (b) => `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">${b}</svg>`;
const patterns = {
  'stripes.svg': ['Classic Stripes', 'Geometric', svg('<rect width="80" height="80" fill="#f4efe6"/><rect width="20" height="80" fill="#d9c9a8"/><rect x="40" width="20" height="80" fill="#d9c9a8"/>')],
  'floral.svg': ['Soft Floral', 'Floral', svg('<rect width="80" height="80" fill="#fdf1f3"/><g fill="#f2a6b5"><circle cx="40" cy="28" r="9"/><circle cx="40" cy="52" r="9"/><circle cx="28" cy="40" r="9"/><circle cx="52" cy="40" r="9"/></g><circle cx="40" cy="40" r="6" fill="#f7d86a"/>')],
  'diamond.svg': ['Teal Diamonds', 'Geometric', svg('<rect width="80" height="80" fill="#e6f3f2"/><path d="M40 6 74 40 40 74 6 40Z" fill="none" stroke="#2a9d8f" stroke-width="4"/>')],
  'bricks.svg': ['Brick Wall', 'Texture', svg('<rect width="80" height="80" fill="#b5523b"/><g stroke="#e8d5c4" stroke-width="3"><path d="M0 20H80M0 40H80M0 60H80M0 80H80M40 0V20M20 20V40M60 20V40M40 40V60M20 60V80M60 60V80"/></g>')]
};
const colors = [['Ocean Breeze Blue', '#6FA8DC', 'Asian Paints', ['Living Room', 'Bedroom']], ['Warm Ivory', '#F5EBD7', 'Berger', ['Living Room', 'Neutral']], ['Sage Whisper', '#B2C2A1', 'Nerolac', ['Bedroom', 'Neutral']],
  ['Terracotta Glow', '#D9825B', 'Asian Paints', ['Accent', 'Living Room']], ['Blush Pink', '#F4C2C2', 'Dulux', ['Bedroom', 'Kids']], ['Sunshine Yellow', '#F7D154', 'Berger', ['Kitchen', 'Accent']],
  ['Midnight Navy', '#27374D', 'Dulux', ['Accent']], ['Mint Fresh', '#BFE8D4', 'Nerolac', ['Kitchen', 'Bathroom']], ['Lavender Mist', '#C9B8E6', 'Asian Paints', ['Bedroom', 'Kids']],
  ['Charcoal Grey', '#5A5F66', 'Dulux', ['Accent', 'Living Room']], ['Coral Reef', '#F28B82', 'Berger', ['Accent', 'Kids']], ['Pure White', '#FFFFFF', 'Nerolac', ['Neutral']]];
(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/paint_visualizer');
  if (!(await User.findOne({ role: 'admin' }))) await User.create({ name: 'Admin', email: 'admin@paint.com', password: await bcrypt.hash('Admin@123', 10), role: 'admin', permissions: ['colors', 'patterns', 'users', 'settings'] });
  if (!(await Color.countDocuments())) await Color.insertMany(colors.map(c => ({ name: c[0], hex: c[1], brand: c[2], tags: c[3], finishes: ['matte', 'satin', 'glossy'] })));
  if (!(await Pattern.countDocuments())) {
    const dir = path.join(__dirname, 'uploads', 'patterns'); fs.mkdirSync(dir, { recursive: true });
    for (const [f, [name, category, body]] of Object.entries(patterns)) { fs.writeFileSync(path.join(dir, f), body); await Pattern.create({ name, category, description: name + ' wallpaper', image: '/uploads/patterns/' + f, scale: 1 }); }
  }
  console.log('Seeded. Admin login: admin@paint.com / Admin@123'); process.exit(0);
})();
