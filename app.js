const form = document.getElementById('studentForm');
const studentsBody = document.getElementById('studentsBody');
const template = document.getElementById('studentRowTemplate');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const notesDialog = document.getElementById('notesDialog');
const dialogTitle = document.getElementById('dialogTitle');
const dialogContent = document.getElementById('dialogContent');
const closeDialogBtn = document.getElementById('closeDialog');
const toggleThemeBtn = document.getElementById('toggleTheme');

const counters = {
  active: document.getElementById('activeCount'),
  on_leave: document.getElementById('onLeaveCount'),
  completed: document.getElementById('completedCount'),
  risky: document.getElementById('riskCount'),
};

const STATUS_LABELS = {
  active: 'Aktif',
  on_leave: 'Tatilde',
  completed: 'Mezun',
  risky: 'Risk Altında',
};

const STORAGE_KEY = 'student-tracker-data';
const THEME_KEY = 'student-tracker-theme';

const state = {
  students: loadStudents(),
  filter: 'all',
  query: '',
};

render();

form.addEventListener('submit', handleSubmit);
statusFilter.addEventListener('change', (event) => {
  state.filter = event.target.value;
  render();
});
searchInput.addEventListener('input', (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});
exportBtn.addEventListener('click', exportToCsv);
resetBtn.addEventListener('click', () => {
  form.reset();
  form.querySelector('#studentId').value = '';
  form.querySelector('button.primary').textContent = 'Kaydet';
});
closeDialogBtn.addEventListener('click', () => notesDialog.close());
notesDialog.addEventListener('click', (event) => {
  if (event.target === notesDialog) {
    notesDialog.close();
  }
});
toggleThemeBtn.addEventListener('click', toggleTheme);

initTheme();

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const student = {
    id: formData.get('studentId') || crypto.randomUUID(),
    fullName: formData.get('fullName').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
    cohort: formData.get('cohort').trim(),
    status: formData.get('status'),
    progress: clamp(Number(formData.get('progress')) || 0, 0, 100),
    notes: formData.get('notes').trim(),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = state.students.findIndex((s) => s.id === student.id);
  if (existingIndex >= 0) {
    state.students.splice(existingIndex, 1, student);
  } else {
    state.students.push(student);
  }

  persistStudents();
  render();
  form.reset();
  form.querySelector('#studentId').value = '';
  form.querySelector('button.primary').textContent = 'Kaydet';
}

function render() {
  updateCounters();
  renderTable();
}

function updateCounters() {
  const counts = state.students.reduce(
    (acc, student) => {
      if (student.status in acc) {
        acc[student.status] += 1;
      }
      return acc;
    },
    { active: 0, on_leave: 0, completed: 0, risky: 0 }
  );

  Object.entries(counts).forEach(([status, count]) => {
    counters[status].textContent = count;
  });
}

function renderTable() {
  studentsBody.innerHTML = '';
  const filtered = state.students.filter((student) => {
    const matchesStatus = state.filter === 'all' || student.status === state.filter;
    const matchesQuery = state.query
      ? [student.fullName, student.email, student.notes, student.cohort]
          .join(' ')
          .toLowerCase()
          .includes(state.query)
      : true;
    return matchesStatus && matchesQuery;
  });

  if (filtered.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'empty';
    cell.textContent = 'Eşleşen öğrenci bulunamadı.';
    row.appendChild(cell);
    studentsBody.appendChild(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((student) => {
      const clone = template.content.cloneNode(true);
      const row = clone.querySelector('tr');
      row.dataset.id = student.id;

      clone.querySelector('.name').textContent = student.fullName;
      clone.querySelector('.contact').textContent = student.email;
      clone.querySelector('.cohort').textContent = student.cohort || '—';

      const statusBadge = clone.querySelector('.status-badge');
      statusBadge.dataset.status = student.status;
      statusBadge.textContent = STATUS_LABELS[student.status];

      const progressBar = clone.querySelector('.progress-bar');
      progressBar.style.setProperty('--value', student.progress / 100);
      clone.querySelector('.progress-text').textContent = `${student.progress}%`;

      const updatedDate = new Date(student.updatedAt);
      clone.querySelector('.updated').textContent = updatedDate.toLocaleString('tr-TR');

      clone.querySelector('.view-notes').addEventListener('click', () => openNotes(student));
      clone.querySelector('.edit').addEventListener('click', () => editStudent(student));
      clone.querySelector('.delete').addEventListener('click', () => deleteStudent(student.id));

      fragment.appendChild(clone);
    });

  studentsBody.appendChild(fragment);
}

function editStudent(student) {
  form.querySelector('#studentId').value = student.id;
  form.querySelector('#fullName').value = student.fullName;
  form.querySelector('#email').value = student.email;
  form.querySelector('#phone').value = student.phone;
  form.querySelector('#cohort').value = student.cohort;
  form.querySelector('#status').value = student.status;
  form.querySelector('#progress').value = student.progress;
  form.querySelector('#notes').value = student.notes;
  form.querySelector('button.primary').textContent = 'Güncelle';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteStudent(id) {
  if (!confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
    return;
  }
  state.students = state.students.filter((student) => student.id !== id);
  persistStudents();
  render();
}

function openNotes(student) {
  dialogTitle.textContent = `${student.fullName} — Notlar`;
  dialogContent.textContent = student.notes || 'Not bulunmuyor.';
  if (typeof notesDialog.showModal === 'function') {
    notesDialog.showModal();
  }
}

function exportToCsv() {
  const headers = [
    'İsim',
    'E-posta',
    'Telefon',
    'Program',
    'Durum',
    'İlerleme (%)',
    'Son Güncelleme',
    'Notlar',
  ];

  const rows = state.students.map((student) => [
    student.fullName,
    student.email,
    student.phone,
    student.cohort,
    STATUS_LABELS[student.status],
    student.progress,
    new Date(student.updatedAt).toLocaleString('tr-TR'),
    student.notes.replace(/\n/g, ' '),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'ogrenci-listesi.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value = '') {
  const str = String(value ?? '').replace(/"/g, '""');
  return /[";\n]/.test(str) ? `"${str}"` : str;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadStudents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createSampleStudents();
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return createSampleStudents();
    }
    return parsed;
  } catch (error) {
    console.error('Öğrenci verisi yüklenemedi:', error);
    return createSampleStudents();
  }
}

function persistStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
}

function createSampleStudents() {
  const now = new Date();
  return [
    {
      id: crypto.randomUUID(),
      fullName: 'Ayşe Yılmaz',
      email: 'ayse@example.com',
      phone: '0532 000 00 00',
      cohort: 'Frontend 2024',
      status: 'active',
      progress: 65,
      notes: 'React projesi bekleniyor. Haftalık mentorluk tamamlandı.',
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      fullName: 'Mehmet Demir',
      email: 'mehmet@example.com',
      phone: '0551 111 11 11',
      cohort: 'Backend 2023',
      status: 'risky',
      progress: 35,
      notes: 'Son iki haftadır ödev teslim etmedi. Ek destek önerildi.',
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      fullName: 'Elif Kaya',
      email: 'elif@example.com',
      phone: '0543 222 22 22',
      cohort: 'Mobil 2023',
      status: 'completed',
      progress: 100,
      notes: 'Bitirme projesi onaylandı. İşe yerleştirme süreci takipte.',
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    },
  ];
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    document.body.classList.toggle('dark', saved === 'dark');
    toggleThemeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', prefersDark);
  toggleThemeBtn.textContent = prefersDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  toggleThemeBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}
