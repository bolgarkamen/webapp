const tg = window.Telegram.WebApp;
tg.expand();

// Загружаем баланс из памяти (если нет — ставим 1000)
let currentBalance = parseInt(localStorage.getItem('balance')) || 1000;
document.getElementById('balance').innerText = currentBalance;

// Загружаем гараж из памяти (если нет — пустой массив)
let myCars = JSON.parse(localStorage.getItem('myCars')) || [];

const carsDB = [
    { name: "Toyota Camry", color: "Чёрный" },
    { name: "BMW M5", color: "Синий" },
    { name: "Lada Vesta", color: "Белый" },
    { name: "Mercedes G-Class", color: "Серый" },
    { name: "Audi RS6", color: "Красный" },
    { name: "Tesla Model 3", color: "Белый" }
];

// Вспомогательная функция для сохранения баланса
function saveBalance() {
    localStorage.setItem('balance', currentBalance);
    document.getElementById('balance').innerText = currentBalance;
}

// --- ЛОГИКА КЕЙСОВ ---
function openCase(caseName, price) {
    if (currentBalance >= price) {
        currentBalance -= price;
        saveBalance();
        
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('roulette-screen').style.display = 'block';
        document.getElementById('roulette-title').innerText = `Крутим ${caseName} кейс...`;
        document.getElementById('car-result').style.display = 'none';
        document.getElementById('back-btn').style.display = 'none';

        setTimeout(() => {
            const randomCar = carsDB[Math.floor(Math.random() * carsDB.length)];
            
            // ДОБАВЛЯЕМ МАШИНУ В ГАРАЖ И СОХРАНЯЕМ
            myCars.push(randomCar);
            localStorage.setItem('myCars', JSON.stringify(myCars));

            document.getElementById('roulette-title').innerText = "🎉 Ты выбил:";
            document.getElementById('car-name').innerText = randomCar.name;
            document.getElementById('car-details').innerText = `Цвет: ${randomCar.color}`;
            document.getElementById('car-result').style.display = 'block';
            document.getElementById('back-btn').style.display = 'block';
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }, 1500); 
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

function goToMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('roulette-screen').style.display = 'none';
    document.getElementById('roulette-game-screen').style.display = 'none';
    document.getElementById('garage-screen').style.display = 'none';
}

// --- ЛОГИКА РУЛЕТКИ ---
function goToRoulette() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('roulette-game-screen').style.display = 'block';
    buildRouletteTrack();
}

function buildRouletteTrack() {
    const track = document.getElementById('roulette-track');
    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    
    for (let i = 0; i < 30; i++) {
        const car = carsDB[Math.floor(Math.random() * carsDB.length)];
        const item = document.createElement('div');
        item.style.minWidth = '100px';
        item.style.textAlign = 'center';
        item.style.padding = '10px';
        item.style.borderRight = '1px solid #333';
        item.innerHTML = `<div style="font-size: 30px;">🚗</div><div style="font-size: 12px; color: #fff; margin-top:5px;">${car.name}</div>`;
        track.appendChild(item);
    }
}

function spinRoulette() {
    if (currentBalance < 100) {
        tg.showAlert("Недостаточно монет!");
        return;
    }
    
    currentBalance -= 100;
    saveBalance();
    
    const btn = document.getElementById('spin-btn');
    btn.disabled = true;
    btn.innerText = "Крутится...";
    
    const track = document.getElementById('roulette-track');
    const winIndex = Math.floor(Math.random() * 5) + 15;
    const itemWidth = 102;
    
    const centerOffset = window.innerWidth / 2;
    const offset = -(winIndex * itemWidth) - 50 + centerOffset; 
    
    track.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
    track.style.transform = `translateX(${offset}px)`;
    
    setTimeout(() => {
        const winningCar = carsDB[Math.floor(Math.random() * carsDB.length)];
        
        // ДОБАВЛЯЕМ МАШИНУ В ГАРАЖ И СОХРАНЯЕМ
        myCars.push(winningCar);
        localStorage.setItem('myCars', JSON.stringify(myCars));

        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        
        tg.showAlert(`🎉 Ты выиграл: ${winningCar.name}!`, () => {
            btn.disabled = false;
            btn.innerText = "Крутить за 100 🪙";
            goToMenu();
        });
    }, 3200);
}

// --- ЛОГИКА ГАРАЖА ---
function goToGarage() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('garage-screen').style.display = 'block';
    
    const list = document.getElementById('garage-list');
    list.innerHTML = ''; // Очищаем список
    
    if (myCars.length === 0) {
        list.innerHTML = '<p style="color: #ccc; text-align: center;">Твой гараж пуст. Крути рулетку или открывай кейсы!</p>';
        return;
    }

    // Проходимся по всем сохраненным машинам и создаем для них карточки
    myCars.forEach((car, index) => {
        const item = document.createElement('div');
        item.style.background = '#232e3c';
        item.style.padding = '15px';
        item.style.borderRadius = '10px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        
        item.innerHTML = `
            <div>
                <h3 style="margin: 0; color: #ffd700;">${car.name}</h3>
                <p style="margin: 5px 0 0 0; color: #ccc; font-size: 14px;">Цвет: ${car.color}</p>
            </div>
            <div style="font-size: 30px;">🚗</div>
        `;
        list.appendChild(item);
    });
}
