jest.mock('../../src/repositories/room.repository', () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    findAvailable: jest.fn()
}));

const roomRepository = require('../../src/repositories/room.repository');
const roomService = require('../../src/services/room.service');

const VALID_ID = '507f1f77bcf86cd799439011';
const validRoom = (overrides = {}) => ({ number: ' 101 ', type: 'suite', capacity: '4', pricePerNight: '220', ...overrides });

beforeEach(() => jest.clearAllMocks());

describe('RoomService.validateData', () => {
    test('normaliza los datos de una habitación válida', () => {
        expect(roomService.validateData(validRoom({ status: 'maintenance' }))).toEqual({
            number: '101', type: 'suite', capacity: 4, pricePerNight: 220, status: 'maintenance'
        });
    });

    test.each([
        ['sin número', { number: '' }],
        ['tipo inexistente', { type: 'loft' }],
        ['capacidad 0', { capacity: 0 }],
        ['capacidad mayor a 10', { capacity: 11 }],
        ['precio negativo', { pricePerNight: -1 }],
        ['estado inválido', { status: 'closed' }]
    ])('rechaza con 400: %s', (_caso, override) => {
        expect(() => roomService.validateData(validRoom(override))).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
});

describe('RoomService.available', () => {
    test('consulta disponibilidad con fechas válidas', () => {
        roomService.available({ type: 'deluxe', checkIn: '2026-12-01', checkOut: '2026-12-03' });
        expect(roomRepository.findAvailable).toHaveBeenCalledWith('deluxe', new Date('2026-12-01'), new Date('2026-12-03'));
    });

    test.each([
        ['tipo inválido', { type: 'loft', checkIn: '2026-12-01', checkOut: '2026-12-03' }],
        ['checkOut antes de checkIn', { checkIn: '2026-12-05', checkOut: '2026-12-03' }],
        ['sin fechas', {}]
    ])('rechaza con 400: %s', (_caso, query) => {
        expect(() => roomService.available(query)).toThrow(expect.objectContaining({ statusCode: 400 }));
    });
});

describe('RoomService CRUD', () => {
    test('getById rechaza un id inválido', async () => {
        await expect(roomService.getById('abc')).rejects.toMatchObject({ statusCode: 400 });
    });

    test('getById responde 404 si no existe', async () => {
        roomRepository.findById.mockResolvedValue(null);
        await expect(roomService.getById(VALID_ID)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('create guarda los datos normalizados', () => {
        roomService.create(validRoom());
        expect(roomRepository.create).toHaveBeenCalledWith(expect.objectContaining({ number: '101', capacity: 4 }));
    });

    test('update valida que la habitación exista antes de actualizar', async () => {
        roomRepository.findById.mockResolvedValue({ _id: VALID_ID });
        await roomService.update(VALID_ID, validRoom());
        expect(roomRepository.updateById).toHaveBeenCalledWith(VALID_ID, expect.objectContaining({ type: 'suite' }));
    });

    test('delete responde 404 si no existe', async () => {
        roomRepository.deleteById.mockResolvedValue(null);
        await expect(roomService.delete(VALID_ID)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('getAll delega en el repositorio', () => {
        roomService.getAll();
        expect(roomRepository.findAll).toHaveBeenCalled();
    });
});
