const roomService = require("../services/room.service");

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const list = asyncHandler(async (req, res) =>
  res.json({ data: await roomService.getAll() }),
);
const available = asyncHandler(async (req, res) =>
  res.json({ data: await roomService.available(req.query) }),
);
const get = asyncHandler(async (req, res) =>
  res.json({ data: await roomService.getById(req.params.id) }),
);
const create = asyncHandler(async (req, res) =>
  res.status(201).json({ data: await roomService.create(req.body) }),
);
const update = asyncHandler(async (req, res) =>
  res.json({ data: await roomService.update(req.params.id, req.body) }),
);
const remove = asyncHandler(async (req, res) => {
  await roomService.delete(req.params.id);
  res.status(204).send();
});

module.exports = { list, available, get, create, update, remove };
