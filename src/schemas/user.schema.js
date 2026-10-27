/** Contrato del usuario público que devuelven /auth/register y /auth/login (publicUser). */
const userSchema = {
    type: 'object',
    required: ['id', 'name', 'email', 'picture', 'role'],
    additionalProperties: false, // detecta fugas como "password" o "googleId"
    properties: {
        id: { type: 'string', format: 'objectid' },
        name: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        picture: { type: 'string' },
        role: { type: 'string', enum: ['user', 'admin'] }
    }
};

module.exports = { userSchema };
