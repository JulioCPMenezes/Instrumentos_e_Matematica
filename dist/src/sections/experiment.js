import { experimentoInicial } from '../data/experimento.js';
import {
  formatNumber,
  linearRegression,
  percentError,
  stringFrequency
} from '../math/core.js';
import { drawLineChart } from '../utils/canvas.js';
import { showToast } from './layout.js';

const $ = selector => document.querySelector(selector);

function cloneInitial() {
  return JSON.parse(JSON.stringify(experimentoInicial));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadState() {
  return cloneInitial();
}

function calculateRow(row, tension, density) {
  const lengthM = Number(row.comprimentoCm) / 100;
  if (!(lengthM > 0) || !(tension > 0) || !(density > 0)) {
    return { inverse: NaN, theoretical: NaN, error: NaN };
  }
  const theoretical = stringFrequency({
    lengthM,
    tensionN: tension,
    linearDensityKgM: density,
    harmonic: 1
  });
  const measured = Number(row.frequenciaMedida);
  const error = measured > 0 ? percentError(measured, theoretical) : NaN;
  return {
    inverse: 1 / lengthM,
    theoretical,
    error
  };
}

function createCsv(state) {
  const rows = [
    ['Comprimento (cm)', 'Frequência medida (Hz)', '1/L (1/m)', 'Frequência teórica (Hz)', 'Erro (%)', 'Observação']
  ];
  state.dados.forEach(row => {
    const calculated = calculateRow(row, state.tensao, state.densidadeLinear);
    rows.push([
      row.comprimentoCm,
      row.frequenciaMedida,
      Number.isFinite(calculated.inverse) ? calculated.inverse.toFixed(5) : '',
      Number.isFinite(calculated.theoretical) ? calculated.theoretical.toFixed(3) : '',
      Number.isFinite(calculated.error) ? calculated.error.toFixed(3) : '',
      row.observacao || ''
    ]);
  });
  return rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
}

export function initExperiment() {
  const table = $('#experiment-table');
  const tensionInput = $('#experiment-tension');
  const densityInput = $('#experiment-density');
  const chartLength = $('#experiment-chart-length');
  const chartInverse = $('#experiment-chart-inverse');
  if (!table || !tensionInput || !densityInput || !chartLength || !chartInverse) return;

  let state = loadState();
  tensionInput.value = state.tensao;
  densityInput.value = state.densidadeLinear;

  const warning = $('#experiment-warning');
  if (warning) {
    warning.innerHTML = `<strong>Dados de demonstração</strong><p>${escapeHtml(experimentoInicial.aviso)}</p>`;
  }

  const syncStateFromSettings = () => {
    state.tensao = Math.max(0.001, Number(tensionInput.value) || experimentoInicial.tensao);
    state.densidadeLinear = Math.max(0.000001, Number(densityInput.value) || experimentoInicial.densidadeLinear);
  };

  const validMeasuredPoints = () => state.dados
    .map(row => {
      const lengthM = Number(row.comprimentoCm) / 100;
      const measured = Number(row.frequenciaMedida);
      return { lengthM, measured };
    })
    .filter(point => point.lengthM > 0 && point.measured > 0);

  const renderCharts = () => {
    const measured = validMeasuredPoints();
    const byLength = measured.map(point => ({ x: point.lengthM, y: point.measured }));
    const byInverse = measured.map(point => ({ x: 1 / point.lengthM, y: point.measured }));
    let regression = null;
    if (byInverse.length >= 2) {
      try {
        regression = linearRegression(byInverse);
      } catch {
        regression = null;
      }
    }
    drawLineChart(chartLength, byLength, {
      xLabel: 'comprimento (m)',
      yLabel: 'frequência (Hz)',
      lineColor: '#7b2c42',
      pointColor: '#c8a24a'
    });
    drawLineChart(chartInverse, byInverse, {
      xLabel: '1/L (1/m)',
      yLabel: 'frequência (Hz)',
      lineColor: '#1e3557',
      pointColor: '#c8a24a',
      regression
    });

    const equation = $('#regression-equation');
    const r2 = $('#regression-r2');
    if (regression) {
      equation.textContent = `f ≈ ${formatNumber(regression.slope, 2)} · (1/L) ${regression.intercept >= 0 ? '+' : '−'} ${formatNumber(Math.abs(regression.intercept), 2)}`;
      r2.textContent = formatNumber(regression.rSquared, 4);
    } else {
      equation.textContent = 'Adicione pelo menos dois pontos válidos';
      r2.textContent = '—';
    }
  };

  const renderTable = () => {
    syncStateFromSettings();
    table.innerHTML = state.dados.map((row, index) => {
      const calculated = calculateRow(row, state.tensao, state.densidadeLinear);
      return `
        <tr data-index="${index}">
          <td><input type="number" min="1" step="0.1" data-field="comprimentoCm" value="${escapeHtml(row.comprimentoCm)}" aria-label="Comprimento da medição ${index + 1} em centímetros"></td>
          <td><input type="number" min="0" step="0.1" data-field="frequenciaMedida" value="${escapeHtml(row.frequenciaMedida)}" aria-label="Frequência medida ${index + 1} em hertz"></td>
          <td data-calculated="inverse">${Number.isFinite(calculated.inverse) ? formatNumber(calculated.inverse, 3) : '—'}</td>
          <td data-calculated="theoretical">${Number.isFinite(calculated.theoretical) ? formatNumber(calculated.theoretical, 2) : '—'}</td>
          <td data-calculated="error">${Number.isFinite(calculated.error) ? `${formatNumber(calculated.error, 2)}%` : '—'}</td>
          <td><input type="text" data-field="observacao" value="${escapeHtml(row.observacao)}" aria-label="Observação da medição ${index + 1}"></td>
          <td><button class="table-delete" type="button" data-delete="${index}" aria-label="Excluir medição ${index + 1}">×</button></td>
        </tr>
      `;
    }).join('');
    renderCharts();
  };

  const updateCalculatedCells = rowElement => {
    const index = Number(rowElement.dataset.index);
    const row = state.dados[index];
    if (!row) return;
    const calculated = calculateRow(row, state.tensao, state.densidadeLinear);
    const inverse = rowElement.querySelector('[data-calculated="inverse"]');
    const theoretical = rowElement.querySelector('[data-calculated="theoretical"]');
    const error = rowElement.querySelector('[data-calculated="error"]');
    inverse.textContent = Number.isFinite(calculated.inverse) ? formatNumber(calculated.inverse, 3) : '—';
    theoretical.textContent = Number.isFinite(calculated.theoretical) ? formatNumber(calculated.theoretical, 2) : '—';
    error.textContent = Number.isFinite(calculated.error) ? `${formatNumber(calculated.error, 2)}%` : '—';
  };

  table.addEventListener('input', event => {
    const input = event.target.closest('[data-field]');
    if (!input) return;
    const rowElement = input.closest('tr');
    const index = Number(rowElement.dataset.index);
    const field = input.dataset.field;
    const value = input.type === 'number' ? Number(input.value) : input.value;
    if (state.dados[index]) state.dados[index][field] = value;
    updateCalculatedCells(rowElement);
    renderCharts();
  });

  table.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const index = Number(button.dataset.delete);
    state.dados.splice(index, 1);
    renderTable();
  });

  const settingsChanged = () => {
    syncStateFromSettings();
    renderTable();
  };
  tensionInput.addEventListener('input', settingsChanged);
  densityInput.addEventListener('input', settingsChanged);

  $('#experiment-add')?.addEventListener('click', () => {
    state.dados.push({ comprimentoCm: 50, frequenciaMedida: 0, observacao: 'PREENCHER COM MEDIÇÃO REAL' });
    renderTable();
    table.querySelector('tr:last-child input')?.focus();
  });

  $('#experiment-reset')?.addEventListener('click', () => {
    state = cloneInitial();
    tensionInput.value = state.tensao;
    densityInput.value = state.densidadeLinear;
    renderTable();
    showToast('Dados de demonstração restaurados.');
  });

  $('#experiment-export')?.addEventListener('click', () => {
    syncStateFromSettings();
    const csv = createCsv(state);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dados-experimento-comprimento-frequencia.csv';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });

  window.addEventListener('resize', renderCharts);
  renderTable();
}
