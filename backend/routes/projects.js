const r = require('express').Router(), fs = require('fs'), path = require('path');
const { Project, h } = require('../models'); const { auth } = require('../middleware/auth');
const up = require('../middleware/upload').fields([{ name: 'original', maxCount: 1 }, { name: 'preview', maxCount: 1 }]);
const url = f => f ? '/uploads/' + f.filename : undefined;
const rm = u => u && u.startsWith('/uploads/') && !u.includes('..') && fs.unlink(path.join(__dirname, '..', u), () => {});
const parse = t => { try { const v = JSON.parse(t || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const own = q => ({ _id: q.params.id, owner: q.user.id });
r.use(auth);
r.get('/', h(async (q, s) => s.json(await Project.find({ owner: q.user.id }).sort('-updatedAt').select('-trials'))));
r.get('/:id', h(async (q, s) => { const p = await Project.findOne(own(q)); p ? s.json(p) : s.status(404).json({ message: 'Project not found' }); }));
r.post('/', up, h(async (q, s) => {
  const f = q.files || {}; if (!f.original) return s.status(400).json({ message: 'Room image is required' });
  s.status(201).json(await Project.create({ owner: q.user.id, name: q.body.name || 'Untitled room', original: url(f.original[0]), preview: url(f.preview?.[0]), width: +q.body.width, height: +q.body.height, trials: parse(q.body.trials) }));
}));
r.put('/:id', up, h(async (q, s) => {
  const p = await Project.findOne(own(q)); if (!p) return s.status(404).json({ message: 'Project not found' });
  const f = q.files || {};
  if (q.body.name) p.name = q.body.name;
  if (q.body.trials) p.trials = parse(q.body.trials);
  if (f.preview) { rm(p.preview); p.preview = url(f.preview[0]); }
  await p.save(); s.json(p);
}));
r.delete('/:id', h(async (q, s) => {
  const p = await Project.findOneAndDelete(own(q)); if (!p) return s.status(404).json({ message: 'Project not found' });
  rm(p.original); rm(p.preview); s.json({ ok: true });
}));
module.exports = r;
