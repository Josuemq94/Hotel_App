const axios = require('axios');
require('dotenv').config();

// Configuración base centralizada
const apiClient = axios.create({
    baseURL: process.env.BASE_URL || 'http://localhost:3000/api',
    timeout: parseInt(process.env.TIMEOUT) || 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // Permite a Jest manejar los errores (400, 401, 500) para hacer aserciones sin usar try/catch en cada test
    validateStatus: function (status) {
        return status < 600; 
    }
});

// Interceptor para inyectar dinámicamente el token de autorización
apiClient.interceptors.request.use(config => {
    // global.authToken se establece dinámicamente durante la ejecución de las pruebas (ej. al hacer login)
    if (global.authToken) {
        config.headers.Authorization = `Bearer ${global.authToken}`;
        // Fallback por si la API utiliza cookies en su lugar
        config.headers.Cookie = `hotel_token=${global.authToken}`;
    }
    return config;
});

module.exports = apiClient;