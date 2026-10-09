const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User, Feedback, getSettings, h } = require('../models'); const { auth } = require('../middleware/auth');
const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, favColors: u.favColors.map(String), favPatterns: u.favPatterns.map(String) });
const bad = (s, m, c = 400) => s.status(c).json({ message: m });

r.post('/register', h(async (q, s) => {
  if (!(await getSettings()).allowRegistration) return bad(s, 'Registration is currently disabled', 403);
  const { name, email, password } = q.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6) return bad(s, 'Valid name, email and a password of 6+ characters are required');
  if (await User.findOne({ email: email.toLowerCase() })) return bad(s, 'Email already registered', 409);
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), lastLoginAt: new Date(), sessions: 1 });
  s.status(201).json({ token: sign(u), user: pub(u) });
}));
r.post('/login', h(async (q, s) => {
  const u = await User.findOne({ email: (q.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.password))) return bad(s, 'Invalid email or password', 401);
  u.lastLoginAt = new Date(); u.sessions++; await u.save();
  s.json({ token: sign(u), user: pub(u) });
}));
r.use(auth);
r.get('/me', h(async (q, s) => s.json(pub(await User.findById(q.user.id)))));
r.post('/logout', h(async (q, s) => {
  const u = await User.findById(q.user.id);
  if (u?.lastLoginAt) { u.totalSessionMs += Date.now() - u.lastLoginAt; u.lastLoginAt = null; await u.save(); }
  s.json({ ok: true });
}));
r.post('/favourites', h(async (q, s) => {
  const u = await User.findById(q.user.id), f = q.body.type === 'pattern' ? 'favPatterns' : 'favColors', id = String(q.body.id);
  u[f] = u[f].map(String).includes(id) ? u[f].filter(x => String(x) !== id) : [...u[f], id];
  await u.save(); s.json(pub(u));
}));
r.post('/feedback', h(async (q, s) => {
  const rating = +q.body.rating; if (!(rating >= 1 && rating <= 5)) return bad(s, 'Rating 1-5 required');
  await Feedback.create({ user: q.user.id, rating, comment: String(q.body.comment || '').slice(0, 500) }); s.status(201).json({ ok: true });
}));
module.exports = r;
