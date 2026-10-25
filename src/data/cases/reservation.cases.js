const { aReservation } = require('../builders/reservation.builder');

/**
 * Casos de datos de POST /reservations (requiere sesión).
 *
 * Reglas (ReservationService.validateData y el modelo Reservation):
 * - guestName, email, roomType, checkIn, checkOut y guests son obligatorios
 * - roomType: standard | deluxe | suite
 * - guests: número entero de 1 a 10
 * - checkOut posterior a checkIn (mínimo 1 noche)
 * - room (opcional): id de MongoDB válido
 * - precio: tarifa × noches + 15 por cada huésped después del segundo, por noche
 *   (tarifas: standard 80, deluxe 130, suite 220)
 *
 * Los precios esperados están calculados a mano: son el oráculo del caso, no una
 * copia de la fórmula de la API (si la API calcula mal, el caso lo detecta).
 */

const GUESTS_MAX = 10;

const RESERVATION_ERRORS = Object.freeze({
    invalidData: 'Invalid reservation data',
    authRequired: 'Authentication required'
});

/** Reserva válida por defecto: deluxe, 3 noches, 2 huéspedes → 130 × 3 = 390 */
const VALID_RESERVATION = {
    id: 'RES-01',
    payload: aReservation().build(),
    expectedTotalPrice: 390
};

/** Valor límite válido, con recargo por huéspedes extra → 201 */
const VALID_CASES = [
    {
        id: 'RES-02',
        scenario: `huéspedes en el límite superior (${GUESTS_MAX})`,
        payload: aReservation().forGuests(GUESTS_MAX).build(),
        expectedTotalPrice: 750 // 130 × 3 + (10 − 2) × 15 × 3
    }
];

/** Valores límite inválidos y valor fuera del catálogo → 400 */
const INVALID_VALUES = [
    {
        id: 'RES-03',
        scenario: `huéspedes sobre el límite (${GUESTS_MAX + 1})`,
        payload: aReservation().forGuests(GUESTS_MAX + 1).build(),
        expectedError: RESERVATION_ERRORS.invalidData
    },
    {
        id: 'RES-04',
        scenario: 'check-out el mismo día del check-in (0 noches)',
        payload: aReservation().forNights(0).build(),
        expectedError: RESERVATION_ERRORS.invalidData
    },
    {
        id: 'RES-05',
        scenario: 'tipo de habitación fuera del catálogo',
        payload: aReservation().ofType('presidential').build(),
        expectedError: RESERVATION_ERRORS.invalidData
    }
];

/** Reserva válida enviada sin sesión → 401 */
const UNAUTHENTICATED = {
    id: 'RES-06',
    payload: aReservation().build(),
    expectedError: RESERVATION_ERRORS.authRequired
};

/**
 * Defectos detectados en la API. Estos casos describen el comportamiento correcto,
 * así que fallan mientras el defecto exista.
 *
 * RES-07: cambiar el estado de una reserva es exclusivo de admin
 * (PATCH /reservations/:id/status), pero POST /reservations acepta `status` de
 * cualquier usuario. Una reserva nueva debería quedar "pending" y la API la guarda
 * "confirmed".
 */
const KNOWN_DEFECTS = [
    {
        id: 'RES-07',
        scenario: 'un usuario sin rol admin no puede crear la reserva ya confirmada',
        payload: aReservation().with({ status: 'confirmed' }).build(),
        expectedReservationStatus: 'pending'
    }
];

module.exports = {
    RESERVATION_ERRORS,
    VALID_RESERVATION,
    VALID_CASES,
    INVALID_VALUES,
    UNAUTHENTICATED,
    KNOWN_DEFECTS
};
