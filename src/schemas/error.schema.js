/** Contrato de toda respuesta de error de la API: { "error": "mensaje" } (error.middleware.js). */
const errorSchema = {
    type: 'object',
    required: ['error'],
    additionalProperties: false,
    properties: {
        error: { type: 'string', minLength: 1 }
    }
};

module.exports = { errorSchema };
