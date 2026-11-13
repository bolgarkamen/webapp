// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем приложение на весь экран

// Получаем данные пользователя из Телеграма
const user = tg.initDataUnsafe?.user;
if (user) {
    console.log("Привет, " + user.first_name + "!");
    // Здесь мы позже будем запрашивать баланс из базы данных
}

// Твоя логика
let currentBalance = 1000; 
document.getElementById('balance').innerText = currentBalance;

// Функция для кнопок кейсов
function openCase(caseName) {
    if (currentBalance >= 100) {
        currentBalance -= 100;
        document.getElementById('balance').innerText = currentBalance;
        // Вызываем красивое всплывающее окно Телеграма
        tg.showAlert(`Ты открыл ${caseName} кейс!\n\nСписано 100 монет.`);
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

// Переход на экран рулетки
function goToRoulette() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('roulette-screen').style.display = 'block';
}

// Возврат в меню
function goToMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('roulette-screen').style.display = 'none';
}
