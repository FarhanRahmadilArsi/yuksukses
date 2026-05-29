/* ============================================
   HRSync — Employee Management System
   script.js — Core Application Logic
   Author: Senior Full Stack Dev
   Version: 1.0.0
   ============================================ */

'use strict';

/* ==========================================
   CONSTANTS & CONFIGURATION
   ========================================== */

const STORAGE_KEY = 'hrsync_employees';
const ROWS_PER_PAGE = 8;
const API_BASE = '/api/employees';

const DEPT_COLORS = {
  'Engineering':      { bg: 'bg-blue-100 dark:bg-blue-900',   text: 'text-blue-700 dark:text-blue-300',   bar: '#3b82f6' },
  'Product':          { bg: 'bg-violet-100 dark:bg-violet-900', text: 'text-violet-700 dark:text-violet-300', bar: '#8b5cf6' },
  'Design':           { bg: 'bg-pink-100 dark:bg-pink-900',   text: 'text-pink-700 dark:text-pink-300',   bar: '#ec4899' },
  'Marketing':        { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-300', bar: '#f59e0b' },
  'Sales':            { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', bar: '#10b981' },
  'Finance':          { bg: 'bg-teal-100 dark:bg-teal-900',   text: 'text-teal-700 dark:text-teal-300',   bar: '#14b8a6' },
  'Human Resources':  { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', bar: '#f97316' },
  'Operations':       { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', bar: '#64748b' },
  'Legal':            { bg: 'bg-red-100 dark:bg-red-900',     text: 'text-red-700 dark:text-red-300',     bar: '#ef4444' },
  'Customer Success': { bg: 'bg-cyan-100 dark:bg-cyan-900',   text: 'text-cyan-700 dark:text-cyan-300',   bar: '#06b6d4' },
};

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' }, { bg: '#d1fae5', text: '#065f46' },
  { bg: '#ede9fe', text: '#6d28d9' }, { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fce7f3', text: '#9d174d' }, { bg: '#ccfbf1', text: '#0f766e' },
  { bg: '#ffedd5', text: '#9a3412' }, { bg: '#e0e7ff', text: '#3730a3' },
];

/* ==========================================
   APPLICATION STATE
   ========================================== */

let state = {
  employees: [],
  filtered: [],
  currentPage: 1,
  searchQuery: '',
  sortBy: 'name-asc',
  deleteTargetId: null,
  editMode: false,
};

/* ==========================================
   LOCALSTORAGE HELPERS
   ========================================== */

const storage = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

async function apiGetEmployees() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Gagal mengambil data dari server');
  return res.json();
}

async function apiCreateEmployee(employee) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  if (!res.ok) throw new Error('Gagal menyimpan data ke server');
  return res.json();
}

async function apiUpdateEmployee(id, employee) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  if (!res.ok) throw new Error('Gagal memperbarui data di server');
  return res.json();
}

async function apiDeleteEmployee(id) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus data dari server');
}

async function fetchEmployees() {
  try {
    return await apiGetEmployees();
  } catch (error) {
    console.warn('API tidak tersedia, menggunakan data lokal.', error);
    return storage.load();
  }
}

async function saveEmployeesLocally(data) {
  storage.save(data);
}

/* ==========================================
   ID GENERATOR
   ========================================== */

function generateId() {
  const year = new Date().getFullYear();
  const seq = String(state.employees.length + 1).padStart(4, '0');
  return `EMP-${year}-${seq}`;
}

/* ==========================================
   SANITIZATION & VALIDATION
   ========================================== */

function sanitizeText(str) {
  return String(str)
    .trim()
    .replace(/[<>"'`]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[c]);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  return /^[0-9]{8,15}$/.test(cleaned);
}

function validateForm() {
  const fields = [
    { id: 'fieldNama',      err: 'errNama',      label: 'Nama lengkap wajib diisi' },
    { id: 'fieldEmail',     err: 'errEmail',      label: 'Email wajib diisi' },
    { id: 'fieldTelepon',   err: 'errTelepon',    label: 'Nomor telepon wajib diisi' },
    { id: 'fieldTanggal',   err: 'errTanggal',    label: 'Tanggal masuk wajib diisi' },
    { id: 'fieldJabatan',   err: 'errJabatan',    label: 'Jabatan wajib diisi' },
    { id: 'fieldDepartemen',err: 'errDepartemen', label: 'Departemen wajib dipilih' },
  ];
  let valid = true;

  fields.forEach(({ id, err, label }) => {
    const el = document.getElementById(id);
    const errEl = document.getElementById(err);
    const val = el.value.trim();
    el.classList.remove('invalid');
    errEl.classList.add('hidden');
    errEl.textContent = '';

    if (!val) {
      el.classList.add('invalid');
      errEl.textContent = label;
      errEl.classList.remove('hidden');
      valid = false;
      return;
    }

    if (id === 'fieldEmail' && !validateEmail(val)) {
      el.classList.add('invalid');
      errEl.textContent = 'Format email tidak valid';
      errEl.classList.remove('hidden');
      valid = false;
    }

    if (id === 'fieldTelepon' && !validatePhone(val)) {
      el.classList.add('invalid');
      errEl.textContent = 'Nomor telepon tidak valid (8–15 digit)';
      errEl.classList.remove('hidden');
      valid = false;
    }
  });

  return valid;
}

/* ==========================================
   TOAST NOTIFICATION
   ========================================== */

function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error:   `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    info:    `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type]}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ==========================================
   LOADING SPINNER HELPERS
   ========================================== */

function showLoading() {
  document.getElementById('loadingSpinner').classList.remove('hidden');
  document.getElementById('loadingSpinner').classList.add('flex');
  document.getElementById('tableContainer').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loadingSpinner').classList.add('hidden');
  document.getElementById('loadingSpinner').classList.remove('flex');
  document.getElementById('tableContainer').classList.remove('hidden');
}

/* ==========================================
   DARK MODE
   ========================================== */

function initDarkMode() {
  const saved = localStorage.getItem('hrsync_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  applyDarkMode(isDark);
}

function applyDarkMode(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  if (sunIcon) sunIcon.classList.toggle('hidden', !isDark);
  if (moonIcon) moonIcon.classList.toggle('hidden', isDark);
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('hrsync_theme', isDark ? 'dark' : 'light');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  if (sunIcon) sunIcon.classList.toggle('hidden', !isDark);
  if (moonIcon) moonIcon.classList.toggle('hidden', isDark);
}

/* ==========================================
   AVATAR HELPER
   ========================================== */

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getAvatarColor(name) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ==========================================
   SORT & FILTER
   ========================================== */

function applySearch(query) {
  if (!query) return state.employees;
  const q = query.toLowerCase();
  return state.employees.filter(emp =>
    emp.nama.toLowerCase().includes(q) ||
    emp.email.toLowerCase().includes(q) ||
    emp.jabatan.toLowerCase().includes(q) ||
    emp.departemen.toLowerCase().includes(q) ||
    emp.id.toLowerCase().includes(q)
  );
}

function applySort(data, sortBy) {
  const sorted = [...data];
  switch (sortBy) {
    case 'name-asc':  sorted.sort((a, b) => a.nama.localeCompare(b.nama)); break;
    case 'name-desc': sorted.sort((a, b) => b.nama.localeCompare(a.nama)); break;
    case 'date-asc':  sorted.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)); break;
    case 'date-desc': sorted.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); break;
    case 'dept-asc':  sorted.sort((a, b) => a.departemen.localeCompare(b.departemen)); break;
  }
  return sorted;
}

function handleSort() {
  state.sortBy = document.getElementById('sortSelect').value;
  state.currentPage = 1;
  render();
}

/* ==========================================
   SEARCH HANDLER (real-time)
   ========================================== */

function handleSearch(query) {
  state.searchQuery = query;
  state.currentPage = 1;
  render();
}

/* ==========================================
   STATS UPDATE
   ========================================== */

function updateStats() {
  const total = state.employees.length;
  const depts = new Set(state.employees.map(e => e.departemen)).size;
  const positions = new Set(state.employees.map(e => e.jabatan)).size;
  const now = new Date();
  const newThisMonth = state.employees.filter(e => {
    const d = new Date(e.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  animateCount('statTotal', total);
  animateCount('statDept', depts);
  animateCount('statPosition', positions);
  animateCount('statNew', newThisMonth);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  const current = parseInt(el.textContent) || 0;
  const step = target > current ? 1 : -1;
  if (current === target) return;
  let val = current;
  const timer = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(timer);
  }, 30);
}

/* ==========================================
   DEPARTMENT CHART
   ========================================== */

function renderDeptChart() {
  const chart = document.getElementById('deptChart');
  if (!state.employees.length) {
    chart.innerHTML = '<p class="text-sm text-slate-400 dark:text-slate-500 text-center py-6">Belum ada data karyawan</p>';
    return;
  }

  const deptCount = {};
  state.employees.forEach(e => {
    deptCount[e.departemen] = (deptCount[e.departemen] || 0) + 1;
  });

  const sorted = Object.entries(deptCount).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];

  chart.innerHTML = sorted.map(([dept, count]) => {
    const pct = Math.round((count / max) * 100);
    const color = DEPT_COLORS[dept]?.bar || '#6366f1';
    const badge = DEPT_COLORS[dept] ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-500 ${DEPT_COLORS[dept].bg} ${DEPT_COLORS[dept].text}">${dept}</span>` : `<span class="text-sm font-500 text-slate-700 dark:text-slate-300">${dept}</span>`;
    return `
      <div class="flex items-center gap-3">
        <div class="w-36 sm:w-44 flex-shrink-0">${badge}</div>
        <div class="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div class="dept-bar h-2 rounded-full" style="width: ${pct}%; background: ${color};"></div>
        </div>
        <span class="text-sm font-600 text-slate-700 dark:text-slate-300 w-12 text-right">${count} <span class="text-xs text-slate-400 font-400">org</span></span>
      </div>
    `;
  }).join('');
}

/* ==========================================
   RENDER TABLE ROWS
   ========================================== */

function renderTable() {
  const tableBody = document.getElementById('employeeTable');
  const emptyState = document.getElementById('emptyState');
  const paginationContainer = document.getElementById('paginationContainer');
  const tableContainer = document.getElementById('tableContainer');
  const subtitle = document.getElementById('tableSubtitle');

  state.filtered = applySort(applySearch(state.searchQuery), state.sortBy);

  const total = state.filtered.length;
  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  if (state.currentPage > totalPages) state.currentPage = 1;

  const start = (state.currentPage - 1) * ROWS_PER_PAGE;
  const pageData = state.filtered.slice(start, start + ROWS_PER_PAGE);

  // Update subtitle
  subtitle.textContent = state.searchQuery
    ? `Ditemukan ${total} hasil untuk "${state.searchQuery}"`
    : `Menampilkan ${total} karyawan`;

  // Empty state
  if (total === 0) {
    tableContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    paginationContainer.classList.add('hidden');
    document.getElementById('emptyTitle').textContent = state.searchQuery ? 'Karyawan tidak ditemukan' : 'Belum ada karyawan';
    document.getElementById('emptyDesc').textContent = state.searchQuery ? `Tidak ada hasil untuk "${state.searchQuery}"` : 'Buka halaman Registrasi untuk menambahkan data pertama';
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');
  tableContainer.classList.remove('hidden');
  paginationContainer.classList.remove('hidden');

  // Render rows
  tableBody.innerHTML = pageData.map((emp, i) => {
    const initials = getInitials(emp.nama);
    const avatarColor = getAvatarColor(emp.nama);
    const deptStyle = DEPT_COLORS[emp.departemen] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' };
    const dateFormatted = formatDate(emp.tanggal);

    return `
      <tr class="row-enter" style="animation-delay: ${i * 0.04}s">
        <td class="px-4 sm:px-5 py-3.5">
          <span class="font-mono text-xs text-slate-400 dark:text-slate-500">${emp.id}</span>
        </td>
        <td class="px-4 sm:px-5 py-3.5">
          <div class="flex items-center gap-3">
            <div class="avatar" style="background:${avatarColor.bg}; color:${avatarColor.text}">
              ${initials}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-600 text-slate-800 dark:text-slate-200 truncate">${escapeHtml(emp.nama)}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 truncate">${escapeHtml(emp.email)}</p>
            </div>
          </div>
        </td>
        <td class="hidden md:table-cell px-4 sm:px-5 py-3.5">
          <span class="text-sm text-slate-600 dark:text-slate-400">${escapeHtml(emp.jabatan)}</span>
        </td>
        <td class="hidden lg:table-cell px-4 sm:px-5 py-3.5">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-500 ${deptStyle.bg} ${deptStyle.text}">
            ${escapeHtml(emp.departemen)}
          </span>
        </td>
        <td class="hidden xl:table-cell px-4 sm:px-5 py-3.5">
          <span class="text-sm text-slate-500 dark:text-slate-400">${dateFormatted}</span>
        </td>
        <td class="hidden md:table-cell px-4 sm:px-5 py-3.5">
          <span class="text-sm text-slate-500 dark:text-slate-400 font-mono">${escapeHtml(emp.telepon)}</span>
        </td>
        <td class="px-4 sm:px-5 py-3.5">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openEditModal('${emp.id}')" title="Edit"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-all duration-150">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button onclick="openDeleteModal('${emp.id}')" title="Hapus"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-150">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Pagination info
  document.getElementById('paginationInfo').textContent =
    `Menampilkan ${start + 1}–${Math.min(start + ROWS_PER_PAGE, total)} dari ${total} karyawan`;

  renderPagination(totalPages);
}

/* ==========================================
   PAGINATION
   ========================================== */

function renderPagination(totalPages) {
  const container = document.getElementById('paginationBtns');
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const makeBtn = (label, page, disabled = false, active = false) => `
    <button class="page-btn ${active ? 'page-active' : ''}" ${disabled ? 'disabled' : ''} onclick="goToPage(${page})">
      ${label}
    </button>
  `;

  let html = makeBtn('‹', state.currentPage - 1, state.currentPage === 1);

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= state.currentPage - 1 && i <= state.currentPage + 1)
    ) {
      html += makeBtn(i, i, false, i === state.currentPage);
    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
      html += `<span class="page-btn opacity-40 cursor-default">…</span>`;
    }
  }

  html += makeBtn('›', state.currentPage + 1, state.currentPage === totalPages);
  container.innerHTML = html;
}

function goToPage(page) {
  state.currentPage = page;
  renderTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================
   MASTER RENDER
   ========================================== */

function render() {
  updateStats();
  renderDeptChart();
  renderTable();
}

/* ==========================================
   MODAL: ADD EMPLOYEE
   ========================================== */

function openAddModal() {
  window.location.href = 'registrasi.html';
}

function resetForm() {
  ['fieldNama','fieldEmail','fieldTelepon','fieldTanggal','fieldJabatan','fieldDepartemen'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('invalid');
  });
  ['errNama','errEmail','errTelepon','errTanggal','errJabatan','errDepartemen'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.textContent = '';
  });
}

/* ==========================================
   MODAL: EDIT EMPLOYEE
   ========================================== */

function openEditModal(id) {
  const emp = state.employees.find(e => e.id === id);
  if (!emp) return;
  state.editMode = true;
  document.getElementById('modalTitle').textContent = 'Edit Karyawan';
  document.getElementById('submitBtnText').textContent = 'Perbarui';
  document.getElementById('editId').value = emp.id;
  document.getElementById('fieldNama').value = emp.nama;
  document.getElementById('fieldEmail').value = emp.email;
  document.getElementById('fieldTelepon').value = emp.telepon;
  document.getElementById('fieldTanggal').value = emp.tanggal;
  document.getElementById('fieldJabatan').value = emp.jabatan;
  document.getElementById('fieldDepartemen').value = emp.departemen;
  ['fieldNama','fieldEmail','fieldTelepon','fieldTanggal','fieldJabatan','fieldDepartemen'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
  });
  ['errNama','errEmail','errTelepon','errTanggal','errJabatan','errDepartemen'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  openModal('formModal');
}

/* ==========================================
   SUBMIT FORM (CREATE / UPDATE)
   ========================================== */

async function submitForm() {
  if (!validateForm()) {
    showToast('Harap lengkapi semua field dengan benar', 'error');
    return;
  }

  const btn = document.getElementById('submitBtn');
  const spinner = document.getElementById('submitSpinner');
  const btnText = document.getElementById('submitBtnText');
  const editId = document.getElementById('editId').value;

  const newData = {
    id: editId || generateId(),
    nama: sanitizeText(document.getElementById('fieldNama').value),
    email: sanitizeText(document.getElementById('fieldEmail').value.toLowerCase()),
    telepon: sanitizeText(document.getElementById('fieldTelepon').value),
    tanggal: document.getElementById('fieldTanggal').value,
    jabatan: sanitizeText(document.getElementById('fieldJabatan').value),
    departemen: document.getElementById('fieldDepartemen').value,
  };

  btn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Menyimpan...';

  try {
    if (editId) {
      await apiUpdateEmployee(editId, newData);
      const idx = state.employees.findIndex(e => e.id === editId);
      state.employees[idx] = { ...state.employees[idx], ...newData, updatedAt: Date.now() };
      showToast(`Data ${newData.nama} berhasil diperbarui`, 'success');
    } else {
      const created = await apiCreateEmployee(newData);
      state.employees.push(created);
      showToast(`${created.nama} berhasil ditambahkan`, 'success');
    }
  } catch (error) {
    showToast(`Gagal menyimpan data: ${error.message}`, 'error');
    return;
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = editId ? 'Perbarui' : 'Simpan';
  }

  closeModal();
  render();
}

/* ==========================================
   MODAL: DELETE
   ========================================== */

function openDeleteModal(id) {
  const emp = state.employees.find(e => e.id === id);
  if (!emp) return;
  state.deleteTargetId = id;
  document.getElementById('deleteDesc').textContent =
    `Karyawan "${emp.nama}" akan dihapus secara permanen.`;
  openModal('deleteModal');
}

function closeDeleteModal() {
  closeModal('deleteModal');
  state.deleteTargetId = null;
}

async function confirmDelete() {
  if (!state.deleteTargetId) return;

  const btn = document.getElementById('deleteBtn');
  const spinner = document.getElementById('deleteSpinner');
  const btnText = document.getElementById('deleteBtnText');
  const emp = state.employees.find(e => e.id === state.deleteTargetId);

  btn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Menghapus...';

  try {
    await apiDeleteEmployee(state.deleteTargetId);
    state.employees = state.employees.filter(e => e.id !== state.deleteTargetId);
    closeModal('deleteModal');
    state.deleteTargetId = null;
    render();
    showToast(`Data ${emp?.nama || 'karyawan'} berhasil dihapus`, 'info');
  } catch (error) {
    showToast(`Gagal menghapus data: ${error.message}`, 'error');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Hapus';
  }
}

/* ==========================================
   MODAL HELPERS
   ========================================== */

function openModal(id = 'formModal') {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id = 'formModal') {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

/* ==========================================
   EXPORT CSV
   ========================================== */

function exportCSV() {
  if (!state.employees.length) {
    showToast('Tidak ada data untuk diekspor', 'error');
    return;
  }

  const headers = ['ID Karyawan', 'Nama Lengkap', 'Email', 'Nomor Telepon', 'Jabatan', 'Departemen', 'Tanggal Masuk'];
  const rows = state.employees.map(e => [
    e.id, e.nama, e.email, e.telepon, e.jabatan, e.departemen, e.tanggal
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hrsync_karyawan_${formatDateFile(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${state.employees.length} data berhasil diekspor ke CSV`, 'success');
}

/* ==========================================
   IMPORT CSV
   ========================================== */

async function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoading();

  const reader = new FileReader();
  reader.onload = (e) => {
    setTimeout(async () => {
      try {
        const text = e.target.result.replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('File CSV kosong atau tidak valid');

        const headers = parseCSVLine(lines[0]);
        const expectedHeaders = ['ID Karyawan', 'Nama Lengkap', 'Email', 'Nomor Telepon', 'Jabatan', 'Departemen', 'Tanggal Masuk'];

        // Validate headers
        const hasValidHeaders = expectedHeaders.every((h, i) =>
          headers[i]?.toLowerCase().includes(h.toLowerCase().split(' ')[0].toLowerCase())
        );
        if (!hasValidHeaders) {
          throw new Error('Format header CSV tidak sesuai. Gunakan template export untuk impor.');
        }

        let imported = 0;
        let skipped = 0;
        const importedEmployees = [];

        for (const line of lines.slice(1)) {
          const cols = parseCSVLine(line);
          if (cols.length < 7) { skipped++; continue; }

          const emp = {
            id: cols[0] || generateId(),
            nama: sanitizeText(cols[1]),
            email: sanitizeText(cols[2].toLowerCase()),
            telepon: sanitizeText(cols[3]),
            jabatan: sanitizeText(cols[4]),
            departemen: sanitizeText(cols[5]),
            tanggal: cols[6],
          };

          if (!emp.nama || !validateEmail(emp.email)) { skipped++; continue; }

          if (state.employees.find(e => e.id === emp.id)) {
            emp.id = generateId() + '-' + Math.random().toString(36).slice(2, 6);
          }

          try {
            const created = await apiCreateEmployee(emp);
            importedEmployees.push(created);
            imported++;
          } catch (err) {
            skipped++;
          }
        }

        state.employees = state.employees.concat(importedEmployees);
        hideLoading();
        render();
        showToast(`Berhasil mengimpor ${imported} karyawan${skipped ? `, ${skipped} data dilewati` : ''}`, 'success');
      } catch (err) {
        hideLoading();
        showToast(err.message || 'Gagal mengimpor CSV', 'error');
      }

      event.target.value = '';
    }, 600);
  };
  reader.readAsText(file, 'UTF-8');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/* ==========================================
   DATE FORMATTERS
   ========================================== */

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateFile(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/* ==========================================
   XSS ESCAPE
   ========================================== */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ==========================================
   SEED DATA (for demo)
   ========================================== */

function seedDemoData() {
  const demo = [
    { nama: 'Andi Prasetyo',    email: 'andi.prasetyo@hrsync.id',    telepon: '08123456789', jabatan: 'Senior Software Engineer', departemen: 'Engineering',     tanggal: '2022-03-15' },
    { nama: 'Siti Rahayu',      email: 'siti.rahayu@hrsync.id',      telepon: '08234567890', jabatan: 'Product Manager',          departemen: 'Product',         tanggal: '2021-07-01' },
    { nama: 'Budi Santoso',     email: 'budi.santoso@hrsync.id',     telepon: '08345678901', jabatan: 'UI/UX Designer',           departemen: 'Design',          tanggal: '2023-01-10' },
    { nama: 'Dewi Lestari',     email: 'dewi.lestari@hrsync.id',     telepon: '08456789012', jabatan: 'Marketing Lead',           departemen: 'Marketing',       tanggal: '2020-11-20' },
    { nama: 'Rizky Firmansyah', email: 'rizky.firmansyah@hrsync.id', telepon: '08567890123', jabatan: 'Sales Executive',          departemen: 'Sales',           tanggal: '2023-06-05' },
    { nama: 'Nurul Hidayah',    email: 'nurul.hidayah@hrsync.id',    telepon: '08678901234', jabatan: 'HR Manager',               departemen: 'Human Resources', tanggal: '2019-04-12' },
    { nama: 'Fajar Ramadhan',   email: 'fajar.ramadhan@hrsync.id',   telepon: '08789012345', jabatan: 'Finance Analyst',          departemen: 'Finance',         tanggal: '2022-08-30' },
    { nama: 'Mega Wulandari',   email: 'mega.wulandari@hrsync.id',   telepon: '08890123456', jabatan: 'Operations Manager',       departemen: 'Operations',      tanggal: '2021-02-14' },
    { nama: 'Hendra Wijaya',    email: 'hendra.wijaya@hrsync.id',    telepon: '08901234567', jabatan: 'Backend Developer',        departemen: 'Engineering',     tanggal: '2023-09-01' },
    { nama: 'Putri Amelia',     email: 'putri.amelia@hrsync.id',     telepon: '08112345678', jabatan: 'Customer Success Mgr',     departemen: 'Customer Success',tanggal: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}` },
    { nama: 'Dimas Kurniawan',  email: 'dimas.kurniawan@hrsync.id',  telepon: '08223456789', jabatan: 'DevOps Engineer',          departemen: 'Engineering',     tanggal: '2022-12-01' },
    { nama: 'Ayu Puspita',      email: 'ayu.puspita@hrsync.id',      telepon: '08334567890', jabatan: 'Legal Counsel',            departemen: 'Legal',           tanggal: '2020-05-18' },
  ];

  demo.forEach((d, i) => {
    state.employees.push({
      id: `EMP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      ...d,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  storage.save(state.employees);
}

/* ==========================================
   EVENT LISTENERS
   ========================================== */

function initEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const searchInputMobile = document.getElementById('searchInputMobile');
  const formModal = document.getElementById('formModal');
  const deleteModal = document.getElementById('deleteModal');

  if (!searchInput || !searchInputMobile || !formModal || !deleteModal) return;

  // Search (desktop)
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
    searchInputMobile.value = e.target.value;
  });

  // Search (mobile)
  searchInputMobile.addEventListener('input', (e) => {
    handleSearch(e.target.value);
    searchInput.value = e.target.value;
  });

  // Close modal on backdrop click
  formModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('formModal');
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('formModal');
      closeDeleteModal();
    }
  });

  // Real-time clear invalid state on input
  ['fieldNama','fieldEmail','fieldTelepon','fieldTanggal','fieldJabatan','fieldDepartemen'].forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('input', () => {
      field.classList.remove('invalid');
      const errId = 'err' + id.replace('field', '');
      const errEl = document.getElementById(errId);
      if (errEl) errEl.classList.add('hidden');
    });
  });
}

/* ==========================================
   REGISTRATION PAGE
   ========================================== */

function setRegistrationError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (!field || !error) return;
  field.classList.add('invalid');
  error.textContent = message;
  error.classList.remove('hidden');
}

function clearRegistrationError(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (field) field.classList.remove('invalid');
  if (error) {
    error.textContent = '';
    error.classList.add('hidden');
  }
}

function validateRegistrationForm() {
  const fields = [
    { id: 'regNama', err: 'errRegNama', label: 'Nama lengkap wajib diisi' },
    { id: 'regEmail', err: 'errRegEmail', label: 'Email wajib diisi' },
    { id: 'regTelepon', err: 'errRegTelepon', label: 'Nomor telepon wajib diisi' },
    { id: 'regTanggal', err: 'errRegTanggal', label: 'Tanggal masuk wajib diisi' },
    { id: 'regJabatan', err: 'errRegJabatan', label: 'Jabatan wajib diisi' },
    { id: 'regDepartemen', err: 'errRegDepartemen', label: 'Departemen wajib dipilih' },
  ];
  let valid = true;

  fields.forEach(({ id, err, label }) => {
    const field = document.getElementById(id);
    const value = field?.value.trim() || '';
    clearRegistrationError(id, err);

    if (!value) {
      setRegistrationError(id, err, label);
      valid = false;
      return;
    }

    if (id === 'regEmail' && !validateEmail(value)) {
      setRegistrationError(id, err, 'Format email tidak valid');
      valid = false;
    }

    if (id === 'regTelepon' && !validatePhone(value)) {
      setRegistrationError(id, err, 'Nomor telepon tidak valid (8-15 digit)');
      valid = false;
    }
  });

  return valid;
}

function openRegistrationSuccess(employee) {
  const modal = document.getElementById('registrationSuccessModal');
  if (!modal) return;
  document.getElementById('successEmployeeName').textContent = employee.nama;
  document.getElementById('successEmployeeId').textContent = employee.id;
  document.getElementById('successEmployeeDept').textContent = employee.departemen;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeRegistrationSuccess() {
  const modal = document.getElementById('registrationSuccessModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

async function submitRegistrationForm(event) {
  event.preventDefault();

  if (!validateRegistrationForm()) {
    showToast('Periksa kembali data registrasi', 'error');
    return;
  }

  const btn = document.getElementById('registrationSubmitBtn');
  const btnText = document.getElementById('registrationSubmitText');
  const originalText = btnText.textContent;

  const newData = {
    id: generateId(),
    nama: sanitizeText(document.getElementById('regNama').value),
    email: sanitizeText(document.getElementById('regEmail').value.toLowerCase()),
    telepon: sanitizeText(document.getElementById('regTelepon').value),
    tanggal: document.getElementById('regTanggal').value,
    jabatan: sanitizeText(document.getElementById('regJabatan').value),
    departemen: document.getElementById('regDepartemen').value,
  };

  btn.disabled = true;
  btnText.textContent = 'Menyimpan...';

  try {
    const created = await apiCreateEmployee(newData);
    state.employees.push(created);
    document.getElementById('registrationForm').reset();
    openRegistrationSuccess(created);
    showToast('Registrasi berhasil disimpan', 'success');
  } catch (error) {
    const localEmployee = { ...newData, createdAt: Date.now(), updatedAt: Date.now() };
    state.employees.push(localEmployee);
    await saveEmployeesLocally(state.employees);
    document.getElementById('registrationForm').reset();
    openRegistrationSuccess(localEmployee);
    showToast('Server tidak aktif, data disimpan lokal', 'info');
  } finally {
    btn.disabled = false;
    btnText.textContent = originalText;
  }
}

function initRegistrationForm() {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', submitRegistrationForm);

  [
    ['regNama', 'errRegNama'],
    ['regEmail', 'errRegEmail'],
    ['regTelepon', 'errRegTelepon'],
    ['regTanggal', 'errRegTanggal'],
    ['regJabatan', 'errRegJabatan'],
    ['regDepartemen', 'errRegDepartemen'],
  ].forEach(([fieldId, errorId]) => {
    const field = document.getElementById(fieldId);
    if (field) field.addEventListener('input', () => clearRegistrationError(fieldId, errorId));
  });

  const modal = document.getElementById('registrationSuccessModal');
  const closeBtn = document.getElementById('closeRegistrationSuccess');
  if (closeBtn) closeBtn.addEventListener('click', closeRegistrationSuccess);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeRegistrationSuccess();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRegistrationSuccess();
  });
}

/* ==========================================
   INIT APP
   ========================================== */

document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  state.employees = await fetchEmployees();
  if (document.getElementById('employeeTable')) {
    initEventListeners();
    render();
  }
  initRegistrationForm();
});
