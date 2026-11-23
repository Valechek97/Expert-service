// assets/store.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Сохранить балл участника
async function saveScore(moduleId, participant, score) {
  try {
    await set(ref(db, `scores/${moduleId}/${participant}`), score);
    console.log(`Сохранено: модуль ${moduleId}, ${participant} = ${score}`);
  } catch (error) {
    console.error("Ошибка сохранения в Firebase:", error);
    throw error;
  }
}

// Загрузить все баллы (для страницы результатов)
async function loadAllScores() {
  try {
    const snapshot = await get(child(ref(db), 'scores'));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error("Ошибка загрузки из Firebase:", error);
    return {};
  }
}

// Получить балл конкретного участника (для страниц модулей)
async function getScore(moduleId, participant) {
  try {
    const snapshot = await get(ref(db, `scores/${moduleId}/${participant}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Ошибка получения балла:", error);
    return null;
  }
}

// Экспорт в глобальную область для обычных скриптов (module.js, results.js)
window.saveScore = saveScore;
window.loadAllScores = loadAllScores;
window.getScore = getScore;

// Сигнал о готовности базы данных
window.storeReady = true;