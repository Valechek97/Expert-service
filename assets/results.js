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
      const chosen = Object.keys(bonuses).find(p => bonuses[p] === pts);
      if (chosen) sel.value = chosen;

      sel.addEventListener('change', () => {
        Object.keys(bonuses).forEach(p => { if (bonuses[p] === pts) delete bonuses[p]; });
        if (sel.value) bonuses[sel.value] = pts;
        saveBonus();
        renderTable();
      });

      box.appendChild(row);
    });
  }

  function renderTable(){
    const moduleIds = Object.keys(MODULES).map(Number).sort((a,b)=>a-b);

    const thead = document.getElementById('thead');
    thead.innerHTML = `
      <tr>
        <th>Место</th>
        <th>Шифр</th>
        ${moduleIds.map(id => `<th>${MODULES[id].short}</th>`).join('')}
        <th>Доп.</th>
        <th>Итог</th>
      </tr>`;

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

    rows.sort((a,b)=> b.total - a.total || a.code.localeCompare(b.code));

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

  async function refresh(){
    scoresAll = await loadAllScores();
    renderTable();
  }

  document.getElementById('recalcBtn').addEventListener('click', refresh);

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
  })();
})();