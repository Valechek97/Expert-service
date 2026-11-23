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

  async function waitForStore() {
    while (!window.storeReady) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async function initModule() {
    await waitForStore();
    
    let scoredData = {};
    async function updateScoredData() {
      const all = await loadAllScores();
      scoredData = all[moduleId] || {};
    }

    const container = document.getElementById('cards');
    container.innerHTML = '';

    async function renderInterface() {
      await updateScoredData();
      container.innerHTML = '';

      const scoredCount = Object.keys(scoredData).length;
      
      // 1. БЛОК ВВОДА (если оценены еще не все)
      if (scoredCount < 19) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="step-info">Оценено ${scoredCount} из 19</div>
          
          <label style="font-size:13px; color:var(--muted); margin-bottom:4px; display:block;">Шифр участника:</label>
          <input type="text" id="codeInput" placeholder="Например: У-05" autocomplete="off" style="text-transform: uppercase; margin-bottom:12px;">
          
          <label style="font-size:13px; color:var(--muted); margin-bottom:4px; display:block;">Количество баллов (0–100):</label>
          <input type="number" id="scoreInput" min="0" max="100" step="0.01" placeholder="0–100" inputmode="decimal">
          
          <div class="err" id="errMsg"></div>
          <button class="btn" id="submitBtn" type="button">Оценить участника</button>
        `;
        
        const codeInput = card.querySelector('#codeInput');
        const scoreInput = card.querySelector('#scoreInput');
        const err = card.querySelector('#errMsg');
        const btn = card.querySelector('#submitBtn');

        btn.addEventListener('click', async () => {
          err.textContent = '';
          let code = codeInput.value.trim().toUpperCase().replace(/\s+/g, '');
          
          if (/^\d+$/.test(code)) {
            code = 'У-' + code.padStart(2, '0');
          }

          if (!ALL_PARTICIPANTS.includes(code)) {
            err.textContent = 'Неверный шифр. Доступны: У-01 ... У-19.';
            return;
          }

          if (scoredData[code] !== undefined) {
            err.textContent = `Участник ${code} уже оценен (${scoredData[code]} б.).`;
            return;
          }

          const rawScore = scoreInput.value.trim().replace(',', '.');
          const val = Number(rawScore);

          if (rawScore === '' || Number.isNaN(val) || val < 0 || val > 100) {
            err.textContent = 'Введите число от 0 до 100.';
            return;
          }

          btn.disabled = true;
          btn.textContent = 'Сохранение...';

          try {
            await saveScore(moduleId, code, val);
            await renderInterface(); // Перерисовываем (обновит и рейтинг)
          } catch (e) {
            err.textContent = 'Ошибка сохранения. Повторите.';
            btn.disabled = false;
            btn.textContent = 'Оценить участника';
          }
        });

        container.appendChild(card);
      } else {
        // Если все оценены
        container.innerHTML = `<div class="hint" style="text-align:center; color:var(--emerald-600); font-weight:bold; margin-bottom:20px;">Все 19 участников модуля оценены!</div>`;
      }

      // 2. БЛОК РЕЙТИНГА МОДУЛЯ (отображается, если есть хотя бы одна оценка)
      if (scoredCount > 0) {
        const rankingBox = document.createElement('div');
        rankingBox.className = 'queue-preview'; // Используем стили от блока с очередью
        
        // Превращаем объект в массив и сортируем по убыванию баллов
        const ranking = Object.entries(scoredData)
          .map(([code, score]) => ({ code, score }))
          .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));

        const listHtml = ranking.map((item, index) => {
          let medal = '';
          if (index === 0) medal = '🥇 ';
          else if (index === 1) medal = '🥈 ';
          else if (index === 2) medal = '🥉 ';
          
          return `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--emerald-100); font-size:14px;">
            <span>${medal}<strong>${item.code}</strong></span>
            <span style="font-weight:bold; color:var(--emerald-700);">${item.score} б.</span>
          </div>`;
        }).join('');

        rankingBox.innerHTML = `
          <h3 style="text-align:center; margin-bottom:12px;">Текущий рейтинг модуля</h3>
          <div style="max-height: 300px; overflow-y: auto;">
            ${listHtml}
          </div>
        `;
        
        container.appendChild(rankingBox);
      }
    }

    renderInterface();
  }

  initModule();
})();
