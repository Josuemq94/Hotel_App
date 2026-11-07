const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../src/middleware/auth.middleware');
const { notFound, errorHandler } = require('../../src/middleware/error.middleware');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeAll(() => { process.env.JWT_SECRET = 'secreto-de-prueba'; });

describe('authenticate', () => {
    const token = () => jwt.sign({ sub: 'u1', role: 'user' }, 'secreto-de-prueba');

    test('acepta un token en el header Authorization', () => {
        const req = { headers: { authorization: `Bearer ${token()}` } };
        const next = jest.fn();
        authenticate(req, mockRes(), next);
        expect(req.user).toEqual(expect.objectContaining({ sub: 'u1' }));
        expect(next).toHaveBeenCalledWith();
    });

    test('acepta un token en la cookie hotel_token', () => {
        const req = { headers: {}, cookies: { hotel_token: token() } };
        const next = jest.fn();
        authenticate(req, mockRes(), next);
        expect(req.user.sub).toBe('u1');
    });

    test('responde 401 sin token', () => {
        const next = jest.fn();
        authenticate({ headers: {} }, mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    test('responde 401 con un token inválido', () => {
        const next = jest.fn();
        authenticate({ headers: { authorization: 'Bearer no-es-un-jwt' } }, mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
});

describe('authorize', () => {
    test('deja pasar a un rol permitido', () => {
        const next = jest.fn();
        authorize('admin')({ user: { role: 'admin' } }, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
    });

    test('responde 403 a un rol no permitido', () => {
        const next = jest.fn();
        authorize('admin')({ user: { role: 'user' } }, mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
});

describe('errorHandler y notFound', () => {
    test('usa el statusCode del error', () => {
        const res = mockRes();
        errorHandler(Object.assign(new Error('No encontrado'), { statusCode: 404 }), {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado' });
    });

    test('convierte un ValidationError de Mongoose en 400', () => {
        const res = mockRes();
        errorHandler(Object.assign(new Error('Campo requerido'), { name: 'ValidationError' }), {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('responde 500 a errores no controlados y los registra', () => {
        const res = mockRes();
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        errorHandler(new Error('Falla'), { method: 'GET', originalUrl: '/api/x' }, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(500);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    test('notFound responde 404', () => {
        const res = mockRes();
        notFound({}, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
