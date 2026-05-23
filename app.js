// 

// ============================================================
// DATA STRUCTURES
// ============================================================
const BASE_USERS = [
    { id: 'u1', name: 'Ayesha Khan', email: 'ayesha@helphub.ai', password: 'Password1', role: 'both', skills: ['Figma', 'UI/UX', 'HTML/CSS'], interests: ['Hackathons'], location: 'Karachi', trustScore: 100, contributions: 35, badges: ['Design Ally', 'Fast Responder'], joinedDate: '2025-09-01' },
    { id: 'u2', name: 'Hassan Ali', email: 'hassan@helphub.ai', password: 'Password1', role: 'can-help', skills: ['JavaScript', 'React', 'Git', 'GitHub'], interests: ['Web Dev'], location: 'Karachi', trustScore: 88, contributions: 24, badges: ['Code Rescuer', 'Bug Hunter'], joinedDate: '2025-10-01' },
    { id: 'u3', name: 'Sara Noor', email: 'sara@helphub.ai', password: 'Password1', role: 'need-help', skills: ['Python', 'Data Analysis'], interests: ['ML'], location: 'Lahore', trustScore: 74, contributions: 11, badges: ['Community Voice'], joinedDate: '2025-11-01' },
];

const BASE_REQUESTS = [
    { id: 'r1', title: 'Need help making my portfolio responsive before demo day', description: 'My HTML/CSS portfolio breaks on tablets and I need layout guidance before tomorrow evening. The navigation collapses weirdly and images overflow their containers on medium screens.', status: 'open', urgency: 'high', category: 'Web Development', tags: ['HTML/CSS', 'Responsive'], createdBy: 'u3', helpers: ['u1'], location: 'Lahore', createdAt: '2026-04-17T10:00:00Z' },
    { id: 'r2', title: 'Looking for Figma feedback on event poster', description: 'I have a draft poster for a campus community event and want sharper hierarchy, spacing, and CTA copy. The visual weight feels off and I need a second pair of eyes.', status: 'open', urgency: 'medium', category: 'Design', tags: ['Figma', 'Poster'], createdBy: 'u1', helpers: [], location: 'Karachi', createdAt: '2026-04-16T14:00:00Z' },
    { id: 'r3', title: 'Need mock interview support for internship applications', description: 'I am applying for frontend internships and need someone to run through common interview questions with me. Feeling unprepared for technical rounds and behavioral segments.', status: 'open', urgency: 'medium', category: 'Career', tags: ['Interview Prep', 'Career', 'Frontend'], createdBy: 'u3', helpers: ['u1', 'u2'], location: 'Lahore', createdAt: '2026-04-15T09:00:00Z' },
    { id: 'r4', title: 'Python data visualization project needs code review', description: 'My matplotlib charts are rendering but look unprofessional. Need help with styling, color palettes, and making the charts publication-ready for my final project.', status: 'open', urgency: 'low', category: 'Data Science', tags: ['Python', 'Matplotlib'], createdBy: 'u2', helpers: [], location: 'Karachi', createdAt: '2026-04-14T12:00:00Z' },
];

const BASE_MESSAGES = [
    { id: 'cm1', fromUserId: 'u1', toUserId: 'u3', content: 'I checked your portfolio request. Share the breakpoint screenshots.', timestamp: '2026-04-18T09:45:00Z' },
];

const BASE_NOTIFS = [
    { id: 'n1', type: 'status', title: '"Need help" was marked as solved', timestamp: '2026-04-18T14:00:00Z', read: false },
    { id: 'n2', type: 'match', title: 'Ayesha Khan offered help on "Need help"', timestamp: '2026-04-18T13:30:00Z', read: false },
    { id: 'n3', type: 'request', title: 'Your new request is now live', timestamp: '2026-04-17T10:05:00Z', read: false },
    { id: 'n4', type: 'reputation', title: 'Your trust score increased to 100%', timestamp: '2026-04-16T20:00:00Z', read: true },
];

const CATEGORIES = ['All', 'Web Development', 'Design', 'Career', 'Data Science', 'Mobile Development', 'DevOps', 'Community'];
const CATEGORY_BADGE = { 'Web Development': 'badge-teal', 'Design': 'badge-violet', 'Career': 'badge-teal', 'Data Science': 'badge-blue', 'Mobile Development': 'badge-amber', 'DevOps': 'badge-slate', 'Community': 'badge-stone' };
const URGENCY_BADGE = { 'low': 'badge-blue', 'medium': 'badge-amber', 'high': 'badge-red' };
const STATUS_BADGE = { 'open': 'badge-stone', 'in-progress': 'badge-amber', 'solved': 'badge-green' };
const STATUS_LABEL = { 'open': 'Open', 'in-progress': 'In Progress', 'solved': 'Solved' };
const AVATAR_COLORS = ['av-teal', 'av-orange', 'av-pink', 'av-blue', 'av-violet'];
const BADGE_COLORS = { 'Design Ally': 'badge-teal', 'Fast Responder': 'badge-amber', 'Top Mentor': 'badge-blue', 'Code Rescuer': 'badge-green', 'Bug Hunter': 'badge-red', 'Community Voice': 'badge-amber', 'Backend Pro': 'badge-violet', 'Frontend Master': 'badge-teal', 'Mentor Star': 'badge-amber' };

// ============================================================
// LOCAL STORAGE
// ============================================================
function ls(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, v) } catch (e) { } }
function lsJSON(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch (e) { return null } }
function lsSetJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }

let DB_USERS = lsJSON('hh_db_users') || [...BASE_USERS]; lsSetJSON('hh_db_users', DB_USERS);
window.DB_USERS = DB_USERS; // exposed for Firebase module in login.html
let DB_REQUESTS = lsJSON('hh_db_requests') || [...BASE_REQUESTS]; lsSetJSON('hh_db_requests', DB_REQUESTS);
let messages = lsJSON('hh_messages') || [...BASE_MESSAGES]; lsSetJSON('hh_messages', messages);
let notifications = lsJSON('hh_notifications') || [...BASE_NOTIFS]; lsSetJSON('hh_notifications', notifications);

let currentUserId = ls('hh_currentUser') || null;
let isLoggedIn = ls('hh_loggedIn') === 'true';

// ============================================================
// DATA HELPERS
// ============================================================
function getAllRequests() { return DB_REQUESTS }
function getCurrentUser() { return DB_USERS.find(u => u.id === currentUserId) || null }
function getUserById(id) { return DB_USERS.find(u => u.id === id) }
function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

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
// MODAL
// ============================================================
function ensureModal() {
    if (document.getElementById('requestModal')) return;
    const overlay = document.createElement('div'); overlay.id = 'requestModal'; overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-content"><button class="modal-close" onclick="closeModal()">×</button><div id="modalBody"></div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === this) closeModal() });
    document.body.appendChild(overlay);
}

function openRequestModal(reqId) {
    if (!isLoggedIn) { window.location.href = 'login.html'; return }
    ensureModal();
    const req = DB_REQUESTS.find(r => r.id === reqId); if (!req) return;
    const creator = getUserById(req.createdBy);
    const isCreator = req.createdBy === currentUserId;
    const isHelper = req.helpers.includes(currentUserId);
    const catClass = CATEGORY_BADGE[req.category] || 'badge-stone';
    const urgClass = URGENCY_BADGE[req.urgency] || 'badge-stone';
    const statClass = STATUS_BADGE[req.status] || 'badge-stone';

    let aiSummaryText = req.description.split('.')[0] + '.';
    if (req.tags.length > 0) aiSummaryText = req.tags.slice(0, 2).join(', ').toLowerCase() + ' — entry-level ' + req.category.toLowerCase() + ' support.';

    let helpersHtml = '';
    if (req.helpers.length > 0) {
        helpersHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;">
      <p style="font-size:14px;font-weight:800;color:var(--text-900);margin-bottom:1rem;">HELPERS</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${req.helpers.map(hId => {
            const h = getUserById(hId); if (!h) return ''; return `<div class="helper-card">
          <div class="avatar ${AVATAR_COLORS[DB_USERS.indexOf(h) % AVATAR_COLORS.length]}">${getInitials(h.name)}</div>
          <div class="helper-info">
            <p class="helper-name">${h.name}</p>
            <p class="helper-trust">Trust ${h.trustScore}%</p>
            <p class="helper-skills">${h.skills.join(', ')}</p>
          </div>
        </div>`}).join('')}
      </div>
    </div>`;
    }

    let actionHtml = '';
    if (isCreator) {
        actionHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn-primary" onclick="markSolved('${req.id}')">Mark as solved</button>
      <p style="font-size:13px;color:var(--text-500);align-self:center;">${req.helpers.length} people offered help.</p>
    </div>`;
    } else if (isHelper) {
        actionHtml = `<div class="insight-blue" style="padding:1rem;border-radius:12px;margin-top:1.5rem;">
      <p style="font-size:14px;font-weight:700;color:var(--text-700);">You already offered help</p>
      <p style="font-size:13px;color:var(--text-500);margin-top:4px;">Thank you for your contribution!</p>
    </div>`;
    } else {
        actionHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;display:flex;gap:12px;flex-wrap:wrap;">
      <button class="btn-primary" onclick="submitHelp('${req.id}')">I can help</button>
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>`;
    }

    let requesterHtml = `<div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid #e7e5e4;">
    <p style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-400);margin-bottom:8px;">REQUESTER</p>
    <div class="flex items-center gap-3">
      <div class="avatar ${AVATAR_COLORS[DB_USERS.indexOf(creator) % AVATAR_COLORS.length]}">${getInitials(creator?.name || '?')}</div>
      <div><p style="font-size:14px;font-weight:700;color:var(--text-700);">${creator?.name || 'Unknown'}</p>
      <p style="font-size:12px;color:var(--text-400);">${req.location} • ${timeAgo(req.createdAt)}</p></div>
    </div>
  </div>`;

    document.getElementById('modalBody').innerHTML = `
    <div class="flex gap-2 flex-wrap mb-4">
      <span class="badge ${catClass}">${req.category}</span>
      <span class="badge ${urgClass}">${req.urgency}</span>
      <span class="badge ${statClass}">${STATUS_LABEL[req.status]}</span>
    </div>
    <h2 style="font-size:22px;font-weight:900;line-height:1.3;margin-bottom:1rem;">${req.title}</h2>
    <div class="ai-summary-box">
      <p class="ai-summary-label">AI Summary</p>
      <p class="ai-summary-text">${aiSummaryText}</p>
    </div>
    <p style="font-size:15px;color:var(--text-500);line-height:1.7;margin-bottom:1.25rem;">${req.description}</p>
    <div class="flex gap-2 flex-wrap">${req.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    ${helpersHtml}${requesterHtml}${actionHtml}`;

    document.getElementById('requestModal').classList.add('active');
}

function closeModal() { const m = document.getElementById('requestModal'); if (m) m.classList.remove('active') }

function submitHelp(reqId) {
    const reqIndex = DB_REQUESTS.findIndex(r => r.id === reqId); if (reqIndex === -1) return;
    if (!DB_REQUESTS[reqIndex].helpers.includes(currentUserId)) { DB_REQUESTS[reqIndex].helpers.push(currentUserId) }
    lsSetJSON('hh_db_requests', DB_REQUESTS);
    const req = DB_REQUESTS[reqIndex]; const helperName = getCurrentUser().name;
    messages.push({ id: 'cm_' + Date.now(), fromUserId: currentUserId, toUserId: req.createdBy, content: `I can help with "${req.title}". Let me know how you'd like to proceed.`, timestamp: new Date().toISOString() });
    lsSetJSON('hh_messages', messages);
    notifications.unshift({ id: 'n_' + Date.now(), type: 'match', title: `${helperName} offered help on "${req.title}"`, timestamp: new Date().toISOString(), read: false });
    lsSetJSON('hh_notifications', notifications);
    const helperUser = getCurrentUser(); helperUser.contributions += 1; lsSetJSON('hh_db_users', DB_USERS);
    showToast('Help offered successfully!', 'success'); closeModal();
    if (typeof renderPage === 'function') renderPage();
}

function markSolved(reqId) {
    const reqIndex = DB_REQUESTS.findIndex(r => r.id === reqId); if (reqIndex === -1) return;
    DB_REQUESTS[reqIndex].status = 'solved'; lsSetJSON('hh_db_requests', DB_REQUESTS);
    notifications.unshift({ id: 'n_' + Date.now(), type: 'status', title: `"${DB_REQUESTS[reqIndex].title}" was marked as solved`, timestamp: new Date().toISOString(), read: false });
    lsSetJSON('hh_notifications', notifications);
    showToast('Request marked as solved!', 'success'); closeModal();
    if (typeof renderPage === 'function') renderPage();
}

// ============================================================
// NAVBAR
// ============================================================
function renderNavbar(activePage) {
    const publicLinks = [{ l: 'Home', p: 'index' }, { l: 'Explore', p: 'explore' }, { l: 'Leaderboard', p: 'leaderboard' }];
    const authLinks = [{ l: 'Dashboard', p: 'dashboard' }, { l: 'Explore', p: 'explore' }, { l: 'Create Request', p: 'create' }, { l: 'Messages', p: 'messages' }, { l: 'Leaderboard', p: 'leaderboard' }, { l: 'Notification', p: 'notification' }, { l: 'Profile', p: 'profile' }];
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
// AUTH — Tab-based Login/Signup (from script.mjs)
// ============================================================

// Login aur Signup ke tabs switch karne ke liye
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');

    if (loginForm) loginForm.classList.toggle('active', tab === 'login');
    if (signupForm) signupForm.classList.toggle('active', tab === 'signup');
    if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
    if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');
    clearErrors();
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

// Login handle karne ka function — sirf login karta hai, signup nahi
function handleLogin() {
    clearErrors();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    let valid = true;

    // Email check
    if (!email) {
        document.getElementById('loginEmailError').textContent = 'Email is required';
        valid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('loginEmailError').textContent = 'Please enter a valid email';
        valid = false;
    }

    // Password check
    if (!pass) {
        document.getElementById('loginPassError').textContent = 'Password is required';
        valid = false;
    }

    if (!valid) return;

    // Database mein check karein
    const user = DB_USERS.find(u => u.email === email && u.password === pass);
    if (!user) {
        showToast('Invalid email or password', 'error');
        document.getElementById('loginPassError').textContent = 'Email or password is incorrect';
        return;
    }

    // Login successful
    currentUserId = user.id;
    isLoggedIn = true;
    lsSet('hh_currentUser', currentUserId);
    lsSet('hh_loggedIn', 'true');
    showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
    setTimeout(() => { window.location.href = 'dashboard.html' }, 500);
}

// Signup handle karne ka function — alag se chalta hai
function handleSignup() {
    clearErrors();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPassword').value;
    const confirmPass = document.getElementById('signupConfirmPassword').value;
    const role = document.getElementById('signupRole').value;
    let valid = true;

    // Name check
    if (!name) { document.getElementById('signupNameError').textContent = 'Name is required'; valid = false; }

    // Email check
    if (!email) {
        document.getElementById('signupEmailError').textContent = 'Email is required'; valid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('signupEmailError').textContent = 'Please enter a valid email format'; valid = false;
    } else if (DB_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        document.getElementById('signupEmailError').textContent = 'This email is already registered'; valid = false;
    }

    // Password check (8 chars, 1 upper, 1 lower, 1 number)
    let passError = '';
    if (!pass) { passError = 'Password is required'; }
    else if (pass.length < 8) { passError = 'Must be at least 8 characters long'; }
    else if (!/[A-Z]/.test(pass)) { passError = 'Must contain at least 1 uppercase letter (A-Z)'; }
    else if (!/[a-z]/.test(pass)) { passError = 'Must contain at least 1 lowercase letter (a-z)'; }
    else if (!/[0-9]/.test(pass)) { passError = 'Must contain at least 1 number (0-9)'; }

    if (passError) { document.getElementById('signupPassError').textContent = passError; valid = false; }

    // Confirm Password check
    if (!confirmPass) {
        document.getElementById('signupConfirmError').textContent = 'Please confirm your password'; valid = false;
    } else if (pass !== confirmPass) {
        document.getElementById('signupConfirmError').textContent = 'Passwords do not match'; valid = false;
    }

    if (!valid) return;

    // Naya user banayein aur database mein save karein
    const newUser = {
        id: 'u_' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: pass,
        role,
        skills: [],
        interests: [],
        location: 'Remote',
        trustScore: 10,
        contributions: 0,
        badges: ['Community Voice'],
        joinedDate: new Date().toISOString()
    };

    DB_USERS.push(newUser);
    lsSetJSON('hh_db_users', DB_USERS);

    // Auto login kar dein signup ke baad
    currentUserId = newUser.id;
    isLoggedIn = true;
    lsSet('hh_currentUser', currentUserId);
    lsSet('hh_loggedIn', 'true');

    showToast('Account created successfully!', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html' }, 500);
}

function handleLogout() { 
  isLoggedIn = false; 
  currentUserId = null; 
  lsSet('hh_loggedIn', 'false'); 
  lsSet('hh_currentUser', ''); 
  showToast('You have been signed out', 'success'); 
  setTimeout(() => { window.location.href = 'index.html' }, 500); 
}

// ============================================================
// FIREBASE GOOGLE AUTH
// Fully handled in login.html <script type="module">.
// window.handleGoogleLogin is set by that module AFTER app.js loads.
// DO NOT redefine it here — the module script sets it on window.
// ============================================================
// (no stub — module script owns this function)

// ============================================================
// RENDER HELPERS
// ============================================================
function feedCard(req) {
    const catClass = CATEGORY_BADGE[req.category] || 'badge-stone';
    const urgClass = URGENCY_BADGE[req.urgency] || 'badge-stone';
    const statClass = STATUS_BADGE[req.status] || 'badge-stone';
    const creator = getUserById(req.createdBy);
    let tagsHtml = ''; if (req.tags.length > 0) tagsHtml = `<div class="feed-tags">${req.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
    return `<div class="glass-hover feed-card">
    <div class="flex gap-2 flex-wrap">
      <span class="badge ${catClass}">${req.category}</span>
      <span class="badge ${urgClass}">${req.urgency}</span>
      <span class="badge ${statClass}">${STATUS_LABEL[req.status]}</span>
    </div>
    <h3>${req.title}</h3>
    <p class="feed-desc">${req.description}</p>
    ${tagsHtml}
    <div class="feed-footer">
      <div><p class="feed-author">${creator?.name || 'Unknown'}</p>
      <p class="feed-meta">${req.location} • ${req.helpers.length} helper${req.helpers.length !== 1 ? 's' : ''}</p></div>
      <button class="btn-secondary" style="font-size:13px;padding:7px 14px;" onclick="openRequestModal('${req.id}')">Open details</button>
    </div>
  </div>`;
}

function statCard(label, value, sub) { return `<div class="glass p-6"><p class="label mb-2">${label}</p><p class="stat-num">${value}</p><p style="font-size:13px;color:var(--text-400);margin-top:6px;">${sub}</p></div>` }

// ============================================================
// AI HELPERS
// ============================================================
function getAI() {
    const titleEl = document.getElementById('createTitle'); const descEl = document.getElementById('createDesc');
    if (!titleEl || !descEl) return { category: 'Community', urgency: 'Low', tagHint: 'Add more specific tags', rewrite: 'Start describing the challenge to generate a stronger version.' };
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

function handlePublish() {
    const title = document.getElementById('createTitle').value.trim(); if (!title) return;
    const newReq = {
        id: 'r_' + Date.now(), title,
        description: document.getElementById('createDesc').value,
        status: 'open', urgency: document.getElementById('createUrg').value.toLowerCase(),
        category: document.getElementById('createCat').value,
        tags: document.getElementById('createTags').value.split(',').map(t => t.trim()).filter(Boolean),
        createdBy: currentUserId, helpers: [],
        location: getCurrentUser()?.location || 'Remote',
        createdAt: new Date().toISOString()
    };
    DB_REQUESTS.unshift(newReq); lsSetJSON('hh_db_requests', DB_REQUESTS);
    notifications.unshift({ id: 'n_' + Date.now(), type: 'request', title: 'Your new request is now live', timestamp: new Date().toISOString(), read: false });
    lsSetJSON('hh_notifications', notifications);
    showToast('Request published successfully!', 'success');
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
// MESSAGE FUNCTIONS
// ============================================================
function renderMsgStream() {
    const msgs = messages.filter(m => m.fromUserId === currentUserId || m.toUserId === currentUserId);
    const container = document.getElementById('msgStream');
    if (!container) return;
    if (!msgs.length) { container.innerHTML = '<p style="font-size:14px;color:var(--text-400);padding:2rem 0;text-align:center;">No messages yet.</p>'; return }
    container.innerHTML = msgs.slice().reverse().map(m => {
        const sender = getUserById(m.fromUserId); const receiver = getUserById(m.toUserId);
        return `<div class="msg-card"><div class="msg-header">
      <p class="msg-name">${sender?.name || 'Unknown'} → ${receiver?.name || 'Unknown'}</p>
      <span class="msg-time">${formatTime(m.timestamp)}</span>
    </div><p class="msg-text">${m.content}</p></div>`;
    }).join('');
}

function toggleSendBtn() { const btn = document.getElementById('sendBtn'); const body = document.getElementById('msgBody'); if (btn && body) btn.disabled = !body.value.trim() }

function sendMessage() {
    const body = document.getElementById('msgBody')?.value.trim(); if (!body) return;
    const toUser = document.getElementById('msgTo')?.value; if (!toUser) return;
    messages.push({ id: 'cm_' + Date.now(), fromUserId: currentUserId, toUserId: toUser, content: body, timestamp: new Date().toISOString() });
    lsSetJSON('hh_messages', messages);
    const bodyEl = document.getElementById('msgBody'); if (bodyEl) bodyEl.value = '';
    const btn = document.getElementById('sendBtn'); if (btn) btn.disabled = true;
    renderMsgStream();
}

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
let currentPageName = 'index';