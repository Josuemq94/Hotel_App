const { AuthService, RoomService, ReservationService } = require('../services/api.services');
const fixtures = require('../data/fixtures');
const { API_ERRORS, INVALID_TOKEN } = require('../data/cases/api-errors');
const { registerUser, extractAuthToken, withToken, withoutAuth } = require('../support/session');
const { createReservationCleanup } = require('../support/cleanup');
const { expectApiError, expectData, expectDataList, expectEveryItem, expectJson, expectStatus } = require('../support/assertions');
const { userSchema } = require('../schemas/user.schema');
const { roomSchema } = require('../schemas/room.schema');
const { reservationListItemSchema } = require('../schemas/reservation.schema');

/**
 * Todos los casos validan status code Y body:
 * - éxito:  expectData / expectDataList (status, JSON, contrato del body y contenido)
 * - error:  expectApiError (status, JSON, forma { error } y mensaje exacto)
 */
/** Id válido de un usuario que no es el de la sesión: GET /reservations lo ignora si no eres admin. */
const FOREIGN_USER_ID = '507f1f77bcf86cd799439011';

describe('Suite de Pruebas API - Hotel Pura Vida', () => {
    let mainUser = fixtures.generateRandomUser();

    // Setup: registra el usuario que usan los bloques de Login y Reservaciones
    beforeAll(async () => {
        global.authToken = null;
        await registerUser(mainUser);
    });

    // --- 1. POST /api/auth/register ---
    // Casos en auth-register.test.js

    // --- 2. POST /api/auth/login ---
    describe('2. Endpoint: Login de Usuarios', () => {
        it('TC07: Login exitoso y obtención de token (200)', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: mainUser.password });

            const user = expectData(res, 200, userSchema);
            expect(user.email).toBe(mainUser.email);

            // La API entrega el token en la cookie httpOnly "hotel_token", no en el body
            const token = extractAuthToken(res);
            expect(token).toBeTruthy(); // toBeDefined() pasaría también con null
            global.authToken = token;
        });

        it('TC08: Validación de estructura de respuesta', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: mainUser.password });

            const user = expectData(res, 200, userSchema);
            expect(user).toMatchObject({ name: mainUser.name, email: mainUser.email, role: 'user' });
        });

        it('TC09: Falla con contraseña incorrecta (401)', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: 'WrongPassword!' });

            expectApiError(res, 401, API_ERRORS.invalidCredentials);
        });

        it('TC10: Falla con correo inexistente (401)', async () => {
            const res = await AuthService.login({ email: 'notexists@test.com', password: 'pwd' });

            expectApiError(res, 401, API_ERRORS.invalidCredentials);
        });

        it('TC11: Falla sin enviar email (400)', async () => {
            const res = await AuthService.login({ password: 'pwd' });

            expectApiError(res, 400, API_ERRORS.missingCredentials);
        });

        it('TC12: Falla sin enviar contraseña (400)', async () => {
            const res = await AuthService.login({ email: mainUser.email });

            expectApiError(res, 400, API_ERRORS.missingCredentials);
        });
    });

    // --- 3. GET /api/rooms/available ---
    describe('3. Endpoint: Disponibilidad de Habitaciones', () => {
        it('TC13: Consulta válida (200)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.valid);

            const rooms = expectDataList(res, 200, roomSchema);
            expectEveryItem(rooms, 'type', fixtures.ROOM_SEARCH.valid.type);
            expectEveryItem(rooms, 'status', 'available');
        });

        it('TC14: Consulta sin especificar tipo (200)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.noType);

            const rooms = expectDataList(res, 200, roomSchema);
            expectEveryItem(rooms, 'status', 'available');
        });

        it('TC15: Falla sin Check-In (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.missingCheckIn);

            expectApiError(res, 400, API_ERRORS.invalidSearch);
        });

        it('TC16: Falla sin Check-Out (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.missingCheckOut);

            expectApiError(res, 400, API_ERRORS.invalidSearch);
        });

        it('TC17: Falla fechas ilógicas (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.invalidDates);

            expectApiError(res, 400, API_ERRORS.invalidSearch);
        });

        it('TC18: Estructura contiene data', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.valid);

            // Sobre de la respuesta: JSON, solo la clave "data" y de tipo arreglo
            expectStatus(res, 200);
            expectJson(res);
            expect(Object.keys(res.data)).toEqual(['data']);
            expect(Array.isArray(res.data.data)).toBe(true);
        });
    });

    // --- 4. POST /api/reservations ---
    // Casos en reservations-create.test.js

    // --- 5. GET /api/reservations ---
    describe('5. Endpoint: Consultar Reservaciones', () => {
        const reservations = createReservationCleanup();
        let ownerToken;
        let first; // la reserva creada primero (la más antigua)
        let second; // la reserva creada después (la más reciente)

        const createReservation = async (payload) => {
            const res = reservations.track(await ReservationService.createReservation(payload));
            expectStatus(res, 201); // si el setup falla, el error lo dice
            return res.data.data;
        };

        // Setup: sesión propia (no depende de TC07) y dos reservas para que las
        // validaciones sobre cada elemento de la lista se ejecuten de verdad
        beforeAll(async () => {
            const login = await AuthService.login({ email: mainUser.email, password: mainUser.password });
            ownerToken = extractAuthToken(login);
            global.authToken = ownerToken;

            first = await createReservation(fixtures.aReservation().ofType('standard').forNights(2).build());
            second = await createReservation(fixtures.aReservation().ofType('suite').forNights(3).build());
        });

        // Teardown: borra las reservas creadas con el token de su dueño
        afterAll(async () => {
            global.authToken = ownerToken;
            await reservations.cleanup();
        });

        it('TC25: Listado exitoso (200)', async () => {
            const res = await ReservationService.getReservations();

            const list = expectDataList(res, 200, reservationListItemSchema);
            // Un usuario sin rol admin solo ve sus propias reservas: exactamente las dos creadas
            expect(list.map((item) => item._id).sort()).toEqual([first._id, second._id].sort());
            list.forEach((item) => expect(item.user.email.toLowerCase()).toBe(mainUser.email.toLowerCase()));
        });

        it('TC26: Ignora el parámetro userId si el usuario no es admin (200)', async () => {
            // Solo un admin puede consultar las reservas de otro usuario con ?userId=
            const res = await ReservationService.getReservations({ userId: FOREIGN_USER_ID });

            const list = expectDataList(res, 200, reservationListItemSchema);
            expect(list.map((item) => item._id).sort()).toEqual([first._id, second._id].sort());
        });

        it('TC27: Ordena de la más reciente a la más antigua (200)', async () => {
            const res = await ReservationService.getReservations();

            const list = expectDataList(res, 200, reservationListItemSchema);
            expect(list.map((item) => item._id)).toEqual([second._id, first._id]);
        });

        it('TC28: Falla sin Token (401)', async () => {
            const res = await withoutAuth(() => ReservationService.getReservations());

            expectApiError(res, 401, API_ERRORS.authRequired);
        });

        it('TC29: Falla con Token inválido (401)', async () => {
            const res = await withToken(INVALID_TOKEN, () => ReservationService.getReservations());

            expectApiError(res, 401);
        });

        it('TC30: Estructura contiene data', async () => {
            const res = await ReservationService.getReservations();

            // Sobre de la respuesta: JSON, solo la clave "data" y de tipo arreglo
            expectStatus(res, 200);
            expectJson(res);
            expect(Object.keys(res.data)).toEqual(['data']);
            expect(Array.isArray(res.data.data)).toBe(true);
        });
    });
});
