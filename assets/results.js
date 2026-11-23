(function(){
  const BONUS_VALUES = [100,90,80,70,60,50,40,30,20,10];
  const BONUS_LS_KEY = 'competition_bonus_v1';

  let scoresAll = {}; 
  let bonuses   = {}; 

  function loadBonus(){
    try { bonuses = JSON.parse(localStorage.getItem(BONUS_LS_KEY)) || {}; }
    catch { bonuses = {}; }
  }
  function saveBonus(){
    localStorage.setItem(BONUS_LS_KEY, JSON.stringify(bonuses));
  }

  function buildBonusRows(){
    const box = document.getElementById('bonusRows');
    box.innerHTML = '';
    BONUS_VALUES.forEach((pts) => {
      const row = document.createElement('div');
      row.className = 'bonus-row';
      row.innerHTML = `
        <label>+${pts}</label>
        <select data-pts="${pts}">
          <option value="">— не начислять —</option>
          ${ALL_PARTICIPANTS.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <span class="pts"></span>
      `;
      const sel = row.querySelector('select');
      // Восстановление выбранного значения
      const chosen = Object.keys(bonuses).find(p => bonuses[p] === pts);
      if (chosen) sel.value = chosen;

      // Сохраняем выбор в объект bonuses при изменении
      sel.addEventListener('change', () => {
        Object.keys(bonuses).forEach(p => { if (bonuses[p] === pts) delete bonuses[p]; });
        if (sel.value) bonuses[sel.value] = pts;
        saveBonus();
      });

      box.appendChild(row);
    });
  }

  function renderTable(){
    const moduleIds = Object.keys(MODULES).map(Number).sort((a,b)=>a-b);

    // Шапка таблицы
    const thead = document.getElementById('thead');
    thead.innerHTML = `
      <tr>
        <th>Место</th>
        <th>Шифр</th>
        ${moduleIds.map(id => `<th>${MODULES[id].short}</th>`).join('')}
        <th>Доп.</th>
        <th>Итог</th>
      </tr>`;

    // Данные
    const rows = ALL_PARTICIPANTS.map(code => {
      const perModule = moduleIds.map(id => {
        const v = scoresAll[id]?.[code];
        return (typeof v === 'number') ? v : null;
      });
      const sumModules = perModule.reduce((s,v)=> s + (v||0), 0);
      const bonus = bonuses[code] || 0;
      const total = sumModules + bonus;
      return { code, perModule, bonus, total };
    });

    // Сортировка
    rows.sort((a,b)=> b.total - a.total || a.code.localeCompare(b.code));

    // Рендер строк
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = rows.map((r, idx) => {
      const place = idx + 1;
      let cls = '';
      if (place === 1) cls = 'gold';
      else if (place === 2) cls = 'silver';
      else if (place === 3) cls = 'bronze';

      return `<tr class="${cls}">
        <td>${place}</td>
        <td class="code">${r.code}</td>
        ${r.perModule.map(v => `<td>${v===null?'—':v}</td>`).join('')}
        <td>${r.bonus ? '+' + r.bonus : '—'}</td>
        <td class="total">${r.total}</td>
      </tr>`;
    }).join('');
  }

  // Загрузка актуальных данных из Firebase и отрисовка
  async function refresh(){
    scoresAll = await loadAllScores();
    renderTable();
  }

  // Очистка всех результатов
  async function clearAllData() {
    if (!confirm("Вы уверены, что хотите удалить ВСЕ результаты? Это действие нельзя отменить.")) return;
    try {
      await clearAllScores(); // вызов из store.js
      localStorage.removeItem(BONUS_LS_KEY); // сбрасываем бонусы
      bonuses = {};
      alert("Все результаты удалены.");
      location.reload();
    } catch (e) {
      alert("Ошибка при удалении.");
    }
  }

  async function waitForStore() {
    while (!window.storeReady) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  (async function init(){
    await waitForStore();
    loadBonus();
    buildBonusRows();
    await refresh();

    // Кнопка пересчета
    document.getElementById('recalcBtn').addEventListener('click', async () => {
      await refresh();
    });

    // Мелкая кнопка очистки
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-small';
    clearBtn.textContent = 'Очистить все результаты';
    clearBtn.addEventListener('click', clearAllData);
    document.querySelector('.wrap').appendChild(clearBtn);
  })();
})();
