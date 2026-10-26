const { ReservationService } = require('../services/api.services');
const { reservationCases: cases } = require('../data/fixtures');
const { createSession, withoutAuth } = require('../support/session');
const { createReservationCleanup } = require('../support/cleanup');

const OBJECT_ID = /^[a-f\d]{24}$/i;

describe('Endpoint: Crear reserva (POST /reservations)', () => {
    const reservations = createReservationCleanup();
    let session;

    // Setup: este archivo trabaja con su propio usuario y su propia sesión
    beforeAll(async () => {
        session = await createSession();
    });

    // Teardown: borra todas las reservas que se crearon en este archivo
    afterAll(async () => {
        await reservations.cleanup();
    });

    const createReservation = async (payload) =>
        reservations.track(await ReservationService.createReservation(payload));

    describe('Escenarios positivos (201)', () => {
        it('RES-01: crea una reserva válida con el estado inicial, el dueño y el precio correctos', async () => {
            const { payload, expectedTotalPrice } = cases.VALID_RESERVATION;
            const res = await createReservation(payload);

            expect(res.status).toBe(201);
            expect(res.data.data).toMatchObject({
                _id: expect.stringMatching(OBJECT_ID),
                guestName: payload.guestName,
                email: payload.email,
                roomType: payload.roomType,
                guests: payload.guests,
                checkIn: `${payload.checkIn}T00:00:00.000Z`,
                checkOut: `${payload.checkOut}T00:00:00.000Z`,
                status: 'pending',
                user: session.user.id,
                totalPrice: expectedTotalPrice
            });
        });

        it.each(cases.VALID_CASES)('$id: acepta $scenario', async ({ payload, expectedTotalPrice }) => {
            const res = await createReservation(payload);

            expect(res.status).toBe(201);
            expect(res.data.data).toMatchObject({
                roomType: payload.roomType,
                guests: payload.guests,
                totalPrice: expectedTotalPrice
            });
        });
    });

    describe('Escenarios negativos: validación de datos (400)', () => {
        it.each(cases.INVALID_VALUES)('$id: rechaza $scenario', async ({ payload, expectedError }) => {
            const res = await createReservation(payload);

            expect(res.status).toBe(400);
            expect(res.data).toEqual({ error: expectedError });
        });
    });

    describe('Escenario negativo: autenticación (401)', () => {
        it(`${cases.UNAUTHENTICATED.id}: rechaza una reserva válida enviada sin sesión`, async () => {
            const res = await withoutAuth(() => createReservation(cases.UNAUTHENTICATED.payload));

            expect(res.status).toBe(401);
            expect(res.data).toEqual({ error: cases.UNAUTHENTICATED.expectedError });
        });
    });

    describe('Defectos detectados (fallan mientras el defecto exista)', () => {
        it.each(cases.KNOWN_DEFECTS)(
            '$id: [DEFECTO] $scenario',
            async ({ payload, expectedReservationStatus }) => {
                const res = await createReservation(payload);

                expect(res.status).toBe(201);
                expect(res.data.data.status).toBe(expectedReservationStatus);
            }
        );
    });
});
