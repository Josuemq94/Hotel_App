const Room = require("../models/room.model");
const Reservation = require("../models/reservation.model");

class RoomRepository {
  findAll() {
    return Room.find().sort({ number: 1 });
  }

  findById(id) {
    return Room.findById(id);
  }

  create(data) {
    return Room.create(data);
  }

  updateById(id, data) {
    return Room.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return Room.findByIdAndDelete(id);
  }

  async findAvailable(type, checkIn, checkOut) {
  const overlapping = await Reservation.find({
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).distinct("room");
  return Room.find({
    ...(type ? { type } : {}),
    status: "available",
    _id: { $nin: overlapping },
  });
  }
}

module.exports = new RoomRepository();
