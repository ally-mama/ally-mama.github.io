/* ──────────────────────────────────────────────────────────────
   Mama Hub — shared foundation
   Loaded by every page. Provides:
     • one sign-in session, shared across pages, 4h idle logout
     • a universal in-app Back button
     • an "unsaved changes" guard for forms
     • a small Store helper that later features build on
     • Google sign-in (OAuth) — one sign-in, shared across every page
   No build step. Works on file://, a local server, or hosting.
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var IDLE_MS = 4 * 60 * 60 * 1000;          // 4 hours of inactivity
  var SESSION_KEY = 'mama-session';
  var HISTORY_KEY = 'mama-nav-history';

  var MEMBER_PAGES = ['my-time.html', 'my-todos.html'];
  var ADMIN_PAGES  = ['settings.html', 'time-tracker.html'];

  // ── page identity (works on http(s), file://, and the preview shell) ──
  function currentFile() {
    if (window.__MAMA_PAGE__) return window.__MAMA_PAGE__;
    var p = (location.pathname || '').split('/').pop();
    return (p && p.indexOf('.html') > -1) ? p : 'index.html';
  }

  // ── tiny localStorage wrapper ──
  function lget(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function lset(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  // ── session ──
  function readSession() {
    return lget(SESSION_KEY, { member: null, memberAt: 0, admin: false, adminAt: 0 });
  }
  function writeSession(s) { lset(SESSION_KEY, s); }

  var Session = {
    member: function () {
      var s = readSession();
      return this.memberValid() ? s.member : null;
    },
    memberValid: function () {
      var s = readSession();
      return !!s.member && (Date.now() - s.memberAt) < IDLE_MS;
    },
    adminValid: function () {
      var s = readSession();
      return !!s.admin && (Date.now() - s.adminAt) < IDLE_MS;
    },
    setMember: function (id) {
      var s = readSession();
      s.member = id; s.memberAt = Date.now();
      writeSession(s);
    },
    setAdmin: function () {
      var s = readSession();
      s.admin = true; s.adminAt = Date.now();
      writeSession(s);
    },
    clearMember: function () {
      var s = readSession();
      s.member = null; s.memberAt = 0;
      writeSession(s);
    },
    clearAdmin: function () {
      var s = readSession();
      s.admin = false; s.adminAt = 0;
      writeSession(s);
    },
    // refresh the timestamps of whatever is currently signed in
    touch: function () {
      var s = readSession();
      var changed = false;
      if (s.member && (Date.now() - s.memberAt) < IDLE_MS) { s.memberAt = Date.now(); changed = true; }
      if (s.admin  && (Date.now() - s.adminAt)  < IDLE_MS) { s.adminAt  = Date.now(); changed = true; }
      if (changed) writeSession(s);
    }
  };

  // keep the session alive while the person is active, expire it when they aren't
  function wireActivity() {
    var last = 0;
    function ping() {
      var now = Date.now();
      if (now - last > 30000) { last = now; Session.touch(); }
    }
    ['click', 'keydown', 'mousemove', 'touchstart', 'visibilitychange'].forEach(function (ev) {
      document.addEventListener(ev, ping, { passive: true });
    });
    // every minute, check whether the scope this page needs has gone stale
    setInterval(function () {
      var page = currentFile();
      if (MEMBER_PAGES.indexOf(page) > -1 && !Session.memberValid()) location.reload();
      if (ADMIN_PAGES.indexOf(page)  > -1 && !Session.adminValid())  location.reload();
    }, 60000);
  }

  // ── in-app history + Back button ──
  function pushHistory() {
    var hist = sessionStorageGet(HISTORY_KEY, []);
    var here = currentFile();
    if (hist.length === 0 || hist[hist.length - 1] !== here) hist.push(here);
    sessionStorageSet(HISTORY_KEY, hist);
    return hist;
  }
  function sessionStorageGet(k, fb) {
    try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; }
  }
  function sessionStorageSet(k, v) {
    try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  function goBack() {
    var hist = sessionStorageGet(HISTORY_KEY, []);
    if (hist.length > 1) {
      hist.pop();                                   // drop current page
      var target = hist[hist.length - 1];
      sessionStorageSet(HISTORY_KEY, hist);
      navigateTo(target);
    } else {
      navigateTo('index.html');
    }
  }

  // navigation that respects the unsaved-changes guard
  function navigateTo(file) {
    if (!Guard.confirmLeave()) return;
    if (window.__MAMA_NAV__) { window.__MAMA_NAV__(file); return; } // preview shell hook
    location.href = file;
  }

  function mountBack() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var logo = bar.querySelector('.logo');
    var here = currentFile();
    var hist = sessionStorageGet(HISTORY_KEY, []);

    // no point showing Back on the Hub, or with nothing behind us
    if (here === 'index.html' || hist.length <= 1) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to previous page');
    btn.innerHTML = '‹ Back';
    btn.style.cssText =
      'background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.75);' +
      'font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;' +
      'padding:5px 12px;border-radius:20px;transition:all .15s;white-space:nowrap';
    btn.onmouseenter = function () { btn.style.background = 'rgba(255,255,255,0.16)'; btn.style.color = '#fff'; };
    btn.onmouseleave = function () { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.color = 'rgba(255,255,255,0.75)'; };
    btn.onclick = goBack;

    if (logo) {
      var left = document.createElement('div');
      left.style.cssText = 'display:flex;align-items:center;gap:14px';
      bar.insertBefore(left, logo);
      left.appendChild(btn);
      left.appendChild(logo);
    } else {
      bar.insertBefore(btn, bar.firstChild);
    }
  }

  // route in-page nav links through the guard too
  function wireNavGuard() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$=".html"]');
      if (!a) return;
      if (a.target === '_blank') return;
      if (!Guard.isDirty()) return;
      if (!Guard.confirmLeave()) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  // ── unsaved-changes guard ──
  var Guard = {
    _dirty: false,
    _active: false,
    isDirty: function () { return this._active && this._dirty; },
    markDirty: function () { this._dirty = true; },
    clear: function () { this._dirty = false; },
    confirmLeave: function () {
      if (!this.isDirty()) return true;
      var ok = window.confirm('All progress will be discarded. Continue?');
      if (ok) this._dirty = false;
      return ok;
    },
    activate: function () {
      this._active = true;
      var self = this;
      document.addEventListener('input', function () { self.markDirty(); }, true);
      document.addEventListener('change', function () { self.markDirty(); }, true);
      window.addEventListener('beforeunload', function (e) {
        if (self.isDirty()) { e.preventDefault(); e.returnValue = ''; return ''; }
      });
    }
  };

  // ── store skeleton (features layered on next) ──
  var Store = {
    get: lget, set: lset,
    jobs:    function () { return lget('mama-jobs', null); },
    briefs:  function () { return lget('mama-briefs', []); },
    quotes:  function () { return lget('mama-quotes', []); },
    reports: function () { return lget('mama-reports', []); },
    todos:   function () { return lget('mama-todos', []); }
  };

  // ── Google sign-in (OAuth) ──────────────────────────────────────
  // One sign-in, saved to the shared "notepad" (localStorage), read by
  // every page. Uses Google Identity Services to get an access token.
  // The token lets the app read/write Google Sheets on the signed-in
  // person's behalf. Token lasts ~1h, then refreshes silently.
  var GOOGLE_CLIENT_ID = '812767491733-tihh9j12lsingccrh703gfg5f6ohpekh.apps.googleusercontent.com';
  var GOOGLE_SCOPES = 'openid email https://www.googleapis.com/auth/spreadsheets';
  var GKEY = 'mama-google'; // shared notepad: { token, expiresAt, email }

  var _tokenClient = null;
  var _gsiReady = null;

  function loadGsi() {
    if (_gsiReady) return _gsiReady;
    _gsiReady = new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load Google sign-in library')); };
      document.head.appendChild(s);
    });
    return _gsiReady;
  }

  function gRead() { return lget(GKEY, { token: null, expiresAt: 0, email: null }); }
  function gWrite(v) { lset(GKEY, v); }

  var Google = {
    CLIENT_ID: GOOGLE_CLIENT_ID,
    email: function () { return gRead().email; },
    isSignedIn: function () {
      var s = gRead();
      return !!s.token && Date.now() < s.expiresAt;
    },
    // Has this browser consented before? (so we can refresh quietly)
    hasConsented: function () { return !!gRead().email; },

    // Ask Google for an access token.
    //   interactive: true  → shows the popup (use on a button click)
    //   interactive: false → silent refresh, no popup
    // Resolves with { email, token }.
    signIn: function (opts) {
      opts = opts || {};
      var interactive = opts.interactive !== false;
      return loadGsi().then(function () {
        return new Promise(function (resolve, reject) {
          if (!_tokenClient) {
            _tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: GOOGLE_SCOPES,
              callback: function () {}
            });
          }
          _tokenClient.callback = function (resp) {
            if (resp && resp.error) { reject(new Error(resp.error)); return; }
            var store = gRead();
            store.token = resp.access_token;
            store.expiresAt = Date.now() + (((resp.expires_in || 3600) - 60) * 1000);
            gWrite(store);
            // look up the signed-in person's email
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: 'Bearer ' + resp.access_token }
            }).then(function (r) { return r.json(); }).then(function (info) {
              var st = gRead();
              st.email = (info && info.email) || st.email || null;
              gWrite(st);
              resolve({ email: st.email, token: resp.access_token });
            }).catch(function () {
              resolve({ email: gRead().email, token: resp.access_token });
            });
          };
          _tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
        });
      });
    },

    // Silent refresh — no popup.
    refresh: function () { return this.signIn({ interactive: false }); },

    // Always returns a usable token, refreshing quietly if it has expired.
    getToken: function () {
      var s = gRead();
      if (s.token && Date.now() < s.expiresAt) return Promise.resolve(s.token);
      return this.refresh().then(function (r) { return r.token; });
    },

    signOut: function () {
      var s = gRead();
      if (s.token && window.google && window.google.accounts && window.google.accounts.oauth2) {
        try { window.google.accounts.oauth2.revoke(s.token, function () {}); } catch (e) {}
      }
      gWrite({ token: null, expiresAt: 0, email: null });
    }
  };

  // ── boot ──
  function boot() {
    pushHistory();
    mountBack();
    wireActivity();
    wireNavGuard();
    if (document.body && document.body.getAttribute('data-mama-guard')) Guard.activate();
  }

  window.Mama = {
    Session: Session,
    Guard: Guard,
    Store: Store,
    Google: Google,
    currentFile: currentFile,
    back: goBack,
    navigate: navigateTo
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
