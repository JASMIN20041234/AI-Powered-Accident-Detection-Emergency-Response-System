const ContactModel = require('../models/contact.model');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const contacts = await ContactModel.findAllByUser(req.user.id);
  res.json(contacts);
});

const create = asyncHandler(async (req, res) => {
  const { name, relationship, phone, callmebot_apikey } = req.body;
  const contact = await ContactModel.create({
    user_id: req.user.id,
    name: name.trim(),
    relationship: relationship || 'Other',
    phone: phone.replace(/\D/g, ''),
    callmebot_apikey: callmebot_apikey?.trim() || null,
  });
  res.status(201).json(contact);
});

const update = asyncHandler(async (req, res) => {
  const { name, relationship, phone, callmebot_apikey } = req.body;
  const contact = await ContactModel.update(req.params.id, req.user.id, {
    name: name?.trim(),
    relationship,
    phone: phone ? phone.replace(/\D/g, '') : undefined,
    callmebot_apikey: callmebot_apikey?.trim() || null,
  });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await ContactModel.remove(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Contact not found' });
  res.status(204).end();
});

module.exports = { list, create, update, remove };
