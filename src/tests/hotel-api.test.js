const { AuthService, RoomService, ReservationService } = require('../services/api.services');
const fixtures = require('../data/fixtures');
const { registerUser, extractAuthToken } = require('../support/session');

describe('Suite de Pruebas API - Hotel Pura Vida', () => {
    let mainUser = fixtures.generateRandomUser();
    let availableRoomId = null;

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
            expect(res.status).toBe(200);
            
            // La API entrega el token en la cookie httpOnly "hotel_token", no en el body
            const token = extractAuthToken(res);
            expect(token).toBeDefined();
            global.authToken = token; 
        });

        it('TC08: Validación de estructura de respuesta', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: mainUser.password });
            expect(res.data).toHaveProperty('data');
            expect(res.data.data.email).toBe(mainUser.email);
        });

        it('TC09: Falla con contraseña incorrecta (401)', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: "WrongPassword!" });
            expect(res.status).toBe(401);
        });

        it('TC10: Falla con correo inexistente (401)', async () => {
            const res = await AuthService.login({ email: "notexists@test.com", password: "pwd" });
            expect(res.status).toBe(401);
        });

        it('TC11: Falla sin enviar email (400)', async () => {
            const res = await AuthService.login({ password: "pwd" });
            expect(res.status).toBe(400);
        });

        it('TC12: Falla sin enviar contraseña (400)', async () => {
            const res = await AuthService.login({ email: mainUser.email });
            expect(res.status).toBe(400);
        });
    });

    // --- 3. GET /api/rooms/available ---
    describe('3. Endpoint: Disponibilidad de Habitaciones', () => {
        it('TC13: Consulta válida (200)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.valid);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.data.data)).toBeTruthy();
            
            if (res.data.data.length > 0) {
                availableRoomId = res.data.data[0]._id || res.data.data[0].id;
            } else {
                availableRoomId = "6ab36fb773695ef27ee4755e"; // Mock ID
            }
        });

        it('TC14: Consulta sin especificar tipo (200)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.noType);
            expect(res.status).toBe(200);
        });

        it('TC15: Falla sin Check-In (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.missingCheckIn);
            expect(res.status).toBe(400);
        });

        it('TC16: Falla sin Check-Out (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.missingCheckOut);
            expect(res.status).toBe(400);
        });

        it('TC17: Falla fechas ilógicas (400)', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.invalidDates);
            expect(res.status).toBe(400);
        });

        it('TC18: Estructura contiene data', async () => {
            const res = await RoomService.getAvailableRooms(fixtures.ROOM_SEARCH.valid);
            expect(res.data).toHaveProperty('data');
        });
    });

    // --- 4. POST /api/reservations ---
    // Casos en reservations-create.test.js

    // --- 5. GET /api/reservations ---
    describe('5. Endpoint: Consultar Reservaciones', () => {
        it('TC25: Listado exitoso (200)', async () => {
            const res = await ReservationService.getReservations();
            expect(res.status).toBe(200);
            expect(Array.isArray(res.data.data)).toBeTruthy();
        });

        it('TC26: Filtrar por confirmadas (200)', async () => {
            const res = await ReservationService.getReservations({ status: 'confirmed' });
            expect(res.status).toBe(200);
        });

        it('TC27: Filtrar por pendientes (200)', async () => {
            const res = await ReservationService.getReservations({ status: 'pending' });
            expect(res.status).toBe(200);
        });

        it('TC28: Falla sin Token (401)', async () => {
            const tempToken = global.authToken;
            global.authToken = null;
            const res = await ReservationService.getReservations();
            expect(res.status).toBe(401);
            global.authToken = tempToken;
        });

        it('TC29: Falla con Token inválido (401)', async () => {
            const tempToken = global.authToken;
            global.authToken = "invalid.token.test";
            const res = await ReservationService.getReservations();
            expect(res.status).toBe(401);
            global.authToken = tempToken;
        });

        it('TC30: Estructura contiene data', async () => {
            const res = await ReservationService.getReservations();
            expect(res.data).toHaveProperty('data');
        });
    });
});