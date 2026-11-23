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

  // Ждем Firebase
  async function waitForStore() {
    while (!window.storeReady) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async function initModule() {
    await waitForStore();
    const container = document.getElementById('cards');
    container.innerHTML = '';
    
    let currentIndex = 0;

    // Функция отрисовки текущего участника
    async function renderCurrent() {
      container.innerHTML = ''; // Очищаем контейнер
      
      if (currentIndex >= mod.order.length) {
        container.innerHTML = `<div class="hint" style="text-align:center; color:var(--emerald-600); font-weight:bold;">Все участники модуля оценены!</div>`;
        return;
      }

      const code = mod.order[currentIndex];
      const existing = await getScore(moduleId, code);

      // Отрисовка очереди (следующие 5 участников)
      const nextParticipants = mod.order.slice(currentIndex + 1, currentIndex + 6);
      let queueHtml = '';
      if (nextParticipants.length > 0) {
        queueHtml = `
          <div class="queue-preview">
            <h3>Далее по очереди:</h3>
            <div class="queue-list">${nextParticipants.join(' • ')}</div>
          </div>
        `;
      }

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="step-info">Участник ${currentIndex + 1} из ${mod.order.length}</div>
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

      // Если балл уже стоит (независимо от сессии) - блокируем
      if (existing !== null && existing !== undefined) {
        input.value = existing;
        input.disabled = true;
        btn.disabled = true;
        btn.textContent = 'Оценка уже выставлена';
        done.textContent = `Текущая оценка: ${existing}`;
      } else {
        // Логика оценки
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
          input.disabled = true; // Запрет переоценки
          btn.textContent = 'Сохранение...';

          try {
            await saveScore(moduleId, code, val);
            done.textContent = `Сохранено: ${val}`;
            btn.textContent = 'Оценено';
            
            // Автоматический переход к следующему через 1.5 секунды (чтобы эксперт увидел результат)
            setTimeout(() => {
              currentIndex++;
              renderCurrent();
            }, 1500);

          } catch (e) {
            err.textContent = 'Ошибка сохранения. Повторите.';
            btn.disabled = false;
            input.disabled = false;
            btn.textContent = 'Оценить участника';
          }
        });
      }

      container.appendChild(card);
      
      // Добавляем блок с очередью, если он есть
      if (queueHtml) {
        container.insertAdjacentHTML('beforeend', queueHtml);
      }
    }

    renderCurrent();
  }

  initModule();
})();
