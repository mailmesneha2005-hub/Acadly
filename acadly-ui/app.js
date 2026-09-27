import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onAuthStateChanged
} from './firebase.js';

/* Acadly UI preview. Workspace data is browser-local; authentication is a demo shell until an API is connected. */
(() => {
  'use strict';

  const appRoot = document.querySelector('#app-root');
  const overlayRoot = document.querySelector('#overlay-root');
  const toastRoot = document.querySelector('#toast-root');
  const validPages = ['overview', 'tasks', 'subjects', 'insights', 'focus'];
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const subjectColors = ['sage', 'clay', 'stone', 'blue', 'rose'];
  const demoEmail = 'demo@acadly.in';
  const state = {
    session: null,
    page: 'overview',
    authView: 'login',
    tasks: [],
    subjects: [],
    filter: 'all',
    query: '',
    insightRange: 'week',
    modal: null,
    editingId: null,
    modalError: '',
    authError: '',
    authLoading: false,
    toastTimer: null,
    pendingDelete: null,
    modalTrigger: null,
    returnToTaskAfterSubject: false,
    focus: { phase: 'setup', taskId: '', duration: 25, remaining: 1500, sound: 'none', endAt: 0, startedAt: 0, savedSeconds: 0, lastSession: null },
    focusSessions: [],
    focusInterval: null,
    audioContext: null,
    ambientSource: null,
    ambientGain: null
  };

  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const readJSON = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const removeStored = key => { try { localStorage.removeItem(key); } catch { /* Storage can be unavailable in restricted browser contexts. */ } };
  const dateISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
  const today = () => { const now = new Date(); now.setHours(0, 0, 0, 0); return now; };
  const todayISO = () => dateISO(today());
  const offsetISO = amount => dateISO(addDays(today(), amount));
  const parseLocalDate = value => new Date(`${value}T00:00:00`);
  const formatDate = (value, options = { day: 'numeric', month: 'short' }) => {
    if (!value) return 'No due date';
    return new Intl.DateTimeFormat('en-IN', options).format(parseLocalDate(value));
  };
  const formatToday = () => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today());
  const normalizedEmail = email => String(email || '').trim().toLowerCase();
  const profileKey = email => `acadly:profile:${normalizedEmail(email)}`;
  const workspaceKey = email => `acadly:workspace:${normalizedEmail(email)}`;
  const initials = name => String(name || 'A').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'A';
  const displayNameFromEmail = email => {
    const local = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
    return local ? local.replace(/\b\w/g, letter => letter.toUpperCase()) : 'Student';
  };

  function makeSampleWorkspace() {
    const subjects = [
      { id: 'sub-dsa', name: 'Data Structures', color: 'sage' },
      { id: 'sub-dbms', name: 'DBMS', color: 'clay' },
      { id: 'sub-os', name: 'Operating Systems', color: 'blue' },
      { id: 'sub-maths', name: 'Discrete Maths', color: 'stone' }
    ];
    const tasks = [
      { id: 'task-trees', title: 'Trees & graphs problem set', subject: 'Data Structures', type: 'Assignment', date: offsetISO(0), priority: 'High', status: 'In Progress', note: 'Finish questions 4–8.' },
      { id: 'task-normalization', title: 'Normalization quiz', subject: 'DBMS', type: 'Quiz', date: offsetISO(1), priority: 'High', status: 'Pending', note: '' },
      { id: 'task-scheduling', title: 'Scheduling worksheet', subject: 'Operating Systems', type: 'Assignment', date: offsetISO(3), priority: 'Medium', status: 'Pending', note: '' },
      { id: 'task-set-theory', title: 'Set theory practice', subject: 'Discrete Maths', type: 'Assignment', date: offsetISO(5), priority: 'Low', status: 'Pending', note: '' },
      { id: 'task-relational', title: 'Relational algebra worksheet', subject: 'DBMS', type: 'Assignment', date: offsetISO(-2), priority: 'Medium', status: 'Pending', note: 'Review the join examples.' },
      { id: 'task-stack', title: 'Stack implementation quiz', subject: 'Data Structures', type: 'Quiz', date: offsetISO(-4), priority: 'Low', status: 'Completed', note: '' },
      { id: 'task-er', title: 'ER diagram assignment', subject: 'DBMS', type: 'Assignment', date: offsetISO(-6), priority: 'Medium', status: 'Completed', note: '' },
      { id: 'task-process', title: 'Process states exam', subject: 'Operating Systems', type: 'Exam', date: offsetISO(-8), priority: 'High', status: 'Completed', note: '' },
      { id: 'task-logic', title: 'Logic exercises', subject: 'Discrete Maths', type: 'Assignment', date: offsetISO(-10), priority: 'Low', status: 'Completed', note: '' }
    ];
    return { subjects, tasks };
  }

  function persistWorkspace() {
    if (!state.session) return;
    writeJSON(workspaceKey(state.session.email), { subjects: state.subjects, tasks: state.tasks, focusSessions: state.focusSessions });
  }

 async function loadWorkspace(email, demo = false) {
  state.subjects = [];
  state.tasks = [];
  state.focusSessions = [];

  if (!auth.currentUser) return;

  try {
    // Load Tasks
    const tasksRef = collection(
      db,
      'users',
      auth.currentUser.uid,
      'tasks'
    );

    const tasksSnapshot = await getDocs(tasksRef);

    state.tasks = tasksSnapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    // Load Subjects
    const subjectsRef = collection(
      db,
      'users',
      auth.currentUser.uid,
      'subjects'
    );

    const subjectsSnapshot = await getDocs(subjectsRef);

    state.subjects = subjectsSnapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));
    // Load Focus Sessions
const focusSessionsRef = collection(
  db,
  'users',
  auth.currentUser.uid,
  'focusSessions'
);

const focusSessionsSnapshot = await getDocs(focusSessionsRef);

state.focusSessions = focusSessionsSnapshot.docs
  .map(item => ({
    id: item.id,
    ...item.data()
  }))
  .sort((a, b) =>
    new Date(b.endedAt) - new Date(a.endedAt)
  );

console.log(
  'Focus sessions loaded from Firestore:',
  state.focusSessions
);

    console.log('Tasks loaded from Firestore:', state.tasks);
    console.log('Subjects loaded from Firestore:', state.subjects);

  } catch (error) {
    console.error('FIRESTORE WORKSPACE LOAD ERROR:', error);
    showToast('Could not load your workspace.');
  }
}

  function hasSession() { return Boolean(state.session?.email); }
  function getSubject(name) { return state.subjects.find(subject => subject.name === name); }
  function isOverdue(task) { return task.status !== 'Completed' && Boolean(task.date) && task.date < todayISO(); }
  function taskGroup(task) {
    if (task.status === 'Completed') return 'completed';
    if (isOverdue(task)) return 'overdue';
    if (task.date === todayISO()) return 'today';
    return 'upcoming';
  }
  function activeTasks() { return state.tasks.filter(task => task.status !== 'Completed'); }
  function dueSorted(items) {
    return [...items].sort((a, b) => a.date.localeCompare(b.date) || priorityRank[a.priority] - priorityRank[b.priority] || a.title.localeCompare(b.title));
  }
  function completionPercent(tasks = state.tasks) {
    return tasks.length ? Math.round(tasks.filter(task => task.status === 'Completed').length / tasks.length * 100) : 0;
  }
  function getSubjectStats(subjectName) {
    const tasks = state.tasks.filter(task => task.subject === subjectName);
    const completed = tasks.filter(task => task.status === 'Completed').length;
    return { total: tasks.length, completed, active: tasks.length - completed, percent: tasks.length ? Math.round(completed / tasks.length * 100) : null };
  }

  function icon(name) {
    const icons = { overview: '◫', tasks: '☷', subjects: '▦', insights: '⌁', focus: '◉', search: '⌕', add: '＋', check: '✓', calendar: '◷', alert: '!', chart: '▥', signout: '↗', edit: '✎', delete: '×', close: '×', back: '←' };
    return icons[name] || '•';
  }

  function renderAuth() {
    const view = state.authView;
    const isSignup = view === 'signup';
    const isReset = view === 'reset';
    const heading = isSignup ? 'Make space for what matters.' : isReset ? 'Reset your password.' : 'Welcome back.';
    const intro = isSignup ? 'A calmer view of your academic week starts here.' : isReset ? 'Enter your account email and we’ll send reset instructions.' : 'Pick up where you left off.';
    const buttonText = isSignup ? 'Create account' : isReset ? 'Send reset link' : 'Log in';
    const nameField = isSignup ? `<div class="form-field"><label class="field-label" for="auth-name">Full name <span aria-hidden="true">*</span></label><input class="input" id="auth-name" name="name" type="text" autocomplete="name" maxlength="60" required placeholder="Aarav Sharma"><p class="field-error" data-error-for="name"></p></div>` : '';
    const passwordField = !isReset ? `<div class="form-field"><div class="section-head"><label class="field-label" for="auth-password">Password <span aria-hidden="true">*</span></label>${!isSignup ? `<a class="auth-link" href="#reset">Forgot password?</a>` : ''}</div><div class="password-wrap"><input class="input" id="auth-password" name="password" type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" ${isSignup ? 'minlength="8"' : ''} required placeholder="${isSignup ? 'At least 8 characters' : 'Enter your password'}"><button class="password-toggle" type="button" data-action="toggle-password" data-target="auth-password" aria-label="Show password" aria-pressed="false">Show</button></div><p class="field-error" data-error-for="password"></p>${isSignup ? `<p class="form-hint">Use at least 8 characters. Choose a password you don’t use elsewhere.</p>` : ''}</div>` : '';
    const error = state.authError ? `<p class="alert" role="alert" tabindex="-1">${escapeHTML(state.authError)}</p>` : '';
    const loadingButton = state.authLoading ? `<span class="button-spinner" aria-hidden="true"></span> Please wait…` : escapeHTML(buttonText);
    appRoot.innerHTML = `
      <main class="auth-shell">
        <aside class="auth-aside" aria-label="About Acadly">
          <a class="brand" href="#login"><span class="brand-mark">a</span>acadly<span class="brand-dot">.</span></a>
          <div class="auth-aside-content"><p class="eyebrow">ACADEMIC LIFE, A LITTLE LIGHTER</p><h1>All your work.<br>One clear plan.</h1><p>Keep assignments, quizzes, and exams organized by subject, deadline, and priority.</p><div class="auth-illustration" aria-hidden="true"><div class="illustration-card"><span class="illustration-check">✓</span><div class="illustration-lines"><span></span><span></span><span></span></div></div><div class="illustration-card"><span class="section-kicker">THIS WEEK</span><div class="illustration-lines"><span></span><span></span><span></span></div></div></div></div>
          <p class="auth-aside-foot">Capture · Organize · Prioritize · Complete</p>
        </aside>
        <section class="auth-main" aria-labelledby="auth-title">
          <div class="auth-card"><a class="auth-mobile-brand" href="#login"><span class="brand-mark">a</span>acadly<span class="brand-dot">.</span></a>
            <p class="eyebrow">${isSignup ? 'YOUR STUDENT WORKSPACE' : isReset ? 'ACCOUNT RECOVERY' : 'YOUR ACADEMIC SPACE'}</p>
            <h2 id="auth-title">${heading}</h2><p class="auth-intro">${intro}</p>
            ${error}
            <form class="auth-form" data-form="auth" novalidate>
              <input type="hidden" name="view" value="${view}">
              ${nameField}
              <div class="form-field"><label class="field-label" for="auth-email">Email address <span aria-hidden="true">*</span></label><input class="input" id="auth-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com" value="${escapeHTML(state.authEmail || '')}"><p class="field-error" data-error-for="email"></p></div>
              ${passwordField}
              <button class="primary-button" type="submit" ${state.authLoading ? 'disabled' : ''} aria-busy="${state.authLoading}">${loadingButton}</button>
            </form>
            ${isSignup ? `<p class="auth-switch">Already have an account? <a href="#login">Log in</a></p>` : isReset ? `<p class="auth-switch"><a href="#login">${icon('back')} Back to log in</a></p>` : `<p class="auth-switch">New to Acadly? <a href="#signup">Create an account</a></p><button class="secondary-button auth-demo" type="button" data-action="demo-login">Explore the demo workspace</button><p class="auth-note">Demo preview: sign-in is not connected to an authentication server yet. Demo workspace changes stay in this browser.</p>`}
            <p class="auth-foot">Your work, in one place. Take it one task at a time.</p>
          </div>
        </section>
      </main>`;
  }

  function navLink(page, label, compact = false) {
    const selected = state.page === page;
    return `<a class="${compact ? '' : 'nav-link'}" ${compact ? '' : `href="#${page}"`} ${compact ? `href="#${page}"` : ''} ${selected ? 'aria-current="page"' : ''}>${compact ? escapeHTML(label) : `<span class="nav-icon" aria-hidden="true">${icon(page)}</span>${escapeHTML(label)}${page === 'tasks' ? `<span class="nav-count">${activeTasks().length}</span>` : ''}`}</a>`;
  }

  function renderAppShell(content, title) {
    const session = state.session;
    appRoot.innerHTML = `
      <div class="app-frame">
        <aside class="sidebar">
          <a class="brand" href="#overview"><span class="brand-mark">a</span>acadly<span class="brand-dot">.</span></a>
          <p class="nav-caption">Your space</p>
          <nav class="side-nav" aria-label="Main navigation">${navLink('overview', 'Overview')}${navLink('tasks', 'My tasks')}${navLink('subjects', 'Subjects')}${navLink('insights', 'Insights')}${navLink('focus', 'Focus Space')}</nav>
          <div class="sidebar-bottom"><div class="streak-note"><span class="streak-glyph" aria-hidden="true">✦</span><div><strong>Small steps add up.</strong><span>Keep a steady rhythm.</span></div></div><div class="profile-row"><span class="avatar" aria-hidden="true">${escapeHTML(initials(session.name))}</span><div class="profile-meta"><strong>${escapeHTML(session.name)}</strong><small>Student workspace</small></div><button class="signout-button" type="button" data-action="signout" aria-label="Log out" title="Log out">${icon('signout')}</button></div></div>
        </aside>
        <div class="main-shell">
          <header class="topbar"><div class="topbar-left"><a class="mobile-brand" href="#overview"><span class="brand-mark">a</span>acadly<span class="brand-dot">.</span></a><p class="breadcrumb">Workspace <span>/</span><strong>${escapeHTML(title)}</strong></p></div><div class="topbar-right"><span class="today-label">${escapeHTML(formatToday())}</span><span class="avatar topbar-avatar" aria-label="Signed in as ${escapeHTML(session.name)}">${escapeHTML(initials(session.name))}</span></div></header>
          <nav class="mobile-nav" aria-label="Mobile navigation">${navLink('overview', 'Overview', true)}${navLink('tasks', 'My tasks', true)}${navLink('subjects', 'Subjects', true)}${navLink('insights', 'Insights', true)}${navLink('focus', 'Focus Space', true)}<button type="button" data-action="signout" aria-label="Log out" class="icon-action" title="Log out">${icon('signout')}</button></nav>
          <main class="page-wrap">${content}</main>
        </div>
      </div>`;
  }

  function renderSummaryCards() {
    const active = activeTasks();
    const dueToday = active.filter(task => task.date === todayISO()).length;
    const overdue = active.filter(isOverdue).length;
    const cards = [
      { label: 'Due today', value: dueToday, detail: dueToday ? 'Take these one at a time' : 'A little breathing room', glyph: '◷', tint: 'var(--warning-bg)' },
      { label: 'Past due', value: overdue, detail: overdue ? 'Still here when you’re ready' : 'You’re all caught up', glyph: '!', tint: 'var(--error-bg)', danger: overdue > 0 },
      { label: 'On your plate', value: active.length, detail: `Across ${state.subjects.length} subject${state.subjects.length === 1 ? '' : 's'}`, glyph: '☷', tint: 'var(--success-bg)' },
      { label: 'Already done', value: `${completionPercent()}%`, detail: `${state.tasks.filter(task => task.status === 'Completed').length} of ${state.tasks.length} tasks complete`, glyph: '✓', tint: 'var(--success-bg)' }
    ];
    return cards.map(card => `<article class="card summary-card" style="--summary-tint:${card.tint}"><div class="summary-label">${card.label}<span class="summary-symbol" aria-hidden="true">${card.glyph}</span></div><p class="summary-value" ${card.danger ? 'style="color:var(--error)"' : ''}>${escapeHTML(card.value)}</p><p class="summary-detail">${escapeHTML(card.detail)}</p></article>`).join('');
  }

  function weekBuckets() {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(today(), offset);
      const iso = dateISO(date);
      const tasks = state.tasks.filter(task => task.date === iso);
      return { date: iso, day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date), dateLabel: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date), due: tasks.length, done: tasks.filter(task => task.status === 'Completed').length, isToday: offset === 0 };
    });
  }

  const dailyQuotes = [
    'Small progress is still progress.',
    'One focused step is enough to begin.',
    'Show up for the next ten minutes.',
    'You can make a little room for learning today.',
    'Start where you are; build from there.',
    'Steady effort adds up.',
    'You do not have to finish everything to make progress.'
  ];

  function quoteOfTheDay() {
    const dayNumber = Math.floor(parseLocalDate(todayISO()).getTime() / 86400000);
    return dailyQuotes[((dayNumber % dailyQuotes.length) + dailyQuotes.length) % dailyQuotes.length];
  }

  function focusMinutesToday() {
    return state.focusSessions.filter(item => item.date === todayISO()).reduce((sum, item) => sum + item.seconds, 0) / 60;
  }

  function motivationCard() {
    const minutes = Math.round(focusMinutesToday());
    return `<section class="motivation-card card" aria-labelledby="motivation-title"><div class="motivation-copy"><p class="section-kicker" id="motivation-title"><span aria-hidden="true">✦</span> Today’s Motivation</p><blockquote>“${escapeHTML(quoteOfTheDay())}”</blockquote><p class="motivation-byline">— Acadly</p></div><div class="motivation-action"><span class="focus-minutes"><strong>${minutes}</strong> focused min today</span><a class="secondary-button" href="#focus">Open Focus Space <span aria-hidden="true">→</span></a></div></section>`;
  }

  function focusPage() {
    const focus = state.focus;
    const linkedTask = state.tasks.find(task => task.id === focus.taskId);
    const taskLabel = linkedTask ? `${linkedTask.title} · ${linkedTask.subject}` : 'No task linked';
    const historyRows = state.focusSessions.slice(0, 5).map(item => `<li><span><strong>${escapeHTML(item.taskTitle || 'Independent study')}</strong><small>${escapeHTML(formatDate(item.date))}${item.subject ? ` · ${escapeHTML(item.subject)}` : ''}</small></span><b>${Math.round(item.seconds / 60)} min</b></li>`).join('');
    let content;
    if (focus.phase === 'running' || focus.phase === 'paused') {
      const mm = String(Math.floor(focus.remaining / 60)).padStart(2, '0');
      const ss = String(focus.remaining % 60).padStart(2, '0');
      content = `<section class="focus-live card" aria-labelledby="focus-live-title"><p class="section-kicker">${focus.phase === 'paused' ? 'Session paused' : 'You’re in a focus session'}</p><h2 id="focus-live-title">${escapeHTML(linkedTask?.title || focus.taskLabel || 'Independent study')}</h2><p class="page-subtitle">${escapeHTML(linkedTask?.subject || focus.taskSubject || 'No task linked')}</p><div class="focus-timer" role="timer" aria-live="off">${mm}:${ss}</div><p class="focus-status" aria-live="polite">${focus.phase === 'paused' ? 'Paused · your focused time is saved so far.' : `Focused on ${escapeHTML(linkedTask?.title || focus.taskLabel || 'independent study')}`}</p><div class="focus-controls">${focus.phase === 'running' ? '<button class="secondary-button" type="button" data-action="pause-focus">Pause</button>' : '<button class="primary-button" type="button" data-action="resume-focus">Resume session</button>'}<button class="text-button" type="button" data-action="end-focus">End session</button></div><p class="form-hint">${focus.sound === 'none' ? 'Ambient sound is off.' : `Ambient sound: ${escapeHTML(focus.soundLabel || focus.sound)}`}</p></section>`;
    } else if (focus.phase === 'summary' && focus.lastSession) {
      const item = focus.lastSession;
      content = `<section class="focus-summary card" aria-labelledby="focus-summary-title"><span class="empty-icon" aria-hidden="true">✓</span><p class="section-kicker">Session recorded</p><h2 id="focus-summary-title">Nice work showing up.</h2><p class="focus-summary-time">${Math.round(item.seconds / 60)} <span>focused minutes</span></p><p class="page-subtitle">${escapeHTML(item.taskTitle || 'Independent study')}${item.subject ? ` · ${escapeHTML(item.subject)}` : ''}</p><div class="focus-controls"><button class="primary-button" type="button" data-action="new-focus">Start another session</button><a class="secondary-button" href="#tasks">Back to my tasks</a></div></section>`;
    } else {
      const options = activeTasks().map(task => `<option value="${escapeHTML(task.id)}" ${task.id === focus.taskId ? 'selected' : ''}>${escapeHTML(task.title)} · ${escapeHTML(task.subject)}</option>`).join('');
      content = `<section class="focus-setup-grid"><div class="focus-setup card" aria-labelledby="focus-setup-title"><p class="section-kicker">Make a little space to study</p><h2 id="focus-setup-title">What would you like to focus on?</h2><form class="focus-form" data-form="focus-setup"><div class="form-field"><label class="field-label" for="focus-task">Choose a task <span class="optional-label">(optional)</span></label><select class="select" id="focus-task" name="task"><option value="">Independent study</option>${options}</select><p class="form-hint">Your task stays visible while the timer runs.</p></div><div class="form-field"><label class="field-label" for="focus-duration">Study duration</label><select class="select" id="focus-duration" name="duration">${[15,25,45,60].map(minute => `<option value="${minute}" ${focus.duration === minute ? 'selected' : ''}>${minute} minutes</option>`).join('')}</select></div><div class="form-field"><label class="field-label" for="focus-sound">Ambient sound <span class="optional-label">(optional)</span></label><select class="select" id="focus-sound" name="sound"><option value="none" ${focus.sound === 'none' ? 'selected' : ''}>Off — quiet focus</option><option value="rain" ${focus.sound === 'rain' ? 'selected' : ''}>Soft rain</option><option value="forest" ${focus.sound === 'forest' ? 'selected' : ''}>Forest hush</option><option value="brown" ${focus.sound === 'brown' ? 'selected' : ''}>Low brown noise</option></select><p class="form-hint">Optional sound is generated in your browser and stays off until you start.</p></div><button class="primary-button" type="submit">Start focus session</button></form></div><aside class="focus-history card" aria-labelledby="focus-history-title"><p class="section-kicker">Your rhythm</p><h2 id="focus-history-title">Today’s focused time</h2><p class="focus-history-total">${Math.round(focusMinutesToday())}<span> min</span></p><p class="chart-help">Paused time isn’t counted. Sessions are saved in this browser.</p>${historyRows ? `<h3 class="section-kicker">Recent sessions</h3><ul class="focus-history-list">${historyRows}</ul>` : `<p class="form-hint">Your completed sessions will appear here.</p>`}</aside></section>`;
    }
    const backNote = focus.phase === 'running' || focus.phase === 'paused' ? '← Back to Overview · timer keeps running' : '← Back to Overview';
    return `<section class="page-heading"><div><p class="eyebrow">A quieter place to begin</p><h1>Focus Space.</h1><p class="page-subtitle">One task, one timer, one small step at a time.</p></div><a class="back-link" href="#overview">${backNote}</a></section>${content}`;
  }

  function stopAmbientSound() {
    try { state.ambientSource?.stop(); } catch { /* The sound may already have stopped. */ }
    try { state.ambientSource?.disconnect(); state.ambientGain?.disconnect(); } catch { /* Ignore already-closed audio nodes. */ }
    state.ambientSource = null;
    state.ambientGain = null;
  }

  function playAmbientSound(kind) {
    stopAmbientSound();
    if (kind === 'none') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Audio unavailable');
      state.audioContext ||= new AudioContextClass();
      const context = state.audioContext;
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.35;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer; source.loop = true;
      filter.type = kind === 'rain' ? 'highpass' : 'lowpass';
      filter.frequency.value = kind === 'rain' ? 700 : kind === 'forest' ? 900 : 170;
      gain.gain.value = kind === 'rain' ? 0.018 : 0.025;
      source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
      context.resume().catch(() => { stopAmbientSound(); state.focus.sound = 'none'; showToast('Ambient sound is unavailable here. Your timer still works.'); });
      state.ambientSource = source; state.ambientGain = gain;
    } catch {
      state.focus.sound = 'none';
      showToast('Ambient sound is unavailable here. Your timer still works.');
    }
  }

 async function recordFocusSession(seconds) {
  stopAmbientSound();

  if (state.focusInterval) clearInterval(state.focusInterval);
  state.focusInterval = null;

  const task = state.tasks.find(item => item.id === state.focus.taskId);

  const session = {
    id: `focus-${Date.now()}`,
    taskId: task?.id || '',
    taskTitle: task?.title || state.focus.taskLabel || '',
    subject: task?.subject || state.focus.taskSubject || '',
    seconds: Math.max(0, seconds),
    date: state.focus.sessionDate || todayISO(),
    endedAt: new Date().toISOString()
  };

  if (session.seconds > 0) {
    if (auth.currentUser) {
      try {
        await setDoc(
          doc(
            db,
            'users',
            auth.currentUser.uid,
            'focusSessions',
            session.id
          ),
          session
        );
      } catch (error) {
        console.error('FIRESTORE FOCUS SESSION ERROR:', error);
        showToast('Focus session could not be saved.');
        return;
      }
    }

    state.focusSessions.unshift(session);
    state.focus.lastSession = session;

    if (!auth.currentUser) {
      persistWorkspace();
    }
  }

  state.focus.remaining = 0;
  state.focus.phase = 'summary';

  if (state.page === 'focus' || state.page === 'overview') {
    renderApp();
  }

  showToast(
    session.seconds > 0
      ? 'Focus session recorded.'
      : 'Session ended before any focus time was recorded.'
  );
}

  function beginFocusSession() {
    const focus = state.focus;
    focus.duration = Number(focus.duration) || 25;
    focus.remaining = focus.duration * 60;
    focus.startedAt = Date.now();
    focus.sessionDate = todayISO();
    focus.endAt = Date.now() + focus.remaining * 1000;
    const task = state.tasks.find(item => item.id === focus.taskId);
    focus.taskLabel = task?.title || 'Independent study';
    focus.taskSubject = task?.subject || '';
    focus.soundLabel = ({ none: '', rain: 'Soft rain', forest: 'Forest hush', brown: 'Low brown noise' })[focus.sound] || '';
    focus.phase = 'running';
    playAmbientSound(focus.sound);
    renderApp();
    state.focusInterval = setInterval(() => {
      focus.remaining = Math.max(0, Math.ceil((focus.endAt - Date.now()) / 1000));
      const timer = appRoot.querySelector('.focus-timer');
      if (timer) timer.textContent = `${String(Math.floor(focus.remaining / 60)).padStart(2, '0')}:${String(focus.remaining % 60).padStart(2, '0')}`;
      if (focus.remaining <= 0) recordFocusSession(focus.duration * 60);
    }, 1000);
  }

  function pauseFocusSession() {
    const focus = state.focus;
    focus.remaining = Math.max(0, Math.ceil((focus.endAt - Date.now()) / 1000));
    focus.phase = 'paused';
    if (state.focusInterval) clearInterval(state.focusInterval);
    state.focusInterval = null;
    stopAmbientSound();
    renderApp();
  }

  function resumeFocusSession() {
    state.focus.endAt = Date.now() + state.focus.remaining * 1000;
    state.focus.phase = 'running';
    playAmbientSound(state.focus.sound);
    renderApp();
    state.focusInterval = setInterval(() => {
      state.focus.remaining = Math.max(0, Math.ceil((state.focus.endAt - Date.now()) / 1000));
      const timer = appRoot.querySelector('.focus-timer');
      if (timer) timer.textContent = `${String(Math.floor(state.focus.remaining / 60)).padStart(2, '0')}:${String(state.focus.remaining % 60).padStart(2, '0')}`;
      if (state.focus.remaining <= 0) recordFocusSession(state.focus.duration * 60);
    }, 1000);
  }

  async function endFocusSession() {
    const focus = state.focus;
    const remaining = focus.phase === 'running' ? Math.max(0, Math.ceil((focus.endAt - Date.now()) / 1000)) : focus.remaining;
    const elapsed = Math.max(0, focus.duration * 60 - remaining);
    const prompt = elapsed > 0 ? `Save ${Math.round(elapsed / 60)} focused minute${Math.round(elapsed / 60) === 1 ? '' : 's'} and end this session?` : 'End this session? No focused time will be recorded yet.';
    if (window.confirm(prompt)) await recordFocusSession(elapsed);
  }

  function chartMarkup(buckets, label = 'Workload by day') {
    const max = Math.max(1, ...buckets.map(bucket => bucket.due));
    const columns = buckets.map(bucket => {
      const dueHeight = bucket.due ? Math.max(8, bucket.due / max * 100) : 0;
      const doneHeight = bucket.due ? bucket.done / bucket.due * 100 : 0;
      return `<div class="chart-column" role="img" aria-label="${escapeHTML(bucket.dateLabel || bucket.label)}: ${bucket.due} due, ${bucket.done} completed"><span class="chart-count" aria-hidden="true">${bucket.due || '0'}</span><div class="chart-bar-track" aria-hidden="true"><div class="chart-bar-due" style="height:${dueHeight}px">${bucket.done ? `<span class="chart-bar-done" style="height:${doneHeight}%"></span>` : ''}</div></div><span class="chart-day" aria-hidden="true">${escapeHTML(bucket.day || bucket.label)}${bucket.isToday ? '<br>Today' : ''}</span></div>`;
    }).join('');
    return `<div class="chart-grid" role="group" aria-label="${escapeHTML(label)}">${columns}</div>`;
  }

  function chartLegend() {
    return `<div class="chart-legend"><span class="legend-item"><i class="legend-swatch" aria-hidden="true"></i>Due</span><span class="legend-item"><i class="legend-swatch complete" aria-hidden="true"></i>Completed</span></div>`;
  }

  function subjectProgressRows() {
    if (!state.subjects.length) return emptyState('▦', 'Your subjects start here.', 'Add a subject to organize your academic work.', 'Add a subject', 'open-subject');
    return `<div class="progress-list">${state.subjects.map(subject => {
      const stats = getSubjectStats(subject.name);
      return `<div class="progress-row"><span class="progress-name" title="${escapeHTML(subject.name)}">${escapeHTML(subject.name)}</span>${stats.total ? `<div class="progress-track" role="progressbar" aria-label="${escapeHTML(subject.name)} completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.percent}"><div class="progress-fill" style="width:${stats.percent}%"></div></div><span class="progress-value">${stats.percent}%</span>` : `<div class="progress-track" aria-hidden="true"></div><span class="progress-value">—</span>`}</div>${stats.total === 0 ? `<p class="form-hint" style="margin:-10px 0 0">${escapeHTML(subject.name)} · No tasks yet</p>` : ''}`;
    }).join('')}</div>`;
  }

  function taskBadges(task) {
    const group = taskGroup(task);
    const status = isOverdue(task) ? 'Overdue' : task.status;
    const priorityClass = task.priority.toLowerCase();
    const statusClass = status === 'Completed' ? 'success' : status === 'Overdue' ? 'error' : status === 'In Progress' ? 'in-progress' : '';
    return `<span class="pill ${priorityClass}">${escapeHTML(task.priority)} priority</span><span class="pill ${statusClass}">${escapeHTML(status)}</span>`;
  }

  function renderUpcomingList() {
    const items = dueSorted(activeTasks()).slice(0, 3);
    if (!items.length) return emptyState('✓', 'Nothing pressing.', 'Enjoy the breathing room. Add a task whenever something comes up.', 'Add a task', 'open-task');
    return `<div class="upcoming-list">${items.map(task => `<article class="upcoming-task ${isOverdue(task) ? 'overdue' : ''}"><div class="upcoming-top"><span class="upcoming-title">${escapeHTML(task.title)}</span><span class="upcoming-date">${isOverdue(task) ? `Past due · ${escapeHTML(formatDate(task.date))}` : task.date === todayISO() ? 'Due today' : escapeHTML(formatDate(task.date))}</span></div><p class="upcoming-meta">${escapeHTML(task.subject)} · ${escapeHTML(task.type)}</p><div class="task-row-tags">${taskBadges(task)}</div></article>`).join('')}</div>`;
  }

  function renderDeadlineTable() {
    const items = dueSorted(activeTasks()).slice(0, 5);
    if (!items.length) return emptyState('✓', 'Your list is clear.', 'Add a task whenever something comes up.', 'Add a task', 'open-task');
    return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Task</th><th scope="col">Subject</th><th scope="col">Due</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col"><span class="screen-reader-only">Task actions</span></th></tr></thead><tbody>${items.map(task => `<tr><td><span class="task-name-cell"><span class="task-type-icon" aria-hidden="true">${typeMark(task.type)}</span>${escapeHTML(task.title)}</span></td><td><span class="subject-name"><i class="subject-dot tone-${escapeHTML(getSubject(task.subject)?.color || 'sage')}" aria-hidden="true"></i>${escapeHTML(task.subject)}</span></td><td>${isOverdue(task) ? '<span style="color:var(--error)">Past due</span>' : task.date === todayISO() ? 'Today' : escapeHTML(formatDate(task.date))}</td><td><span class="pill ${task.priority.toLowerCase()}">${escapeHTML(task.priority)}</span></td><td><span class="pill ${task.status === 'Completed' ? 'success' : isOverdue(task) ? 'error' : task.status === 'In Progress' ? 'in-progress' : ''}">${escapeHTML(isOverdue(task) ? 'Overdue' : task.status)}</span></td><td><div class="row-actions"><button type="button" class="icon-action" data-action="edit-task" data-id="${escapeHTML(task.id)}" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">${icon('edit')}</button></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function overviewPage() {
    const chart = weekBuckets();
    return `<section class="page-heading"><div><p class="eyebrow">${escapeHTML(formatToday())}</p><h1>Your week, in focus.</h1><p class="page-subtitle">Hi ${escapeHTML(state.session.name)}. Here’s what needs your attention.</p></div><button type="button" class="primary-button" data-action="open-task"><span aria-hidden="true">${icon('add')}</span> Add a task</button></section>
      <section class="summary-grid" aria-label="Academic workload summary">${renderSummaryCards()}</section>
      <div class="dashboard-grid">
        <section class="card card-pad" aria-labelledby="week-chart-title"><div class="section-head"><div><p class="section-kicker">The big picture</p><h2 id="week-chart-title">Your next 7 days</h2></div><span class="pill">${state.tasks.filter(task => task.date >= todayISO() && task.date <= offsetISO(6) && task.status !== 'Completed').length} active due</span></div>${chartLegend()}${chartMarkup(chart, 'Academic tasks due over the next seven days')}<p class="chart-help">Each bar is a due date; the clay segment marks tasks already completed.</p></section>
        <section class="card card-pad" aria-labelledby="next-up-title"><div class="section-head"><div><p class="section-kicker">Start here</p><h2 id="next-up-title">Next up</h2></div><a class="text-button" href="#tasks">My tasks →</a></div>${renderUpcomingList()}</section>
      </div>
      <div class="dashboard-lower">
        <section class="card card-pad" aria-labelledby="subject-progress-title"><div class="section-head"><div><p class="section-kicker">At a glance</p><h2 id="subject-progress-title">Subject progress</h2></div><a class="text-button" href="#subjects">Subjects →</a></div>${subjectProgressRows()}</section>
        <section class="card card-pad" aria-labelledby="study-loop-title"><p class="section-kicker">Your study loop</p><h2 id="study-loop-title">From due date to done</h2><div class="flow-strip" aria-label="Capture, organize, prioritize, complete"><span class="flow-chip"><span class="flow-chip-number">01</span>Capture</span><span class="flow-arrow" aria-hidden="true">→</span><span class="flow-chip"><span class="flow-chip-number">02</span>Organize</span><span class="flow-arrow" aria-hidden="true">→</span><span class="flow-chip"><span class="flow-chip-number">03</span>Focus</span><span class="flow-arrow" aria-hidden="true">→</span><span class="flow-chip"><span class="flow-chip-number">04</span>Complete</span></div><p class="chart-help">One clear next step, at a time.</p></section>
      </div>
      ${motivationCard()}
      <section class="card" aria-labelledby="deadline-table-title"><div class="section-head card-pad" style="padding-bottom:14px"><div><p class="section-kicker">Coming up</p><h2 id="deadline-table-title">All your deadlines, together</h2></div><a class="text-button" href="#tasks">My tasks →</a></div>${renderDeadlineTable()}</section>`;
  }

  function emptyState(symbol, heading, message, buttonLabel, action) {
    return `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${symbol}</span><h3>${escapeHTML(heading)}</h3><p>${escapeHTML(message)}</p><button type="button" class="primary-button" data-action="${action}">${escapeHTML(buttonLabel)}</button></div>`;
  }

  function typeMark(type) { return ({ Assignment: 'A', Quiz: 'Q', Exam: 'E' })[type] || 'T'; }

  function filterCount(filter) {
    return state.tasks.filter(task => filter === 'all' || taskGroup(task) === filter).length;
  }

  function taskMatchesFilter(task) {
    if (state.filter === 'all') return true;
    return taskGroup(task) === state.filter;
  }

  function taskRow(task) {
    const isComplete = task.status === 'Completed';
    return `<article class="card task-row"><span class="task-check-wrap"><button type="button" class="task-check" data-action="toggle-task" data-id="${escapeHTML(task.id)}" aria-pressed="${isComplete}" aria-label="${isComplete ? 'Reopen' : 'Complete'} ${escapeHTML(task.title)}">${isComplete ? '✓' : ''}</button></span><div class="task-row-main"><h3 class="task-row-title ${isComplete ? 'completed' : ''}">${escapeHTML(task.title)}</h3><p class="task-row-detail">${escapeHTML(task.subject)} · ${escapeHTML(task.type)}${task.note ? ` · ${escapeHTML(task.note)}` : ''}</p><div class="task-row-tags">${taskBadges(task)}</div></div><div class="task-row-end"><span class="due-text">${isComplete ? 'Completed' : isOverdue(task) ? `Past due · ${escapeHTML(formatDate(task.date))}` : task.date === todayISO() ? 'Due today' : escapeHTML(formatDate(task.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</span><label class="screen-reader-only" for="status-${escapeHTML(task.id)}">Status for ${escapeHTML(task.title)}</label><select class="inline-select" id="status-${escapeHTML(task.id)}" data-action="change-status" data-id="${escapeHTML(task.id)}" aria-label="Status for ${escapeHTML(task.title)}"><option ${task.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option ${isComplete ? 'selected' : ''}>Completed</option></select><button type="button" class="icon-action" data-action="edit-task" data-id="${escapeHTML(task.id)}" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">${icon('edit')}</button><button type="button" class="icon-action danger" data-action="delete-task" data-id="${escapeHTML(task.id)}" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">${icon('delete')}</button></div></article>`;
  }

  function taskResults() {
    const query = state.query.trim().toLowerCase();
    const tasks = dueSorted(state.tasks.filter(task => taskMatchesFilter(task) && (!query || `${task.title} ${task.subject} ${task.type} ${task.priority} ${task.status}`.toLowerCase().includes(query))));
    if (tasks.length) return tasks.map(taskRow).join('');
    if (!state.tasks.length) return emptyState('＋', 'Your plan starts here.', 'Add one task to make your workload visible.', 'Add a task', 'open-task');
    return `<section class="card empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h3>No tasks match this view.</h3><p>Try another filter or clear your search.</p><button class="secondary-button" type="button" data-action="clear-filters">Clear filters</button></section>`;
  }

  function taskPage() {
    const filterOptions = [
      ['all', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']
    ];
    const filterButtons = filterOptions.map(([key, label]) => `<button type="button" class="filter-button" data-action="filter" data-filter="${key}" aria-pressed="${state.filter === key}">${label}<span class="filter-count">${filterCount(key)}</span></button>`).join('');
    return `<section class="page-heading"><div><p class="eyebrow">A place for everything</p><h1>My tasks.</h1><p class="page-subtitle">Keep every deadline in view, and choose what matters next.</p></div><button class="primary-button" type="button" data-action="open-task">${icon('add')} Add a task</button></section><section class="card toolbar" aria-label="Task filters and search"><div class="filter-list" role="group" aria-label="Filter tasks">${filterButtons}</div><div class="search-box"><label class="screen-reader-only" for="task-search">Search tasks</label><input class="input" id="task-search" type="search" value="${escapeHTML(state.query)}" placeholder="Find a task…" autocomplete="off"></div></section><section class="task-list" aria-label="Academic tasks">${taskResults()}</section>`;
  }

  function subjectPage() {
    const cards = state.subjects.map(subject => {
      const stats = getSubjectStats(subject.name);
      return `<article class="card subject-card tone-${escapeHTML(subject.color || 'sage')}" aria-labelledby="subject-title-${escapeHTML(subject.id)}"><div class="subject-card-head"><div class="subject-title-wrap"><i class="subject-dot" aria-hidden="true"></i><h3 id="subject-title-${escapeHTML(subject.id)}">${escapeHTML(subject.name)}</h3></div><span class="pill">${stats.total} task${stats.total === 1 ? '' : 's'}</span></div><p class="subject-card-meta">${stats.active} still in your plan</p>${stats.total ? `<div class="progress-track" role="progressbar" aria-label="${escapeHTML(subject.name)} completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.percent}"><div class="progress-fill" style="width:${stats.percent}%"></div></div><div class="section-head" style="margin-top:8px"><span class="form-hint" style="margin:0">${stats.completed} completed</span><span class="form-hint" style="margin:0">${stats.percent}% complete</span></div>` : `<p class="form-hint">No tasks yet — add one when work comes up.</p>`}<div class="subject-card-actions"><button type="button" class="secondary-button" data-action="edit-subject" data-id="${escapeHTML(subject.id)}">Edit subject</button><button type="button" class="text-button" data-action="delete-subject" data-id="${escapeHTML(subject.id)}">Delete</button></div></article>`;
    }).join('');
    const body = state.subjects.length ? `<div class="subject-grid">${cards}</div>` : emptyState('▦', 'Start with one subject.', 'Every task gets a home. Add your classes to organize your semester.', 'Add subject', 'open-subject');
    return `<section class="page-heading"><div><p class="eyebrow">Your semester, organized</p><h1>Made for your subjects.</h1><p class="page-subtitle">See what’s on your plate in every class.</p></div><button class="primary-button" type="button" data-action="open-subject">${icon('add')} Add subject</button></section>${body}`;
  }

  function monthBuckets() {
    const now = today();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const groupCount = Math.ceil(lastDay / 7);
    return Array.from({ length: groupCount }, (_, index) => {
      const firstDay = index * 7 + 1;
      const lastGroupDay = Math.min(firstDay + 6, lastDay);
      const tasks = state.tasks.filter(task => {
        const date = parseLocalDate(task.date);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() >= firstDay && date.getDate() <= lastGroupDay;
      });
      return { label: `${firstDay}–${lastGroupDay}`, due: tasks.length, done: tasks.filter(task => task.status === 'Completed').length };
    });
  }

  function renderInsightChart() {
    const buckets = state.insightRange === 'month' ? monthBuckets() : weekBuckets();
    if (state.insightRange === 'week') return chartMarkup(buckets, 'Tasks due across the next seven days');
    const max = Math.max(1, ...buckets.map(bucket => bucket.due));
    return `<div class="chart-month-grid" role="group" aria-label="Monthly workload by week">${buckets.map(bucket => {
      const height = bucket.due ? Math.max(8, bucket.due / max * 126) : 0;
      const completedHeight = bucket.due ? bucket.done / bucket.due * 100 : 0;
      return `<div class="chart-month-column" aria-label="Days ${bucket.label}: ${bucket.due} due, ${bucket.done} completed"><span class="chart-month-value">${bucket.due}</span><div class="chart-month-bar" style="height:${height}px">${bucket.done ? `<span class="chart-month-done" style="height:${completedHeight}%"></span>` : ''}</div><span class="chart-month-label">Days<br>${bucket.label}</span></div>`;
    }).join('')}</div>`;
  }

  function renderSubjectWorkload() {
    if (!state.subjects.length) return emptyState('▦', 'No subject data yet.', 'Add a subject and task to see your workload.', 'Add subject', 'open-subject');
    const counts = state.subjects.map(subject => ({ subject, count: state.tasks.filter(task => task.subject === subject.name).length }));
    const max = Math.max(1, ...counts.map(item => item.count));
    return `<div class="progress-list">${counts.map(({ subject, count }) => `<div class="progress-row"><span class="progress-name" title="${escapeHTML(subject.name)}">${escapeHTML(subject.name)}</span><div class="progress-track" role="progressbar" aria-label="${escapeHTML(subject.name)} task count" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${count}"><div class="progress-fill" style="width:${count ? Math.max(5, count / max * 100) : 0}%"></div></div><span class="progress-value">${count}</span></div>`).join('')}</div>`;
  }

  function insightsPage() {
    const completed = state.tasks.filter(task => task.status === 'Completed').length;
    const active = activeTasks().length;
    const overdue = activeTasks().filter(isOverdue).length;
    const periodLabel = state.insightRange === 'month' ? 'This month' : 'Next 7 days';
    if (!state.tasks.length) {
      return `<section class="page-heading"><div><p class="eyebrow">Notice your progress</p><h1>Your progress starts here.</h1><p class="page-subtitle">Add a task and Acadly will turn your plan into a clear picture.</p></div></section><section class="card insight-empty" aria-labelledby="insight-empty-title"><div class="insight-empty-visual" aria-hidden="true"><span>0</span><i></i><i></i><i></i><i></i><i></i><i></i></div><div><p class="section-kicker">Your first step</p><h2 id="insight-empty-title">No tasks to chart yet.</h2><p class="page-subtitle">Your progress, workload, and due-date charts will show here once you add your first task.</p><button type="button" class="primary-button" data-action="open-task">${icon('add')} Add your first task</button></div></section>`;
    }
    return `<section class="page-heading"><div><p class="eyebrow">Notice your progress</p><h1>Look how far you’ve come.</h1><p class="page-subtitle">A simple picture of the work you’re putting in.</p></div><div class="search-box"><label class="field-label" for="insight-range">Time period</label><select class="select" id="insight-range"><option value="week" ${state.insightRange === 'week' ? 'selected' : ''}>Next 7 days</option><option value="month" ${state.insightRange === 'month' ? 'selected' : ''}>This month</option></select></div></section><section class="insight-stats" aria-label="Progress summary"><article class="card card-pad"><p class="summary-detail">Tasks completed</p><p class="summary-value">${completed}</p><p class="summary-detail">${state.tasks.length ? `${completionPercent()}% of your total work` : 'Every checkmark counts'}</p></article><article class="card card-pad"><p class="summary-detail">Still in your plan</p><p class="summary-value">${active}</p><p class="summary-detail">Across ${state.subjects.length} subjects</p></article><article class="card card-pad"><p class="summary-detail">Need a fresh look</p><p class="summary-value" ${overdue ? 'style="color:var(--error)"' : ''}>${overdue}</p><p class="summary-detail">${overdue ? 'Past-due tasks stay visible' : 'Nothing overdue'}</p></article></section><div class="insight-grid"><section class="card card-pad" aria-labelledby="insight-chart-title"><p class="section-kicker">A gentle rhythm</p><h2 id="insight-chart-title">Tasks due · ${escapeHTML(periodLabel)}</h2>${chartLegend()}${renderInsightChart()}<p class="chart-help">Bars count tasks by due date. Completed tasks are highlighted within each bar.</p></section><section class="card card-pad" aria-labelledby="subject-chart-title"><p class="section-kicker">Where you’re focusing</p><h2 id="subject-chart-title">Work by subject</h2>${renderSubjectWorkload()}</section></div><section class="card explain-card"><span class="info-mark" aria-hidden="true">i</span><div><h3>How progress is calculated</h3><p>Subject progress is completed tasks divided by all tasks in that subject. Overdue tasks remain in your plan until completed or removed, so nothing quietly disappears.</p></div></section>`;
  }

  function renderApp() {
    if (state.page === 'tasks') renderAppShell(taskPage(), 'My tasks');
    else if (state.page === 'subjects') renderAppShell(subjectPage(), 'Subjects');
    else if (state.page === 'insights') renderAppShell(insightsPage(), 'Insights');
    else if (state.page === 'focus') renderAppShell(focusPage(), 'Focus Space');
    else renderAppShell(overviewPage(), 'Overview');
    renderModal();
  }

  function render() {
    if (!hasSession()) {
      overlayRoot.innerHTML = '';
      renderAuth();
      return;
    }
    if (!validPages.includes(state.page)) state.page = 'overview';
    renderApp();
  }

  function focusMainHeading() {
    const heading = appRoot.querySelector('main h1, main h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

function emptyTaskForm(task = null) {
  const subjectOptions = state.subjects
    .map(
      subject =>
        `<option value="${escapeHTML(subject.name)}" ${
          task?.subject === subject.name ? 'selected' : ''
        }>${escapeHTML(subject.name)}</option>`
    )
    .join('');

  return `<form class="form-grid" data-form="task" novalidate>

    <div class="form-field field-full">
      <label class="field-label" for="task-title">
        Task name <span aria-hidden="true">*</span>
      </label>
      <input
        class="input"
        id="task-title"
        name="title"
        type="text"
        required
        maxlength="80"
        value="${escapeHTML(task?.title || '')}"
        placeholder="e.g. Data structures assignment 2"
      >
      <p class="field-error" data-error-for="title"></p>
    </div>

    <div class="form-field">
      <label class="field-label" for="task-subject">
        Subject <span aria-hidden="true">(optional)</span>
      </label>
      <select class="select" id="task-subject" name="subject">
        <option value="">No subject</option>
        ${subjectOptions}
      </select>
      <p class="field-error" data-error-for="subject"></p>
    </div>

    <div class="form-field">
      <label class="field-label" for="task-type">
        Task type <span aria-hidden="true">*</span>
      </label>
      <select class="select" id="task-type" name="type" required>
        ${['Assignment', 'Quiz', 'Exam']
          .map(
            type =>
              `<option ${
                task?.type === type ? 'selected' : ''
              }>${type}</option>`
          )
          .join('')}
      </select>
    </div>

    <div class="form-field">
      <label class="field-label" for="task-date">
        Due date <span aria-hidden="true">*</span>
      </label>
      <input
        class="input"
        id="task-date"
        name="date"
        type="date"
        required
        value="${escapeHTML(task?.date || todayISO())}"
      >
      <p class="field-error" data-error-for="date"></p>
    </div>

    <div class="form-field">
      <label class="field-label" for="task-priority">
        Priority <span aria-hidden="true">*</span>
      </label>
      <select class="select" id="task-priority" name="priority" required>
        ${['High', 'Medium', 'Low']
          .map(
            priority =>
              `<option ${
                task?.priority === priority ? 'selected' : ''
              }>${priority}</option>`
          )
          .join('')}
      </select>
    </div>

    ${
      task
        ? `<div class="form-field field-full">
            <label class="field-label" for="task-status">Status</label>
            <select class="select" id="task-status" name="status">
              ${['Pending', 'In Progress', 'Completed']
                .map(
                  status =>
                    `<option ${
                      task.status === status ? 'selected' : ''
                    }>${status}</option>`
                )
                .join('')}
            </select>
          </div>`
        : ''
    }

    <div class="form-field field-full">
      <label class="field-label" for="task-note">
        Note <span style="font-weight:400;color:var(--muted)">(optional)</span>
      </label>
      <textarea
        class="textarea"
        id="task-note"
        name="note"
        maxlength="300"
        placeholder="Anything worth remembering?"
      >${escapeHTML(task?.note || '')}</textarea>
    </div>

    <p class="dialog-error field-full" role="alert">
      ${escapeHTML(state.modalError)}
    </p>

    <div class="form-actions field-full">
      <button
        type="button"
        class="secondary-button"
        data-action="close-modal"
      >
        Cancel
      </button>

      <button type="submit" class="primary-button">
        ${task ? 'Save changes' : 'Save task'}
      </button>
    </div>

  </form>`;
}

  function renderModal() {
    if (!state.modal) { overlayRoot.innerHTML = ''; return; }
    if (state.modal === 'task') {
      const task = state.editingId ? state.tasks.find(item => item.id === state.editingId) : null;
      overlayRoot.innerHTML = `<div class="overlay" data-overlay-backdrop><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><div><p class="section-kicker">${task ? 'KEEP IT CURRENT' : 'MAKE IT VISIBLE'}</p><h2 id="dialog-title">${task ? 'Edit task' : 'Add an academic task'}</h2></div><button class="dialog-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div><p class="dialog-intro">${task ? 'Update the details and save your changes.' : 'Get it out of your head and into your plan.'}</p>${emptyTaskForm(task)}</section></div>`;
    } else if (state.modal === 'subject') {
      const subject = state.editingId ? state.subjects.find(item => item.id === state.editingId) : null;
      overlayRoot.innerHTML = `<div class="overlay" data-overlay-backdrop><section class="dialog dialog-small" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><div><p class="section-kicker">A NEW PLACE TO FOCUS</p><h2 id="dialog-title">${subject ? 'Edit subject' : 'Add a subject'}</h2></div><button class="dialog-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div><p class="dialog-intro">Every task gets a home.</p><form class="form-grid" data-form="subject" novalidate><div class="form-field field-full"><label class="field-label" for="subject-name">Subject name <span aria-hidden="true">*</span></label><input class="input" id="subject-name" name="name" type="text" required maxlength="36" value="${escapeHTML(subject?.name || '')}" placeholder="e.g. Data Structures"><p class="field-error" data-error-for="name"></p></div><div class="form-field field-full"><label class="field-label" for="subject-color">Choose a color</label><select class="select" id="subject-color" name="color">${subjectColors.map(color => `<option value="${color}" ${subject?.color === color ? 'selected' : ''}>${color.charAt(0).toUpperCase() + color.slice(1)}</option>`).join('')}</select></div><p class="dialog-error field-full" role="alert">${escapeHTML(state.modalError)}</p><div class="form-actions field-full"><button type="button" class="secondary-button" data-action="close-modal">Cancel</button><button type="submit" class="primary-button">${subject ? 'Save changes' : 'Add subject'}</button></div></form></section></div>`;
    } else if (state.modal === 'confirm-delete') {
      const item = state.pendingDelete;
      const isTask = item?.kind === 'task';
      const current = isTask ? state.tasks.find(task => task.id === item.id) : state.subjects.find(subject => subject.id === item.id);
      overlayRoot.innerHTML = `<div class="overlay" data-overlay-backdrop><section class="dialog dialog-small" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">Delete ${isTask ? 'task' : 'subject'}?</h2><button class="dialog-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div><p class="dialog-intro">${isTask ? `“${escapeHTML(current?.title || '')}” will be removed from your plan.` : `“${escapeHTML(current?.name || '')}” can only be removed when no tasks use it.`}</p><div class="form-actions"><button type="button" class="secondary-button" data-action="close-modal">Keep it</button><button type="button" class="danger-button" data-action="confirm-delete">Delete ${isTask ? 'task' : 'subject'}</button></div></section></div>`;
    }
    const focusable = overlayRoot.querySelector('input:not([type="hidden"]),button,select,textarea,a[href]');
    if (focusable) requestAnimationFrame(() => focusable.focus());
  }

  function showToast(message) {
    toastRoot.innerHTML = `<div class="toast">${escapeHTML(message)}</div>`;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { toastRoot.innerHTML = ''; }, 3000);
  }

  function openTask(taskId = null) {
    state.modalTrigger = document.activeElement;
    state.modal = 'task'; state.editingId = taskId; state.modalError = '';
    renderModal();
  }

  function openSubject(subjectId = null) {
    state.modalTrigger = document.activeElement;
    state.modal = 'subject'; state.editingId = subjectId; state.modalError = '';
    renderModal();
  }

  function closeModal() {
    const trigger = state.modalTrigger;
    state.modal = null; state.editingId = null; state.modalError = ''; state.pendingDelete = null;
    renderModal();
    if (trigger instanceof HTMLElement && document.contains(trigger)) requestAnimationFrame(() => trigger.focus());
  }

  function validateRequired(form, names) {
    let valid = true;
    names.forEach(name => {
      const control = form.elements.namedItem(name);
      const error = form.querySelector(`[data-error-for="${name}"]`);
      if (!control) return;
      let message = '';
      if (!control.value.trim()) message = name === 'date' ? 'Choose a due date.' : `Enter ${name === 'title' ? 'a task name' : name === 'email' ? 'your email address' : name}.`;
      else if (name === 'email' && !control.validity.valid) message = 'Enter a valid email address.';
      else if (name === 'password' && control.value.length < 8) message = 'Use at least 8 characters.';
      else if (name === 'subject' && !state.subjects.some(subject => subject.name === control.value)) message = 'Choose a subject from your list.';
      if (error) error.textContent = message;
      if (message) valid = false;
    });
    return valid;
  }

  function setButtonLoading(button, text) {
    if (!button) return () => {};
    const previous = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${escapeHTML(text)}`;
    return () => { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = previous; };
  }

  async function startSession(name, email) {
    state.session = { name: name.trim() || displayNameFromEmail(email), email: normalizedEmail(email) };
    writeJSON('acadly:session', state.session);
    writeJSON(profileKey(email), state.session);
    await loadWorkspace(email, false);
    state.page = 'overview'; state.authError = ''; state.authLoading = false;
    history.pushState(null, '', '#overview');
    render();
    focusMainHeading();
  }

async function handleAuthSubmit(form) {
  const view = form.elements.view.value;
  const email = normalizedEmail(form.elements.email.value);

  if (view === 'signup') {
    const name = form.elements.name.value.trim();

    if (!validateRequired(form, ['name', 'email', 'password'])) return;

    if (name.length < 2) {
      form.querySelector('[data-error-for="name"]').textContent =
        'Enter your full name.';
      return;
    }

    const release = setButtonLoading(
      form.querySelector('[type="submit"]'),
      'Creating account…'
    );

    state.authLoading = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        form.elements.password.value
      );

      await updateProfile(userCredential.user, {
        displayName: name
      });

      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          name,
          email,
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );

      await startSession(name, email);

      showToast('Account created. Welcome to Acadly.');
    } catch (error) {
      state.authLoading = false;

      if (error.code === 'auth/email-already-in-use') {
        state.authError = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        state.authError = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        state.authError = 'Please enter a valid email address.';
      } else {
        state.authError = 'Could not create your account. Please try again.';
      }

      console.error('SIGNUP ERROR:', error);
    } finally {
      release();
      state.authLoading = false;
    }

    return;
  }

  if (view === 'login') {
    if (!validateRequired(form, ['email', 'password'])) return;

    const release = setButtonLoading(
      form.querySelector('[type="submit"]'),
      'Signing in…'
    );

    state.authLoading = true;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        form.elements.password.value
      );

      const user = userCredential.user;

      await startSession(
        user.displayName || displayNameFromEmail(user.email),
        user.email
      );

      showToast('Welcome back.');
    } catch (error) {
      state.authLoading = false;

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        state.authError = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
        state.authError = 'Please enter a valid email address.';
      } else {
        state.authError = 'Could not sign you in. Please try again.';
      }

      console.error('LOGIN ERROR:', error);
    } finally {
      release();
      state.authLoading = false;
    }

    return;
  }

  if (view === 'reset') {
    if (!validateRequired(form, ['email'])) return;

    state.authEmail = email;

    const release = setButtonLoading(
      form.querySelector('[type="submit"]'),
      'Sending…'
    );

    state.authLoading = true;

    try {
      await sendPasswordResetEmail(auth, email);

      state.authError = '';
      renderAuth();

      const authIntro = appRoot.querySelector('.auth-intro');

      if (authIntro) {
        authIntro.insertAdjacentHTML(
          'afterend',
          `<p class="alert success" role="status">
            If an account exists for ${escapeHTML(email)}, reset instructions have been sent.
          </p>`
        );
      }
    } catch (error) {
      state.authLoading = false;

      if (error.code === 'auth/invalid-email') {
        state.authError = 'Please enter a valid email address.';
      } else {
        state.authError =
          'Could not send reset instructions. Please try again.';
      }

      renderAuth();
    } finally {
      release();
      state.authLoading = false;
    }

    return;
  }
}

  function demoLogin() {
    const demoProfile = { name: 'Aarav Sharma', email: demoEmail };
    state.session = demoProfile;
    writeJSON('acadly:session', demoProfile);
    writeJSON(profileKey(demoEmail), demoProfile);
    if (!readJSON(workspaceKey(demoEmail), null)) {
      writeJSON(workspaceKey(demoEmail), makeSampleWorkspace());
    }
    loadWorkspace(demoEmail, true);
    state.page = 'overview'; state.authError = '';
    history.pushState(null, '', '#overview');
    render();
    focusMainHeading();
  }

  async function createTask(data, id = null) {
  const taskId =
    id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const taskData = {
    id: taskId,
    title: data.title.trim(),
    subject: data.subject || '',
    type: data.type,
    date: data.date,
    priority: data.priority,
    status: data.status || 'Pending',
    note: (data.note || '').trim()
  };

  if (auth.currentUser) {
    const taskRef = doc(
      db,
      'users',
      auth.currentUser.uid,
      'tasks',
      taskId
    );
    await setDoc(taskRef, taskData);
  } else if (!state.session) {
    throw new Error('You must be logged in to save a task.');
  }

  if (id) {
    state.tasks = state.tasks.map(task =>
      task.id === id ? taskData : task
    );
  } else {
    state.tasks.unshift(taskData);
  }

  if (!auth.currentUser) persistWorkspace();

  return taskData;
}

async function createSubject(data, id = null) {
  const name = data.name.trim();
  const color = data.color || 'sage';

  const existing = state.subjects.find(
    subject =>
      subject.name.toLowerCase() === name.toLowerCase() &&
      subject.id !== id
  );

  if (existing) {
    return { error: 'That subject is already in your list.' };
  }

  const subjectId =
    id ||
    `subject-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const subjectData = {
    id: subjectId,
    name,
    color
  };

  if (auth.currentUser) {
    try {
      await setDoc(
        doc(
          db,
          'users',
          auth.currentUser.uid,
          'subjects',
          subjectId
        ),
        subjectData
      );
    } catch (error) {
      console.error('FIRESTORE SUBJECT SAVE ERROR:', error);
      return { error: 'Subject could not be saved.' };
    }
  }

  if (id) {
    const oldName = state.subjects.find(
      subject => subject.id === id
    )?.name;

    state.subjects = state.subjects.map(subject =>
      subject.id === id
        ? subjectData
        : subject
    );

    state.tasks = state.tasks.map(task =>
      task.subject === oldName
        ? { ...task, subject: name }
        : task
    );
  } else {
    state.subjects.push(subjectData);
  }

  if (!auth.currentUser) {
    persistWorkspace();
  }

  return { subject: name };
}
  async function handleTaskSubmit(form) {
  if (!validateRequired(form, ['title', 'date'])) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('[type="submit"]');
  const release = setButtonLoading(submit, 'Saving…');

  try {
    const wasEditing = Boolean(state.editingId);

    await createTask(data, state.editingId);

    closeModal();
    renderApp();

    showToast(
      wasEditing
        ? 'Task updated.'
        : 'Task added to your plan.'
    );
  } catch (error) {
    console.error('FIRESTORE TASK ERROR:', error);

    showToast('Task could not be saved.');
  } finally {
    release();
  }
}

  async function handleSubjectSubmit(form) {
    if (!validateRequired(form, ['name'])) return;
    const data = Object.fromEntries(new FormData(form));
    const submit = form.querySelector('[type="submit"]');
    const release = setButtonLoading(submit, 'Saving…');
    const wasEditing = Boolean(state.editingId);
    const result = await createSubject(data, state.editingId);
    if (result.error) {
      release();
      state.modalError = result.error;
      const error = form.querySelector('.dialog-error');
      if (error) error.textContent = result.error;
      return;
    }
    const continueToTask = state.returnToTaskAfterSubject;
    state.returnToTaskAfterSubject = false;
    closeModal();
    renderApp();
    showToast(wasEditing ? 'Subject updated.' : 'Subject added.');
    if (continueToTask) setTimeout(() => openTask(), 0);
  }

  async function toggleTask(id) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;

  const newStatus =
    task.status === 'Completed' ? 'Pending' : 'Completed';

  task.status = newStatus;

  if (auth.currentUser) {
    try {
      await updateDoc(
        doc(db, 'users', auth.currentUser.uid, 'tasks', id),
        {
          status: newStatus
        }
      );
    } catch (error) {
      console.error('FIRESTORE TASK STATUS ERROR:', error);
      showToast('Task status could not be saved.');
      return;
    }
  } else {
    persistWorkspace();
  }

  renderApp();

  showToast(
    newStatus === 'Completed'
      ? 'Task complete. Nice work.'
      : 'Task moved back to your plan.'
  );
}

  async function changeTaskStatus(id, status) {
  const task = state.tasks.find(item => item.id === id);

  if (
    !task ||
    !['Pending', 'In Progress', 'Completed'].includes(status)
  ) {
    return;
  }

  task.status = status;

  if (auth.currentUser) {
    try {
      await updateDoc(
        doc(db, 'users', auth.currentUser.uid, 'tasks', id),
        {
          status
        }
      );
    } catch (error) {
      console.error('FIRESTORE TASK STATUS ERROR:', error);
      showToast('Task status could not be saved.');
      return;
    }
  } else {
    persistWorkspace();
  }

  renderApp();

  showToast(
    status === 'Completed'
      ? 'Task complete. Nice work.'
      : 'Task status updated.'
  );
}

  function deleteItem(kind, id) {
    state.modalTrigger = document.activeElement;
    state.pendingDelete = { kind, id };
    state.modal = 'confirm-delete';
    renderModal();
  }
  
  async function confirmDelete() {
      const target = state.pendingDelete;
    if (!target) return;
    if (target.kind === 'task') {
  const task = state.tasks.find(item => item.id === target.id);

  try {
    await deleteDoc(
      doc(db, 'users', auth.currentUser.uid, 'tasks', target.id)
    );

    state.tasks = state.tasks.filter(item => item.id !== target.id);

    closeModal();
    renderApp();

    showToast(task ? `“${task.title}” removed.` : 'Task removed.');
  } catch (error) {
    console.error('FIRESTORE TASK DELETE ERROR:', error);
    showToast('Task could not be deleted.');
  }

  return;
}
    const subject = state.subjects.find(item => item.id === target.id);
    const used = state.tasks.some(task => task.subject === subject?.name);
    if (used) {
      closeModal();
      showToast('Move or delete this subject’s tasks before removing it.');
      return;
    }
    state.subjects = state.subjects.filter(item => item.id !== target.id);
    closeModal(); persistWorkspace(); renderApp(); showToast('Subject removed.');
  }

  function handleClick(event) {
    const routeLink = event.target.closest('a[href^="#"]');
    if (routeLink && !routeLink.closest('.auth-form')) {
      const route = routeLink.getAttribute('href').slice(1);
      if (['login', 'signup', 'reset'].includes(route)) {
        event.preventDefault(); state.authView = route; state.authError = ''; state.authEmail = appRoot.querySelector('[name="email"]')?.value || '';
        history.pushState(null, '', `#${route}`); render(); focusMainHeading(); return;
      }
      if (validPages.includes(route)) {
        event.preventDefault(); state.page = route; state.filter = 'all'; state.query = '';
        history.pushState(null, '', `#${route}`); renderApp(); window.scrollTo({ top: 0, behavior: 'smooth' }); focusMainHeading(); return;
      }
    }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
      if (event.target.matches('[data-overlay-backdrop]')) closeModal();
      return;
    }
    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;
    if (action === 'demo-login') demoLogin();
    else if (action === 'signout') {
      if (state.focusInterval) clearInterval(state.focusInterval);
      state.focusInterval = null; stopAmbientSound();
      removeStored('acadly:session'); state.session = null; state.authView = 'login'; state.authError = ''; state.modal = null; render();
    } else if (action === 'open-task') openTask();
    else if (action === 'open-subject' || action === 'open-subject-from-task') {
      const continueToTask = action === 'open-subject-from-task' || state.returnToTaskAfterSubject;
      state.returnToTaskAfterSubject = continueToTask; openSubject();
    } else if (action === 'close-modal') closeModal();
    else if (action === 'edit-task') openTask(id);
    else if (action === 'delete-task') deleteItem('task', id);
    else if (action === 'edit-subject') openSubject(id);
    else if (action === 'delete-subject') deleteItem('subject', id);
    else if (action === 'confirm-delete') confirmDelete();
    else if (action === 'toggle-task') toggleTask(id);
    else if (action === 'filter') {
      state.filter = actionButton.dataset.filter; renderApp();
    } else if (action === 'clear-filters') {
      state.filter = 'all'; state.query = ''; renderApp();
    } else if (action === 'pause-focus') pauseFocusSession();
    else if (action === 'resume-focus') resumeFocusSession();
    else if (action === 'end-focus') endFocusSession();
    else if (action === 'new-focus') {
      state.focus = { ...state.focus, phase: 'setup', remaining: (Number(state.focus.duration) || 25) * 60, lastSession: null };
      renderApp();
    } else if (action === 'toggle-password') {
      const input = document.getElementById(actionButton.dataset.target);
      if (!input) return;
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      actionButton.textContent = visible ? 'Hide' : 'Show';
      actionButton.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
      actionButton.setAttribute('aria-pressed', String(visible));
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.form === 'auth') { event.preventDefault(); handleAuthSubmit(form); }
    else if (form.dataset.form === 'task') { event.preventDefault(); handleTaskSubmit(form); }
    else if (form.dataset.form === 'subject') { event.preventDefault(); handleSubjectSubmit(form); }
    else if (form.dataset.form === 'focus-setup') {
      event.preventDefault();
      state.focus.taskId = form.elements.task.value;
      state.focus.duration = Number(form.elements.duration.value) || 25;
      state.focus.sound = form.elements.sound.value;
      beginFocusSession();
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.id === 'insight-range') { state.insightRange = target.value; renderApp(); }
    else if (target.id === 'focus-task') state.focus.taskId = target.value;
    else if (target.id === 'focus-duration') state.focus.duration = Number(target.value) || 25;
    else if (target.id === 'focus-sound') state.focus.sound = target.value;
    else if (target.dataset.action === 'change-status') changeTaskStatus(target.dataset.id, target.value);
  }

  function syncFromHistory() {
    const route = location.hash.slice(1);
    if (hasSession()) {
      state.page = validPages.includes(route) ? route : 'overview';
      renderApp();
    } else {
      state.authView = ['signup', 'reset'].includes(route) ? route : 'login';
      renderAuth();
    }
    focusMainHeading();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && state.modal) { closeModal(); return; }
    if (event.key === 'Tab' && state.modal) {
      const dialog = overlayRoot.querySelector('[role="dialog"]');
      const focusable = [...(dialog?.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)') || [])];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.key === 'Escape' && hasSession()) {
      state.modal = null; renderModal();
    }
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('change', handleChange);
  document.addEventListener('input', event => {
    if (event.target.id === 'task-search') {
      state.query = event.target.value;
      const results = appRoot.querySelector('.task-list');
      if (results) results.innerHTML = taskResults();
    }
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('popstate', syncFromHistory);

  const storedSession = readJSON('acadly:session', null);
const initialRoute = location.hash.slice(1);

if (storedSession?.email) {
  state.session = storedSession;
  state.page = validPages.includes(initialRoute)
    ? initialRoute
    : 'overview';
} else {
  state.authView = ['signup', 'reset'].includes(initialRoute)
    ? initialRoute
    : 'login';
}

render();

onAuthStateChanged(auth, async user => {
  if (user) {
    const session = {
      name:
        user.displayName ||
        storedSession?.name ||
        displayNameFromEmail(user.email),
      email: normalizedEmail(user.email)
    };

    state.session = session;

    writeJSON('acadly:session', session);

    await loadWorkspace(user.email, false);

    state.page = validPages.includes(location.hash.slice(1))
      ? location.hash.slice(1)
      : 'overview';

    render();
  } else {
    state.session = null;
    state.subjects = [];
    state.tasks = [];
    state.focusSessions = [];

    if (!location.hash || location.hash === '#overview') {
      state.authView = 'login';
      state.page = 'overview';
    }

    render();
  }
});
})();
