const EPSILON = 1e-12;

export function assertPositive(value, name = 'valor') {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${name} precisa ser um número positivo.`);
  }
  return number;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

export function stringWaveSpeed(tensionN, linearDensityKgM) {
  const tension = assertPositive(tensionN, 'tensão');
  const density = assertPositive(linearDensityKgM, 'densidade linear');
  return Math.sqrt(tension / density);
}

export function stringFrequency({ lengthM, tensionN, linearDensityKgM, harmonic = 1 }) {
  const length = assertPositive(lengthM, 'comprimento');
  const n = Math.max(1, Math.round(assertPositive(harmonic, 'harmônico')));
  return (n / (2 * length)) * stringWaveSpeed(tensionN, linearDensityKgM);
}

export function equalTemperamentFrequency(baseFrequency, semitones) {
  const base = assertPositive(baseFrequency, 'frequência de referência');
  return base * 2 ** (Number(semitones) / 12);
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((Number(midi) - 69) / 12);
}

export function frequencyToMidi(frequency) {
  return 69 + 12 * Math.log2(assertPositive(frequency, 'frequência') / 440);
}

const NOTE_NAMES = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];

export function nearestNote(frequency) {
  const exactMidi = frequencyToMidi(frequency);
  const midi = Math.round(exactMidi);
  const noteFrequency = midiToFrequency(midi);
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const cents = 1200 * Math.log2(frequency / noteFrequency);
  return {
    midi,
    name: `${NOTE_NAMES[noteIndex]}${octave}`,
    frequency: noteFrequency,
    cents
  };
}

export function fretPosition(scaleLength, fret) {
  const scale = assertPositive(scaleLength, 'escala');
  const n = Math.max(0, Number(fret));
  return scale * (1 - 2 ** (-n / 12));
}

export function remainingStringLength(scaleLength, fret) {
  const scale = assertPositive(scaleLength, 'escala');
  const n = Math.max(0, Number(fret));
  return scale / 2 ** (n / 12);
}

export function speedOfSound(temperatureC = 20) {
  const temperature = Number(temperatureC);
  if (!Number.isFinite(temperature)) throw new RangeError('Temperatura inválida.');
  return 331.3 + 0.606 * temperature;
}

export function openTubeFrequency({ lengthM, temperatureC = 20, mode = 1 }) {
  const length = assertPositive(lengthM, 'comprimento');
  const n = Math.max(1, Math.round(assertPositive(mode, 'modo')));
  return (n * speedOfSound(temperatureC)) / (2 * length);
}

export function closedTubeFrequency({ lengthM, temperatureC = 20, mode = 1 }) {
  const length = assertPositive(lengthM, 'comprimento');
  const n = Math.max(1, Math.round(assertPositive(mode, 'modo')));
  return ((2 * n - 1) * speedOfSound(temperatureC)) / (4 * length);
}

export function brassAddedLength(baseLength, semitonesDown) {
  const length = assertPositive(baseLength, 'comprimento inicial');
  const k = Math.max(0, Number(semitonesDown));
  return length * (2 ** (k / 12) - 1);
}

export function barFrequency({ lengthM, thicknessM, youngModulusPa, densityKgM3 }) {
  const length = assertPositive(lengthM, 'comprimento');
  const thickness = assertPositive(thicknessM, 'espessura');
  const young = assertPositive(youngModulusPa, 'módulo de elasticidade');
  const density = assertPositive(densityKgM3, 'densidade');
  return 1.028 * (thickness / length ** 2) * Math.sqrt(young / density);
}

export function membraneFrequency({ radiusM, tensionPerLength, surfaceDensity }) {
  const radius = assertPositive(radiusM, 'raio');
  const tension = assertPositive(tensionPerLength, 'tensão por unidade de comprimento');
  const density = assertPositive(surfaceDensity, 'densidade superficial');
  return (0.3827 / radius) * Math.sqrt(tension / density);
}

export function helmholtzFrequency({ soundSpeed = 343, openingAreaM2, volumeM3, effectiveNeckLengthM }) {
  const c = assertPositive(soundSpeed, 'velocidade do som');
  const area = assertPositive(openingAreaM2, 'área da abertura');
  const volume = assertPositive(volumeM3, 'volume');
  const neck = assertPositive(effectiveNeckLengthM, 'comprimento efetivo');
  return (c / (2 * Math.PI)) * Math.sqrt(area / (volume * neck));
}

export function sabineRT60(volumeM3, absorptionSabins) {
  const volume = assertPositive(volumeM3, 'volume');
  const absorption = assertPositive(absorptionSabins, 'absorção equivalente');
  return 0.161 * volume / absorption;
}

export function equivalentAbsorption(surfaces) {
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    throw new RangeError('Informe ao menos uma superfície.');
  }
  return surfaces.reduce((total, surface) => {
    const area = Math.max(0, Number(surface.areaM2) || 0);
    const coefficient = clamp(surface.coefficient, 0, 1);
    return total + area * coefficient;
  }, 0);
}

export function beatFrequency(frequencyA, frequencyB) {
  return Math.abs(assertPositive(frequencyA, 'frequência A') - assertPositive(frequencyB, 'frequência B'));
}

export function wavelength(frequency, soundSpeed = 343) {
  return assertPositive(soundSpeed, 'velocidade') / assertPositive(frequency, 'frequência');
}

export function intensityDecibels(ratio) {
  return 10 * Math.log10(assertPositive(ratio, 'razão de intensidade'));
}

export function pressureDecibels(ratio) {
  return 20 * Math.log10(assertPositive(ratio, 'razão de pressão'));
}

export function percentError(measured, theoretical) {
  const theory = assertPositive(theoretical, 'valor teórico');
  return Math.abs(Number(measured) - theory) / theory * 100;
}

export function linearRegression(points) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new RangeError('A regressão precisa de pelo menos dois pontos.');
  }
  const normalized = points.map(({ x, y }) => ({ x: Number(x), y: Number(y) }));
  if (normalized.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new RangeError('Os pontos da regressão precisam ser numéricos.');
  }

  const n = normalized.length;
  const meanX = normalized.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = normalized.reduce((sum, point) => sum + point.y, 0) / n;
  const numerator = normalized.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = normalized.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = Math.abs(denominator) < EPSILON ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  const predicted = normalized.map(point => slope * point.x + intercept);
  const ssResidual = normalized.reduce((sum, point, index) => sum + (point.y - predicted[index]) ** 2, 0);
  const ssTotal = normalized.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const rSquared = Math.abs(ssTotal) < EPSILON ? 1 : 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared, predicted };
}

export function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Number(value));
}
