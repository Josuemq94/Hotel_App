const { validate } = require('./schema');
const { errorSchema } = require('../schemas/error.schema');

/**
 * Helpers de assertions reutilizables: validan el status code Y el body.
 *
 * Cada helper lanza un Error que explica qué se esperaba, qué llegó y el body
 * de la respuesta, así un caso fallido se entiende sin reproducirlo.
 */

const preview = (data) => {
    const text = JSON.stringify(data);
    return text && text.length > 300 ? `${text.slice(0, 300)}…` : text;
};

/** El status HTTP es el esperado. */
const expectStatus = (res, expected) => {
    if (res.status !== expected) {
        throw new Error(`Se esperaba status ${expected} y llegó ${res.status}. Body: ${preview(res.data)}`);
    }
};

/** La respuesta declara Content-Type JSON. */
const expectJson = (res) => {
    const contentType = res.headers?.['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
        throw new Error(`Se esperaba Content-Type application/json y llegó "${contentType}"`);
    }
};

/** El valor cumple el schema; si no, lista todos los incumplimientos de una vez. */
const expectMatchesSchema = (value, schema, label = 'La respuesta') => {
    const errors = validate(schema, value);
    if (errors.length > 0) {
        throw new Error(`${label} no cumple el contrato:\n - ${errors.join('\n - ')}`);
    }
};

/**
 * Respuesta exitosa con la forma { data: ... } de esta API: valida status,
 * Content-Type, que el body no traiga campos extra y que `data` cumpla el schema.
 * Devuelve `data` para seguir validando su contenido.
 */
const expectData = (res, status, dataSchema) => {
    expectStatus(res, status);
    expectJson(res);
    expectMatchesSchema(
        res.data,
        { type: 'object', required: ['data'], additionalProperties: false, properties: { data: dataSchema } },
        'El body'
    );
    return res.data.data;
};

/** Atajo de expectData para listas: `data` es un arreglo y cada elemento cumple el schema. */
const expectDataList = (res, status, itemSchema) => expectData(res, status, { type: 'array', items: itemSchema });

/**
 * Respuesta de error de la API: status esperado, JSON, forma { error } y,
 * si se indica, el mensaje exacto.
 */
const expectApiError = (res, status, message) => {
    expectStatus(res, status);
    expectJson(res);
    expectMatchesSchema(res.data, errorSchema, 'El body de error');
    if (message !== undefined && res.data.error !== message) {
        throw new Error(`Mensaje de error distinto. Esperado: "${message}". Recibido: "${res.data.error}"`);
    }
};

/** Todos los elementos tienen `field === expected` (muestra cuántos no cumplen). */
const expectEveryItem = (items, field, expected) => {
    const offenders = items.filter((item) => item[field] !== expected);
    if (offenders.length > 0) {
        const found = [...new Set(offenders.map((item) => item[field]))].join(', ');
        throw new Error(
            `${offenders.length} de ${items.length} elementos no tienen ${field} = "${expected}" (encontrado: ${found})`
        );
    }
};

module.exports = {
    expectStatus,
    expectJson,
    expectMatchesSchema,
    expectData,
    expectDataList,
    expectApiError,
    expectEveryItem
};
