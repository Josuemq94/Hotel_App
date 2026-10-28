
const { aUser } = require('./builders/user.builder');
const { aReservation } = require('./builders/reservation.builder');
const registerCases = require('./cases/register.cases');
const reservationCases = require('./cases/reservation.cases');

/** Usuario válido con email único. */
const generateRandomUser = () => aUser().build();

/**
 * Usuarios inválidos con una sola falla cada uno.
 * @deprecated Los casos de Registro viven en cases/register.cases.js.
 */
const INVALID_USERS = {
    missingName: aUser().without('name').build(),
    missingEmail: aUser().without('email').build(),
    missingPassword: aUser().without('password').build(),
    shortPassword: aUser().with({ password: 'Qa12!' }).build()
};

/** Búsquedas de disponibilidad de habitaciones. */
const ROOM_SEARCH = {
    valid: { checkIn: "2026-11-01", checkOut: "2026-11-05", type: "deluxe" },
    noType: { checkIn: "2026-11-01", checkOut: "2026-11-05" },
    missingCheckIn: { checkOut: "2026-11-05" },
    missingCheckOut: { checkIn: "2026-11-01" },
    invalidDates: { checkIn: "2026-11-05", checkOut: "2026-11-01" }
};

/** Datos trasladados desde los tests para evitar valores quemados (TC09, TC10, TC29) */
const MANUAL_TEST_DATA = {
    tc09: { password: 'WrongPassword!' },
    tc10: { email: 'notexists@test.com', password: 'pwd' },
    tc29: { invalidToken: 'INVALID_TOKEN_12345' }
};

/**
 * Payload de reserva válido según el contrato real de la API.
 * @deprecated Usar aReservation(). Se mantiene para no romper código existente.
 */
const getReservationPayload = (roomId) =>
    aReservation().with(roomId ? { room: roomId } : {}).build();

module.exports = {
    aUser,
    aReservation,
    registerCases,
    reservationCases,
    generateRandomUser,
    INVALID_USERS,
    ROOM_SEARCH,
    MANUAL_TEST_DATA,
    getReservationPayload
};