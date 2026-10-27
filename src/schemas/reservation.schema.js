/**
 * Contrato de una reserva en GET /reservations.
 *
 * El repositorio hace `populate`, así que en la lista `user` es { _id, name, email }
 * y `room` es { _id, number, type } (o no viene si la reserva no tiene habitación).
 * En POST /reservations, en cambio, `user` es solo un id.
 */
const ROOM_TYPES = ['standard', 'deluxe', 'suite'];
const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const objectId = { type: 'string', format: 'objectid' };

const reservationListItemSchema = {
    type: 'object',
    required: ['_id', 'guestName', 'email', 'roomType', 'user', 'checkIn', 'checkOut', 'guests', 'totalPrice', 'status'],
    additionalProperties: false,
    properties: {
        _id: objectId,
        guestName: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', maxLength: 160 },
        roomType: { type: 'string', enum: ROOM_TYPES },
        user: {
            type: 'object',
            required: ['_id', 'name', 'email'],
            additionalProperties: false,
            properties: { _id: objectId, name: { type: 'string' }, email: { type: 'string' } }
        },
        room: {
            type: ['object', 'null'],
            additionalProperties: false,
            properties: { _id: objectId, number: { type: 'string' }, type: { type: 'string', enum: ROOM_TYPES } }
        },
        checkIn: { type: 'string', format: 'date-time' },
        checkOut: { type: 'string', format: 'date-time' },
        guests: { type: 'integer', minimum: 1, maximum: 10 },
        totalPrice: { type: 'number', minimum: 0 },
        status: { type: 'string', enum: RESERVATION_STATUSES },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        __v: { type: 'integer' }
    }
};

module.exports = { reservationListItemSchema, RESERVATION_STATUSES };
