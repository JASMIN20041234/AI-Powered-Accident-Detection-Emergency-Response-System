const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { sign } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

function tokenFor(user) {
  return sign({ sub: user.id, username: user.username, role: user.role });
}

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const password_hash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({
    username: username.toLowerCase().trim(),
    email: email || null,
    password_hash,
  });
  res.status(201).json({ token: tokenFor(user), user });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findByUsername(username.toLowerCase().trim());

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password_hash, ...safeUser } = user;
  res.json({ token: tokenFor(safeUser), user: safeUser });
});

const me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = { register, login, me };
