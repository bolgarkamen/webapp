const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;
const userId = user ? user.id.toString() : "test_user";

let currentBalance = 1000;
let myCars = [];
let myNumbers = [];
let lastBonusTime = 0; // Время последнего бонуса

let isVibrationOn = localStorage.getItem('vibration') !== 'false';

const carsDB = [
    { name: "Toyota Camry", color: "Чёрный", img: "cars/toyota_new.png" },
    { name: "BMW M5", color: "Синий", img: "cars/bmw_new.png" },
    { name: "Lada Vesta", color: "Белый", img: "cars/lada_new.png" },
    { name: "Mercedes G-Class", color: "Серый", img: "cars/mercedes_new.png" },
    { name: "Audi RS6", color: "Красный", img: "cars/audi_new.png" }
];

const numbersDB = ["А001АА", "В777ВВ", "Е666КХ", "О777ОО", "М199ММ", "Х005ХХ", "К888КК", "Т999ТТ", "У001УУ"];

const API_URL = "https://overhear-probing-hundredth.ngrok-free.dev";

async function loadData() {
    try {
        const response = await fetch(`${API_URL}/api/get_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        currentBalance = data.balance;
        myCars = data.cars;
        myNumbers = data.numbers || [];
        lastBonusTime = parseInt(data.last_bonus) || 0;
        
        document.getElementById('balance').innerText = currentBalance;
        
        // ПРОВЕРКА ЕЖЕДНЕВНОГО БОНУСА
        checkDailyBonus();
        
    } catch (e) {
        console.log("Ошибка сервера", e);
        document.getElementById('balance').innerText = currentBalance;
    }
}
loadData();

async function saveData() {
    try {
        await fetch(`${API_URL}/api/save_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ 
                user_id: userId, 
                balance: currentBalance, 
                cars: myCars, 
                numbers: myNumbers,
                last_bonus: lastBonusTime.toString()
            })
        });
    } catch (e) {
        console.log("Ошибка сохранения", e);
    }
}

// ПРОВЕРКА БОНУСА (1 РАЗ В 24 ЧАСА)
function checkDailyBonus() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    
    if (now - lastBonusTime > oneDay) {
        document.getElementById('bonus-modal').style.display = 'flex';
    }
}

function claimBonus() {
    currentBalance += 500;
    lastBonusTime = Date.now();
    updateBalance();
    saveData();
    document.getElementById('bonus-modal').style.display = 'none';
    vibrate('success');
}

function updateBalance() {
    document.getElementById('balance').innerText = currentBalance;
}

function vibrate(type) {
    if (isVibrationOn && tg.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred('light');
    }
}

// --- КЕЙСЫ С МАШИНАМИ ---
function openCase(caseName, price) {
    if (currentBalance >= price) {
        currentBalance -= price;
        updateBalance();
        
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('roulette-screen').style.display = 'block';
        document.getElementById('roulette-title').innerText = `Крутим ${caseName} кейс...`;
        document.getElementById('car-result').style.display = 'none';
        document.getElementById('back-btn').style.display = 'none';

        setTimeout(() => {
            const randomCar = carsDB[Math.floor(Math.random() * carsDB.length)];
            myCars.push(randomCar);
            saveData();

            document.getElementById('roulette-title').innerText = "🎉 Ты выбил:";
            document.getElementById('car-name').innerText = randomCar.name;
            document.getElementById('car-details').innerText = `Цвет: ${randomCar.color}`;
            
            let resultBox = document.getElementById('car-result');
            let oldImg = resultBox.querySelector('img');
            if(oldImg) oldImg.remove();
            
            let img = document.createElement('img');
            img.src = randomCar.img;
            img.style.width = '150px';
            img.style.marginBottom = '10px';
            resultBox.insertBefore(img, document.getElementById('car-name'));

            document.getElementById('car-result').style.display = 'block';
            document.getElementById('back-btn').style.display = 'block';
            vibrate('success');
        }, 1500); 
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

// --- КЕЙСЫ С НОМЕРАМИ ---
function goToNumbersMenu() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('numbers-menu-screen').style.display = 'block';
}

function openNumberCase(caseName, price) {
    if (currentBalance >= price) {
        currentBalance -= price;
        updateBalance();
        
        document.getElementById('numbers-menu-screen').style.display = 'none';
        document.getElementById('number-result-screen').style.display = 'block';
        document.getElementById('number-text').innerText = "...";

        setTimeout(() => {
            const randomNum = numbersDB[Math.floor(Math.random() * numbersDB.length)];
            myNumbers.push(randomNum);
            saveData();

            document.getElementById('number-text').innerText = randomNum;
            vibrate('success');
        }, 1000); 
    } else {
        tg.showAlert("Недостаточно монет!");
    }
}

// --- ОБЩАЯ НАВИГАЦИЯ ---
function goToMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('roulette-screen').style.display = 'none';
    document.getElementById('roulette-game-screen').style.display = 'none';
    document.getElementById('garage-screen').style.display = 'none';
    document.getElementById('numbers-menu-screen').style.display = 'none';
    document.getElementById('number-result-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'none';
}

// --- РУЛЕТКА ---
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
        item.innerHTML = `<img src="${car.img}" style="width: 80px; height: 50px; object-fit: contain;"><div style="font-size: 12px; color: #fff; margin-top:5px;">${car.name}</div>`;
        track.appendChild(item);
    }
}

function spinRoulette() {
    if (currentBalance < 100) {
        tg.showAlert("Недостаточно монет!");
        return;
    }
    
    currentBalance -= 100;
    updateBalance();
    vibrate('light');
    
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
        myCars.push(winningCar);
        saveData();

        vibrate('success');
        
        tg.showAlert(`🎉 Ты выиграл: ${winningCar.name}!`, () => {
            btn.disabled = false;
            btn.innerText = "Крутить за 100 🪙";
            goToMenu();
        });
    }, 3200);
}

// --- ГАРАЖ ---
function goToGarage() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('garage-screen').style.display = 'block';
    
    const carList = document.getElementById('garage-list');
    carList.innerHTML = ''; 
    if (myCars.length === 0) {
        carList.innerHTML = '<p style="color: #ccc;">Нет машин.</p>';
    } else {
        myCars.forEach((car) => {
            const item = document.createElement('div');
            item.style.background = '#232e3c';
            item.style.padding = '15px';
            item.style.borderRadius = '10px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.innerHTML = `
                <img src="${car.img}" style="width: 80px; height: 50px; object-fit: contain; margin-right: 15px;">
                <div>
                    <h3 style="margin: 0; color: #ffd700;">${car.name}</h3>
                    <p style="margin: 5px 0 0 0; color: #ccc; font-size: 14px;">Цвет: ${car.color}</p>
                </div>
            `;
            carList.appendChild(item);
        });
    }

    const numList = document.getElementById('numbers-list');
    numList.innerHTML = '';
    if (myNumbers.length === 0) {
        numList.innerHTML = '<p style="color: #ccc;">Нет номеров.</p>';
    } else {
        myNumbers.forEach((num) => {
            const item = document.createElement('div');
            item.style.background = '#fff';
            item.style.color = '#000';
            item.style.padding = '10px 15px';
            item.style.borderRadius = '5px';
            item.style.border = '2px solid #000';
            item.style.fontFamily = 'monospace';
            item.style.fontWeight = 'bold';
            item.style.fontSize = '18px';
            item.innerText = num;
            numList.appendChild(item);
        });
    }
}

// --- НАСТРОЙКИ ---
function goToSettings() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    
    const vBtn = document.getElementById('vibration-btn');
    if (isVibrationOn) {
        vBtn.innerText = "📳 Вибрация: ВКЛ";
        vBtn.style.background = "#2b3e4e";
    } else {
        vBtn.innerText = "📴 Вибрация: ВЫКЛ";
        vBtn.style.background = "#555";
    }
}

function toggleVibration() {
    isVibrationOn = !isVibrationOn;
    localStorage.setItem('vibration', isVibrationOn);
    goToSettings(); 
    if (isVibrationOn) vibrate('light'); 
}

function contactDev() {
    tg.openTelegramLink('https://t.me/larin_a'); // Замени на свой ник
}

function resetProgress() {
    tg.showConfirm("Ты уверен, что хочешь сбросить весь прогресс?", (confirmed) => {
        if (confirmed) {
            localStorage.removeItem('vibration');
            window.location.reload();
        }
    });
}
