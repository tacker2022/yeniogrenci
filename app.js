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
const snapshotBtn = document.getElementById('snapshotBtn');
const progressFilter = document.getElementById('progressFilter');
const progressValue = document.getElementById('progressValue');
const attentionOnlyToggle = document.getElementById('attentionOnly');

const avgProgressEl = document.getElementById('avgProgress');
const distributionTextEl = document.getElementById('distributionText');
const upcomingCountEl = document.getElementById('upcomingCount');
const upcomingListEl = document.getElementById('upcomingList');
const smartHintsEl = document.getElementById('smartHints');
const spotlightStudentEl = document.getElementById('spotlightStudent');
const spotlightMetaEl = document.getElementById('spotlightMeta');

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

const initialMinProgress = Number(progressFilter?.value ?? 0) || 0;
const initialAttentionOnly = Boolean(attentionOnlyToggle?.checked);

if (progressFilter) {
  progressFilter.value = String(initialMinProgress);
}
if (progressValue) {
  progressValue.textContent = `${initialMinProgress}%`;
}

const state = {
  students: loadStudents(),
  filter: 'all',
  query: '',
  minProgress: initialMinProgress,
  attentionOnly: initialAttentionOnly,
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
  if (progressFilter) {
    progressFilter.value = '0';
  }
  if (progressValue) {
    progressValue.textContent = '0%';
  }
  state.minProgress = 0;
  if (attentionOnlyToggle) {
    attentionOnlyToggle.checked = false;
  }
  state.attentionOnly = false;
  render();
});
closeDialogBtn.addEventListener('click', () => notesDialog.close());
notesDialog.addEventListener('click', (event) => {
  if (event.target === notesDialog) {
    notesDialog.close();
  }
});
toggleThemeBtn.addEventListener('click', toggleTheme);
if (progressFilter) {
  progressFilter.addEventListener('input', (event) => {
    const value = Number(event.target.value) || 0;
    state.minProgress = value;
    if (progressValue) {
      progressValue.textContent = `${value}%`;
    }
    render();
  });
}
if (attentionOnlyToggle) {
  attentionOnlyToggle.addEventListener('change', (event) => {
    state.attentionOnly = event.target.checked;
    render();
  });
}
if (snapshotBtn) {
  snapshotBtn.addEventListener('click', captureSnapshot);
}

initTheme();

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const student = applyStudentDefaults({
    id: formData.get('studentId') || crypto.randomUUID(),
    fullName: formData.get('fullName').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
    cohort: formData.get('cohort').trim(),
    mentor: formData.get('mentor').trim(),
    status: formData.get('status'),
    progress: clamp(Number(formData.get('progress')) || 0, 0, 100),
    notes: formData.get('notes').trim(),
    lastContact: formData.get('lastContact') || null,
    nextMeeting: formData.get('nextMeeting') || null,
    updatedAt: new Date().toISOString(),
  });

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
  if (progressFilter) {
    progressFilter.value = String(state.minProgress);
  }
  if (progressValue) {
    progressValue.textContent = `${state.minProgress}%`;
  }
}

function render() {
  updateCounters();
  renderTable();
  updateInsights();
}

function updateCounters() {
  const counts = getCounts(state.students);

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
    const matchesProgress = student.progress >= state.minProgress;
    const attentionFlag = requiresAttention(student);
    const matchesAttention = !state.attentionOnly || attentionFlag;
    return matchesStatus && matchesQuery && matchesProgress && matchesAttention;
  });

  if (filtered.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
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
      const lastContactEl = clone.querySelector('.last-contact');
      if (student.lastContact) {
        lastContactEl.textContent = `Son görüşme: ${formatDate(student.lastContact)}`;
      } else {
        lastContactEl.textContent = 'Son görüşme: —';
      }
      clone.querySelector('.cohort').textContent = student.cohort || '—';
      clone.querySelector('.mentor').textContent = student.mentor || '—';

      const statusBadge = clone.querySelector('.status-badge');
      statusBadge.dataset.status = student.status;
      statusBadge.textContent = STATUS_LABELS[student.status];

      const progressBar = clone.querySelector('.progress-bar');
      progressBar.style.setProperty('--value', student.progress / 100);
      clone.querySelector('.progress-text').textContent = `${student.progress}%`;

      const updatedDate = new Date(student.updatedAt);
      clone.querySelector('.updated').textContent = updatedDate.toLocaleString('tr-TR');

      const nextMeetingCell = clone.querySelector('.next-meeting');
      nextMeetingCell.innerHTML = '';
      if (student.nextMeeting) {
        const relative = document.createElement('div');
        relative.textContent = formatRelative(student.nextMeeting);
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = formatDate(student.nextMeeting, { day: '2-digit', month: 'short' });
        nextMeetingCell.append(relative, meta);
      } else {
        nextMeetingCell.textContent = '—';
      }

      clone.querySelector('.view-notes').addEventListener('click', () => openNotes(student));
      clone.querySelector('.edit').addEventListener('click', () => editStudent(student));
      clone.querySelector('.delete').addEventListener('click', () => deleteStudent(student.id));

      if (requiresAttention(student)) {
        row.classList.add('attention-row');
      }

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
  form.querySelector('#mentor').value = student.mentor ?? '';
  form.querySelector('#status').value = student.status;
  form.querySelector('#progress').value = student.progress;
  form.querySelector('#notes').value = student.notes;
  form.querySelector('#lastContact').value = student.lastContact ?? '';
  form.querySelector('#nextMeeting').value = student.nextMeeting ?? '';
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
    'Mentor',
    'Durum',
    'İlerleme (%)',
    'Son Görüşme',
    'Takip Tarihi',
    'Son Güncelleme',
    'Notlar',
  ];

  const rows = state.students.map((student) => [
    student.fullName,
    student.email,
    student.phone,
    student.cohort,
    student.mentor,
    STATUS_LABELS[student.status],
    student.progress,
    formatDate(student.lastContact) === '—' ? '' : formatDate(student.lastContact),
    formatDate(student.nextMeeting) === '—' ? '' : formatDate(student.nextMeeting),
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
      return createSampleStudents().map(applyStudentDefaults);
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return createSampleStudents().map(applyStudentDefaults);
    }
    return parsed.map(applyStudentDefaults);
  } catch (error) {
    console.error('Öğrenci verisi yüklenemedi:', error);
    return createSampleStudents().map(applyStudentDefaults);
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
      mentor: 'Merve Koç',
      status: 'active',
      progress: 65,
      notes: 'React projesi bekleniyor. Haftalık mentorluk tamamlandı.',
      lastContact: toInputDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)),
      nextMeeting: toInputDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3)),
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      fullName: 'Mehmet Demir',
      email: 'mehmet@example.com',
      phone: '0551 111 11 11',
      cohort: 'Backend 2023',
      mentor: 'Cem Arslan',
      status: 'risky',
      progress: 35,
      notes: 'Son iki haftadır ödev teslim etmedi. Ek destek önerildi.',
      lastContact: toInputDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)),
      nextMeeting: toInputDate(new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1)),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      fullName: 'Elif Kaya',
      email: 'elif@example.com',
      phone: '0543 222 22 22',
      cohort: 'Mobil 2023',
      mentor: 'Seda Aydın',
      status: 'completed',
      progress: 100,
      notes: 'Bitirme projesi onaylandı. İşe yerleştirme süreci takipte.',
      lastContact: toInputDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10)),
      nextMeeting: null,
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    },
  ];
}

function applyStudentDefaults(student) {
  return {
    mentor: '',
    lastContact: null,
    nextMeeting: null,
    ...student,
  };
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

function getCounts(students) {
  return students.reduce(
    (acc, student) => {
      if (student.status in acc) {
        acc[student.status] += 1;
      }
      return acc;
    },
    { active: 0, on_leave: 0, completed: 0, risky: 0 }
  );
}

function requiresAttention(student) {
  const lowProgress = student.progress < 50;
  const riskyStatus = student.status === 'risky';
  const upcomingMeeting = isUpcomingSoon(student.nextMeeting);
  return lowProgress || riskyStatus || upcomingMeeting;
}

function isUpcomingSoon(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return false;
  const today = startOfDay(new Date());
  const diff = date.getTime() - today.getTime();
  const threeDays = 1000 * 60 * 60 * 24 * 3;
  return diff >= 0 && diff <= threeDays;
}

function updateInsights() {
  const students = state.students;
  if (!students.length) {
    avgProgressEl.textContent = '0%';
    distributionTextEl.textContent = 'Öğrenci verisi bekleniyor';
    upcomingCountEl.textContent = '0';
    renderUpcomingList([]);
    renderSmartHints([]);
    spotlightStudentEl.textContent = '—';
    spotlightMetaEl.textContent = 'Henüz öneri yok';
    return;
  }

  const counts = getCounts(students);
  const total = students.length;
  const averageProgress = Math.round(
    students.reduce((sum, student) => sum + Number(student.progress || 0), 0) / total
  );
  avgProgressEl.textContent = `${averageProgress}%`;
  distributionTextEl.textContent = `${counts.active} aktif • ${counts.on_leave} tatilde • ${counts.completed} mezun • ${counts.risky} risk`;

  const upcoming = students
    .filter((student) => !!student.nextMeeting)
    .map((student) => ({
      student,
      date: parseLocalDate(student.nextMeeting),
    }))
    .filter((item) => item.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = startOfDay(new Date());
  const weekAhead = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 7);
  const upcomingWithinWeek = upcoming.filter(
    (item) => item.date.getTime() >= today.getTime() && item.date.getTime() <= weekAhead.getTime()
  );

  upcomingCountEl.textContent = `${upcomingWithinWeek.length}`;
  renderUpcomingList(upcoming);

  const attentionCount = students.filter(requiresAttention).length;
  const highPerformers = students.filter((student) => student.progress >= 85);
  const spotlight = students
    .slice()
    .sort((a, b) => b.progress - a.progress || new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  spotlightStudentEl.textContent = spotlight ? spotlight.fullName : '—';
  spotlightMetaEl.textContent = spotlight
    ? `${spotlight.progress}% · Mentor: ${spotlight.mentor || 'Belirsiz'}`
    : 'Henüz öneri yok';

  renderSmartHints(
    generateSmartHints({
      attentionCount,
      upcomingWithinWeek,
      highPerformers,
      averageProgress,
    })
  );
}

function renderUpcomingList(entries) {
  upcomingListEl.innerHTML = '';
  if (!entries.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Planlanmış takip bulunmuyor.';
    upcomingListEl.appendChild(empty);
    return;
  }

  entries.forEach(({ student, date }) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${student.fullName} — ${formatRelative(student.nextMeeting)}`;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${formatDate(student.nextMeeting)} • Mentor: ${student.mentor || 'Belirsiz'}`;
    item.append(title, meta);
    upcomingListEl.appendChild(item);
  });
}

function renderSmartHints(hints) {
  smartHintsEl.innerHTML = '';
  if (!hints.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Analizler için daha fazla veriye ihtiyaç var.';
    smartHintsEl.appendChild(empty);
    return;
  }

  hints.forEach((hint) => {
    const item = document.createElement('li');
    item.textContent = hint;
    smartHintsEl.appendChild(item);
  });
}

function generateSmartHints({ attentionCount, upcomingWithinWeek, highPerformers, averageProgress }) {
  const hints = [];
  if (attentionCount > 0) {
    hints.push(`⚠️ ${attentionCount} öğrenci ek aksiyon bekliyor. Risk panelini kontrol edin.`);
  }
  if (upcomingWithinWeek.length > 0) {
    hints.push(`📅 ${upcomingWithinWeek.length} takip görüşmesi önümüzdeki hafta içinde. Mentorlere hatırlatın.`);
  }
  if (averageProgress < 70) {
    hints.push('📈 Ortalama ilerleme %70’in altında. Haftalık hızlandırıcı seans planlayın.');
  }
  if (highPerformers.length >= 2) {
    hints.push(`🌟 ${highPerformers.length} öğrenci %85 üstü ilerliyor. Başarı hikayelerini paylaşmayı düşünün.`);
  }
  if (!hints.length) {
    hints.push('✨ Her şey yolunda görünüyor. CSV aktarımı ile raporunuzu paylaşabilirsiniz.');
  }
  return hints;
}

function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  const date = parseLocalDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('tr-TR', options);
}

function formatRelative(value) {
  const date = parseLocalDate(value);
  if (!date) return 'Planlanmadı';
  const today = startOfDay(new Date());
  const diff = startOfDay(date).getTime() - today.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.round(diff / dayMs);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days === -1) return 'Dün';
  if (days > 1) return `${days} gün sonra`;
  return `${Math.abs(days)} gün önce`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toInputDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function captureSnapshot() {
  const students = state.students;
  if (!students.length) {
    alert('Paylaşılacak öğrenci verisi bulunamadı.');
    return;
  }

  const counts = getCounts(students);
  const attentionCount = students.filter(requiresAttention).length;
  const summaryLines = [
    `Öğrenci sayısı: ${students.length}`,
    `Ortalama ilerleme: ${avgProgressEl.textContent}`,
    `Dağılım: ${counts.active} aktif / ${counts.on_leave} tatilde / ${counts.risky} risk / ${counts.completed} mezun`,
    `Dikkat gerektiren öğrenci: ${attentionCount}`,
  ];

  const upcomingItem = upcomingListEl.querySelector('li');
  if (upcomingItem && !upcomingItem.classList.contains('empty-state')) {
    summaryLines.push(`Sıradaki takip: ${upcomingItem.textContent}`);
  }

  const snapshotText = `Öğrenci Takip Özeti\n${summaryLines.join('\n')}`;

  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Clipboard API unsupported');
    }
    await navigator.clipboard.writeText(snapshotText);
    if (snapshotBtn) {
      snapshotBtn.textContent = 'Kopyalandı!';
      snapshotBtn.disabled = true;
      setTimeout(() => {
        snapshotBtn.textContent = 'Anlık Durum';
        snapshotBtn.disabled = false;
      }, 1500);
    }
  } catch (error) {
    const blob = new Blob([snapshotText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ogrenci-ozet.txt';
    link.click();
    URL.revokeObjectURL(url);
    alert('Özet kopyalanamadı, metin dosyası indirildi.');
  }
}
