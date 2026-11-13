const tg = window.Telegram.WebApp;
tg.expand();

let currentBalance = 1000; 
document.getElementById('balance').innerText = currentBalance;

function openCase(caseName) {
    if (currentBalance >= 100) {
        currentBalance -= 100;
        document.getElementById('balance').innerText = currentBalance;
        tg.showAlert(`Ты открыл ${caseName} кейс! Тут скоро будет машина.`);
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

function goToRoulette() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('roulette-screen').style.display = 'block';
}

function goToMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('roulette-screen').style.display = 'none';
}