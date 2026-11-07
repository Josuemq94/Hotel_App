jest.mock('../../src/repositories/user.repository', () => ({
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
    upsertGoogleUser: jest.fn()
}));

const bcrypt = require('bcryptjs');
const userRepository = require('../../src/repositories/user.repository');
const authService = require('../../src/services/auth.service');

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secreto-de-prueba';
    process.env.ADMIN_EMAILS = 'admin@hotel.com';
});

afterAll(() => { process.env = ORIGINAL_ENV; });

describe('AuthService.registerClient', () => {
    test('registra un usuario nuevo con la contraseña cifrada', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        userRepository.create.mockImplementation(async (data) => ({ _id: 'u1', ...data }));

        const user = await authService.registerClient({ name: ' Ana ', email: 'ANA@correo.com', password: '123456' });

        const saved = userRepository.create.mock.calls[0][0];
        expect(saved.email).toBe('ana@correo.com');
        expect(saved.password).not.toBe('123456');
        expect(await bcrypt.compare('123456', saved.password)).toBe(true);
        expect(user).not.toHaveProperty('password');
        expect(user.role).toBe('user');
    });

    test('asigna rol admin a los correos configurados en ADMIN_EMAILS', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        userRepository.create.mockImplementation(async (data) => ({ _id: 'u2', ...data }));
        const user = await authService.registerClient({ name: 'Admin', email: 'admin@hotel.com', password: '123456' });
        expect(user.role).toBe('admin');
    });

    test.each([
        ['nombre de 1 letra', { name: 'A', email: 'a@b.com', password: '123456' }],
        ['correo inválido', { name: 'Ana', email: 'ana', password: '123456' }],
        ['contraseña corta', { name: 'Ana', email: 'a@b.com', password: '123' }]
    ])('rechaza con 400: %s', async (_caso, data) => {
        await expect(authService.registerClient(data)).rejects.toMatchObject({ statusCode: 400 });
        expect(userRepository.create).not.toHaveBeenCalled();
    });

    test('rechaza con 409 un correo ya registrado', async () => {
        userRepository.findByEmail.mockResolvedValue({ _id: 'existente' });
        await expect(authService.registerClient({ name: 'Ana', email: 'a@b.com', password: '123456' }))
            .rejects.toMatchObject({ statusCode: 409 });
    });
});

describe('AuthService.loginLocal', () => {
    const storedUser = async () => ({
        _id: 'u1', name: 'Ana', email: 'ana@correo.com', role: 'user',
        password: await bcrypt.hash('123456', 4), save: jest.fn()
    });

    test('devuelve el usuario público y un token válido', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue(await storedUser());
        const { user, token } = await authService.loginLocal({ email: 'ANA@correo.com', password: '123456' });
        expect(user).toEqual(expect.objectContaining({ id: 'u1', email: 'ana@correo.com' }));
        expect(authService.verifyToken(token)).toEqual(expect.objectContaining({ sub: 'u1', role: 'user' }));
    });

    test('rechaza con 400 si faltan credenciales', async () => {
        await expect(authService.loginLocal({ email: '', password: '' })).rejects.toMatchObject({ statusCode: 400 });
    });

    test('rechaza con 401 si el usuario no existe', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue(null);
        await expect(authService.loginLocal({ email: 'x@y.com', password: '123456' })).rejects.toMatchObject({ statusCode: 401 });
    });

    test('rechaza con 401 si la contraseña no coincide', async () => {
        userRepository.findByEmailWithPassword.mockResolvedValue(await storedUser());
        await expect(authService.loginLocal({ email: 'ana@correo.com', password: 'otra-clave' })).rejects.toMatchObject({ statusCode: 401 });
    });

    test('promueve a admin a un usuario que está en ADMIN_EMAILS', async () => {
        const user = { ...(await storedUser()), email: 'admin@hotel.com' };
        userRepository.findByEmailWithPassword.mockResolvedValue(user);
        await authService.loginLocal({ email: 'admin@hotel.com', password: '123456' });
        expect(user.role).toBe('admin');
        expect(user.save).toHaveBeenCalled();
    });
});

describe('AuthService.verifyToken', () => {
    test('rechaza con 401 si no hay token', () => {
        expect(() => authService.verifyToken(undefined)).toThrow(expect.objectContaining({ statusCode: 401 }));
    });

    test('rechaza un token firmado con otro secreto', () => {
        const token = authService.issueToken({ _id: 'u1', role: 'user', email: 'a@b.com', name: 'Ana' });
        process.env.JWT_SECRET = 'otro-secreto';
        expect(() => authService.verifyToken(token)).toThrow();
    });
});

describe('AuthService.signInWithGoogle', () => {
    test('responde 503 si Google no está configurado', async () => {
        delete process.env.GOOGLE_CLIENT_ID;
        await expect(authService.signInWithGoogle('credencial')).rejects.toMatchObject({ statusCode: 503 });
    });
});
