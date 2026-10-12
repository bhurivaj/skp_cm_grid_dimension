// State
let currentMode = 'uniform';
let currentUnit = 'mm';
let levelCounter = 2;

// Grid data
let columns = 5;
let rows = 5;
let columnSpacings = [1000, 1000, 1000, 1000, 1000];
let rowSpacings = [1000, 1000, 1000, 1000, 1000];

// Canvas state
let canvas, ctx;
let isDragging = false;
let dragType = null; // 'column' or 'row'
let dragIndex = -1;
let canvasScale = 1;
let gridOffsetX = 34;
let gridOffsetY = 32;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
  canvas = document.getElementById('gridCanvas');
  ctx = canvas.getContext('2d');

  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Canvas events
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);

  // Initial render
  updateVariableInputs();
  drawGrid();
  updateTotalDimensions();

  // Ruby sends saved config when editing an existing grid
  sketchup.dialog_ready();
});

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2, 2);
  drawGrid();
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const uniformSection = document.getElementById('uniformSection');
  const variableSection = document.getElementById('variableSection');
  const uniformSpacingRow = document.getElementById('uniformSpacingRow');
  const previewInfo = document.getElementById('previewInfo');

  if (mode === 'variable') {
    uniformSpacingRow.classList.add('hidden');
    variableSection.classList.remove('hidden');
    previewInfo.textContent = 'ลากเส้นเพื่อปรับขนาด';
    updateVariableInputs();
  } else {
    uniformSpacingRow.classList.remove('hidden');
    variableSection.classList.add('hidden');
    previewInfo.textContent = 'Preview';
    syncFromUniform();
  }

  drawGrid();
  updateTotalDimensions();
}

// Inputs that hold lengths in the current unit (spacings in variable mode come from the mm arrays)
function lengthInputs() {
  return [
    document.getElementById('spacingX'),
    document.getElementById('spacingY'),
    document.getElementById('labelOffset'),
    document.getElementById('labelSize'),
    ...document.querySelectorAll('.height-level input')
  ];
}

function setUnit(unit) {
  // Convert typed values old unit → mm → new unit so the real length stays the same
  lengthInputs().forEach(input => {
    const value = parseFloat(input.value);
    if (isNaN(value)) return;
    const mm = convertToMm(value);
    input.value = roundValue(mmToUnit(mm, unit));
  });
  currentUnit = unit;
  updateVariableInputs();
  applyUnitLabels();
}

function applyUnitLabels() {
  const unit = currentUnit;
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === unit);
  });
  document.querySelectorAll('.js-unit').forEach(el => { el.textContent = unit; });
}

function onGridSizeChange() {
  const newCols = parseInt(document.getElementById('columns').value) || 1;
  const newRows = parseInt(document.getElementById('rows').value) || 1;

  // Adjust column spacings array
  while (columnSpacings.length < newCols) {
    columnSpacings.push(columnSpacings[columnSpacings.length - 1] || 1000);
  }
  while (columnSpacings.length > newCols) {
    columnSpacings.pop();
  }

  // Adjust row spacings array
  while (rowSpacings.length < newRows) {
    rowSpacings.push(rowSpacings[rowSpacings.length - 1] || 1000);
  }
  while (rowSpacings.length > newRows) {
    rowSpacings.pop();
  }

  columns = newCols;
  rows = newRows;

  updateVariableInputs();
  drawGrid();
  updateTotalDimensions();
}

function onSpacingChange() {
  if (currentMode === 'uniform') {
    syncFromUniform();
    drawGrid();
    updateTotalDimensions();
  }
}

function syncFromUniform() {
  const spacingX = parseFloat(document.getElementById('spacingX').value) || 1000;
  const spacingY = parseFloat(document.getElementById('spacingY').value) || 1000;

  columnSpacings = columnSpacings.map(() => convertToMm(spacingX));
  rowSpacings = rowSpacings.map(() => convertToMm(spacingY));
}

function updateVariableInputs() {
  const colContainer = document.getElementById('columnSpacings');
  const rowContainer = document.getElementById('rowSpacings');

  // Column spacings
  colContainer.innerHTML = '';
  columnSpacings.forEach((spacing, i) => {
    colContainer.innerHTML += `
      <div class="spacing-row">
        <label>${i + 1}:</label>
        <input type="number" min="0" step="any" value="${displayValue(spacing)}" 
               onchange="updateColumnSpacing(${i}, this.value)">
      </div>
    `;
  });

  // Row spacings
  rowContainer.innerHTML = '';
  rowSpacings.forEach((spacing, i) => {
    rowContainer.innerHTML += `
      <div class="spacing-row">
        <label>${String.fromCharCode(65 + i)}:</label>
        <input type="number" min="0" step="any" value="${displayValue(spacing)}" 
               onchange="updateRowSpacing(${i}, this.value)">
      </div>
    `;
  });
}

function displayValue(mmValue) {
  return roundValue(mmToUnit(mmValue, currentUnit));
}

function mmToUnit(mmValue, unit) {
  switch (unit) {
    case 'cm': return mmValue / 10;
    case 'm': return mmValue / 1000;
    default: return mmValue;
  }
}

// Drop float noise (e.g. 0.30000000000000004) without losing real decimals
function roundValue(value) {
  return parseFloat(value.toFixed(6));
}

function updateColumnSpacing(index, value) {
  columnSpacings[index] = convertToMm(parseFloat(value) || 1000);
  drawGrid();
  updateTotalDimensions();
}

function updateRowSpacing(index, value) {
  rowSpacings[index] = convertToMm(parseFloat(value) || 1000);
  drawGrid();
  updateTotalDimensions();
}

function convertToMm(value) {
  switch (currentUnit) {
    case 'cm': return value * 10;
    case 'm': return value * 1000;
    default: return value;
  }
}

function updateTotalDimensions() {
  const totalWidth = columnSpacings.reduce((a, b) => a + b, 0);
  const totalDepth = rowSpacings.reduce((a, b) => a + b, 0);

  let displayWidth, displayDepth, unit;
  if (totalWidth >= 1000 || totalDepth >= 1000) {
    displayWidth = (totalWidth / 1000).toFixed(2);
    displayDepth = (totalDepth / 1000).toFixed(2);
    unit = 'm';
  } else {
    displayWidth = totalWidth;
    displayDepth = totalDepth;
    unit = 'mm';
  }

  document.getElementById('totalDimensions').textContent =
    `Total: ${displayWidth} × ${displayDepth} ${unit}`;
}

function generateGrid() {
  const heightLevels = getHeightLevels().map(h => convertToMm(h));

  if (heightLevels.length === 0) {
    heightLevels.push(0);
  }

  const gridConfig = {
    gridType: currentMode,
    columns: columns,
    rows: rows,
    columnSpacings: columnSpacings,
    rowSpacings: rowSpacings,
    spacingX: convertToMm(parseFloat(document.getElementById('spacingX').value) || 1000),
    spacingY: convertToMm(parseFloat(document.getElementById('spacingY').value) || 1000),
    heightLevels: heightLevels,
    labelOffset: convertToMm(parseFloat(document.getElementById('labelOffset').value) || 300),
    labelSize: convertToMm(parseFloat(document.getElementById('labelSize').value) || 300),
    displayUnit: currentUnit
  };

  // Send to SketchUp Ruby
  sketchup.generate_grid(JSON.stringify(gridConfig));
}

function cancel() {
  sketchup.close_dialog();
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.ctrlKey) {
    generateGrid();
  } else if (e.key === 'Escape') {
    cancel();
  }
});
