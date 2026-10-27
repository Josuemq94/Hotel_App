/**
 * Mensajes de error exactos que devuelve la API (AuthService, RoomService y
 * authenticate). Se centralizan aquí para que los tests no repitan textos.
 */
const API_ERRORS = Object.freeze({
    missingCredentials: 'Ingresa tu correo y contraseña',
    invalidCredentials: 'Correo o contraseña incorrectos',
    invalidSearch: 'Valid checkIn and checkOut dates are required',
    authRequired: 'Authentication required'
});

/** Token que no es un JWT válido (el mensaje exacto lo define jsonwebtoken). */
const INVALID_TOKEN = 'invalid.token.test';

module.exports = { API_ERRORS, INVALID_TOKEN };
