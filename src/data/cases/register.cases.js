const { aUser } = require('../builders/user.builder');
const { TEST_EMAIL_DOMAIN } = require('../builders/unique');

/**
 * Casos de datos de POST /auth/register.
 *
 * Reglas (AuthService.registerClient, las mismas del formulario register.html):
 * - name: de 2 a 100 caracteres, sin contar los espacios al inicio y al final
 * - email: formato usuario@dominio.tld; se guarda en minúsculas y debe ser único
 * - password: mínimo 6 caracteres
 *
 * Cada fila cambia un solo dato respecto de un usuario válido, así el resultado
 * esperado se explica por ese dato.
 */

const PASSWORD_MIN = 6;

const REGISTER_ERRORS = Object.freeze({
    invalidNameOrEmail: 'Ingresa un nombre y correo válidos',
    shortPassword: 'La contraseña debe tener al menos 6 caracteres',
    duplicatedEmail: 'Este correo ya está registrado'
});

const passwordOfLength = (length) => 'QaPass123!'.padEnd(length, 'x').slice(0, length);

/** Valor límite inválido y formato fuera de la partición válida → 400 */
const INVALID_VALUES = [
    {
        id: 'REG-02',
        scenario: `contraseña bajo el límite (${PASSWORD_MIN - 1} caracteres)`,
        payload: aUser().with({ password: passwordOfLength(PASSWORD_MIN - 1) }).build(),
        expectedError: REGISTER_ERRORS.shortPassword
    },
    {
        id: 'REG-03',
        scenario: 'email sin arroba',
        payload: aUser().with({ email: `qa.sin-arroba.${TEST_EMAIL_DOMAIN}` }).build(),
        expectedError: REGISTER_ERRORS.invalidNameOrEmail
    }
];

/** Campo obligatorio ausente; el resto del usuario es válido → 400 */
const MISSING_FIELDS = [
    { id: 'REG-04', field: 'name', expectedError: REGISTER_ERRORS.invalidNameOrEmail }
].map((row) => ({
    ...row,
    scenario: `el registro sin el campo obligatorio "${row.field}"`,
    payload: aUser().without(row.field).build()
}));

/** Email ya registrado. El duplicado se arma a partir del usuario que crea el setup → 409 */
const DUPLICATES = [
    {
        id: 'REG-05',
        scenario: 'un email ya registrado',
        toDuplicate: (existing) => aUser().with({ email: existing.email }).build()
    }
];

module.exports = {
    REGISTER_ERRORS,
    INVALID_VALUES,
    MISSING_FIELDS,
    DUPLICATES
};
