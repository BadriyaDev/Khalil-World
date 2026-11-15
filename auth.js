
/* ===== الحساب وتسجيل الدخول باستخدام Google ===== */

const GOOGLE_CLIENT_ID = '857541717542-0af34fovqj8jt2sr63l7sq60e0nu39mf.apps.googleusercontent.com';

let user = null;
let guest = LS('guest', false);
let accountMenu = null;
let googleInitialized = false;

/* ===== الرسائل ===== */

function authMsg(text) {
  const el = document.getElementById('a-msg');
  if (el) el.textContent = text;
}

/* ===== معلومات المستخدم ===== */

function getUserName() {
  if (!user) return '';

  return user.name || user.email?.split('@')[0] || 'مستخدم';
}

/* ===== تحديث زر الحساب ===== */

function refresh() {
  const b = document.getElementById('nav-acc');

  if (!b) return;

  if (user) {
    b.textContent = 'حسابي';
    b.dataset.go = '';
    b.setAttribute('aria-expanded', 'false');

    b.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      toggleAccountMenu();
    };
  } else {
    b.textContent = 'دخول';
    b.dataset.go = 'login';
    b.setAttribute('aria-expanded', 'false');
    b.onclick = null;
  }

  closeAccountMenu();
}

/* ===== القائمة الجانبية للحساب ===== */

function createAccountMenu() {
  if (accountMenu) return accountMenu;

  accountMenu = document.createElement('div');
  accountMenu.id = 'account-menu';
  accountMenu.className = 'account-menu';
  accountMenu.hidden = true;

  document.body.appendChild(accountMenu);

  return accountMenu;
}

function renderAccountMenu() {
  if (!user) return;

  const menu = createAccountMenu();

  menu.innerHTML = `
    <div class="account-menu-head">
      <div class="account-avatar">👤</div>

      <div class="account-user-info">
        <strong>${escapeHTML(getUserName())}</strong>
        <small dir="ltr">${escapeHTML(user.email || '')}</small>
      </div>
    </div>

    <div class="account-menu-divider"></div>

    <button type="button" class="account-logout" id="account-logout">
      <span>↪</span>
      تسجيل الخروج
    </button>
  `;

  menu.querySelector('#account-logout').onclick = logout;
}

function toggleAccountMenu() {
  if (!user) return;

  const menu = createAccountMenu();

  if (menu.hidden) {
    renderAccountMenu();
    menu.hidden = false;

    document.getElementById('nav-acc')
      ?.setAttribute('aria-expanded', 'true');
  } else {
    closeAccountMenu();
  }
}

function closeAccountMenu() {
  if (accountMenu) {
    accountMenu.hidden = true;
  }

  document.getElementById('nav-acc')
    ?.setAttribute('aria-expanded', 'false');
}

/* إغلاق القائمة عند الضغط خارجها */

document.addEventListener('click', e => {
  if (
    accountMenu &&
    !accountMenu.hidden &&
    !accountMenu.contains(e.target) &&
    !e.target.closest('#nav-acc')
  ) {
    closeAccountMenu();
  }
});

/* إغلاق القائمة بزر Escape */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAccountMenu();
});

/* ===== تنظيف النصوص ===== */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/* ===== قراءة بيانات Google ===== */

function readGoogleCredential(credential) {
  try {
    const payload = credential.split('.')[1];

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c =>
          '%' + c.charCodeAt(0).toString(16).padStart(2, '0')
        )
        .join('')
    );

    return JSON.parse(decoded);

  } catch (error) {
    console.error('Google credential error:', error);
    return null;
  }
}

/* ===== استقبال تسجيل الدخول ===== */

function handleGoogleLogin(response) {
  const data = readGoogleCredential(response.credential);

  if (!data || !data.email) {
    authMsg('تعذّر قراءة بيانات حساب Google. حاولي مرة أخرى.');
    return;
  }

  user = {
    id: data.sub,
    name: data.name || data.email.split('@')[0],
    email: data.email,
    picture: data.picture || ''
  };

  guest = false;

  sessionStorage.setItem(
    'googleUser',
    JSON.stringify(user)
  );

  save('guest', false);

  authMsg('');

  refresh();

  if (typeof go === 'function') {
    go('home');
  } else {
    location.hash = '';
  }
}

/* ===== تهيئة زر Google الرسمي ===== */

function initGoogleLogin() {
  if (googleInitialized) return;

  const container = document.getElementById('google-signin-button');

  if (!container) return;

  if (!window.google?.accounts?.id) {
    authMsg('تعذّر تحميل خدمة Google. أعيدي تحميل الصفحة.');
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    authMsg('لم يتم إعداد Google Client ID.');
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  google.accounts.id.renderButton(
    container,
    {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 300,
      locale: 'ar'
    }
  );

  googleInitialized = true;
}

/* ===== الدخول كضيف ===== */

const guestButton = document.getElementById('a-guest');

if (guestButton) {
  guestButton.onclick = () => {
    user = null;
    guest = true;

    sessionStorage.removeItem('googleUser');
    save('guest', true);

    authMsg('');
    refresh();

    if (typeof go === 'function') {
      go('home');
    } else {
      location.hash = '';
    }
  };
}

/* ===== تسجيل الخروج ===== */

function logout() {
  closeAccountMenu();

  if (window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }

  sessionStorage.removeItem('googleUser');

  user = null;
  guest = true;

  save('guest', true);

  refresh();

  if (typeof go === 'function') {
    go('home');
  } else {
    location.hash = '';
    location.reload();
  }
}

/* ===== إعدادات الموقع المحلية ===== */

function setSet(k, v) {
  const s = LS('settings', {});

  s[k] = v;
  save('settings', s);

  applySet();
}

function applySet() {
  const s = LS('settings', {});

  document.documentElement.style.fontSize = ({
    normal: '100%',
    large: '115%',
    xl: '130%'
  })[s.font || 'normal'];

  const autoSay = document.getElementById('auto-say');

  if (autoSay) {
    autoSay.checked = s.auto !== false;
  }
}

const autoSay = document.getElementById('auto-say');

if (autoSay) {
  autoSay.onchange = e => {
    setSet('auto', e.target.checked);
  };
}

/* ===== استعادة الجلسة المحلية ===== */

function restoreGoogleUser() {
  try {
    const saved = sessionStorage.getItem('googleUser');

    if (saved) {
      user = JSON.parse(saved);
      guest = false;
    }
  } catch (error) {
    console.error('Session restore error:', error);
    sessionStorage.removeItem('googleUser');
    user = null;
  }
}

/* ===== تشغيل الحساب ===== */

function initAuth() {
  applySet();

  restoreGoogleUser();

  refresh();

  initGoogleLogin();

  if (!googleInitialized) {
    window.addEventListener('load', initGoogleLogin, { once: true });
  }
}

initAuth();
