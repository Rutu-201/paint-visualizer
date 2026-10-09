const r = require('express').Router(), fs = require('fs'), path = require('path');
const M = require('../models'), { User, Project, Color, Pattern, Feedback, Setting, h } = M;
const { auth, admin } = require('../middleware/auth'); const upload = require('../middleware/upload');
const csv = v => Array.isArray(v) ? v : String(v || '').split(',').map(x => x.trim()).filter(Boolean);
const rm = u => u && u.startsWith('/uploads/') && !u.includes('..') && fs.unlink(path.join(__dirname, '..', u), () => {});
r.use(auth, admin);

r.post('/colors', h(async (q, s) => { const b = q.body; s.status(201).json(await Color.create({ ...b, finishes: csv(b.finishes), tags: csv(b.tags) })); }));
r.put('/colors/:id', h(async (q, s) => { const b = q.body; s.json(await Color.findByIdAndUpdate(q.params.id, { ...b, finishes: csv(b.finishes), tags: csv(b.tags) }, { new: true })); }));
r.delete('/colors/:id', h(async (q, s) => { await Color.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));

r.post('/patterns', upload.single('image'), h(async (q, s) => {
  if (!q.file) return s.status(400).json({ message: 'Pattern image required' });
  s.status(201).json(await Pattern.create({ name: q.body.name, description: q.body.description, category: q.body.category, scale: +q.body.scale || 1, image: '/uploads/' + q.file.filename }));
}));
r.put('/patterns/:id', upload.single('image'), h(async (q, s) => {
  const p = await Pattern.findById(q.params.id); if (!p) return s.status(404).json({ message: 'Not found' });
  Object.assign(p, { name: q.body.name, description: q.body.description, category: q.body.category, scale: +q.body.scale || 1 });
  if (q.file) { if (!p.image.startsWith('/uploads/patterns/')) rm(p.image); p.image = '/uploads/' + q.file.filename; }
  s.json(await p.save());
}));
r.delete('/patterns/:id', h(async (q, s) => { const p = await Pattern.findByIdAndDelete(q.params.id); if (p && !p.image.startsWith('/uploads/patterns/')) rm(p.image); s.json({ ok: true }); }));

r.get('/users', h(async (q, s) => s.json(await User.find().select('-password').sort('-createdAt'))));
r.get('/projects', h(async (q, s) => s.json(await Project.find().select('-trials').populate('owner', 'name email').sort('-updatedAt').limit(200))));
r.get('/stats', h(async (q, s) => {
  const [users, projects, fb, u, all] = await Promise.all([User.countDocuments(), Project.find().select('trials'), Feedback.find().populate('user', 'name').sort('-createdAt').limit(10), User.find().select('sessions totalSessionMs'), Feedback.find().select('rating')]);
  const sessions = u.reduce((a, x) => a + x.sessions, 0), ms = u.reduce((a, x) => a + x.totalSessionMs, 0);
  s.json({ users, imagesUploaded: projects.length, designsSaved: projects.reduce((a, p) => a + (p.trials?.filter(t => t.walls?.length).length || 0), 0),
    avgSessionMinutes: sessions ? +(ms / sessions / 60000).toFixed(1) : 0, avgRating: all.length ? +(all.reduce((a, x) => a + x.rating, 0) / all.length).toFixed(2) : 0, feedback: fb });
}));
r.get('/settings', h(async (q, s) => s.json(await M.getSettings())));
r.put('/settings', h(async (q, s) => {
  const data = { siteName: String(q.body.siteName || 'Paint Visualizer'), allowRegistration: !!q.body.allowRegistration, maxUploadMB: Math.min(10, Math.max(1, +q.body.maxUploadMB || 10)) };
  await Setting.findOneAndUpdate({ key: 'system' }, { data }, { upsert: true }); s.json(data);
}));
module.exports = r;
