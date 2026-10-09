const r = require('express').Router(); const { Color, Pattern, h } = require('../models'); const { auth } = require('../middleware/auth');
r.use(auth);
r.get('/colors', h(async (q, s) => s.json(await Color.find().sort('name'))));
r.get('/patterns', h(async (q, s) => s.json(await Pattern.find().sort('name'))));
module.exports = r;
