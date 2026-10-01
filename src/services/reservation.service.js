const mongoose = require("mongoose");
const reservationRepository = require("../repositories/reservation.repository");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roomRates = { standard: 80, deluxe: 130, suite: 220 };

class ReservationService {
  async getAll(user, filters = {}) {
    if (user.role !== "admin") {
      return reservationRepository.findAll({ user: user.sub });
    }
    const filter = {};
    if (filters.userId && mongoose.isValidObjectId(filters.userId)) {
      filter.user = filters.userId;
    }
    return reservationRepository.findAll(filter);
  }

  async updateStatus(id, status, user) {
    if (user.role !== "admin") {
      const error = new Error("You are not authorized for this action");
      error.statusCode = 403;
      throw error;
    }
    this.validateId(id);
    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      const error = new Error("Invalid reservation status");
      error.statusCode = 400;
      throw error;
    }
    const updated = await reservationRepository.updateById(id, { status });
    if (!updated) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async getById(id, user) {
    this.validateId(id);
    const reservation = await reservationRepository.findById(id, user.role === "admin" ? {} : { user: user.sub });
    if (!reservation) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }
    return reservation;
  }

  async create(data, user) {
    const normalized = this.validateData(data);
    return reservationRepository.create({
      ...normalized,
      user: user.sub,
      totalPrice: this.calculatePrice(normalized),
    });
  }

  async update(id, data, user) {
    await this.getById(id, user);
    const normalized = this.validateData(data);
    return reservationRepository.updateById(id, {
      ...normalized,
      totalPrice: this.calculatePrice(normalized),
    }, user.role === "admin" ? {} : { user: user.sub });
  }

  async delete(id, user) {
    this.validateId(id);
    const deleted = await reservationRepository.deleteById(id, user.role === "admin" ? {} : { user: user.sub });
    if (!deleted) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }
  }

  validateId(id) {
    if (!mongoose.isValidObjectId(id)) {
      const error = new Error("Invalid reservation id");
      error.statusCode = 400;
      throw error;
    }
  }

  validateData(data) {
    const {
      guestName,
      email,
      roomType,
      room,
      checkIn,
      checkOut,
      guests,
      status,
    } = data;
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (
      !guestName ||
      !email ||
      !roomRates[roomType] ||
      !Number.isInteger(Number(guests)) ||
      !emailPattern.test(email) ||
      Number(guests) < 1 ||
      Number(guests) > 10 ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      const error = new Error("Invalid reservation data");
      error.statusCode = 400;
      throw error;
    }
    if (room && !mongoose.isValidObjectId(room)) {
      const error = new Error("Invalid room id");
      error.statusCode = 400;
      throw error;
    }

    if (
      status &&
      !["pending", "confirmed", "cancelled", "completed"].includes(status)
    ) {
      const error = new Error("Invalid reservation status");
      error.statusCode = 400;
      throw error;
    }

    return {
      guestName: String(guestName).trim(),
      email: String(email).trim().toLowerCase(),
      roomType,
      ...(room ? { room } : {}),
      checkIn: start,
      checkOut: end,
      guests: Number(guests),
      ...(status ? { status } : {}),
    };
  }

  calculatePrice({ roomType, checkIn, checkOut, guests }) {
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / 86400000,
    );
    return roomRates[roomType] * nights + Math.max(0, guests - 2) * 15 * nights;
  }
}

module.exports = new ReservationService();
