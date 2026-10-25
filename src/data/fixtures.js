// Generador de usuarios dinámicos para evitar conflictos 409
const generateRandomUser = () => ({
    name: "Usuario QA Jest",
    email: `jest_user_${Date.now()}@test.com`,
    password: "Test1234Secure!"
});

const INVALID_USERS = {
    missingName: { email: "test@test.com", password: "pwd" },
    missingEmail: { name: "Test", password: "pwd" },
    missingPassword: { name: "Test", email: "test@test.com" },
    shortPassword: { name: "Test", email: "test@test.com", password: "12" }
};

const ROOM_SEARCH = {
    valid: { checkIn: "2026-11-01", checkOut: "2026-11-05", type: "deluxe" },
    noType: { checkIn: "2026-11-01", checkOut: "2026-11-05" },
    missingCheckIn: { checkOut: "2026-11-05" },
    missingCheckOut: { checkIn: "2026-11-01" },
    invalidDates: { checkIn: "2026-11-05", checkOut: "2026-11-01" } 
};

const getReservationPayload = (roomId) => ({
    roomId: roomId,
    guestName: "Huesped QA",
    guestEmail: "guestqa@jest.com",
    checkIn: "2026-12-01",
    checkOut: "2026-12-05",
    guests: 2
});

module.exports = {
    generateRandomUser,
    INVALID_USERS,
    ROOM_SEARCH,
    getReservationPayload
};