export function prepareCanvas(canvas, cssHeight = null) {
  if (!canvas) return null;
  if (cssHeight !== null) canvas.style.height = `${cssHeight}px`;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  return { context, width: rect.width, height: rect.height, dpr };
}

export function drawGrid(context, width, height, {
  color = 'rgba(255,255,255,.06)',
  step = 28
} = {}) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

export function drawAxes(context, width, height, {
  color = 'rgba(255,255,255,.3)',
  padding = 36
} = {}) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding, height - padding);
  context.lineTo(width - padding, height - padding);
  context.moveTo(padding, height - padding);
  context.lineTo(padding, padding);
  context.stroke();
  context.restore();
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function drawLineChart(canvas, points, {
  xLabel = '',
  yLabel = '',
  lineColor = '#7b2c42',
  pointColor = '#c8a24a',
  textColor = '#655f56',
  background = '#fbf8f1',
  regression = null,
  emptyMessage = 'Adicione dados para gerar o gráfico.'
} = {}) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { context, width, height } = prepared;
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, { color: 'rgba(30,53,87,.06)', step: 30 });

  const valid = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (valid.length < 1) {
    context.fillStyle = textColor;
    context.font = '14px system-ui';
    context.textAlign = 'center';
    context.fillText(emptyMessage, width / 2, height / 2);
    return;
  }

  const padding = 46;
  let minX = Math.min(...valid.map(point => point.x));
  let maxX = Math.max(...valid.map(point => point.x));
  let minY = Math.min(...valid.map(point => point.y));
  let maxY = Math.max(...valid.map(point => point.y));
  if (minX === maxX) { minX -= 1; maxX += 1; }
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const xMargin = (maxX - minX) * 0.08;
  const yMargin = (maxY - minY) * 0.14;
  minX -= xMargin;
  maxX += xMargin;
  minY = Math.max(0, minY - yMargin);
  maxY += yMargin;

  const toX = x => mapRange(x, minX, maxX, padding, width - padding);
  const toY = y => mapRange(y, minY, maxY, height - padding, padding);
  drawAxes(context, width, height, { color: 'rgba(30,53,87,.25)', padding });

  context.fillStyle = textColor;
  context.font = '11px system-ui';
  context.textAlign = 'center';
  context.fillText(xLabel, width / 2, height - 10);
  context.save();
  context.translate(13, height / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(yLabel, 0, 0);
  context.restore();

  const sorted = [...valid].sort((a, b) => a.x - b.x);
  context.strokeStyle = lineColor;
  context.lineWidth = 2.5;
  context.beginPath();
  sorted.forEach((point, index) => {
    const x = toX(point.x);
    const y = toY(point.y);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  if (regression && Number.isFinite(regression.slope) && Number.isFinite(regression.intercept)) {
    context.save();
    context.strokeStyle = 'rgba(30,53,87,.65)';
    context.setLineDash([7, 5]);
    context.lineWidth = 1.7;
    context.beginPath();
    context.moveTo(toX(minX), toY(regression.slope * minX + regression.intercept));
    context.lineTo(toX(maxX), toY(regression.slope * maxX + regression.intercept));
    context.stroke();
    context.restore();
  }

  sorted.forEach(point => {
    const x = toX(point.x);
    const y = toY(point.y);
    context.fillStyle = pointColor;
    context.beginPath();
    context.arc(x, y, 4.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.stroke();
  });
}
