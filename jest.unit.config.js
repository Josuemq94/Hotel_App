/**
 * Configuración de Jest para las pruebas unitarias (npm run test:unit).
 * No necesitan base de datos ni servidor: los repositorios se reemplazan con mocks.
 * Genera coverage/lcov.info, que SonarQube puede leer para reportar la cobertura.
 */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/unit'],
    collectCoverage: true,
    collectCoverageFrom: ['src/services/**/*.js', 'src/middleware/**/*.js', '!src/services/api.services.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text-summary']
};
