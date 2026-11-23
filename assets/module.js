// assets/module.js
(function(){
  const m = location.pathname.match(/module(\d+)\.html$/i);
  const moduleId = m ? parseInt(m[1], 10) : null;

  if (!moduleId || !MODULES[moduleId]) {
    document.getElementById('title').textContent = 'Модуль не найден.';
    return;
  }

  const mod = MODULES[moduleId];
  document.getElementById('title').innerHTML = `<span class="num">Модуль № ${moduleId}.</span> «${mod.name}»`;
  document.title = `Модуль № ${moduleId}. ${mod.name}`;

  // Ждем, пока Firebase инициализируется (store.js отработает)
  async function waitForStore() {
    while (!window.storeReady) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async function initModule() {
    await waitForStore();
    const cards = document.getElementById('cards');

    for (const code of mod.order) {
      const existing = await getScore(moduleId, code);

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="code">${code}</div>
        <input type="number" min="0" max="100" step="0.01" placeholder="0–100" inputmode="decimal">
        <div class="err"></div>
        <button class="btn" type="button">Оценить участника</button>
        <div class="done"></div>
      `;
      
      const input = card.querySelector('input');
      const err   = card.querySelector('.err');
      const btn   = card.querySelector('.btn');
      const done  = card.querySelector('.done');

      if (existing !== null && existing !== undefined) {
        input.value = existing;
        done.textContent = `Текущая оценка: ${existing} (можно изменить)`;
      }

      btn.addEventListener('click', async () => {
        err.textContent = '';
        const raw = input.value.trim().replace(',', '.');
        const val = Number(raw);

        if (raw === '' || Number.isNaN(val)) {
          err.textContent = 'Введите число от 0 до 100.';
          return;
        }
        if (val < 0 || val > 100) {
          err.textContent = 'Допустимый диапазон: от 0 до 100.';
          return;
        }

        btn.disabled = true;
        try {
          await saveScore(moduleId, code, val);
          done.textContent = `Сохранено: ${val}`;
        } catch (e) {
          err.textContent = 'Ошибка сохранения. Повторите.';
        } finally {
          btn.disabled = false;
        }
      });

      cards.appendChild(card);
    }
  }

  initModule();
})();