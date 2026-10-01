const mongoose = require("mongoose");
const roomRepository = require("../repositories/room.repository");

const roomTypes = ["standard", "deluxe", "suite"];

class RoomService {
  getAll() {
    return roomRepository.findAll();
  }

  async getById(id) {
    this.validateId(id);
    const room = await roomRepository.findById(id);
    if (!room) throw this.error("Room not found", 404);
    return room;
  }

  create(data) {
    return roomRepository.create(this.validateData(data));
  }

  async update(id, data) {
    await this.getById(id);
    return roomRepository.updateById(id, this.validateData(data));
  }

  async delete(id) {
    this.validateId(id);
    if (!(await roomRepository.deleteById(id)))
      throw this.error("Room not found", 404);
  }

  available({ type, checkIn, checkOut }) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (
      (type && !roomTypes.includes(type)) ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw this.error("Valid checkIn and checkOut dates are required", 400);
    }
    return roomRepository.findAvailable(type, start, end);
  }

  validateData({ number, type, capacity, pricePerNight, status }) {
    if (
      !number ||
      !roomTypes.includes(type) ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) < 1 ||
      Number(capacity) > 10 ||
      Number(pricePerNight) < 0 ||
      (status && !["available", "maintenance"].includes(status))
    ) {
      throw this.error("Invalid room data", 400);
    }
    return {
      number: String(number).trim(),
      type,
      capacity: Number(capacity),
      pricePerNight: Number(pricePerNight),
      ...(status ? { status } : {}),
    };
  }

  validateId(id) {
    if (!mongoose.isValidObjectId(id)) throw this.error("Invalid room id", 400);
  }

  error(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

module.exports = new RoomService();
