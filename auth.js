
/* ===== الحساب وتسجيل الدخول باستخدام Google ===== */

/* ضعي Google Client ID بين علامتي الاقتباس */
const GOOGLE_CLIENT_ID = '857541717542-0af34fovqj8jt2sr63l7sq60e0nu39mf.apps.googleusercontent.com';

let user = null;
let guest = LS('guest', false);
let accountMenu = null;

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

/*
  نقرأ بيانات الاسم والبريد من Google ID token
  لا نخزن التوكن نفسه.
*/

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
    authMsg('تعذّر قراءة بيانات حساب Google. حاول مرة أخرى.');
    return;
  }

  user = {
    id: data.sub,
    name: data.name || data.email.split('@')[0],
    email: data.email,
    picture: data.picture || ''
  };

  guest = false;

  /*
    تخزين الاسم والبريد فقط داخل الجلسة الحالية.
    لا يتم تخزين كلمة مرور أو Google token.
  */

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

/* ===== تهيئة Google Identity Services ===== */

function initGoogleLogin() {
  if (!GOOGLE_CLIENT_ID ||
      GOOGLE_CLIENT_ID === 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE') {
    authMsg('أضيفي Google Client ID أولاً في ملف auth.js.');
    return;
  }

  if (!window.google?.accounts?.id) {
    authMsg('تعذّر تحميل خدمة Google. أعيدي تحميل الصفحة.');
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin,
    auto_select: false
  });

  const button = document.getElementById('a-google');

  if (button) {
    button.onclick = () => {
      authMsg('اختاري حساب Google للمتابعة.');

      google.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed()) {
          authMsg(
            'لم تظهر نافذة Google. تحققي من إعدادات المتصفح وحاولي مرة أخرى.'
          );
        }
      });
    };
  }
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

  const googleButton = document.getElementById('a-google');

  if (googleButton) {
    googleButton.onclick = () => {
      if (!window.google?.accounts?.id) {
        authMsg('انتظري قليلًا حتى يتم تحميل Google ثم حاولي مجددًا.');
        return;
      }

      initGoogleLogin();
      google.accounts.id.prompt();
    };
  }

  if (window.google?.accounts?.id) {
    initGoogleLogin();
  } else {
    window.addEventListener('load', () => {
      initGoogleLogin();
    }, { once: true });
  }
}

initAuth();
