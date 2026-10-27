const { AuthService } = require('../services/api.services');
const { aUser } = require('../data/fixtures');

/** Cookie donde la API entrega el JWT al iniciar sesión. */
const AUTH_COOKIE = 'hotel_token';

/**
 * Obtiene el token de una respuesta de login.
 *
 * La API no devuelve el token en el body: lo envía en la cookie httpOnly
 * `hotel_token` (encabezado Set-Cookie). Se revisa primero el body por si el
 * contrato cambia en el futuro.
 */
const extractAuthToken = (response) => {
    const bodyToken = response?.data?.token ?? response?.data?.data?.token;
    if (bodyToken) return bodyToken;

    const cookies = response?.headers?.['set-cookie'] ?? [];
    for (const cookie of cookies) {
        const [name, ...value] = cookie.split(';')[0].split('=');
        if (name.trim() === AUTH_COOKIE) return value.join('=');
    }
    return null;
};

/**
 * Setup: registra un usuario. Si la API no lo acepta, falla con un mensaje de
 * setup para no confundir un problema de preparación con el fallo de una prueba.
 */
const registerUser = async (user = aUser().build()) => {
    const response = await AuthService.register(user);
    if (response.status !== 201) {
        throw new Error(
            `[setup] No se pudo registrar ${user.email}: ${response.status} ${JSON.stringify(response.data)}`
        );
    }
    return { ...user, id: response.data.data.id };
};

/**
 * Setup: crea un usuario único, inicia sesión y deja su token activo para las
 * llamadas siguientes (el interceptor de apiClient lo inyecta en cada request).
 */
const createSession = async () => {
    const user = await registerUser();
    const response = await AuthService.login({ email: user.email, password: user.password });
    const token = extractAuthToken(response);
    if (response.status !== 200 || !token) {
        throw new Error(`[setup] El login de ${user.email} no devolvió token (status ${response.status})`);
    }
    global.authToken = token;
    return { user, token };
};

/**
 * Ejecuta una llamada con un token específico (por ejemplo, uno inválido) y
 * restaura el token anterior aunque la llamada o una assertion fallen.
 */
const withToken = async (token, action) => {
    const previousToken = global.authToken;
    global.authToken = token;
    try {
        return await action();
    } finally {
        global.authToken = previousToken;
    }
};

/** Ejecuta una llamada sin sesión (token nulo) y restaura el token anterior. */
const withoutAuth = (action) => withToken(null, action);

module.exports = { AUTH_COOKIE, extractAuthToken, registerUser, createSession, withToken, withoutAuth };
