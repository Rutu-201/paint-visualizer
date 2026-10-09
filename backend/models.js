const m = require('mongoose'); const { Schema } = m; const ref = n => ({ type: Schema.Types.ObjectId, ref: n });
exports.User = m.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  permissions: [String],
  favColors: [ref('Color')], favPatterns: [ref('Pattern')],
  sessions: { type: Number, default: 0 }, totalSessionMs: { type: Number, default: 0 }, lastLoginAt: Date
}, { timestamps: true }));
exports.Project = m.model('Project', new Schema({
  owner: { ...ref('User'), required: true }, name: String, original: String, preview: String,
  width: Number, height: Number, trials: [Schema.Types.Mixed]
}, { timestamps: true }));
exports.Color = m.model('Color', new Schema({
  name: { type: String, required: true }, hex: { type: String, required: true },
  brand: String, finishes: [String], tags: [String]
}, { timestamps: true }));
exports.Pattern = m.model('Pattern', new Schema({
  name: { type: String, required: true }, description: String, category: String,
  image: { type: String, required: true }, scale: { type: Number, default: 1 }
}, { timestamps: true }));
exports.Feedback = m.model('Feedback', new Schema({ user: ref('User'), rating: { type: Number, min: 1, max: 5 }, comment: String }, { timestamps: true }));
const Setting = m.model('Setting', new Schema({ key: { type: String, unique: true }, data: Schema.Types.Mixed }));
exports.Setting = Setting;
exports.getSettings = async () => ({ siteName: 'Paint Visualizer', allowRegistration: true, maxUploadMB: 10, ...((await Setting.findOne({ key: 'system' }))?.data || {}) });
exports.h = f => (q, s, n) => f(q, s, n).catch(n);
