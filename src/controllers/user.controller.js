const userRepository = require("../repositories/user.repository");

async function list(req, res, next) {
  try {
    res.json({ data: await userRepository.findAll() });
  } catch (error) {
    next(error);
  }
}

module.exports = { list };
