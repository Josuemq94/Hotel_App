const reservationService = require("../services/reservation.service");

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const list = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.getAll(req.user, req.query) });
});

const get = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.getById(req.params.id, req.user) });
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await reservationService.create(req.body, req.user) });
});

const update = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.update(req.params.id, req.body, req.user) });
});

const updateStatus = asyncHandler(async (req, res) => {
  res.json({ data: await reservationService.updateStatus(req.params.id, req.body.status, req.user) });
});

const remove = asyncHandler(async (req, res) => {
  await reservationService.delete(req.params.id, req.user);
  res.status(204).send();
});

module.exports = { list, get, create, update, updateStatus, remove };
