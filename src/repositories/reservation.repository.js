const Reservation = require("../models/reservation.model");

class ReservationRepository {
  findAll(filter = {}) {
    return Reservation.find(filter).populate("room", "number type").populate("user", "name email").sort({ createdAt: -1 });
  }

  findById(id, filter = {}) {
    return Reservation.findOne({ _id: id, ...filter }).populate("room", "number type").populate("user", "name email");
  }

  create(data) {
    return Reservation.create(data);
  }

  updateById(id, data, filter = {}) {
    return Reservation.findOneAndUpdate({ _id: id, ...filter }, data, {
      new: true,
      runValidators: true,
    });
  }

  deleteById(id, filter = {}) {
    return Reservation.findOneAndDelete({ _id: id, ...filter });
  }
}

module.exports = new ReservationRepository();
