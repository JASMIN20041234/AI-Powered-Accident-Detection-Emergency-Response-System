const IncidentModel  = require('../models/incident.model');
const ContactModel   = require('../models/contact.model');
const NotificationSvc = require('../services/notification.service');
const asyncHandler   = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const incidents = await IncidentModel.findAllByUser(req.user.id);
  res.json(incidents);
});

const create = asyncHandler(async (req, res) => {
  const { event_type, magnitude, latitude, longitude, accuracy, status } = req.body;
  const incident = await IncidentModel.create({
    user_id:    req.user.id,
    event_type,
    magnitude:  Number(magnitude),
    latitude:   latitude  ? Number(latitude)  : null,
    longitude:  longitude ? Number(longitude) : null,
    accuracy:   accuracy  ? Number(accuracy)  : null,
    status:     status || 'detected',
  });
  res.status(201).json(incident);
});

const dispatch = asyncHandler(async (req, res) => {
  const { incident_id } = req.body;
  if (!incident_id) return res.status(400).json({ error: 'incident_id is required' });

  const incident = await IncidentModel.findById(incident_id, req.user.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const contacts = await ContactModel.findAllByUser(req.user.id);
  const results  = await NotificationSvc.dispatch({ incident, contacts, userId: req.user.id });

  res.json({ dispatched: true, results });
});

const testSend = asyncHandler(async (req, res) => {
  const { phone, apikey } = req.body;
  if (!phone || !apikey) return res.status(400).json({ error: 'phone and apikey are required' });
  const result = await NotificationSvc.testSend({ phone, apikey });
  res.json(result);
});

const clearAll = asyncHandler(async (req, res) => {
  await IncidentModel.removeAllByUser(req.user.id);
  res.status(204).end();
});

module.exports = { list, create, dispatch, testSend, clearAll };
