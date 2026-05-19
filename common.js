/**
 * Gym Training Management System — Shared JavaScript
 * Auth state + login/register + navigation + utility functions
 * Uses localStorage for cross-page auth state persistence
 */

var AUTH_KEY = 'gympro_auth';
var USERS_KEY = 'gympro_users';

function loadAuth() {
  try {
    var raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { loggedIn: false, role: null, name: '', email: '' };
  } catch (e) {
    return { loggedIn: false, role: null, name: '', email: '' };
  }
}

function saveAuth(state) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function loadUsers() {
  try {
    var raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  var users = loadUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) return users[i];
  }
  return null;
}

var authState = loadAuth();
var loginRole = 'member';
var registerRole = 'member';

function setActiveNav(currentPage) {
  var links = document.querySelectorAll('.nav-links a');
  links.forEach(function(a) {
    a.classList.remove('active');
    if (a.getAttribute('data-page') === currentPage) {
      a.classList.add('active');
    }
  });
}

function initRoleSwitches() {
  var loginBtns = document.querySelectorAll('#login-role-switch button');
  var registerBtns = document.querySelectorAll('#register-role-switch button');

  if (loginBtns.length) {
    loginBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        loginRole = this.dataset.role;
        loginBtns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  }

  if (registerBtns.length) {
    registerBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        registerRole = this.dataset.role;
        registerBtns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  }
}

function openLogin() {
  if (authState.loggedIn) return;
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  var login = document.getElementById('auth-login');
  if (login) login.classList.remove('hidden');
  var reg = document.getElementById('auth-register');
  if (reg) reg.classList.add('hidden');
  var err = document.getElementById('login-error');
  if (err) err.classList.add('hidden');
  var em = document.getElementById('login-email');
  if (em) em.value = '';
  var pw = document.getElementById('login-password');
  if (pw) pw.value = '';
  document.body.style.overflow = 'hidden';
}

function openRegister() {
  if (authState.loggedIn) return;
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  var reg = document.getElementById('auth-register');
  if (reg) reg.classList.remove('hidden');
  var login = document.getElementById('auth-login');
  if (login) login.classList.add('hidden');
  var err = document.getElementById('register-error');
  if (err) err.classList.add('hidden');
  var suc = document.getElementById('register-success');
  if (suc) suc.classList.add('hidden');
  var name = document.getElementById('register-name');
  if (name) name.value = '';
  var em = document.getElementById('register-email');
  if (em) em.value = '';
  var pw = document.getElementById('register-password');
  if (pw) pw.value = '';
  var cf = document.getElementById('register-confirm');
  if (cf) cf.value = '';
  document.body.style.overflow = 'hidden';
}

function closeAuth() {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function switchToRegister() {
  var login = document.getElementById('auth-login');
  if (login) login.classList.add('hidden');
  var reg = document.getElementById('auth-register');
  if (reg) reg.classList.remove('hidden');
  var err = document.getElementById('register-error');
  if (err) err.classList.add('hidden');
  var suc = document.getElementById('register-success');
  if (suc) suc.classList.add('hidden');
}

function switchToLogin() {
  var reg = document.getElementById('auth-register');
  if (reg) reg.classList.add('hidden');
  var login = document.getElementById('auth-login');
  if (login) login.classList.remove('hidden');
  var err = document.getElementById('login-error');
  if (err) err.classList.add('hidden');
}

function handleLogin(e) {
  e.preventDefault();
  var emailEl = document.getElementById('login-email');
  var passwordEl = document.getElementById('login-password');
  var errorEl = document.getElementById('login-error');
  var email = emailEl ? emailEl.value.trim() : '';
  var password = passwordEl ? passwordEl.value.trim() : '';

  if (!email || !password) {
    if (errorEl) { errorEl.textContent = '请填写邮箱和密码'; errorEl.classList.remove('hidden'); }
    return;
  }

  var user = findUserByEmail(email);
  if (!user) {
    if (errorEl) { errorEl.textContent = '该账号尚未注册，请先注册'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (user.password !== password) {
    if (errorEl) { errorEl.textContent = '密码错误，请重试'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (user.role !== loginRole) {
    if (errorEl) { errorEl.textContent = '角色不匹配，请选择正确的角色登录'; errorEl.classList.remove('hidden'); }
    return;
  }

  if (errorEl) errorEl.classList.add('hidden');

  authState.loggedIn = true;
  authState.role = user.role;
  authState.name = user.name;
  authState.email = user.email;
  saveAuth(authState);

  applyAuthUI();
  closeAuth();
  onLoginSuccess();
}

function handleRegister(e) {
  e.preventDefault();
  var nameEl = document.getElementById('register-name');
  var emailEl = document.getElementById('register-email');
  var passwordEl = document.getElementById('register-password');
  var confirmEl = document.getElementById('register-confirm');
  var errorEl = document.getElementById('register-error');
  var successEl = document.getElementById('register-success');

  var name = nameEl ? nameEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim() : '';
  var password = passwordEl ? passwordEl.value : '';
  var confirm = confirmEl ? confirmEl.value : '';

  if (errorEl) errorEl.classList.add('hidden');
  if (successEl) successEl.classList.add('hidden');

  if (!name || !email || !password || !confirm) {
    if (errorEl) { errorEl.textContent = '请填写所有字段'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (!email.includes('@') && !/^\d{11}$/.test(email)) {
    if (errorEl) { errorEl.textContent = '请输入有效的邮箱或11位手机号'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (password.length < 6) {
    if (errorEl) { errorEl.textContent = '密码长度至少6位'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (!/[a-zA-Z]/.test(password)) {
    if (errorEl) { errorEl.textContent = '密码必须包含至少一个英文字母'; errorEl.classList.remove('hidden'); }
    return;
  }
  if (password !== confirm) {
    if (errorEl) { errorEl.textContent = '两次密码输入不一致'; errorEl.classList.remove('hidden'); }
    return;
  }

  if (findUserByEmail(email)) {
    if (errorEl) { errorEl.textContent = '该邮箱/手机号已被注册'; errorEl.classList.remove('hidden'); }
    return;
  }

  var newUser = {
    name: name,
    email: email,
    password: password,
    role: registerRole
  };

  var users = loadUsers();
  users.push(newUser);
  saveUsers(users);

  authState.loggedIn = true;
  authState.role = registerRole;
  authState.name = name;
  authState.email = email;
  saveAuth(authState);

  if (successEl) {
    successEl.textContent = '注册成功！正在跳转...';
    successEl.classList.remove('hidden');
  }

  setTimeout(function() {
    applyAuthUI();
    closeAuth();
    onLoginSuccess();
  }, 800);
}

function handleLogout() {
  authState = { loggedIn: false, role: null, name: '', email: '' };
  clearAuth();

  var utilLogin = document.getElementById('util-login');
  var utilJoin = document.getElementById('util-join');
  var utilLogout = document.getElementById('util-logout');
  var navOut = document.getElementById('nav-logged-out');
  var navIn = document.getElementById('nav-logged-in');

  if (utilLogin) utilLogin.classList.remove('hidden');
  if (utilJoin) utilJoin.classList.remove('hidden');
  if (utilLogout) utilLogout.classList.add('hidden');
  if (navOut) navOut.classList.remove('hidden');
  if (navIn) navIn.classList.add('hidden');

  if (typeof onLogout === 'function') onLogout();
}

function applyAuthUI() {
  var utilLogin = document.getElementById('util-login');
  var utilJoin = document.getElementById('util-join');
  var utilLogout = document.getElementById('util-logout');
  var navOut = document.getElementById('nav-logged-out');
  var navIn = document.getElementById('nav-logged-in');
  var badge = document.getElementById('nav-role-badge');
  var userName = document.getElementById('nav-user-name');

  if (utilLogin) utilLogin.classList.add('hidden');
  if (utilJoin) utilJoin.classList.add('hidden');
  if (utilLogout) utilLogout.classList.remove('hidden');
  if (navOut) navOut.classList.add('hidden');
  if (navIn) navIn.classList.remove('hidden');

  if (badge) {
    if (authState.role === 'admin') {
      badge.textContent = '管理员';
      badge.className = 'nav-role-badge admin';
    } else {
      badge.textContent = '会员';
      badge.className = 'nav-role-badge member';
    }
  }
  if (userName) userName.textContent = authState.name;
}

function onLoginSuccess() {
  // Override per page to handle post-login actions
}

function onLogout() {
  // Override per page for logout cleanup
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initRoleSwitches();
  if (authState.loggedIn) {
    applyAuthUI();
    if (typeof onLoginSuccess === 'function') onLoginSuccess();
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var overlay = document.getElementById('auth-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        closeAuth();
      }
    }
  });
});
