// assets/auth.js

function requireAuth(moduleId) {
  const isMaster = moduleId === 'master';
  const pwdKey = isMaster ? 'auth_master' : `auth_mod_${moduleId}`;
  const correctPassword = isMaster ? MASTER_PASSWORD : MODULES[moduleId].password;

  // Если уже авторизован в этой сессии - пропускаем
  if (sessionStorage.getItem(pwdKey) === 'true') {
    return true;
  }

  // Создаем оверлей
  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-box">
      <h2>${isMaster ? 'Главный эксперт' : 'Модуль ' + moduleId}</h2>
      <p>Введите код доступа для входа</p>
      <input type="password" id="authPwd" placeholder="Код доступа" autocomplete="off">
      <div class="auth-err" id="authErr"></div>
      <button class="btn" id="authBtn">Войти</button>
    </div>
  `;
  document.body.appendChild(overlay);

  return new Promise((resolve) => {
    const input = document.getElementById('authPwd');
    const btn = document.getElementById('authBtn');
    const err = document.getElementById('authErr');

    input.focus();

    const check = () => {
      err.textContent = '';
      if (input.value === correctPassword) {
        sessionStorage.setItem(pwdKey, 'true');
        overlay.remove();
        resolve(true);
      } else {
        err.textContent = 'Неверный код доступа';
        input.value = '';
        input.focus();
      }
    };

    btn.addEventListener('click', check);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') check();
    });
  });
}
