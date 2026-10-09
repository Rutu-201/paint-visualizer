require('dotenv').config();
process.env.JWT_SECRET ||= 'dev-secret-change-me';
const express = require('express'), cors = require('cors'), mongoose = require('mongoose'), path = require('path'), fs = require('fs');
const app = express();
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', (q, s) => s.json({ ok: true }));
app.use((err, q, s, n) => s.status(err.status || (err.name === 'MulterError' || /Only JPG/.test(err.message) ? 400 : 500)).json({ message: err.message }));
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/paint_visualizer')
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API on port', process.env.PORT || 5000)))
  .catch(e => { console.error('MongoDB connection failed', e.message); process.exit(1); });
