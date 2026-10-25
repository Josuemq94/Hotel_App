const { uniqueEmail } = require('./unique');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** El check-in por defecto cae 90 días después de hoy: los datos nunca vencen. */
const DEFAULT_CHECK_IN_OFFSET_DAYS = 90;

/** Fecha en formato YYYY-MM-DD, el que usa el contrato de la API. */
const toIsoDate = (date) => date.toISOString().slice(0, 10);

const daysFromToday = (days) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return new Date(today.getTime() + days * DAY_IN_MS);
};

/**
 * Test Data Builder de reservas, alineado al contrato real de POST /reservations
 * (colección Postman y ReservationService.validateData):
 * guestName, email, roomType, checkIn, checkOut y guests. `room` es opcional.
 *
 * Por defecto: deluxe, 3 noches, 2 huéspedes.
 *
 * @example aReservation().build()
 * @example aReservation().ofType('suite').forNights(2).forGuests(4).build()
 * @example aReservation().without('roomType').build()
 */
class ReservationBuilder {
    constructor() {
        this.fields = {
            guestName: 'Huesped QA',
            email: uniqueEmail('qa.guest'),
            roomType: 'deluxe',
            guests: 2
        };
        this.nights = 3;
        this.overrides = {};
        this.removed = [];
    }

    ofType(roomType) {
        this.fields.roomType = roomType;
        return this;
    }

    forGuests(guests) {
        this.fields.guests = guests;
        return this;
    }

    /** Cantidad de noches. Con 0 o un número negativo genera fechas inválidas a propósito. */
    forNights(nights) {
        this.nights = nights;
        return this;
    }

    /** Reemplaza cualquier campo, incluidas las fechas calculadas. */
    with(overrides) {
        Object.assign(this.overrides, overrides);
        return this;
    }

    without(...fields) {
        this.removed.push(...fields);
        return this;
    }

    build() {
        const checkIn = daysFromToday(DEFAULT_CHECK_IN_OFFSET_DAYS);
        const checkOut = new Date(checkIn.getTime() + this.nights * DAY_IN_MS);
        const payload = {
            ...this.fields,
            checkIn: toIsoDate(checkIn),
            checkOut: toIsoDate(checkOut),
            ...this.overrides
        };
        this.removed.forEach((field) => delete payload[field]);
        return payload;
    }
}

const aReservation = () => new ReservationBuilder();

module.exports = { aReservation };
