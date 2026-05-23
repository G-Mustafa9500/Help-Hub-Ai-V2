// ============================================================
// HELPHUB AI — app.js
// Firebase Firestore for requests + replies, localStorage for auth session
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================
const CATEGORIES = ['All', 'Web Development', 'Design', 'Career', 'Data Science', 'Mobile Development', 'DevOps', 'Community'];
const CATEGORY_BADGE = { 'Web Development': 'badge-teal', 'Design': 'badge-violet', 'Career': 'badge-teal', 'Data Science': 'badge-blue', 'Mobile Development': 'badge-amber', 'DevOps': 'badge-slate', 'Community': 'badge-stone' };
const URGENCY_BADGE = { 'low': 'badge-blue', 'medium': 'badge-amber', 'high': 'badge-red' };
const STATUS_BADGE = { 'open': 'badge-stone', 'in-progress': 'badge-amber', 'solved': 'badge-green' };
const STATUS_LABEL = { 'open': 'Open', 'in-progress': 'In Progress', 'solved': 'Solved' };
const AVATAR_COLORS = ['av-teal', 'av-orange', 'av-pink', 'av-blue', 'av-violet'];
const BADGE_COLORS = { 'Design Ally': 'badge-teal', 'Fast Responder': 'badge-amber', 'Top Mentor': 'badge-blue', 'Code Rescuer': 'badge-green', 'Bug Hunter': 'badge-red', 'Community Voice': 'badge-amber', 'Backend Pro': 'badge-violet', 'Frontend Master': 'badge-teal', 'Mentor Star': 'badge-amber' };

// ============================================================
// LOCAL STORAGE HELPERS (auth/session/users only)
// ============================================================
function ls(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, v) } catch (e) { } }
function lsJSON(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch (e) { return null } }
function lsSetJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }

// ============================================================
// USER DB (localStorage only — no fake seed data)
// ============================================================
let DB_USERS = lsJSON('hh_db_users') || [];
window.DB_USERS = DB_USERS;

let notifications = lsJSON('hh_notifications') || [];
let currentUserId = ls('hh_currentUser') || null;
let isLoggedIn = ls('hh_loggedIn') === 'true';

// ============================================================
// FIREBASE CONFIG
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAUfZ4CTBV2O8XMRSfgTMLP5icyNt19SdE",
  authDomain: "help-hub-ai-db2ca.firebaseapp.com",
  projectId: "help-hub-ai-db2ca",
  storageBucket: "help-hub-ai-db2ca.firebasestorage.app",
  messagingSenderId: "700180580288",
  appId: "1:700180580288:web:8cb87cde49f7de8157aa25"
};

// Firestore module loaded lazily
let _db = null;
let _storage = null;

async function getDB() {
  if (_db) return _db;
  const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  _db = getFirestore(app);
  return _db;
}

async function getStorage() {
  if (_storage) return _storage;
  const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const { getStorage: _getStorage } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  _storage = _getStorage(app);
  return _storage;
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================
async function fsGetAll(col) {
  try {
    const db = await getDB();
    const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const q = query(collection(db, col), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('fsGetAll error:', e); return []; }
}

async function fsAdd(col, data) {
  try {
    const db = await getDB();
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = await addDoc(collection(db, col), data);
    return ref.id;
  } catch (e) { console.error('fsAdd error:', e); return null; }
}

async function fsUpdate(col, docId, data) {
  try {
    const db = await getDB();
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    await updateDoc(doc(db, col, docId), data);
    return true;
  } catch (e) { console.error('fsUpdate error:', e); return false; }
}

async function fsGetReplies(requestId) {
  try {
    const db = await getDB();
    const { collection, getDocs, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const q = query(collection(db, 'replies'), where('requestId', '==', requestId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error('fsGetReplies error:', e); return []; }
}

// Upload image to Firebase Storage (base64)
async function uploadImage(file, path) {
  try {
    const storage = await getStorage();
    const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (e) { console.error('uploadImage error:', e); return null; }
}

// ============================================================
// DATA HELPERS
// ============================================================
function getCurrentUser() { return DB_USERS.find(u => u.id === currentUserId) || null }
function getUserById(id) { return DB_USERS.find(u => u.id === id) }
function getInitials(name) { if(!name) return '?'; return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

// ============================================================
// UI HELPERS
// ============================================================
function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg; t.className = `toast toast-${type} show`; setTimeout(() => { t.className = 'toast' }, 3000)
}
function clearErrors() { document.querySelectorAll('.field-error').forEach(el => el.textContent = '') }

// ============================================================
// MODAL — Request Detail + Public Reply Thread
// ============================================================
function ensureModal() {
  if (document.getElementById('requestModal')) return;
  const overlay = document.createElement('div'); overlay.id = 'requestModal'; overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content"><button class="modal-close" onclick="closeModal()">×</button><div id="modalBody"></div></div>`;
  overlay.addEventListener('click', function (e) { if (e.target === this) closeModal() });
  document.body.appendChild(overlay);
}

function openRequestModal(reqId) {
  if (!isLoggedIn) { window.location.href = 'login.html'; return }
  ensureModal();
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-400);">Loading...</div>`;
  document.getElementById('requestModal').classList.add('active');

  // Load from Firestore
  (async () => {
    const db = await getDB();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const snap = await getDoc(doc(db, 'requests', reqId));
    if (!snap.exists()) { modalBody.innerHTML = '<p style="padding:2rem;color:red;">Request not found.</p>'; return; }
    const req = { id: snap.id, ...snap.data() };
    renderModalContent(req);
    loadReplies(reqId);
  })();
}

function renderModalContent(req) {
  const modalBody = document.getElementById('modalBody');
  const creator = getUserById(req.createdBy) || { name: req.creatorName || 'Unknown', id: req.createdBy };
  const isCreator = req.createdBy === currentUserId;
  const helpers = req.helpers || [];
  const isHelper = helpers.includes(currentUserId);
  const catClass = CATEGORY_BADGE[req.category] || 'badge-stone';
  const urgClass = URGENCY_BADGE[req.urgency] || 'badge-stone';
  const statClass = STATUS_BADGE[req.status] || 'badge-stone';
  const avatarIdx = DB_USERS.indexOf(creator);
  const avClass = AVATAR_COLORS[avatarIdx >= 0 ? avatarIdx % AVATAR_COLORS.length : 0];

  let actionHtml = '';
  if (req.status === 'solved') {
    actionHtml = `<div class="insight-teal" style="padding:1rem;border-radius:12px;margin-top:1.5rem;"><p style="font-size:14px;font-weight:700;color:var(--text-700);">✓ This request has been solved</p></div>`;
  } else if (isCreator) {
    actionHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn-primary" onclick="markSolved('${req.id}')">Mark as solved</button>
      <p style="font-size:13px;color:var(--text-500);align-self:center;">${helpers.length} people offered help.</p>
    </div>`;
  } else if (isHelper) {
    actionHtml = `<div class="insight-blue" style="padding:1rem;border-radius:12px;margin-top:1.5rem;">
      <p style="font-size:14px;font-weight:700;color:var(--text-700);">You already offered help ✓</p>
      <p style="font-size:13px;color:var(--text-500);margin-top:4px;">Your reply is visible below.</p>
    </div>`;
  } else {
    actionHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;">
      <p style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-400);margin-bottom:12px;">POST A PUBLIC SOLUTION</p>
      <textarea id="replyText" class="field" rows="4" placeholder="Write your solution or advice here... Everyone can see this reply." style="margin-bottom:10px;resize:vertical;"></textarea>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <input type="file" id="replyImage" accept="image/*" style="display:none;" onchange="previewReplyImage(this)"/>
        <div class="code-upload-area" id="codeUploadArea" onclick="document.getElementById('replyImage').click()">
          <div class="upload-icon">📸</div>
          <div class="upload-text">Attach Code Screenshot</div>
          <div class="upload-hint">Click to upload or drag an image of your error/code</div>
        </div>
      </div>
      <div id="replyImagePreview" style="margin-bottom:10px;"></div>
      <div style="display:flex;gap:10px;">
        <button class="btn-primary" onclick="submitPublicReply('${req.id}')">I Can Help — Post Reply</button>
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </div>`;
  }

  modalBody.innerHTML = `
    <div class="flex gap-2 flex-wrap mb-4">
      <span class="badge ${catClass}">${req.category}</span>
      <span class="badge ${urgClass}">${req.urgency}</span>
      <span class="badge ${statClass}">${STATUS_LABEL[req.status]}</span>
    </div>
    <h2 style="font-size:22px;font-weight:900;line-height:1.3;margin-bottom:1rem;">${req.title}</h2>
    <p style="font-size:15px;color:var(--text-500);line-height:1.7;margin-bottom:1.25rem;">${req.description}</p>
    <div class="flex gap-2 flex-wrap">${(req.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;">
      <p style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-400);margin-bottom:8px;">POSTED BY</p>
      <div class="flex items-center gap-3">
        <div class="avatar ${avClass}">${getInitials(creator.name)}</div>
        <div><p style="font-size:14px;font-weight:700;color:var(--text-700);">${creator.name}</p>
        <p style="font-size:12px;color:var(--text-400);">${req.location || ''} • ${timeAgo(req.createdAt)}</p></div>
      </div>
    </div>
    ${actionHtml}
    <div style="margin-top:2rem;padding-top:1.5rem;border-top:2px solid #e7e5e4;">
      <p style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-400);margin-bottom:1rem;">💬 PUBLIC REPLIES <span id="replyCount" style="font-weight:900;color:var(--text-700);"></span></p>
      <div id="repliesContainer" style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13px;color:var(--text-400);">Loading replies...</p>
      </div>
    </div>`;
}

async function loadReplies(requestId) {
  const container = document.getElementById('repliesContainer');
  const countEl = document.getElementById('replyCount');
  if (!container) return;
  const replies = await fsGetReplies(requestId);
  if (countEl) countEl.textContent = `(${replies.length})`;
  if (!replies.length) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-400);padding:1rem 0;">No replies yet. Be the first to help!</p>';
    return;
  }
  container.innerHTML = replies.map(r => {
    const user = getUserById(r.userId) || { name: r.userName || 'Community Member' };
    const avIdx = DB_USERS.findIndex(u => u.id === r.userId);
    const avClass = AVATAR_COLORS[avIdx >= 0 ? avIdx % AVATAR_COLORS.length : 0];
    const imgHtml = r.imageUrl ? `<img src="${r.imageUrl}" alt="reply image" style="max-width:100%;border-radius:10px;margin-top:10px;max-height:300px;object-fit:cover;cursor:pointer;" onclick="window.open('${r.imageUrl}','_blank')"/>` : '';
    return `<div style="background:#f9f8f7;border-radius:14px;padding:1rem 1.25rem;border:1px solid #e7e5e4;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div class="avatar ${avClass}" style="width:32px;height:32px;font-size:12px;">${getInitials(user.name)}</div>
        <div>
          <p style="font-size:13px;font-weight:800;color:var(--text-700);">${user.name}</p>
          <p style="font-size:11px;color:var(--text-400);">${timeAgo(r.createdAt)}</p>
        </div>
        <span class="badge badge-teal" style="margin-left:auto;font-size:11px;">Helper</span>
      </div>
      <p style="font-size:14px;color:var(--text-600);line-height:1.7;">${r.text}</p>
      ${imgHtml}
    </div>`;
  }).join('');
}

function previewReplyImage(input) {
  const file = input.files[0]; if (!file) return;
  const previewEl = document.getElementById('replyImagePreview');
  const uploadArea = document.getElementById('codeUploadArea');
  const reader = new FileReader();
  reader.onload = e => {
    if (previewEl) previewEl.innerHTML = `
      <div style="position:relative;display:inline-block;">
        <img src="${e.target.result}" style="max-width:100%;max-height:200px;border-radius:10px;border:1.5px solid #99f6e4;"/>
        <button onclick="clearReplyImage()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:99px;width:24px;height:24px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">×</button>
      </div>`;
    if (uploadArea) {
      uploadArea.classList.add('has-file');
      uploadArea.innerHTML = `<div class="upload-icon">✅</div><div class="upload-text" style="color:var(--teal-700);">${file.name}</div><div class="upload-hint">Click to change image</div>`;
    }
  };
  reader.readAsDataURL(file);
}

async function submitPublicReply(reqId) {
  const textEl = document.getElementById('replyText');
  const imageInput = document.getElementById('replyImage');
  const text = textEl?.value.trim();
  if (!text) { showToast('Please write your solution first.', 'error'); return; }

  const btn = document.querySelector(`button[onclick="submitPublicReply('${reqId}')"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

  const user = getCurrentUser();
  let imageUrl = null;

  // Upload image if selected
  if (imageInput?.files[0]) {
    showToast('Uploading image...', 'success');
    const file = imageInput.files[0];
    const path = `reply_images/${reqId}_${Date.now()}_${file.name}`;
    imageUrl = await uploadImage(file, path);
  }

  const replyData = {
    requestId: reqId,
    userId: currentUserId,
    userName: user?.name || 'Community Member',
    text,
    imageUrl: imageUrl || null,
    createdAt: new Date().toISOString()
  };

  const newId = await fsAdd('replies', replyData);
  if (!newId) { showToast('Failed to post reply. Try again.', 'error'); if (btn) { btn.disabled = false; btn.textContent = 'I Can Help — Post Reply'; } return; }

  // Update helpers array on request
  const db = await getDB();
  const { doc, getDoc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const reqSnap = await getDoc(doc(db, 'requests', reqId));
  if (reqSnap.exists()) {
    await updateDoc(doc(db, 'requests', reqId), { helpers: arrayUnion(currentUserId) });
  }

  // Update user contributions in localStorage
  if (user) { user.contributions = (user.contributions || 0) + 1; lsSetJSON('hh_db_users', DB_USERS); }

  // Notification
  notifications.unshift({ id: 'n_' + Date.now(), type: 'match', title: `${user?.name || 'Someone'} replied to a help request`, timestamp: new Date().toISOString(), read: false });
  lsSetJSON('hh_notifications', notifications);

  showToast('Your solution has been posted publicly!', 'success');

  // Reload request to show updated state
  openRequestModal(reqId);
}

function closeModal() { const m = document.getElementById('requestModal'); if (m) m.classList.remove('active') }

async function markSolved(reqId) {
  const ok = await fsUpdate('requests', reqId, { status: 'solved' });
  if (ok) {
    notifications.unshift({ id: 'n_' + Date.now(), type: 'status', title: 'Your request was marked as solved', timestamp: new Date().toISOString(), read: false });
    lsSetJSON('hh_notifications', notifications);
    showToast('Request marked as solved!', 'success');
    closeModal();
    if (typeof renderPage === 'function') renderPage();
  } else { showToast('Failed to update. Try again.', 'error'); }
}

// ============================================================
// NAVBAR
// ============================================================
function renderNavbar(activePage) {
  const publicLinks = [{ l: 'Home', p: 'index' }, { l: 'Explore', p: 'explore' }, { l: 'Leaderboard', p: 'leaderboard' }];
  const authLinks = [
    { l: 'Dashboard', p: 'dashboard' },
    { l: 'Explore', p: 'explore' },
    { l: 'Create Request', p: 'create' },
    { l: 'Leaderboard', p: 'leaderboard' },
    { l: 'Notification', p: 'notification' },
    { l: 'AI Center', p: 'ai-center' },
    { l: 'Profile', p: 'profile' }
  ];
  const links = isLoggedIn ? authLinks : publicLinks;
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.innerHTML = links.map(({ l, p }) => `<a class="nav-link${activePage === p ? ' active' : ''}" href="${p}.html">${l}</a>`).join('');
  const navActions = document.getElementById('navActions');
  if (navActions) {
    if (!isLoggedIn) { navActions.innerHTML = '<a class="btn-primary-sm" href="login.html">Join the platform</a>' }
    else { const user = getCurrentUser(); navActions.innerHTML = `<span style="font-size:13px;font-weight:600;color:var(--text-700);margin-right:8px;">Hi, ${user?.name?.split(' ')[0] || 'User'}</span><button class="btn-outline" onclick="handleLogout()">Sign out</button>` }
  }
}

function requireAuth() { if (!isLoggedIn || !currentUserId) { window.location.href = 'login.html'; return false } return true }

// ============================================================
// AUTH
// ============================================================
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm'); const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin'); const tabSignup = document.getElementById('tabSignup');
  if (loginForm) loginForm.classList.toggle('active', tab === 'login');
  if (signupForm) signupForm.classList.toggle('active', tab === 'signup');
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');
  clearErrors();
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

function handleLogin() {
  clearErrors();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  let valid = true;
  if (!email) { document.getElementById('loginEmailError').textContent = 'Email is required'; valid = false; }
  else if (!isValidEmail(email)) { document.getElementById('loginEmailError').textContent = 'Please enter a valid email'; valid = false; }
  if (!pass) { document.getElementById('loginPassError').textContent = 'Password is required'; valid = false; }
  if (!valid) return;
  const user = DB_USERS.find(u => u.email === email && u.password === pass);
  if (!user) { showToast('Invalid email or password', 'error'); document.getElementById('loginPassError').textContent = 'Email or password is incorrect'; return; }
  currentUserId = user.id; isLoggedIn = true;
  lsSet('hh_currentUser', currentUserId); lsSet('hh_loggedIn', 'true');
  showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  setTimeout(() => { window.location.href = 'dashboard.html' }, 500);
}

function handleSignup() {
  clearErrors();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPassword').value;
  const confirmPass = document.getElementById('signupConfirmPassword').value;
  const role = document.getElementById('signupRole').value;
  let valid = true;
  if (!name) { document.getElementById('signupNameError').textContent = 'Name is required'; valid = false; }
  if (!email) { document.getElementById('signupEmailError').textContent = 'Email is required'; valid = false; }
  else if (!isValidEmail(email)) { document.getElementById('signupEmailError').textContent = 'Please enter a valid email format'; valid = false; }
  else if (DB_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) { document.getElementById('signupEmailError').textContent = 'This email is already registered'; valid = false; }
  let passError = '';
  if (!pass) passError = 'Password is required';
  else if (pass.length < 8) passError = 'Must be at least 8 characters long';
  else if (!/[A-Z]/.test(pass)) passError = 'Must contain at least 1 uppercase letter';
  else if (!/[a-z]/.test(pass)) passError = 'Must contain at least 1 lowercase letter';
  else if (!/[0-9]/.test(pass)) passError = 'Must contain at least 1 number';
  if (passError) { document.getElementById('signupPassError').textContent = passError; valid = false; }
  if (!confirmPass) { document.getElementById('signupConfirmError').textContent = 'Please confirm your password'; valid = false; }
  else if (pass !== confirmPass) { document.getElementById('signupConfirmError').textContent = 'Passwords do not match'; valid = false; }
  if (!valid) return;
  const newUser = { id: 'u_' + Date.now(), name, email: email.toLowerCase(), password: pass, role, skills: [], interests: [], location: 'Pakistan', trustScore: 10, contributions: 0, badges: ['Community Voice'], joinedDate: new Date().toISOString() };
  DB_USERS.push(newUser); lsSetJSON('hh_db_users', DB_USERS);
  window.DB_USERS = DB_USERS;
  currentUserId = newUser.id; isLoggedIn = true;
  lsSet('hh_currentUser', currentUserId); lsSet('hh_loggedIn', 'true');
  showToast('Account created successfully!', 'success');
  setTimeout(() => { window.location.href = 'dashboard.html' }, 500);
}

function handleLogout() {
  isLoggedIn = false; currentUserId = null;
  lsSet('hh_loggedIn', 'false'); lsSet('hh_currentUser', '');
  showToast('You have been signed out', 'success');
  setTimeout(() => { window.location.href = 'index.html' }, 500);
}

// Firebase Google Auth — defined in login.html module script
// window.handleGoogleLogin is set by that module

// ============================================================
// RENDER HELPERS
// ============================================================
function feedCard(req) {
  const catClass = CATEGORY_BADGE[req.category] || 'badge-stone';
  const urgClass = URGENCY_BADGE[req.urgency] || 'badge-stone';
  const statClass = STATUS_BADGE[req.status] || 'badge-stone';
  const helperCount = (req.helpers || []).length;
  const replyCount = req.replyCount || 0;
  return `<div class="glass-hover feed-card">
    <div class="flex gap-2 flex-wrap">
      <span class="badge ${catClass}">${req.category}</span>
      <span class="badge ${urgClass}">${req.urgency}</span>
      <span class="badge ${statClass}">${STATUS_LABEL[req.status]}</span>
    </div>
    <h3>${req.title}</h3>
    <p class="feed-desc">${req.description}</p>
    <div class="flex gap-2 flex-wrap">${(req.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div class="feed-footer">
      <div>
        <p class="feed-author">${req.creatorName || 'Community Member'}</p>
        <p class="feed-meta">${req.location || ''} • ${helperCount} helper${helperCount !== 1 ? 's' : ''} • ${timeAgo(req.createdAt)}</p>
      </div>
      <button class="btn-secondary" style="font-size:13px;padding:7px 14px;" onclick="openRequestModal('${req.id}')">Open →</button>
    </div>
  </div>`;
}

function statCard(label, value, sub) { return `<div class="glass p-6"><p class="label mb-2">${label}</p><p class="stat-num">${value}</p><p style="font-size:13px;color:var(--text-400);margin-top:6px;">${sub}</p></div>` }

// ============================================================
// AI HELPERS
// ============================================================
function getAI() {
  const titleEl = document.getElementById('createTitle'); const descEl = document.getElementById('createDesc');
  if (!titleEl || !descEl) return { category: 'Community', urgency: 'Low', tagHint: 'Add more specific tags', rewrite: 'Start describing the challenge.' };
  const title = titleEl.value; const desc = descEl.value; const text = (title + ' ' + desc).toLowerCase();
  let category = 'Community', urgency = 'Low', tagHint = 'Add more specific tags';
  if (/html|css|javascript|react|web/.test(text)) category = 'Web Development';
  else if (/figma|design|ui/.test(text)) category = 'Design';
  else if (/interview|career|job|resume/.test(text)) category = 'Career';
  else if (/python|data|ml|machine/.test(text)) category = 'Data Science';
  if (/urgent|deadline|tomorrow|asap/.test(text)) urgency = 'High';
  else if (/help|need|review|stuck/.test(text)) urgency = 'Medium';
  if (text.length > 20) tagHint = 'Consider adding skill-specific tags';
  const rewrite = desc.length > 30 ? `Rewritten: "${title}" — ${desc.slice(0, 80)}...` : 'Start describing the challenge to generate a stronger version.';
  return { category, urgency, tagHint, rewrite };
}

function updateAI() {
  const title = document.getElementById('createTitle')?.value.trim();
  const btn = document.getElementById('publishBtn'); if (btn) btn.disabled = !title;
  const ai = getAI();
  const aiCat = document.getElementById('aiCat'); if (aiCat) aiCat.textContent = ai.category;
  const aiUrg = document.getElementById('aiUrg'); if (aiUrg) aiUrg.textContent = ai.urgency;
  const aiTagHint = document.getElementById('aiTagHint'); if (aiTagHint) aiTagHint.textContent = ai.tagHint;
  const aiRewrite = document.getElementById('aiRewrite'); if (aiRewrite) aiRewrite.textContent = ai.rewrite;
}

function applyAI() {
  const ai = getAI();
  const cat = document.getElementById('createCat'); if (cat) cat.value = ai.category;
  const urg = document.getElementById('createUrg'); if (urg) urg.value = ai.urgency;
  showToast('AI suggestions applied!', 'success');
}

async function handlePublish() {
  const title = document.getElementById('createTitle').value.trim(); if (!title) return;
  const user = getCurrentUser();
  const btn = document.getElementById('publishBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Publishing...'; }

  const newReq = {
    title,
    description: document.getElementById('createDesc').value,
    status: 'open',
    urgency: document.getElementById('createUrg').value.toLowerCase(),
    category: document.getElementById('createCat').value,
    tags: document.getElementById('createTags').value.split(',').map(t => t.trim()).filter(Boolean),
    createdBy: currentUserId,
    creatorName: user?.name || 'Community Member',
    helpers: [],
    location: user?.location || 'Pakistan',
    createdAt: new Date().toISOString()
  };

  const id = await fsAdd('requests', newReq);
  if (!id) { showToast('Failed to publish. Try again.', 'error'); if (btn) { btn.disabled = false; btn.textContent = 'Publish Request'; } return; }

  notifications.unshift({ id: 'n_' + Date.now(), type: 'request', title: 'Your new request is now live', timestamp: new Date().toISOString(), read: false });
  lsSetJSON('hh_notifications', notifications);
  showToast('Request published!', 'success');
  setTimeout(() => { window.location.href = 'explore.html' }, 500);
}

// ============================================================
// TIME UTILS
// ============================================================
function formatTime(ts) { return new Date(ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) }
function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime(); const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function typeLabel(t) { const labels = { status: 'Status', match: 'Match', request: 'Request', reputation: 'Reputation' }; return labels[t] || t }

// ============================================================
// NOTIFICATION FUNCTIONS
// ============================================================
function markRead(id) { notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n); lsSetJSON('hh_notifications', notifications); if (typeof renderPage === 'function') renderPage() }
function markAllRead() { notifications = notifications.map(n => ({ ...n, read: true })); lsSetJSON('hh_notifications', notifications); if (typeof renderPage === 'function') renderPage() }

// ============================================================
// PROFILE
// ============================================================
function saveProfile() {
  const user = getCurrentUser(); if (!user) return;
  user.name = document.getElementById('editName').value;
  user.location = document.getElementById('editLoc').value;
  user.skills = document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(Boolean);
  user.interests = document.getElementById('editInterests').value.split(',').map(s => s.trim()).filter(Boolean);
  lsSetJSON('hh_db_users', DB_USERS);
  showToast('Profile saved successfully!', 'success');
  if (typeof renderPage === 'function') renderPage();
  renderNavbar(currentPageName || 'profile');
}

// Global page name for navbar

// ============================================================
// HAMBURGER MOBILE MENU
// ============================================================
function renderMobileNav() {
  // Remove existing
  document.querySelector('.hamburger')?.remove();
  document.querySelector('.mobile-nav-overlay')?.remove();
  document.querySelector('.mobile-nav-drawer')?.remove();

  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const navInner = navbar.querySelector('.nav-inner');

  // Hamburger button
  const btn = document.createElement('button');
  btn.className = 'hamburger';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  navInner.appendChild(btn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  document.body.appendChild(overlay);

  // Drawer
  const drawer = document.createElement('div');
  drawer.className = 'mobile-nav-drawer';
  document.body.appendChild(drawer);

  // Build nav links
  const publicLinks = [
    { l: 'Home', p: 'index' },
    { l: 'Explore', p: 'explore' },
    { l: 'Leaderboard', p: 'leaderboard' }
  ];
  const authLinks = [
    { l: '🏠 Dashboard', p: 'dashboard' },
    { l: '🔍 Explore', p: 'explore' },
    { l: '✏️ Create Request', p: 'create' },
    { l: '🏆 Leaderboard', p: 'leaderboard' },
    { l: '🔔 Notifications', p: 'notification' },
    { l: '🤖 AI Center', p: 'ai-center' },
    { l: '👤 Profile', p: 'profile' }
  ];
  const links = isLoggedIn ? authLinks : publicLinks;
  const active = window.currentPageName || '';

  let html = links.map(({ l, p }) =>
    `<a class="mobile-nav-link${active === p ? ' active' : ''}" href="${p}.html">${l}</a>`
  ).join('');

  html += '<div class="mobile-nav-divider"></div>';

  if (!isLoggedIn) {
    html += `<a class="mobile-nav-btn primary" href="login.html">Join the Platform</a>`;
  } else {
    const user = getCurrentUser();
    html += `<div style="padding:12px 16px;font-size:14px;font-weight:700;color:var(--text-700);">Hi, ${user?.name?.split(' ')[0] || 'User'} 👋</div>`;
    html += `<button class="mobile-nav-btn secondary" onclick="handleLogout();closeMobileNav();">Sign Out</button>`;
  }

  drawer.innerHTML = html;

  // Toggle
  function openMobileNav() {
    btn.classList.add('open');
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  window.closeMobileNav = function() {
    btn.classList.remove('open');
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
  overlay.addEventListener('click', closeMobileNav);
}

// ============================================================
// USER PROFILE MODAL (click on any username to open)
// ============================================================
function ensureProfileModal() {
  if (document.getElementById('userProfileModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'userProfileModal';
  overlay.className = 'profile-modal-overlay';
  overlay.innerHTML = `
    <div class="profile-modal-box">
      <button class="profile-modal-close" onclick="closeProfileModal()">×</button>
      <div id="profileModalBody"></div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeProfileModal(); });
  document.body.appendChild(overlay);
}

function closeProfileModal() {
  const m = document.getElementById('userProfileModal');
  if (m) m.classList.remove('active');
}

function openUserProfile(userId) {
  ensureProfileModal();
  const user = getUserById(userId);
  if (!user) {
    showToast('Profile not found', 'error');
    return;
  }
  const BG_COLORS_P = ['#2a9d8f','#e76f51','#f4a261','#3b82f6','#8b5cf6','#ec4899'];
  const idx = DB_USERS.findIndex(u => u.id === userId);
  const bg = BG_COLORS_P[idx >= 0 ? idx % BG_COLORS_P.length : 0];
  const badges = (user.badges || []);
  const skills = (user.skills || []);
  const interests = (user.interests || []);
  const isMe = userId === currentUserId;

  const roleLabel = {
    'need-help': 'Help Seeker',
    'can-help': 'Helper / Mentor',
    'both': 'Helper & Seeker'
  }[user.role] || user.role || 'Community Member';

  const joinedFormatted = user.joinedDate
    ? new Date(user.joinedDate).toLocaleDateString('en-PK', { year:'numeric', month:'short' })
    : 'Unknown';

  document.getElementById('profileModalBody').innerHTML = `
    <div class="profile-modal-header">
      <div class="profile-modal-avatar" style="background:${bg};">${getInitials(user.name)}</div>
      <div>
        <div class="profile-modal-name">${user.name}${isMe ? ' <span style="font-size:12px;color:var(--teal-700);">(you)</span>' : ''}</div>
        <div class="profile-modal-role">${roleLabel} • ${user.location || 'Pakistan'}</div>
        <div style="font-size:12px;color:var(--text-400);margin-top:2px;">Member since ${joinedFormatted}</div>
      </div>
    </div>

    <div class="profile-modal-stat-row">
      <div class="profile-modal-stat">
        <div class="profile-modal-stat-num">${user.trustScore || 10}%</div>
        <div class="profile-modal-stat-label">Trust</div>
      </div>
      <div class="profile-modal-stat">
        <div class="profile-modal-stat-num">${user.contributions || 0}</div>
        <div class="profile-modal-stat-label">Contribs</div>
      </div>
      <div class="profile-modal-stat">
        <div class="profile-modal-stat-num">${badges.length}</div>
        <div class="profile-modal-stat-label">Badges</div>
      </div>
    </div>

    ${skills.length ? `
    <div style="margin-bottom:1rem;">
      <p class="profile-modal-section-title">Skills</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}
      </div>
    </div>` : ''}

    ${interests.length ? `
    <div style="margin-bottom:1rem;">
      <p class="profile-modal-section-title">Interests</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${interests.map(i => `<span class="tag">${i}</span>`).join('')}
      </div>
    </div>` : ''}

    ${badges.length ? `
    <div style="margin-bottom:1rem;">
      <p class="profile-modal-section-title">Badges</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${badges.map(b => `<span class="badge ${BADGE_COLORS[b]||'badge-stone'}">${b}</span>`).join('')}
      </div>
    </div>` : ''}

    ${isMe ? `
    <a href="profile.html" class="btn-primary" style="display:block;text-align:center;margin-top:0.5rem;">Edit My Profile</a>
    ` : `
    <a href="messages.html" class="btn-primary" style="display:block;text-align:center;margin-top:0.5rem;">💬 Send Message</a>
    `}
  `;

  document.getElementById('userProfileModal').classList.add('active');
}

// ============================================================
// OVERRIDE renderNavbar to also call renderMobileNav
// ============================================================
const _origRenderNavbar = renderNavbar;
window.renderNavbar = function(activePage) {
  _origRenderNavbar(activePage);
  renderMobileNav();
};

// ============================================================
// OVERRIDE feedCard to make author name clickable
// ============================================================
const _origFeedCard = feedCard;
window.feedCard = function(req) {
  const catClass = CATEGORY_BADGE[req.category] || 'badge-stone';
  const urgClass = URGENCY_BADGE[req.urgency] || 'badge-stone';
  const statClass = STATUS_BADGE[req.status] || 'badge-stone';
  const helperCount = (req.helpers || []).length;
  const replyCount = req.replyCount || 0;
  const creatorId = req.createdBy || '';
  return `<div class="glass-hover feed-card">
    <div class="flex gap-2 flex-wrap">
      <span class="badge ${catClass}">${req.category}</span>
      <span class="badge ${urgClass}">${req.urgency}</span>
      <span class="badge ${statClass}">${STATUS_LABEL[req.status]}</span>
    </div>
    <h3>${req.title}</h3>
    <p class="feed-desc">${req.description}</p>
    <div class="flex gap-2 flex-wrap">${(req.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div class="feed-footer">
      <div>
        <p class="feed-author user-clickable" onclick="event.stopPropagation();openUserProfile('${creatorId}')" style="color:var(--teal-700);">${req.creatorName || 'Community Member'}</p>
        <p class="feed-meta">${req.location || ''} • ${helperCount} helper${helperCount !== 1 ? 's' : ''} • ${timeAgo(req.createdAt)}</p>
      </div>
      <button class="btn-secondary" style="font-size:13px;padding:7px 14px;" onclick="openRequestModal('${req.id}')">Open →</button>
    </div>
  </div>`;
};

// Make creator name in modal clickable too
const _origRenderModalContent = renderModalContent;
window.renderModalContent = function(req) {
  _origRenderModalContent(req);
  // Patch "POSTED BY" section to make name clickable
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;
  const nameEls = modalBody.querySelectorAll('[data-creator-id]');
  // Already handled if data attr present; otherwise find by structure
  const creator = getUserById(req.createdBy) || { name: req.creatorName || 'Unknown', id: req.createdBy };
  // Find the name p in POSTED BY section and make it clickable
  const allPs = modalBody.querySelectorAll('p');
  allPs.forEach(p => {
    if (p.textContent === creator.name && !p.dataset.patched) {
      p.dataset.patched = '1';
      p.classList.add('user-clickable');
      p.style.color = 'var(--teal-700)';
      p.style.cursor = 'pointer';
      p.onclick = () => openUserProfile(req.createdBy);
    }
  });
};


function clearReplyImage() {
  const input = document.getElementById('replyImage');
  const preview = document.getElementById('replyImagePreview');
  const uploadArea = document.getElementById('codeUploadArea');
  if (input) input.value = '';
  if (preview) preview.innerHTML = '';
  if (uploadArea) {
    uploadArea.classList.remove('has-file');
    uploadArea.innerHTML = `<div class="upload-icon">📸</div><div class="upload-text">Attach Code Screenshot</div><div class="upload-hint">Click to upload or drag an image of your error/code</div>`;
  }
}

// Drag and drop support for code screenshot upload
document.addEventListener('dragover', e => {
  const area = document.getElementById('codeUploadArea');
  if (area) { e.preventDefault(); area.style.borderColor = 'var(--teal-500)'; }
});
document.addEventListener('drop', e => {
  const area = document.getElementById('codeUploadArea');
  const input = document.getElementById('replyImage');
  if (!area || !input) return;
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    previewReplyImage(input);
  }
});


// ============================================================
// MESSAGES
// ============================================================
function renderMsgStream() {
  const container = document.getElementById('msgStream');
  if (!container) return;
  const msgs = lsJSON('hh_messages') || [];
  const myMsgs = msgs.filter(m => m.toId === currentUserId || m.fromId === currentUserId);
  if (!myMsgs.length) {
    container.innerHTML = `<div class="empty-state"><h3>No messages yet</h3><p>Send a message to a community member to start a conversation.</p></div>`;
    return;
  }
  container.innerHTML = myMsgs.map(m => {
    const isMe = m.fromId === currentUserId;
    const otherUser = getUserById(isMe ? m.toId : m.fromId) || { name: isMe ? 'You → ' + (m.toName||'?') : (m.fromName||'Unknown') };
    return `<div class="msg-card">
      <div class="msg-header">
        <span class="msg-name">${isMe ? 'You → ' + (m.toName||'?') : (m.fromName||'Unknown')}</span>
        <span class="msg-time">${timeAgo(m.timestamp)}</span>
      </div>
      <p class="msg-text">${m.body}</p>
    </div>`;
  }).join('');
}

function toggleSendBtn() {
  const btn = document.getElementById('sendBtn');
  const body = document.getElementById('msgBody');
  if (btn && body) btn.disabled = !body.value.trim();
}

function sendMessage() {
  const toId = document.getElementById('msgTo')?.value;
  const body = document.getElementById('msgBody')?.value.trim();
  if (!toId || !body) return;
  const user = getCurrentUser();
  const toUser = getUserById(toId);
  const msgs = lsJSON('hh_messages') || [];
  msgs.unshift({
    id: 'm_' + Date.now(),
    fromId: currentUserId,
    fromName: user?.name || 'You',
    toId,
    toName: toUser?.name || '?',
    body,
    timestamp: new Date().toISOString()
  });
  lsSetJSON('hh_messages', msgs);
  document.getElementById('msgBody').value = '';
  toggleSendBtn();
  notifications.unshift({ id: 'n_' + Date.now(), type: 'match', title: `Message sent to ${toUser?.name||'?'}`, timestamp: new Date().toISOString(), read: false });
  lsSetJSON('hh_notifications', notifications);
  showToast('Message sent!', 'success');
  renderMsgStream();
}

