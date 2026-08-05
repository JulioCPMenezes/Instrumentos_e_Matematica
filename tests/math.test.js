import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stringFrequency,
  equalTemperamentFrequency,
  midiToFrequency,
  fretPosition,
  openTubeFrequency,
  closedTubeFrequency,
  beatFrequency,
  sabineRT60,
  linearRegression,
  percentError
} from '../src/math/core.js';

const close = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} deveria estar próximo de ${expected}`);
};

test('reduzir o comprimento de uma corda pela metade dobra a frequência', () => {
  const base = stringFrequency({ lengthM: 1, tensionN: 100, linearDensityKgM: 0.01 });
  const half = stringFrequency({ lengthM: 0.5, tensionN: 100, linearDensityKgM: 0.01 });
  close(half / base, 2);
});

test('multiplicar a tensão por quatro dobra a frequência', () => {
  const base = stringFrequency({ lengthM: 1, tensionN: 100, linearDensityKgM: 0.01 });
  const result = stringFrequency({ lengthM: 1, tensionN: 400, linearDensityKgM: 0.01 });
  close(result / base, 2);
});

test('multiplicar a densidade linear por quatro reduz a frequência pela metade', () => {
  const base = stringFrequency({ lengthM: 1, tensionN: 100, linearDensityKgM: 0.01 });
  const result = stringFrequency({ lengthM: 1, tensionN: 100, linearDensityKgM: 0.04 });
  close(result / base, 0.5);
});

test('doze semitons dobram a frequência', () => {
  close(equalTemperamentFrequency(440, 12), 880);
});

test('MIDI 69 corresponde a 440 Hz', () => {
  close(midiToFrequency(69), 440);
});

test('o décimo segundo traste está na metade da escala', () => {
  close(fretPosition(650, 12), 325);
});

test('tubo fechado ideal tem metade da fundamental de tubo aberto de mesmo comprimento', () => {
  const open = openTubeFrequency({ lengthM: 1, temperatureC: 20, mode: 1 });
  const closed = closedTubeFrequency({ lengthM: 1, temperatureC: 20, mode: 1 });
  close(closed / open, 0.5);
});

test('442 Hz e 440 Hz produzem batimentos de 2 Hz', () => {
  close(beatFrequency(442, 440), 2);
});

test('maior absorção reduz RT60', () => {
  assert.ok(sabineRT60(1000, 500) < sabineRT60(1000, 250));
});

test('maior volume aumenta RT60 quando a absorção não muda', () => {
  assert.ok(sabineRT60(2000, 500) > sabineRT60(1000, 500));
});

test('regressão de uma reta perfeita produz R² igual a 1', () => {
  const regression = linearRegression([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }]);
  close(regression.slope, 2);
  close(regression.intercept, 1);
  close(regression.rSquared, 1);
});

test('erro percentual é calculado corretamente', () => {
  close(percentError(90, 100), 10);
});
