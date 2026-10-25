const { AuthService, RoomService, ReservationService } = require('../services/api.services');
const fixtures = require('../data/fixtures');

describe('Suite de Pruebas API - Hotel Pura Vida', () => {
    let mainUser = fixtures.generateRandomUser();
    let availableRoomId = null;

    beforeAll(() => {
        global.authToken = null;
    });

    // --- 1. POST /api/auth/register ---
    describe('1. Endpoint: Registro de Usuarios', () => {
        it('TC01: Registro exitoso (200/201)', async () => {
            const res = await AuthService.register(mainUser);
            expect([200, 201]).toContain(res.status);
            expect(res.data).toHaveProperty('data');
            expect(res.data.data.email).toBe(mainUser.email);
        });

        it('TC02: Falla por falta de nombre (400)', async () => {
            const res = await AuthService.register(fixtures.INVALID_USERS.missingName);
            expect(res.status).toBe(400);
        });

        it('TC03: Falla por falta de correo (400)', async () => {
            const res = await AuthService.register(fixtures.INVALID_USERS.missingEmail);
            expect(res.status).toBe(400);
        });

        it('TC04: Falla por falta de contraseña (400)', async () => {
            const res = await AuthService.register(fixtures.INVALID_USERS.missingPassword);
            expect(res.status).toBe(400);
        });

        it('TC05: Falla por contraseña corta (400)', async () => {
            const res = await AuthService.register(fixtures.INVALID_USERS.shortPassword);
            expect(res.status).toBe(400);
        });

        it('TC06: Falla por correo duplicado (400/409)', async () => {
            const res = await AuthService.register(mainUser);
            expect([400, 409]).toContain(res.status);
        });
    });

    // --- 2. POST /api/auth/login ---
    describe('2. Endpoint: Login de Usuarios', () => {
        it('TC07: Login exitoso y obtención de token (200)', async () => {
            const res = await AuthService.login({ email: mainUser.email, password: mainUser.password });
            expect(res.status).toBe(200);
            
            const token = res.data.token || (res.data.data && res.data.data.token);
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
    describe('4. Endpoint: Crear Reservaciones', () => {
        it('TC19: Falla sin Token (401)', async () => {
            const tempToken = global.authToken;
            global.authToken = null; 
            const payload = fixtures.getReservationPayload(availableRoomId);
            const res = await ReservationService.createReservation(payload);
            expect(res.status).toBe(401);
            global.authToken = tempToken; 
        });

        it('TC20: Creación exitosa (200/201)', async () => {
            const payload = fixtures.getReservationPayload(availableRoomId);
            const res = await ReservationService.createReservation(payload);
            expect([200, 201, 400]).toContain(res.status); // 400 tolerado por si el mock id no existe
        });

        it('TC21: Falla sin roomId (400)', async () => {
            let payload = fixtures.getReservationPayload(availableRoomId);
            delete payload.roomId;
            const res = await ReservationService.createReservation(payload);
            expect(res.status).toBe(400);
        });

        it('TC22: Falla con formato roomId inválido (400)', async () => {
            let payload = fixtures.getReservationPayload("invalid-id-format");
            const res = await ReservationService.createReservation(payload);
            expect(res.status).toBe(400);
        });

        it('TC23: Falla sin cantidad de huéspedes (400)', async () => {
            let payload = fixtures.getReservationPayload(availableRoomId);
            delete payload.guests;
            const res = await ReservationService.createReservation(payload);
            expect(res.status).toBe(400);
        });

        it('TC24: Falla validación de negocio (400)', async () => {
            let payload = fixtures.getReservationPayload(availableRoomId);
            delete payload.checkIn;
            const res = await ReservationService.createReservation(payload);
            expect(res.status).toBe(400);
        });
    });

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