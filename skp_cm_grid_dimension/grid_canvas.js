// Canvas Drawing — styled like a construction drawing: dash-dot grid lines + label bubbles
const BUBBLE_R = 8;

function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Redraw when the OS switches light/dark
const darkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', () => drawGrid());

function drawBubble(x, y, text, line, ink, fill) {
  ctx.beginPath();
  ctx.arc(x, y, BUBBLE_R, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = line;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
}

function drawGrid() {
  if (!ctx) return;

  const width = canvas.width / 2;
  const height = canvas.height / 2;
  const c = {
    sheet: themeColor('--sheet'),
    line: themeColor('--line-strong'),
    ink: themeColor('--ink-2'),
    accent: themeColor('--accent'),
    surface: themeColor('--surface')
  };
  const font = themeColor('--font');

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = c.sheet;
  ctx.fillRect(0, 0, width, height);

  // Calculate scale (variable mode reserves room for the measurements)
  const totalWidth = columnSpacings.reduce((a, b) => a + b, 0);
  const totalDepth = rowSpacings.reduce((a, b) => a + b, 0);
  const isVariable = currentMode === 'variable';

  const availableWidth = width - 34 - (isVariable ? 40 : 16);
  const availableHeight = height - gridOffsetY - (isVariable ? 26 : 16);

  canvasScale = Math.min(availableWidth / totalWidth, availableHeight / totalDepth);
  // Center the grid horizontally on the sheet (mouse hit-testing reads gridOffsetX too)
  gridOffsetX = 34 + Math.max(0, (availableWidth - totalWidth * canvasScale) / 2);

  // Calculate positions
  const colPositions = [0];
  columnSpacings.forEach(s => colPositions.push(colPositions[colPositions.length - 1] + s));

  const rowPositions = [0];
  rowSpacings.forEach(s => rowPositions.push(rowPositions[rowPositions.length - 1] + s));

  const left = gridOffsetX;
  const top = gridOffsetY;
  const right = left + totalWidth * canvasScale;
  const bottom = top + totalDepth * canvasScale;
  const bubbleTop = top - BUBBLE_R - 8;
  const bubbleLeft = left - BUBBLE_R - 8;

  // Grid lines run from the bubble to just past the far edge
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1;
  ctx.setLineDash([9, 3, 2, 3]);

  colPositions.forEach(pos => {
    const x = Math.round(left + pos * canvasScale) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, bubbleTop + BUBBLE_R);
    ctx.lineTo(x, bottom + 6);
    ctx.stroke();
  });

  rowPositions.forEach(pos => {
    const y = Math.round(top + pos * canvasScale) + 0.5;
    ctx.beginPath();
    ctx.moveTo(bubbleLeft + BUBBLE_R, y);
    ctx.lineTo(right + 6, y);
    ctx.stroke();
  });

  ctx.setLineDash([]);

  // Label bubbles: numbers on columns, letters on rows
  ctx.font = `600 9px ${font}`;
  colPositions.forEach((pos, i) => {
    drawBubble(left + pos * canvasScale, bubbleTop, String(i + 1), c.line, c.ink, c.sheet);
  });
  rowPositions.forEach((pos, i) => {
    drawBubble(bubbleLeft, top + pos * canvasScale, String.fromCharCode(65 + i), c.line, c.ink, c.sheet);
  });

  if (!isVariable) return;

  // Drag handles (inner lines only)
  const handle = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = c.accent;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.sheet;
    ctx.stroke();
  };
  for (let i = 1; i < colPositions.length - 1; i++) {
    handle(left + colPositions[i] * canvasScale, (top + bottom) / 2);
  }
  for (let i = 1; i < rowPositions.length - 1; i++) {
    handle((left + right) / 2, top + rowPositions[i] * canvasScale);
  }

  // Bay measurements
  ctx.fillStyle = c.accent;
  ctx.font = `500 9px ${font}`;
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'center';
  for (let i = 0; i < columnSpacings.length; i++) {
    const x1 = left + colPositions[i] * canvasScale;
    const x2 = left + colPositions[i + 1] * canvasScale;
    ctx.fillText(formatMeasurement(columnSpacings[i]), (x1 + x2) / 2, bottom + 15);
  }

  ctx.textAlign = 'left';
  for (let i = 0; i < rowSpacings.length; i++) {
    const y1 = top + rowPositions[i] * canvasScale;
    const y2 = top + rowPositions[i + 1] * canvasScale;
    ctx.fillText(formatMeasurement(rowSpacings[i]), right + 10, (y1 + y2) / 2);
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
