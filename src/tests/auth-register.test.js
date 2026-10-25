const { AuthService } = require('../services/api.services');
const { aUser, registerCases: cases } = require('../data/fixtures');
const { registerUser } = require('../support/session');

const OBJECT_ID = /^[a-f\d]{24}$/i;

describe('Endpoint: Registro de usuarios (POST /auth/register)', () => {
    describe('Escenario positivo (201)', () => {
        it('REG-01: registra un usuario válido y responde solo sus datos públicos', async () => {
            const user = aUser().build();
            const res = await AuthService.register(user);

            expect(res.status).toBe(201);
            expect(res.data.data).toEqual({
                id: expect.stringMatching(OBJECT_ID),
                name: user.name,
                email: user.email,
                picture: '',
                role: 'user'
            });
            expect(res.data.data).not.toHaveProperty('password');
        });
    });

    describe('Escenarios negativos: validación de datos (400)', () => {
        it.each([...cases.INVALID_VALUES, ...cases.MISSING_FIELDS])(
            '$id: rechaza $scenario',
            async ({ payload, expectedError }) => {
                const res = await AuthService.register(payload);

                expect(res.status).toBe(400);
                expect(res.data).toEqual({ error: expectedError });
            }
        );
    });

    describe('Escenario negativo: email duplicado (409)', () => {
        let existingUser;

        // Setup: un usuario que ya existe en la base antes de intentar duplicarlo
        beforeAll(async () => {
            existingUser = await registerUser();
        });

        it.each(cases.DUPLICATES)('$id: rechaza $scenario', async ({ toDuplicate }) => {
            const res = await AuthService.register(toDuplicate(existingUser));

            expect(res.status).toBe(409);
            expect(res.data).toEqual({ error: cases.REGISTER_ERRORS.duplicatedEmail });
        });
    });
});
