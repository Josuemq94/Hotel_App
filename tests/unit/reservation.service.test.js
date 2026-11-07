jest.mock('../../src/repositories/reservation.repository', () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn()
}));

const reservationRepository = require('../../src/repositories/reservation.repository');
const reservationService = require('../../src/services/reservation.service');

const VALID_ID = '507f1f77bcf86cd799439011';
const admin = { sub: 'admin-id', role: 'admin' };
const client = { sub: 'user-id', role: 'user' };

const validReservation = (overrides = {}) => ({
    guestName: '  Ana Mora  ',
    email: 'ANA@Correo.com',
    roomType: 'deluxe',
    checkIn: '2026-12-01',
    checkOut: '2026-12-04',
    guests: 2,
    ...overrides
});

beforeEach(() => jest.clearAllMocks());

describe('ReservationService.calculatePrice', () => {
    test('cobra la tarifa por noche según el tipo de habitación', () => {
        const price = reservationService.calculatePrice({ roomType: 'standard', checkIn: '2026-12-01', checkOut: '2026-12-03', guests: 2 });
        expect(price).toBe(160); // 2 noches x 80
    });

    test('suma 15 por noche por cada huésped adicional a 2', () => {
        const price = reservationService.calculatePrice({ roomType: 'suite', checkIn: '2026-12-01', checkOut: '2026-12-02', guests: 4 });
        expect(price).toBe(250); // 220 + 2 x 15
    });
});

describe('ReservationService.validateData', () => {
    test('normaliza nombre, correo, fechas y cantidad de huéspedes', () => {
        const result = reservationService.validateData(validReservation({ guests: '3' }));
        expect(result.guestName).toBe('Ana Mora');
        expect(result.email).toBe('ana@correo.com');
        expect(result.guests).toBe(3);
        expect(result.checkIn).toBeInstanceOf(Date);
    });

    test.each([
        ['tipo de habitación inexistente', { roomType: 'penthouse' }],
        ['correo inválido', { email: 'sin-arroba' }],
        ['checkOut igual a checkIn', { checkOut: '2026-12-01' }],
        ['checkOut antes de checkIn', { checkOut: '2026-11-30' }],
        ['0 huéspedes', { guests: 0 }],
        ['más de 10 huéspedes', { guests: 11 }],
        ['huéspedes no entero', { guests: 2.5 }],
        ['fecha inválida', { checkIn: 'no-es-fecha' }],
        ['nombre vacío', { guestName: '' }]
    ])('rechaza con 400: %s', (_caso, override) => {
        expect(() => reservationService.validateData(validReservation(override)))
            .toThrow(expect.objectContaining({ statusCode: 400, message: 'Invalid reservation data' }));
    });

    test('rechaza un id de habitación inválido', () => {
        expect(() => reservationService.validateData(validReservation({ room: 'abc' })))
            .toThrow(expect.objectContaining({ statusCode: 400, message: 'Invalid room id' }));
    });

    test('rechaza un estado que no existe', () => {
        expect(() => reservationService.validateData(validReservation({ status: 'archived' })))
            .toThrow(expect.objectContaining({ statusCode: 400, message: 'Invalid reservation status' }));
    });
});

describe('ReservationService.create', () => {
    test('guarda la reserva con el usuario de la sesión y el precio calculado', async () => {
        reservationRepository.create.mockResolvedValue({ _id: VALID_ID });
        await reservationService.create(validReservation(), client);
        expect(reservationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            user: 'user-id',
            totalPrice: 390 // 3 noches x 130
        }));
    });
});

describe('ReservationService.getAll', () => {
    test('un cliente solo ve sus propias reservas', async () => {
        await reservationService.getAll(client, { userId: VALID_ID });
        expect(reservationRepository.findAll).toHaveBeenCalledWith({ user: 'user-id' });
    });

    test('un admin puede filtrar por usuario', async () => {
        await reservationService.getAll(admin, { userId: VALID_ID });
        expect(reservationRepository.findAll).toHaveBeenCalledWith({ user: VALID_ID });
    });

    test('un admin con userId inválido ve todas las reservas', async () => {
        await reservationService.getAll(admin, { userId: 'x' });
        expect(reservationRepository.findAll).toHaveBeenCalledWith({});
    });
});

describe('ReservationService.updateStatus', () => {
    test('un cliente no puede cambiar el estado (403)', async () => {
        await expect(reservationService.updateStatus(VALID_ID, 'confirmed', client))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test('rechaza un estado inválido (400)', async () => {
        await expect(reservationService.updateStatus(VALID_ID, 'archived', admin))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('responde 404 si la reserva no existe', async () => {
        reservationRepository.updateById.mockResolvedValue(null);
        await expect(reservationService.updateStatus(VALID_ID, 'confirmed', admin))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('actualiza el estado cuando todo es válido', async () => {
        reservationRepository.updateById.mockResolvedValue({ status: 'confirmed' });
        await expect(reservationService.updateStatus(VALID_ID, 'confirmed', admin))
            .resolves.toEqual({ status: 'confirmed' });
    });
});

describe('ReservationService.getById / update / delete', () => {
    test('rechaza un id inválido (400)', async () => {
        await expect(reservationService.getById('123', client)).rejects.toMatchObject({ statusCode: 400 });
    });

    test('un cliente solo busca dentro de sus reservas', async () => {
        reservationRepository.findById.mockResolvedValue({ _id: VALID_ID });
        await reservationService.getById(VALID_ID, client);
        expect(reservationRepository.findById).toHaveBeenCalledWith(VALID_ID, { user: 'user-id' });
    });

    test('responde 404 si la reserva no existe', async () => {
        reservationRepository.findById.mockResolvedValue(null);
        await expect(reservationService.getById(VALID_ID, admin)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('update recalcula el precio', async () => {
        reservationRepository.findById.mockResolvedValue({ _id: VALID_ID });
        await reservationService.update(VALID_ID, validReservation({ roomType: 'standard' }), admin);
        expect(reservationRepository.updateById).toHaveBeenCalledWith(VALID_ID, expect.objectContaining({ totalPrice: 240 }), {});
    });

    test('delete responde 404 si no borró nada', async () => {
        reservationRepository.deleteById.mockResolvedValue(null);
        await expect(reservationService.delete(VALID_ID, client)).rejects.toMatchObject({ statusCode: 404 });
    });

    test('delete termina sin error si la reserva existe', async () => {
        reservationRepository.deleteById.mockResolvedValue({ _id: VALID_ID });
        await expect(reservationService.delete(VALID_ID, client)).resolves.toBeUndefined();
    });
});
