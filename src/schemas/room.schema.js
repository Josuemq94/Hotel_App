/** Contrato de una habitación (room.model.js) tal como la devuelve GET /rooms/available. */
const ROOM_TYPES = ['standard', 'deluxe', 'suite'];
const ROOM_STATUSES = ['available', 'maintenance'];

const roomSchema = {
    type: 'object',
    required: ['_id', 'number', 'type', 'capacity', 'pricePerNight', 'status'],
    additionalProperties: false,
    properties: {
        _id: { type: 'string', format: 'objectid' },
        number: { type: 'string', minLength: 1 },
        type: { type: 'string', enum: ROOM_TYPES },
        capacity: { type: 'integer', minimum: 1, maximum: 10 },
        pricePerNight: { type: 'number', minimum: 0 },
        status: { type: 'string', enum: ROOM_STATUSES },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        __v: { type: 'integer' }
    }
};

module.exports = { roomSchema, ROOM_TYPES, ROOM_STATUSES };
