/**
 * Excel Lookup – app.js
 * Handles UI logic: upload, search, keyboard shortcuts,
 * theme persistence, CSV export, staggered card animations, toasts.
 */

'use strict';

/* ── DOM refs ─────────────────────────────────────────────── */
const fileInput      = document.getElementById('fileInput');
const fileLabel      = document.getElementById('fileLabel');
const uploadBtn      = document.getElementById('uploadBtn');
const loadDefaultBtn = document.getElementById('loadDefaultBtn');
const uploadStatus   = document.getElementById('uploadStatus');

const sheetSelect    = document.getElementById('sheetSelect');
const keyInput       = document.getElementById('keyInput');
const searchBtn      = document.getElementById('searchBtn');
const clearBtn       = document.getElementById('clearBtn');
const searchStatus   = document.getElementById('searchStatus');

const resultsSection = document.getElementById('resultsSection');
const resultsHeading = document.getElementById('resultsHeading');
const resultsGrid    = document.getElementById('resultsGrid');
const exportBtn      = document.getElementById('exportBtn');

const themeToggle    = document.getElementById('themeToggle');
const toast          = document.getElementById('toast');

/* ── State ────────────────────────────────────────────────── */
let lastSheet = '';
let lastKey   = '';
let toastTimer = null;

/* ── Theme persistence ────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('excel-lookup-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.textContent = saved === 'dark' ? '🌙' : '☀️';
})();

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
  try { localStorage.setItem('excel-lookup-theme', next); } catch (_) {}
});

/* ── Toast ────────────────────────────────────────────────── */
function showToast(msg, type = 'info', duration = 3200) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, duration);
}

/* ── Status helpers ───────────────────────────────────────── */
function setStatus(el, msg, type = '') {
  el.textContent = msg;
  el.className   = `status-msg ${type}`.trim();
}

/* ── File input ───────────────────────────────────────────── */
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileLabel.querySelector('span:last-of-type').textContent = file.name;
    uploadBtn.disabled = false;
    setStatus(uploadStatus, '');
  } else {
    fileLabel.querySelector('span:last-of-type').textContent = 'Choose .xlsx / .xlsm file…';
    uploadBtn.disabled = true;
  }
});

/* ── Upload ───────────────────────────────────────────────── */
uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Client-side size check (10 MB)
  if (file.size > 10 * 1024 * 1024) {
    setStatus(uploadStatus, '⚠ File exceeds the 10 MB limit', 'error');
    showToast('File too large (max 10 MB)', 'error');
    return;
  }

  setStatus(uploadStatus, '⏳ Uploading…');
  uploadBtn.disabled = true;

  try {
    const form = new FormData();
    form.append('file', file);
    const res  = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();

    if (data.success) {
      setStatus(uploadStatus, `✅ ${data.message}`, 'success');
      showToast('Workbook loaded', 'success');
      populateSheets(data.sheets);
    } else {
      setStatus(uploadStatus, `❌ ${data.error}`, 'error');
      showToast(data.error, 'error');
    }
  } catch (err) {
    setStatus(uploadStatus, `❌ Network error: ${err.message}`, 'error');
    showToast('Upload failed – check console', 'error');
  } finally {
    uploadBtn.disabled = false;
  }
});

/* ── Load default ─────────────────────────────────────────── */
loadDefaultBtn.addEventListener('click', async () => {
  setStatus(uploadStatus, '⏳ Loading sample…');
  loadDefaultBtn.disabled = true;

  try {
    const res  = await fetch('/api/default');
    const data = await res.json();

    if (data.success) {
      setStatus(uploadStatus, `✅ ${data.message}`, 'success');
      showToast('Sample workbook loaded', 'success');
      populateSheets(data.sheets);
    } else {
      setStatus(uploadStatus, `❌ ${data.error}`, 'error');
      showToast(data.error, 'error');
    }
  } catch (err) {
    setStatus(uploadStatus, `❌ Network error: ${err.message}`, 'error');
    showToast('Load failed – check console', 'error');
  } finally {
    loadDefaultBtn.disabled = false;
  }
});

/* ── Sheet select ─────────────────────────────────────────── */
function populateSheets(sheets) {
  sheetSelect.innerHTML = '<option value="">— select sheet —</option>';
  sheets.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sheetSelect.appendChild(opt);
  });
  sheetSelect.disabled = false;
  keyInput.disabled    = false;
  searchBtn.disabled   = false;
  clearBtn.disabled    = false;
  // Auto-select first sheet
  if (sheets.length > 0) sheetSelect.value = sheets[0];
  // Focus the key input for quick typing
  keyInput.focus();
}

sheetSelect.addEventListener('change', () => {
  clearResults();
  setStatus(searchStatus, '');
});

/* ── Search ───────────────────────────────────────────────── */
searchBtn.addEventListener('click', doSearch);

async function doSearch() {
  const sheet = sheetSelect.value;
  const key   = keyInput.value.trim();

  if (!sheet) { showToast('Please select a sheet first', 'error'); return; }
  if (!key)   { showToast('Please enter a key to search', 'error'); keyInput.focus(); return; }

  lastSheet = sheet;
  lastKey   = key;

  setStatus(searchStatus, '⏳ Searching…');
  searchBtn.disabled = true;
  showLoadingSkeleton();

  try {
    const res  = await fetch(`/api/lookup?sheet=${encodeURIComponent(sheet)}&key=${encodeURIComponent(key)}`);
    const data = await res.json();

    if (data.success) {
      const count = data.data.length;
      setStatus(searchStatus, `✅ ${count} record${count !== 1 ? 's' : ''} found${data.cached ? ' (cached)' : ''}`, 'success');
      renderResults(data.data, sheet, key);
    } else {
      setStatus(searchStatus, `❌ ${data.error}`, 'error');
      clearResults();
    }
  } catch (err) {
    setStatus(searchStatus, `❌ Network error: ${err.message}`, 'error');
    clearResults();
  } finally {
    searchBtn.disabled = false;
  }
}

/* ── Results rendering ────────────────────────────────────── */
function renderResults(records, sheet, key) {
  resultsGrid.innerHTML = '';
  resultsSection.hidden = false;
  resultsHeading.textContent = `Results for "${key}" in ${sheet}`;

  records.forEach((record, i) => {
    const card = document.createElement('div');
    card.className = 'result-card glass-card';
    // Staggered entrance: delay each card by 60ms
    card.style.animationDelay = `${i * 60}ms`;

    const badge = document.createElement('div');
    badge.className = 'result-badge';
    badge.textContent = `# ${i + 1}`;
    card.appendChild(badge);

    Object.entries(record).forEach(([field, value]) => {
      const row = document.createElement('div');
      row.className = 'field-row';

      const label = document.createElement('span');
      label.className = 'field-label';
      label.textContent = field;

      const val = document.createElement('span');
      val.className = 'field-value';
      val.textContent = value !== null && value !== undefined ? String(value) : '—';

      row.appendChild(label);
      row.appendChild(val);
      card.appendChild(row);
    });

    resultsGrid.appendChild(card);
  });
}

function clearResults() {
  resultsGrid.innerHTML = '';
  resultsSection.hidden = true;
  resultsHeading.textContent = 'Results';
}

function showLoadingSkeleton() {
  resultsGrid.innerHTML = '';
  resultsSection.hidden = false;
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    card.className = 'result-card glass-card';
    card.style.animationDelay = `${i * 60}ms`;
    for (let j = 0; j < 4; j++) {
      const row = document.createElement('div');
      row.className = 'field-row';
      const sk = document.createElement('div');
      sk.className = 'skeleton';
      sk.style.width = `${60 + Math.random() * 30}%`;
      row.appendChild(sk);
      card.appendChild(row);
    }
    resultsGrid.appendChild(card);
  }
}

/* ── Clear ────────────────────────────────────────────────── */
clearBtn.addEventListener('click', () => {
  keyInput.value = '';
  setStatus(searchStatus, '');
  clearResults();
  lastKey   = '';
  lastSheet = '';
  keyInput.focus();
});

/* ── CSV Export ───────────────────────────────────────────── */
exportBtn.addEventListener('click', () => {
  const sheet = sheetSelect.value || lastSheet;
  const key   = lastKey;

  if (!sheet) { showToast('No sheet selected for export', 'error'); return; }

  let url = `/api/export?sheet=${encodeURIComponent(sheet)}`;
  if (key) url += `&key=${encodeURIComponent(key)}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('CSV download started', 'success');
});

/* ── Keyboard shortcuts ───────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  // Enter → search (when key input or search button is focused, or globally if loaded)
  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
    if (document.activeElement === keyInput ||
        document.activeElement === searchBtn ||
        document.activeElement === sheetSelect) {
      e.preventDefault();
      doSearch();
      return;
    }
  }

  // Escape → clear
  if (e.key === 'Escape') {
    clearBtn.click();
    return;
  }

  // Ctrl+/ or ? → show shortcut hint
  if ((e.ctrlKey && e.key === '/') || e.key === '?') {
    showToast('Enter: search  ·  Esc: clear  ·  Ctrl+/: help', 'info', 4000);
    return;
  }
});

/* ── Auto-load default workbook on page load ──────────────── */
(async function autoLoad() {
  try {
    const res  = await fetch('/api/sheets');
    const data = await res.json();
    if (data.sheets && data.sheets.length > 0) {
      populateSheets(data.sheets);
      setStatus(uploadStatus, '✅ Default workbook loaded', 'success');
    }
  } catch (_) {
    // Silently skip if no workbook loaded yet
  }
})();
