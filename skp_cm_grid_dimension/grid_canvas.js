// Canvas Drawing
function drawGrid() {
  if (!ctx) return;

  const width = canvas.width / 2;
  const height = canvas.height / 2;

  // Clear
  ctx.fillStyle = '#1a2332';
  ctx.fillRect(0, 0, width, height);

  // Calculate scale
  const totalWidth = columnSpacings.reduce((a, b) => a + b, 0);
  const totalDepth = rowSpacings.reduce((a, b) => a + b, 0);

  const availableWidth = width - gridOffsetX - 20;
  const availableHeight = height - gridOffsetY - 20;

  canvasScale = Math.min(availableWidth / totalWidth, availableHeight / totalDepth) * 0.9;

  // Draw grid lines
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Calculate positions
  const colPositions = [0];
  columnSpacings.forEach(s => colPositions.push(colPositions[colPositions.length - 1] + s));

  const rowPositions = [0];
  rowSpacings.forEach(s => rowPositions.push(rowPositions[rowPositions.length - 1] + s));

  // Draw vertical lines
  colPositions.forEach((pos, i) => {
    const x = gridOffsetX + pos * canvasScale;
    ctx.beginPath();
    ctx.moveTo(x, gridOffsetY);
    ctx.lineTo(x, gridOffsetY + totalDepth * canvasScale);
    ctx.stroke();

    // Column labels (numbers)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x, gridOffsetY - 8);
  });

  // Draw horizontal lines
  rowPositions.forEach((pos, i) => {
    const y = gridOffsetY + pos * canvasScale;
    ctx.beginPath();
    ctx.moveTo(gridOffsetX, y);
    ctx.lineTo(gridOffsetX + totalWidth * canvasScale, y);
    ctx.stroke();

    // Row labels (letters)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String.fromCharCode(65 + i), gridOffsetX - 8, y + 4);
  });

  ctx.setLineDash([]);

  // Draw drag handles (only in variable mode)
  if (currentMode === 'variable') {
    ctx.fillStyle = '#3b82f6';

    // Column handles (except first and last)
    for (let i = 1; i < colPositions.length - 1; i++) {
      const x = gridOffsetX + colPositions[i] * canvasScale;
      ctx.beginPath();
      ctx.arc(x, gridOffsetY + totalDepth * canvasScale / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Row handles (except first and last)
    for (let i = 1; i < rowPositions.length - 1; i++) {
      const y = gridOffsetY + rowPositions[i] * canvasScale;
      ctx.beginPath();
      ctx.arc(gridOffsetX + totalWidth * canvasScale / 2, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw measurements for each cell
  if (currentMode === 'variable') {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';

    // Column widths
    for (let i = 0; i < columnSpacings.length; i++) {
      const x1 = gridOffsetX + colPositions[i] * canvasScale;
      const x2 = gridOffsetX + colPositions[i + 1] * canvasScale;
      const width_mm = columnSpacings[i];
      ctx.fillText(formatMeasurement(width_mm), (x1 + x2) / 2, gridOffsetY + totalDepth * canvasScale + 15);
    }

    // Row heights
    ctx.textAlign = 'left';
    for (let i = 0; i < rowSpacings.length; i++) {
      const y1 = gridOffsetY + rowPositions[i] * canvasScale;
      const y2 = gridOffsetY + rowPositions[i + 1] * canvasScale;
      const height_mm = rowSpacings[i];
      ctx.fillText(formatMeasurement(height_mm), gridOffsetX + totalWidth * canvasScale + 8, (y1 + y2) / 2 + 3);
    }
  }
}

function formatMeasurement(mm) {
  if (mm >= 1000) {
    return (mm / 1000).toFixed(1) + 'm';
  }
  return mm + 'mm';
}

// Mouse handlers for dragging
function onMouseDown(e) {
  if (currentMode !== 'variable') return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check for column handle hit
  const colPositions = [0];
  columnSpacings.forEach(s => colPositions.push(colPositions[colPositions.length - 1] + s));

  for (let i = 1; i < colPositions.length - 1; i++) {
    const handleX = gridOffsetX + colPositions[i] * canvasScale;
    if (Math.abs(x - handleX) < 10) {
      isDragging = true;
      dragType = 'column';
      dragIndex = i;
      return;
    }
  }

  // Check for row handle hit
  const rowPositions = [0];
  rowSpacings.forEach(s => rowPositions.push(rowPositions[rowPositions.length - 1] + s));

  for (let i = 1; i < rowPositions.length - 1; i++) {
    const handleY = gridOffsetY + rowPositions[i] * canvasScale;
    if (Math.abs(y - handleY) < 10) {
      isDragging = true;
      dragType = 'row';
      dragIndex = i;
      return;
    }
  }
}

function onMouseMove(e) {
  if (!isDragging) {
    // Update cursor
    if (currentMode === 'variable') {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let nearHandle = false;

      const colPositions = [0];
      columnSpacings.forEach(s => colPositions.push(colPositions[colPositions.length - 1] + s));

      for (let i = 1; i < colPositions.length - 1; i++) {
        const handleX = gridOffsetX + colPositions[i] * canvasScale;
        if (Math.abs(x - handleX) < 10) {
          canvas.style.cursor = 'ew-resize';
          nearHandle = true;
          break;
        }
      }

      if (!nearHandle) {
        const rowPositions = [0];
        rowSpacings.forEach(s => rowPositions.push(rowPositions[rowPositions.length - 1] + s));

        for (let i = 1; i < rowPositions.length - 1; i++) {
          const handleY = gridOffsetY + rowPositions[i] * canvasScale;
          if (Math.abs(y - handleY) < 10) {
            canvas.style.cursor = 'ns-resize';
            nearHandle = true;
            break;
          }
        }
      }

      if (!nearHandle) {
        canvas.style.cursor = 'crosshair';
      }
    }
    return;
  }

  const rect = canvas.getBoundingClientRect();

  if (dragType === 'column') {
    const x = e.clientX - rect.left;
    const newPos = (x - gridOffsetX) / canvasScale;

    // Calculate new spacings
    const colPositions = [0];
    columnSpacings.forEach(s => colPositions.push(colPositions[colPositions.length - 1] + s));

    const minSpacing = 100; // minimum 100mm
    const leftSpacing = Math.max(minSpacing, newPos - colPositions[dragIndex - 1]);
    const rightSpacing = Math.max(minSpacing, colPositions[dragIndex + 1] - newPos);

    // Only update if both spacings are valid
    if (leftSpacing >= minSpacing && rightSpacing >= minSpacing) {
      columnSpacings[dragIndex - 1] = Math.round(leftSpacing);
      columnSpacings[dragIndex] = Math.round(rightSpacing);
      updateVariableInputs();
      drawGrid();
      updateTotalDimensions();
    }
  } else if (dragType === 'row') {
    const y = e.clientY - rect.top;
    const newPos = (y - gridOffsetY) / canvasScale;

    const rowPositions = [0];
    rowSpacings.forEach(s => rowPositions.push(rowPositions[rowPositions.length - 1] + s));

    const minSpacing = 100;
    const topSpacing = Math.max(minSpacing, newPos - rowPositions[dragIndex - 1]);
    const bottomSpacing = Math.max(minSpacing, rowPositions[dragIndex + 1] - newPos);

    if (topSpacing >= minSpacing && bottomSpacing >= minSpacing) {
      rowSpacings[dragIndex - 1] = Math.round(topSpacing);
      rowSpacings[dragIndex] = Math.round(bottomSpacing);
      updateVariableInputs();
      drawGrid();
      updateTotalDimensions();
    }
  }
}

function onMouseUp() {
  isDragging = false;
  dragType = null;
  dragIndex = -1;
}
