// Edit mode: Ruby calls loadConfig() after right-click → แก้ไข Grid

// Fill the form from a saved grid config (values in mm) → edit mode
function loadConfig(config) {
  currentUnit = config.displayUnit || 'mm';
  columnSpacings = config.gridType === 'variable'
    ? config.columnSpacings.slice()
    : new Array(config.columns).fill(config.spacingX);
  rowSpacings = config.gridType === 'variable'
    ? config.rowSpacings.slice()
    : new Array(config.rows).fill(config.spacingY);
  columns = columnSpacings.length;
  rows = rowSpacings.length;

  document.getElementById('columns').value = columns;
  document.getElementById('rows').value = rows;
  document.getElementById('spacingX').value = displayValue(config.spacingX);
  document.getElementById('spacingY').value = displayValue(config.spacingY);
  document.getElementById('labelOffset').value = displayValue(config.labelOffset);
  document.getElementById('labelSize').value = displayValue(config.labelSize);
  setLevels(config.heightLevels.map(h => displayValue(h)));

  applyUnitLabels();
  // setMode last: uniform mode re-syncs spacings from the inputs filled above
  setMode(config.gridType || 'uniform');
  document.getElementById('generateBtn').textContent = 'อัปเดต Grid';
}
