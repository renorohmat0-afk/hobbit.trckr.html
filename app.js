// ═══════════════════════════════════════════
//  TO BE BETTER — app.js
// ═══════════════════════════════════════════

// ─── DATA LAYER — localStorage wrapper ───
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k)
};

// ─── CONSTANTS ───────────────────────────
const DAYS      = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const QUOTES = [
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
];

const WORKOUTS = [
  { name: "Push-ups",           cat: "strength",    emoji: "🤸", desc: "Start in a high plank, lower chest to floor, push back up. Keep core tight throughout." },
  { name: "Squats",             cat: "strength",    emoji: "🦵", desc: "Stand with feet shoulder-width apart, lower hips until thighs parallel to floor, return to standing." },
  { name: "Plank",              cat: "core",        emoji: "🧘", desc: "Hold a straight-arm or forearm position, body in one line. Engage abs and glutes throughout." },
  { name: "Running in Place",   cat: "cardio",      emoji: "🏃", desc: "Jog on the spot, driving knees up. Maintain an upright posture and land softly." },
  { name: "Lunges",             cat: "strength",    emoji: "🚶", desc: "Step one leg forward, lower back knee toward floor, return and alternate. Keep torso upright." },
  { name: "Jumping Jacks",      cat: "cardio",      emoji: "⚡", desc: "Jump feet apart while raising arms overhead, then jump back to starting position. Steady rhythm." },
  { name: "Bicycle Crunches",   cat: "core",        emoji: "🚴", desc: "Lie back, pedal legs in air while rotating elbow to opposite knee. Control the movement." },
  { name: "Downward Dog",       cat: "flexibility", emoji: "🐕", desc: "From hands and knees, push hips up and back to form an inverted V. Breathe and hold." },
  { name: "Mountain Climbers",  cat: "cardio",      emoji: "⛰️", desc: "In plank position, alternate driving knees quickly to chest. Keep hips level." },
  { name: "Glute Bridges",      cat: "strength",    emoji: "🌉", desc: "Lie on back, feet flat, drive hips up by squeezing glutes, hold, then lower." },
  { name: "Child's Pose",       cat: "flexibility", emoji: "🧸", desc: "Kneel and fold forward, arms extended or alongside body. Hold and breathe deeply." },
  { name: "Burpees",            cat: "cardio",      emoji: "💥", desc: "Drop to a squat, jump feet back to plank, do a push-up, jump feet in, then jump up with arms overhead." },
];

// ─── STATE ────────────────────────────────
let currentUser        = null;
let currentDay         = new Date().getDay(); // 0 = Sunday
let activePage         = 'home';
let scheduleDay        = currentDay;
let activeWorkoutFilter = 'all';


// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════

function switchAuthTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (tab === 'login') === (i === 0))
  );
  document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const user = document.getElementById('reg-user').value.trim();
  const pass = document.getElementById('reg-pass').value;

  if (!name || !user || !pass) return showAuthError('Please fill all fields.');
  if (pass.length < 4) return showAuthError('Password must be at least 4 characters.');

  const users = LS.get('tbb_users') || {};
  if (users[user]) return showAuthError('Username already taken.');

  users[user] = { pass, name };
  LS.set('tbb_users', users);

  // Initialize biodata for new user
  LS.set(`tbb_bio_${user}`, { name, username: user, nim: '', major: '', univ: '', sem: '' });

  showToast('Account created! Please sign in.');
  switchAuthTab('login');
  document.getElementById('login-user').value = user;
}

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const users = LS.get('tbb_users') || {};

  if (!users[user] || users[user].pass !== pass) {
    return showAuthError('Invalid username or password.');
  }

  currentUser = user;
  LS.set('tbb_session', user);
  bootApp();
}

function handleLogout() {
  LS.del('tbb_session');
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}


// ═══════════════════════════════════════════
//  APP BOOT
// ═══════════════════════════════════════════

function bootApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  updateTopbarDate();
  updateGreeting();
  updateAvatar();
  renderScheduleTabs();
  renderWorkoutCatalog();
  renderBiodata();
  renderTodoList();
  renderProgress();
  navigate('home');

  setInterval(updateTopbarDate, 60000);
}

function updateTopbarDate() {
  document.getElementById('topbar-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function updateGreeting() {
  const h     = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const bio   = getBio();
  const first = bio.name ? bio.name.split(' ')[0] : 'there';
  document.getElementById('home-greeting').textContent = `${greet}, ${first}! 👋`;

  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quote-text').textContent  = q.text;
  document.getElementById('quote-author').textContent = `— ${q.author}`;
}

function updateAvatar() {
  const bio     = getBio();
  const initial = bio.name ? bio.name[0].toUpperCase() : currentUser[0].toUpperCase();
  document.getElementById('avatar-btn').textContent = initial;
}


// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════

const PAGE_TITLES = {
  home:     'Home',
  schedule: 'Schedule',
  workout:  'Movement Catalog',
  biodata:  'Profile',
  progress: 'Progress'
};

function navigate(page) {
  activePage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.page === page)
  );

  document.getElementById('page-title').textContent = PAGE_TITLES[page];

  // Refresh data on page switch
  if (page === 'home')     { renderTodoList(); updateStats(); }
  if (page === 'progress') renderProgress();
  if (page === 'schedule') renderScheduleDay();
  if (page === 'biodata')  renderBiodata();
}


// ═══════════════════════════════════════════
//  SCHEDULE
// ═══════════════════════════════════════════

function getScheduleKey(day, type) {
  return `tbb_sched_${currentUser}_${day}_${type}`;
}

function renderScheduleTabs() {
  const container = document.getElementById('day-tabs');
  container.innerHTML = DAYS.map((d, i) => `
    <button
      class="day-tab ${i === scheduleDay ? 'active' : ''} ${i === currentDay ? 'today-tab' : ''}"
      onclick="selectScheduleDay(${i})">
      ${DAY_SHORT[i]}${i === currentDay ? ' ·Today' : ''}
    </button>`
  ).join('');
}

function selectScheduleDay(idx) {
  scheduleDay = idx;
  renderScheduleTabs();
  renderScheduleDay();
}

function renderScheduleDay() {
  renderScheduleSection('lecture', 'lec-list');
  renderScheduleSection('workout', 'work-list');
  document.getElementById('lec-input').value  = '';
  document.getElementById('work-input').value = '';
}

function renderScheduleSection(type, containerId) {
  const items     = LS.get(getScheduleKey(scheduleDay, type)) || [];
  const container = document.getElementById(containerId);

  if (items.length === 0) {
    const label = type === 'lecture' ? 'lectures' : 'workouts';
    container.innerHTML = `<div class="todo-empty">No ${label} for ${DAYS[scheduleDay]} yet.</div>`;
    return;
  }

  container.innerHTML = items.map((item, i) => `
    <div class="schedule-item">
      <span>${item}</span>
      <button class="del-btn" onclick="deleteScheduleItem('${type}', ${i})">✕</button>
    </div>`
  ).join('');
}

function addScheduleItem(type) {
  const inputId = type === 'lecture' ? 'lec-input' : 'work-input';
  const val     = document.getElementById(inputId).value.trim();
  if (!val) return;

  const key   = getScheduleKey(scheduleDay, type);
  const items = LS.get(key) || [];
  items.push(val);
  LS.set(key, items);

  document.getElementById(inputId).value = '';
  renderScheduleSection(type, type === 'lecture' ? 'lec-list' : 'work-list');

  // Keep today's To-Do List in sync
  if (scheduleDay === currentDay) renderTodoList();

  showToast(`Added to ${DAYS[scheduleDay]}'s schedule`);
}

function deleteScheduleItem(type, idx) {
  const key   = getScheduleKey(scheduleDay, type);
  const items = LS.get(key) || [];
  items.splice(idx, 1);
  LS.set(key, items);

  renderScheduleSection(type, type === 'lecture' ? 'lec-list' : 'work-list');
  if (scheduleDay === currentDay) renderTodoList();
}


// ═══════════════════════════════════════════
//  TO-DO LIST  (auto-synced from schedule)
// ═══════════════════════════════════════════

function getTodayTasks() {
  const lectures = (LS.get(getScheduleKey(currentDay, 'lecture')) || []).map(t => ({ label: t, type: 'lecture' }));
  const workouts = (LS.get(getScheduleKey(currentDay, 'workout')) || []).map(t => ({ label: t, type: 'workout' }));
  return [...lectures, ...workouts];
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getTodoChecks() { return LS.get(`tbb_todo_checks_${currentUser}_${todayKey()}`) || {}; }
function setTodoChecks(checks) { LS.set(`tbb_todo_checks_${currentUser}_${todayKey()}`, checks); }

function renderTodoList() {
  const tasks     = getTodayTasks();
  const checks    = getTodoChecks();
  const container = document.getElementById('todo-list-container');

  if (tasks.length === 0) {
    container.innerHTML = `<div class="todo-empty">No tasks scheduled for today (${DAYS[currentDay]}).<br>Go to Schedule to add some!</div>`;
    document.getElementById('todo-subtitle').textContent = 'Nothing scheduled for today';
  } else {
    document.getElementById('todo-subtitle').textContent =
      `${DAYS[currentDay]} — ${tasks.length} task${tasks.length > 1 ? 's' : ''}`;

    container.innerHTML = tasks.map((t, i) => {
      const done = !!checks[i];
      return `
        <div class="todo-item ${done ? 'done' : ''}" id="todo-${i}">
          <div class="todo-check ${done ? 'checked' : ''}" onclick="toggleTodo(${i})">
            ${done ? '✓' : ''}
          </div>
          <span class="todo-label">${t.label}</span>
          <span class="todo-badge ${t.type}">
            ${t.type === 'lecture' ? '📚 Class' : '🏋️ Workout'}
          </span>
        </div>`;
    }).join('');
  }

  updateStats();
}

function toggleTodo(idx) {
  const checks  = getTodoChecks();
  checks[idx]   = !checks[idx];
  setTodoChecks(checks);
  saveHistorySnapshot();
  renderTodoList();
}

function updateStats() {
  const tasks = getTodayTasks();
  const checks = getTodoChecks();
  const done  = tasks.filter((_, i) => !!checks[i]).length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('stat-done').textContent  = done;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pct').textContent   = pct + '%';
}


// ═══════════════════════════════════════════
//  PROGRESS
// ═══════════════════════════════════════════

function saveHistorySnapshot() {
  const tasks  = getTodayTasks();
  const checks = getTodoChecks();
  const done   = tasks.filter((_, i) => !!checks[i]).length;
  const total  = tasks.length;

  const key     = `tbb_history_${currentUser}`;
  const history = LS.get(key) || {};
  history[todayKey()] = { done, total, day: currentDay };
  LS.set(key, history);
}

function renderProgress() {
  const tasks  = getTodayTasks();
  const checks = getTodoChecks();
  const done   = tasks.filter((_, i) => !!checks[i]).length;
  const total  = tasks.length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('prog-done').textContent      = done;
  document.getElementById('prog-total').textContent     = total;
  document.getElementById('prog-pct-label').textContent = pct + '%';

  // Animate circle
  const circumference = 251.2;
  const offset        = circumference - (pct / 100) * circumference;
  document.getElementById('prog-circle').style.strokeDashoffset = offset;

  // Weekly history bars
  const history      = LS.get(`tbb_history_${currentUser}`) || {};
  const today        = new Date();
  const histContainer = document.getElementById('history-list');

  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k   = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const rec = history[k];
    const p   = rec && rec.total > 0 ? Math.round((rec.done / rec.total) * 100) : null;
    rows.push({ label: DAY_SHORT[d.getDay()], pct: p, isToday: i === 0 });
  }

  histContainer.innerHTML = rows.map(r => `
    <div class="history-day">
      <span class="history-day-name" style="${r.isToday ? 'color:var(--accent)' : ''}">${r.label}</span>
      <div class="history-bar-wrap">
        <div class="history-bar" style="width:${r.pct !== null ? r.pct : 0}%"></div>
      </div>
      <span class="history-pct">${r.pct !== null ? r.pct + '%' : '—'}</span>
    </div>`
  ).join('');
}


// ═══════════════════════════════════════════
//  BIODATA / PROFILE
// ═══════════════════════════════════════════

function getBio() {
  return LS.get(`tbb_bio_${currentUser}`) ||
    { name: currentUser, username: currentUser, nim: '', major: '', univ: '', sem: '' };
}

function renderBiodata() {
  const bio     = getBio();
  const initial = bio.name ? bio.name[0].toUpperCase() : '?';

  document.getElementById('bio-avatar-big').textContent    = initial;
  document.getElementById('bio-name-display').textContent  = bio.name || '—';
  document.getElementById('bio-user-display').textContent  = '@' + (bio.username || currentUser);

  const fields = [
    { key: 'Student ID',  val: bio.nim   },
    { key: 'Major',       val: bio.major },
    { key: 'University',  val: bio.univ  },
    { key: 'Semester',    val: bio.sem   },
  ];

  document.getElementById('bio-details-list').innerHTML = fields.map(f => `
    <div class="bio-detail">
      <span class="bio-detail-key">${f.key}</span>
      <span class="bio-detail-val">${f.val || '—'}</span>
    </div>`
  ).join('');
}

function showEditBio() {
  const bio = getBio();
  document.getElementById('bio-name-input').value  = bio.name  || '';
  document.getElementById('bio-nim-input').value   = bio.nim   || '';
  document.getElementById('bio-major-input').value = bio.major || '';
  document.getElementById('bio-univ-input').value  = bio.univ  || '';
  document.getElementById('bio-sem-input').value   = bio.sem   || '';
  document.getElementById('bio-view').classList.add('hidden');
  document.getElementById('bio-edit-form').classList.add('active');
}

function saveBio() {
  const bio = {
    name:     document.getElementById('bio-name-input').value.trim(),
    username: currentUser,
    nim:      document.getElementById('bio-nim-input').value.trim(),
    major:    document.getElementById('bio-major-input').value.trim(),
    univ:     document.getElementById('bio-univ-input').value.trim(),
    sem:      document.getElementById('bio-sem-input').value.trim(),
  };
  LS.set(`tbb_bio_${currentUser}`, bio);
  cancelEditBio();
  renderBiodata();
  updateAvatar();
  updateGreeting();
  showToast('Profile updated!');
}

function cancelEditBio() {
  document.getElementById('bio-view').classList.remove('hidden');
  document.getElementById('bio-edit-form').classList.remove('active');
}


// ═══════════════════════════════════════════
//  WORKOUT CATALOG
// ═══════════════════════════════════════════

function catLabel(cat) {
  return {
    strength:    '💪 Strength',
    cardio:      '❤️ Cardio',
    flexibility: '🧘 Flexibility',
    core:        '🔥 Core'
  }[cat] || cat;
}

function renderWorkoutCatalog() {
  const cats = ['all', ...new Set(WORKOUTS.map(w => w.cat))];
  document.getElementById('workout-filter').innerHTML = cats.map(c => `
    <button
      class="filter-btn ${c === 'all' ? 'active' : ''}"
      onclick="filterWorkouts('${c}')">
      ${c === 'all' ? '🌟 All' : catLabel(c)}
    </button>`
  ).join('');
  renderWorkoutGrid('all');
}

function filterWorkouts(cat) {
  activeWorkoutFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active',
      b.textContent.toLowerCase().includes(cat) ||
      (cat === 'all' && b.textContent.includes('All'))
    )
  );
  renderWorkoutGrid(cat);
}

function renderWorkoutGrid(cat) {
  const filtered = cat === 'all' ? WORKOUTS : WORKOUTS.filter(w => w.cat === cat);
  document.getElementById('workout-grid').innerHTML = filtered.map(w => `
    <div class="workout-card">
      <div class="workout-card-emoji">${w.emoji}</div>
      <div class="workout-card-name">${w.name}</div>
      <span class="workout-card-cat cat-${w.cat}">${catLabel(w.cat).replace(/^\S+\s/, '')}</span>
      <div class="workout-card-desc">${w.desc}</div>
    </div>`
  ).join('');
}


// ═══════════════════════════════════════════
//  TOAST NOTIFICATION
// ═══════════════════════════════════════════

let toastTimer;

function showToast(msg) {
  clearTimeout(toastTimer);
  document.getElementById('toast-msg').textContent = msg;
  const t = document.getElementById('toast');
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}


// ═══════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (!currentUser) return;
  if (e.key === 'Enter' && activePage === 'schedule') {
    if (document.getElementById('lec-input')  === document.activeElement) addScheduleItem('lecture');
    if (document.getElementById('work-input') === document.activeElement) addScheduleItem('workout');
  }
});


// ═══════════════════════════════════════════
//  INIT — auto-login from saved session
// ═══════════════════════════════════════════

(function init() {
  const session = LS.get('tbb_session');
  if (session) {
    const users = LS.get('tbb_users') || {};
    if (users[session]) {
      currentUser = session;
      bootApp();
      return;
    }
  }
  document.getElementById('auth-screen').style.display = 'flex';
})();
