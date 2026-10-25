const apiClient = require('../config/apiClient');

/**
 * Capa Service Object Model (SOM)
 * Abstrae las llamadas HTTP para que las pruebas solo consuman métodos de negocio.
 */

class AuthService {
    async register(payload) {
        return await apiClient.post('/auth/register', payload);
    }
    async login(credentials) {
        return await apiClient.post('/auth/login', credentials);
    }
}

class RoomService {
    async getAvailableRooms(params) {
        return await apiClient.get('/rooms/available', { params });
    }
}

class ReservationService {
    async createReservation(payload) {
        return await apiClient.post('/reservations', payload);
    }
    async getReservations(params = {}) {
        return await apiClient.get('/reservations', { params });
    }
}

module.exports = {
    AuthService: new AuthService(),
    RoomService: new RoomService(),
    ReservationService: new ReservationService()
};