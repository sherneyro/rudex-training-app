// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Данные о модулях
const MODULES = {
    1: {
        name: 'О компании',
        icon: '📖',
        blocks: 4,
        test: true
    },
    2: {
        name: 'Продукты',
        icon: '🚪',
        blocks: 6,
        test: true
    },
    3: {
        name: 'Услуги и цены',
        icon: '💰',
        blocks: 2,
        test: true
    },
    4: {
        name: 'Техника продаж',
        icon: '💬',
        blocks: 3,
        test: true
    }
};

// Хранилище данных пользователя
let userData = {
    userId: null,
    username: null,
    progress: {
        modules: {},
        totalBlocks: 0,
        completedBlocks: 0
    }
};

// Инициализация приложения
async function init() {
    // Получаем данные пользователя из Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userData.userId = tg.initDataUnsafe.user.id;
        userData.username = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;
    }

    // Загружаем прогресс пользователя
    await loadUserProgress();

    // Обновляем UI
    updateProgressUI();
    updateModulesUI();

    // Настройка кнопок Telegram
    tg.MainButton.hide();
    tg.BackButton.hide();
}

// Загрузка прогресса пользователя
async function loadUserProgress() {
    try {
        // Здесь будет запрос к серверу/Google Sheets
        // Пока используем локальное хранилище
        const savedProgress = localStorage.getItem(`progress_${userData.userId}`);
        if (savedProgress) {
            userData.progress = JSON.parse(savedProgress);
        } else {
            // Инициализация нового пользователя
            userData.progress = {
                modules: {
                    1: { completed: 0, total: 4, testPassed: false, testScore: 0 },
                    2: { completed: 0, total: 6, testPassed: false, testScore: 0 },
                    3: { completed: 0, total: 2, testPassed: false, testScore: 0 },
                    4: { completed: 0, total: 3, testPassed: false, testScore: 0 }
                },
                totalBlocks: 15,
                completedBlocks: 0
            };
        }
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
    }
}

// Сохранение прогресса
function saveProgress() {
    localStorage.setItem(`progress_${userData.userId}`, JSON.stringify(userData.progress));
    
    // Отправка данных на сервер
    sendProgressToServer();
}

// Отправка прогресса на сервер
async function sendProgressToServer() {
    try {
        // Отправка через Telegram Bot API
        tg.sendData(JSON.stringify({
            action: 'save_progress',
            userId: userData.userId,
            progress: userData.progress
        }));
    } catch (error) {
        console.error('Ошибка отправки прогресса:', error);
    }
}

// Обновление UI прогресса
function updateProgressUI() {
    const totalBlocks = 15; // 4 + 6 + 2 + 3
    const completed = userData.progress.completedBlocks;
    const percentage = Math.round((completed / totalBlocks) * 100);

    // Обновляем прогресс-бар
    document.getElementById('totalProgress').textContent = `${percentage}%`;
    document.getElementById('progressBar').style.width = `${percentage}%`;
    
    // Обновляем статистику
    const completedModules = Object.values(userData.progress.modules)
        .filter(m => m.completed === m.total && m.testPassed).length;
    
    document.getElementById('completedModules').textContent = completedModules;
    document.getElementById('completedBlocks').textContent = completed;
}

// Обновление UI модулей
function updateModulesUI() {
    Object.keys(MODULES).forEach(moduleId => {
        const moduleCard = document.querySelector(`.module-card[data-module="${moduleId}"]`);
        const moduleData = userData.progress.modules[moduleId];
        
        if (!moduleCard || !moduleData) return;

        // Обновляем прогресс модуля
        const percentage = Math.round((moduleData.completed / moduleData.total) * 100);
        const progressFill = moduleCard.querySelector('.module-progress-fill');
        const progressText = moduleCard.querySelector('.module-progress-text');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${moduleData.completed}/${moduleData.total} блоков`;

        // Обновляем статус и доступность
        const button = moduleCard.querySelector('button');
        const statusIcon = moduleCard.querySelector('.status-icon');

        // Проверяем, разблокирован ли модуль
        const isUnlocked = isModuleUnlocked(parseInt(moduleId));
        const isCompleted = moduleData.completed === moduleData.total && moduleData.testPassed;
        const isInProgress = moduleData.completed > 0 && !isCompleted;

        if (isCompleted) {
            moduleCard.setAttribute('data-status', 'completed');
            statusIcon.textContent = '✅';
            button.className = 'btn-primary';
            button.textContent = '✅ Пройдено';
            button.disabled = false;
        } else if (isInProgress) {
            moduleCard.setAttribute('data-status', 'in-progress');
            statusIcon.textContent = '🔄';
            button.className = 'btn-primary';
            button.textContent = 'Продолжить';
            button.disabled = false;
        } else if (isUnlocked) {
            moduleCard.setAttribute('data-status', 'unlocked');
            statusIcon.textContent = '🔓';
            button.className = 'btn-primary';
            button.textContent = 'Начать обучение';
            button.disabled = false;
        } else {
            moduleCard.setAttribute('data-status', 'locked');
            statusIcon.textContent = '🔒';
            button.className = 'btn-secondary';
            button.textContent = `🔒 Завершите Модуль ${parseInt(moduleId) - 1}`;
            button.disabled = true;
        }
    });
}

// Проверка, разблокирован ли модуль
function isModuleUnlocked(moduleId) {
    if (moduleId === 1) return true;
    
    const prevModule = userData.progress.modules[moduleId - 1];
    return prevModule.completed === prevModule.total && prevModule.testPassed;
}

// Открытие модуля
function openModule(moduleId) {
    if (!isModuleUnlocked(moduleId)) {
        tg.showAlert('Сначала завершите предыдущий модуль');
        return;
    }

    // Сохраняем текущий модуль
    sessionStorage.setItem('currentModule', moduleId);
    
    // Переход на страницу модуля
    window.location.href = `module.html?id=${moduleId}`;
}

// Навигация
function showHome() {
    window.location.href = 'index.html';
}

function showProgress() {
    window.location.href = 'progress.html';
}

function showCertificate() {
    // Проверяем, завершено ли обучение
    const allCompleted = Object.values(userData.progress.modules)
        .every(m => m.completed === m.total && m.testPassed);
    
    if (allCompleted) {
        window.location.href = 'certificate.html';
    } else {
        tg.showAlert('Завершите все модули, чтобы получить сертификат');
    }
}

// Обработчик кнопки "Назад" Telegram
tg.BackButton.onClick(() => {
    window.history.back();
});

// Запуск приложения
init();
