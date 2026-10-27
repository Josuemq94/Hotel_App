/**
 * Validador de schemas (subconjunto de JSON Schema, sin dependencias externas).
 *
 * Soporta: type (string | number | integer | boolean | array | object | null),
 * enum, minLength, maxLength, pattern, format, minimum, maximum, required,
 * properties, additionalProperties: false, items y minItems.
 *
 * `validate` devuelve la lista de errores en español con la ruta del campo
 * ("$.data[2].status: ..."). Lista vacía = el valor cumple el contrato.
 */

const FORMATS = Object.freeze({
    objectid: /^[a-f\d]{24}$/i,
    'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
});

const typeOf = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

const matchesType = (type, value) => {
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    return typeOf(value) === type;
};

const show = (value) => (typeof value === 'string' ? JSON.stringify(value) : String(typeOf(value) === 'object' ? 'objeto' : value));

const validateScalar = (schema, value, path, errors) => {
    if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: ${show(value)} no está entre los valores permitidos (${schema.enum.join(', ')})`);
    }
    if (typeof value === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`${path}: debe tener al menos ${schema.minLength} caracteres`);
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`${path}: debe tener máximo ${schema.maxLength} caracteres`);
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
            errors.push(`${path}: ${show(value)} no cumple el patrón ${schema.pattern}`);
        }
        if (schema.format && FORMATS[schema.format] && !FORMATS[schema.format].test(value)) {
            errors.push(`${path}: ${show(value)} no tiene el formato ${schema.format}`);
        }
    }
    if (typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push(`${path}: ${value} es menor que el mínimo ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push(`${path}: ${value} es mayor que el máximo ${schema.maximum}`);
        }
    }
};

const validateObject = (schema, value, path, errors) => {
    const properties = schema.properties || {};
    for (const field of schema.required || []) {
        if (!(field in value)) errors.push(`${path}.${field}: campo obligatorio ausente`);
    }
    for (const [field, fieldSchema] of Object.entries(properties)) {
        if (field in value) errors.push(...validate(fieldSchema, value[field], `${path}.${field}`));
    }
    if (schema.additionalProperties === false) {
        for (const field of Object.keys(value)) {
            if (!(field in properties)) errors.push(`${path}.${field}: campo no esperado en el contrato`);
        }
    }
};

const validateArray = (schema, value, path, errors) => {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push(`${path}: debe tener al menos ${schema.minItems} elemento(s)`);
    }
    if (schema.items) {
        value.forEach((item, index) => errors.push(...validate(schema.items, item, `${path}[${index}]`)));
    }
};

function validate(schema, value, path = '$') {
    const errors = [];
    const types = [].concat(schema.type ?? []);

    if (types.length > 0 && !types.some((type) => matchesType(type, value))) {
        errors.push(`${path}: se esperaba ${types.join(' | ')} y llegó ${typeOf(value)}`);
        return errors;
    }

    validateScalar(schema, value, path, errors);
    if (typeOf(value) === 'object') validateObject(schema, value, path, errors);
    if (typeOf(value) === 'array') validateArray(schema, value, path, errors);
    return errors;
}

module.exports = { validate, FORMATS };
