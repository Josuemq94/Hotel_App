const { uniqueEmail } = require('./unique');

/** Valores base de un usuario válido para POST /auth/register. */
const DEFAULT_USER = Object.freeze({
    name: 'Usuario QA',
    password: 'QaPass123!'
});

/**
 * Test Data Builder de usuarios.
 *
 * Siempre parte de un usuario válido con email único. Cada caso cambia o quita
 * solo el dato que quiere probar (un factor por caso), para que el resultado
 * se explique por ese dato y no por otro.
 *
 * @example aUser().build()                        // válido y único
 * @example aUser().with({ name: 'Al' }).build()   // un solo dato distinto
 * @example aUser().without('email').build()       // falta un solo campo
 */
class UserBuilder {
    constructor() {
        this.payload = {
            name: DEFAULT_USER.name,
            email: uniqueEmail('qa.user'),
            password: DEFAULT_USER.password
        };
    }

    with(overrides) {
        Object.assign(this.payload, overrides);
        return this;
    }

    without(...fields) {
        fields.forEach((field) => delete this.payload[field]);
        return this;
    }

    build() {
        return { ...this.payload };
    }
}

const aUser = () => new UserBuilder();

module.exports = { aUser, DEFAULT_USER };
