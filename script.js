const tg = window.Telegram.WebApp;
tg.expand();

let currentBalance = 1000; 
document.getElementById('balance').innerText = currentBalance;

const carsDB = [
    { name: "Toyota Camry", color: "Чёрный" },
    { name: "BMW M5", color: "Синий" },
    { name: "Lada Vesta", color: "Белый" },
    { name: "Mercedes G-Class", color: "Серый" },
    { name: "Audi RS6", color: "Красный" },
    { name: "Tesla Model 3", color: "Белый" }
];

function openCase(caseName) {
    if (currentBalance >= 100) {
        currentBalance -= 100;
        document.getElementById('balance').innerText = currentBalance;
        
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('roulette-screen').style.display = 'block';
        document.getElementById('roulette-title').innerText = `Крутим ${caseName} кейс...`;
        document.getElementById('car-result').style.display = 'none';
        document.getElementById('back-btn').style.display = 'none';

        setTimeout(() => {
            const randomCar = carsDB[Math.floor(Math.random() * carsDB.length)];
            
            document.getElementById('roulette-title').innerText = "🎉 Ты выбил:";
            document.getElementById('car-name').innerText = randomCar.name;
            document.getElementById('car-details').innerText = `Цвет: ${randomCar.color}`;
            
            document.getElementById('car-result').style.display = 'block';
            document.getElementById('back-btn').style.display = 'block';
            
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }, 1500); 
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

function goToRoulette() {
    tg.showAlert("Рулетка в разработке! Пока крути кейсы.");
}

function goToMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('roulette-screen').style.display = 'none';
}
