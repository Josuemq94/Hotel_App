/**
 * Valores únicos para datos de prueba.
 *
 * Combina la hora actual, un contador del proceso y un sufijo aleatorio, así que
 * dos llamadas nunca devuelven lo mismo: ni dentro de una corrida, ni entre
 * corridas, ni con Jest ejecutando archivos en paralelo (un proceso por worker).
 */
let sequence = 0;

const uniqueSuffix = () => {
    sequence += 1;
    const random = Math.random().toString(36).slice(2, 6);
    return `${Date.now().toString(36)}${sequence.toString(36)}${random}`;
};

/**
 * Dominio reservado para pruebas (RFC 2606): nunca es un buzón real y permite
 * identificar en la base de datos todo lo que creó la suite.
 */
const TEST_EMAIL_DOMAIN = 'hotelpuravida.test';

const uniqueEmail = (prefix = 'qa') => `${prefix}.${uniqueSuffix()}@${TEST_EMAIL_DOMAIN}`;

module.exports = { uniqueSuffix, uniqueEmail, TEST_EMAIL_DOMAIN };
