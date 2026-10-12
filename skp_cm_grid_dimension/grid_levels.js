// Height levels
function addLevel() {
  levelCounter++;
  const container = document.getElementById('heightLevels');
  const levelDiv = document.createElement('div');
  levelDiv.className = 'height-level';
  levelDiv.dataset.level = levelCounter;
  levelDiv.innerHTML = `
    <span class="level-label">ระดับ ${levelCounter}</span>
    <input type="number" min="0" step="0.1" value="" placeholder="ความสูง">
    <button class="btn-remove" onclick="removeLevel(this)" title="ลบ">✕</button>
  `;
  container.appendChild(levelDiv);
  levelDiv.querySelector('input').focus();
}

// Replace all level rows with the given values (current unit)
function setLevels(values) {
  document.getElementById('heightLevels').innerHTML = '';
  levelCounter = 0;
  values.forEach(value => {
    addLevel();
    document.querySelector('.height-level:last-child input').value = value;
  });
}

function removeLevel(btn) {
  const levels = document.querySelectorAll('.height-level');
  if (levels.length > 1) {
    btn.closest('.height-level').remove();
    updateLevelLabels();
  }
}

function updateLevelLabels() {
  document.querySelectorAll('.height-level').forEach((level, index) => {
    level.querySelector('.level-label').textContent = `ระดับ ${index + 1}`;
    level.dataset.level = index + 1;
  });
}

function getHeightLevels() {
  const levels = [];
  document.querySelectorAll('.height-level input').forEach(input => {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      levels.push(value);
    }
  });
  return levels.sort((a, b) => a - b);
}
