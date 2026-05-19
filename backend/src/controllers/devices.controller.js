const DeviceModel  = require('../models/device.model');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { device_id, device_name, device_type, firmware_version, metadata } = req.body;
  const device = await DeviceModel.upsert({
    user_id: req.user.id,
    device_id,
    device_name,
    device_type,
    firmware_version,
    metadata,
  });
  res.status(201).json(device);
});

const list = asyncHandler(async (req, res) => {
  const devices = await DeviceModel.findAllByUser(req.user.id);
  res.json(devices);
});

module.exports = { register, list };
