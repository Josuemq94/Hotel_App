const fs = require('fs');
const path = require('path');

/**
 * Reporter de Jest que genera la evidencia de ejecución, sin dependencias:
 *   reports/test-report.html  → reporte visual (abrir en el navegador)
 *   reports/test-results.json → resultados en crudo
 *
 * Se activa con `npm run test:report` (ver jest.report.config.js).
 *
 * Los casos cuyo título contiene "[DEFECTO]" se muestran aparte de los fallos
 * inesperados: son defectos conocidos del sistema, documentados a propósito.
 */

const DEFECT_TAG = '[DEFECTO]';
const ANSI = /\u001b\[[0-9;]*m/g;
const ID_PATTERN = /^([A-Z]+-?\d+):\s*/; // "TC07: ..." o "REG-01: ..."

const LABELS = { passed: 'Exitoso', failed: 'Fallido', defect: 'Defecto conocido', skipped: 'Omitido' };

const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const classify = (test) => {
    if (test.status === 'passed') return 'passed';
    if (test.status === 'failed') return test.title.includes(DEFECT_TAG) ? 'defect' : 'failed';
    return 'skipped';
};

const collect = (results) =>
    results.testResults.map((file) => ({
        file: path.relative(process.cwd(), file.testFilePath).replace(/\\/g, '/'),
        suiteError: file.testResults.length === 0 && file.failureMessage ? file.failureMessage.replace(ANSI, '') : null,
        tests: file.testResults.map((test) => {
            const match = ID_PATTERN.exec(test.title);
            return {
                id: match ? match[1] : '',
                title: match ? test.title.slice(match[0].length) : test.title,
                group: test.ancestorTitles.join(' › '),
                outcome: classify(test),
                duration: test.duration ?? 0,
                message: (test.failureMessages || []).join('\n').replace(ANSI, '')
            };
        })
    }));

const countBy = (files, outcome) =>
    files.reduce((total, file) => total + file.tests.filter((test) => test.outcome === outcome).length, 0);

const renderTest = (test) => `
        <tr class="row ${test.outcome}" data-outcome="${test.outcome}">
          <td class="id">${escapeHtml(test.id)}</td>
          <td><span class="badge ${test.outcome}">${LABELS[test.outcome]}</span></td>
          <td>${escapeHtml(test.title)}<div class="group">${escapeHtml(test.group)}</div>
            ${test.message ? `<details><summary>Ver detalle del fallo</summary><pre>${escapeHtml(test.message)}</pre></details>` : ''}
          </td>
          <td class="ms">${test.duration} ms</td>
        </tr>`;

const renderFile = (file) => {
    const passed = file.tests.filter((test) => test.outcome === 'passed').length;
    return `
    <section>
      <h2>${escapeHtml(file.file)} <span class="count">${passed}/${file.tests.length} exitosos</span></h2>
      ${file.suiteError ? `<pre class="suite-error">${escapeHtml(file.suiteError)}</pre>` : ''}
      <table>${file.tests.map(renderTest).join('')}</table>
    </section>`;
};

const render = (files, summary) => {
    const verdict =
        summary.failed > 0
            ? { css: 'failed', text: `${summary.failed} fallo(s) inesperado(s): revisar antes de entregar` }
            : summary.defect > 0
              ? { css: 'ok', text: `Sin fallos inesperados · ${summary.defect} defecto(s) conocido(s) documentado(s)` }
              : { css: 'ok', text: 'Todos los casos exitosos' };

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte de pruebas API - Hotel Pura Vida</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f4f6f8; color: #1d2733; }
  header { background: #0b3d91; color: #fff; padding: 24px 32px; }
  header h1 { margin: 0 0 4px; font-size: 22px; }
  header p { margin: 0; opacity: .85; font-size: 14px; }
  main { max-width: 1040px; margin: 24px auto; padding: 0 16px; }
  .verdict { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; color: #fff; }
  .verdict.ok { background: #1a9d55; } .verdict.failed { background: #d64545; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .card { background: #fff; border-radius: 8px; padding: 14px 16px; border-left: 5px solid #8a96a3; font-size: 13px; }
  .card b { display: block; font-size: 26px; }
  .card.passed { border-color: #1a9d55; } .card.failed { border-color: #d64545; } .card.defect { border-color: #e0932b; }
  .filters { margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .filters button { border: 1px solid #c5ced8; background: #fff; border-radius: 16px; padding: 5px 14px; cursor: pointer; font-size: 13px; }
  .filters button.active { background: #0b3d91; color: #fff; border-color: #0b3d91; }
  section { background: #fff; border-radius: 8px; margin-bottom: 20px; padding: 8px 16px 12px; }
  h2 { font-size: 15px; font-family: ui-monospace, monospace; color: #0b3d91; }
  .count { font-family: system-ui, sans-serif; font-weight: 400; font-size: 12px; color: #6b7785; margin-left: 8px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 6px; border-top: 1px solid #e6eaee; vertical-align: top; font-size: 14px; }
  td.id { font-family: ui-monospace, monospace; font-size: 12px; white-space: nowrap; color: #4b5866; }
  td.ms { white-space: nowrap; color: #6b7785; text-align: right; }
  .group { color: #6b7785; font-size: 12px; margin-top: 2px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; color: #fff; white-space: nowrap; }
  .badge.passed { background: #1a9d55; } .badge.failed { background: #d64545; }
  .badge.defect { background: #e0932b; } .badge.skipped { background: #8a96a3; }
  pre { background: #1d2733; color: #e6eaee; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 12px; white-space: pre-wrap; }
  summary { cursor: pointer; color: #0b3d91; font-size: 12px; margin-top: 4px; }
  .hidden { display: none; }
</style>
</head>
<body>
<header>
  <h1>Reporte de pruebas API: Hotel Pura Vida</h1>
  <p>Ejecutado el ${escapeHtml(summary.date)} · duración ${summary.seconds} s · ${summary.suites} suites</p>
</header>
<main>
  <div class="verdict ${verdict.css}">${escapeHtml(verdict.text)}</div>
  <div class="cards">
    <div class="card"><b>${summary.total}</b>Casos ejecutados</div>
    <div class="card passed"><b>${summary.passed}</b>Exitosos</div>
    <div class="card defect"><b>${summary.defect}</b>Defectos conocidos</div>
    <div class="card failed"><b>${summary.failed}</b>Fallos inesperados</div>
  </div>
  <div class="filters">
    <button class="active" data-filter="all">Todos</button>
    <button data-filter="passed">Exitosos</button>
    <button data-filter="defect">Defectos conocidos</button>
    <button data-filter="failed">Fallos inesperados</button>
  </div>
  ${files.map(renderFile).join('')}
</main>
<script>
  document.querySelectorAll('.filters button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.filters button').forEach(function (b) { b.classList.remove('active'); });
      button.classList.add('active');
      var filter = button.dataset.filter;
      document.querySelectorAll('.row').forEach(function (row) {
        row.classList.toggle('hidden', filter !== 'all' && row.dataset.outcome !== filter);
      });
    });
  });
</script>
</body>
</html>`;
};

class HtmlReporter {
    constructor(globalConfig, options = {}) {
        this.outputDir = path.resolve(process.cwd(), options.outputDir || 'reports');
    }

    onRunComplete(contexts, results) {
        const files = collect(results);
        const summary = {
            date: new Date(results.startTime).toLocaleString('es-CR'),
            seconds: ((Date.now() - results.startTime) / 1000).toFixed(1),
            suites: files.length,
            total: files.reduce((total, file) => total + file.tests.length, 0),
            passed: countBy(files, 'passed'),
            defect: countBy(files, 'defect'),
            failed: countBy(files, 'failed')
        };

        fs.mkdirSync(this.outputDir, { recursive: true });
        fs.writeFileSync(path.join(this.outputDir, 'test-report.html'), render(files, summary));
        fs.writeFileSync(path.join(this.outputDir, 'test-results.json'), JSON.stringify({ summary, files }, null, 2));
        console.log(`\nReporte HTML generado: ${path.join(this.outputDir, 'test-report.html')}`);
    }
}

module.exports = HtmlReporter;
