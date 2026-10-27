/**
 * Configuración de Jest para generar el reporte HTML (npm run test:report).
 * `npm test` no la usa, así que su salida no cambia.
 */
module.exports = {
    testEnvironment: 'node',
    reporters: [
        'default',
        // Evidencia de ejecución: genera reports/test-report.html y reports/test-results.json
        ['<rootDir>/reporters/html-reporter.js', { outputDir: 'reports' }]
    ]
};
