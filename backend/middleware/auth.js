const jwt = require('jsonwebtoken');
exports.auth = (q, s, n) => {
  const t = (q.headers.authorization || '').split(' ')[1];
  if (!t) return s.status(401).json({ message: 'Login required' });
  try { q.user = jwt.verify(t, process.env.JWT_SECRET); n(); } catch { s.status(401).json({ message: 'Invalid or expired token' }); }
};
exports.admin = (q, s, n) => q.user.role === 'admin' ? n() : s.status(403).json({ message: 'Admin only' });
