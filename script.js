const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;
const userId = user ? user.id.toString() : "test_user";
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get('ref') || "0";

let currentBalance = 1000;
let myCars = [];
let carPrices = []; 
let myNumbers = [];
let lastBonusTime = 0;
let isVibrationOn = localStorage.getItem('vibration') !== 'false';

let clickerInterval;
let clickerTimeLeft = 15;
let clickerScore = 0;
let isClickerActive = false;

// Переменная для вращения колеса
let currentWheelRotation = 0;

const carsDB = [
    { name: "Toyota Camry", color: "Чёрный", img: "cars/toyota_new.png", price: 40 },
    { name: "BMW M5", color: "Синий", img: "cars/bmw_new.png", price: 200 },
    { name: "Lada Vesta", color: "Белый", img: "cars/lada_new.png", price: 20 },
    { name: "Mercedes G-Class", color: "Серый", img: "cars/mercedes_new.png", price: 400 },
    { name: "Audi RS6", color: "Красный", img: "cars/audi_new.png", price: 150 }
];

const numbersDB = ["А001АА", "В777ВВ", "Е666КХ", "О777ОО", "М199ММ", "Х005ХХ", "К888КК", "Т999ТТ", "У001УУ"];
const API_URL = "https://overhear-probing-hundredth.ngrok-free.dev";

const allScreens = [
    'menu-screen', 'roulette-screen', 'roulette-game-screen', 
    'garage-screen', 'numbers-menu-screen', 'number-result-screen', 
    'settings-screen', 'clicker-screen'
];

function showScreen(screenId) {
    allScreens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'block';
    
    if (screenId !== 'clicker-screen') {
        clearInterval(clickerInterval);
        isClickerActive = false;
    }
}

async function loadData() {
    try {
        const response = await fetch(`${API_URL}/api/get_user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ user_id: userId, referrer_id: referrerId })
        });
        const data = await response.json();
        currentBalance = Number(data.balance);
        myCars = data.cars;
        carPrices = data.car_prices || [];
        myNumbers = data.numbers || [];
        lastBonusTime = parseInt(data.last_bonus) || 0;
        
        document.getElementById('balance').innerText = currentBalance;
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
                user_id: userId, balance: currentBalance, cars: myCars, numbers: myNumbers, 
                last_bonus: lastBonusTime.toString(), car_prices: carPrices
            })
        });
    } catch (e) { console.log("Ошибка сохранения", e); }
}

function checkDailyBonus() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - lastBonusTime > oneDay) { document.getElementById('bonus-modal').style.display = 'flex'; }
}

function claimBonus() {
    currentBalance += 500; lastBonusTime = Date.now(); updateBalance(); saveData();
    document.getElementById('bonus-modal').style.display = 'none'; vibrate('success');
}

function updateBalance() { document.getElementById('balance').innerText = currentBalance; }
function vibrate(type) {
    if (isVibrationOn && tg.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred('light');
    }
}

function goToMenu() { showScreen('menu-screen'); }
function goToNumbersMenu() { showScreen('numbers-menu-screen'); }
function goToRoulette() { showScreen('roulette-game-screen'); }
function goToClicker() { showScreen('clicker-screen'); resetClicker(); }

// --- КРУТИМ КОЛЕСО ---
function spinWheel() {
    if (currentBalance < 100) { tg.showAlert("Недостаточно монет!"); return; }
    
    currentBalance -= 100; 
    updateBalance(); 
    vibrate('light');
    
    const btn = document.getElementById('spin-btn');
    btn.disabled = true; 
    btn.innerText = "Крутится...";
    
    const wheel = document.getElementById('wheel');
    
    const randomDegrees = Math.floor(Math.random() * 360);
    currentWheelRotation += 1800 + randomDegrees; 
    
    wheel.style.transform = `rotate(${currentWheelRotation}deg)`;
    
    setTimeout(() => {
        const winningCar = carsDB[Math.floor(Math.random() * carsDB.length)];
        myCars.push({ name: winningCar.name, color: winningCar.color, img: winningCar.img });
        carPrices.push(Number(winningCar.price));
        saveData(); 
        vibrate('success');
        
        tg.showAlert(`🎉 Колесо остановилось!\nТы выиграл: ${winningCar.name}!`, () => {
            btn.disabled = false; 
            btn.innerText = "Крутить за 100 🪙"; 
            goToMenu();
        });
    }, 4100);
}

function goToGarage() {
    showScreen('garage-screen');
    const carList = document.getElementById('garage-list');
    carList.innerHTML = ''; 
    if (myCars.length === 0) { carList.innerHTML = '<p style="color: #ccc;">Нет машин.</p>'; } 
    else {
        myCars.forEach((car, index) => {
            const price = carPrices[index] || 0;
            const item = document.createElement('div');
            item.style.background = '#232e3c'; item.style.padding = '10px'; item.style.borderRadius = '10px'; item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center';
            item.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <img src="${car.img}" style="width: 60px; height: 40px; object-fit: contain; margin-right: 10px;">
                    <div><h3 style="margin: 0; color: #ffd700; font-size: 16px;">${car.name}</h3></div>
                </div>
                <button onclick="sellCar(${index})" style="background: #c0392b; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; font-weight: bold; cursor: pointer;">Продать (${price} 🪙)</button>
            `;
            carList.appendChild(item);
        });
    }
    const numList = document.getElementById('numbers-list');
    numList.innerHTML = '';
    if (myNumbers.length === 0) { numList.innerHTML = '<p style="color: #ccc;">Нет номеров.</p>'; } 
    else {
        myNumbers.forEach((num) => {
            const item = document.createElement('div');
            item.style.background = '#fff'; item.style.color = '#000'; item.style.padding = '10px 15px'; item.style.borderRadius = '5px'; item.style.border = '2px solid #000'; item.style.fontFamily = 'monospace'; item.style.fontWeight = 'bold'; item.style.fontSize = '18px';
            item.innerText = num; numList.appendChild(item);
        });
    }
}

function goToSettings() {
    showScreen('settings-screen');
    const vBtn = document.getElementById('vibration-btn');
    if (isVibrationOn) { vBtn.innerText = "📳 Вибрация: ВКЛ"; vBtn.style.background = "#2b3e4e"; } 
    else { vBtn.innerText = "📴 Вибрация: ВЫКЛ"; vBtn.style.background = "#555"; }
}

function openCase(caseName, price) {
    if (currentBalance >= price) {
        currentBalance -= price;
        updateBalance();
        showScreen('roulette-screen');
        document.getElementById('roulette-title').innerText = `Крутим ${caseName} кейс...`;
        document.getElementById('car-result').style.display = 'none';
        document.getElementById('back-btn').style.display = 'none';
        setTimeout(() => {
            const randomCar = carsDB[Math.floor(Math.random() * carsDB.length)];
            myCars.push({ name: randomCar.name, color: randomCar.color, img: randomCar.img });
            carPrices.push(Number(randomCar.price));
            saveData();
            document.getElementById('roulette-title').innerText = "🎉 Ты выбил:";
            document.getElementById('car-name').innerText = randomCar.name;
            let resultBox = document.getElementById('car-result');
            let oldImg = resultBox.querySelector('img'); if(oldImg) oldImg.remove();
            let img = document.createElement('img'); img.src = randomCar.img; img.style.width = '150px'; img.style.marginBottom = '10px';
            resultBox.insertBefore(img, document.getElementById('car-name'));
            document.getElementById('car-result').style.display = 'block';
            document.getElementById('back-btn').style.display = 'block';
            vibrate('success');
        }, 1500); 
    } else { tg.showAlert("Недостаточно монет!"); }
}

function openNumberCase(caseName, price) {
    if (currentBalance >= price) {
        currentBalance -= price; updateBalance(); showScreen('number-result-screen');
        document.getElementById('number-text').innerText = "...";
        setTimeout(() => {
            const randomNum = numbersDB[Math.floor(Math.random() * numbersDB.length)];
            myNumbers.push(randomNum); saveData();
            document.getElementById('number-text').innerText = randomNum; vibrate('success');
        }, 1000); 
    } else { tg.showAlert("Недостаточно монет!"); }
}

function sellCar(index) {
    const car = myCars[index]; const price = Number(carPrices[index]) || 0; if (!car) return;
    tg.showConfirm(`Ты хочешь продать ${car.name} за ${price} монет?`, (confirmed) => {
        if (confirmed) {
            currentBalance = Number(currentBalance) + price; updateBalance();
            myCars.splice(index, 1); carPrices.splice(index, 1); 
            saveData(); vibrate('success'); goToGarage(); 
        }
    });
}

function resetClicker() {
    clearInterval(clickerInterval); clickerTimeLeft = 15; clickerScore = 0; isClickerActive = false;
    document.getElementById('clicker-timer').innerText = clickerTimeLeft;
    document.getElementById('clicker-earned').innerText = clickerScore;
    document.getElementById('start-clicker-btn').style.display = 'block';
    document.getElementById('start-clicker-btn').innerText = "Начать игру";
}

function startClicker() {
    if (isClickerActive) return; isClickerActive = true;
    document.getElementById('start-clicker-btn').style.display = 'none';
    const randomCar = carsDB[Math.floor(Math.random() * carsDB.length)];
    document.getElementById('clicker-car').src = randomCar.img;
    clickerInterval = setInterval(() => {
        clickerTimeLeft--; document.getElementById('clicker-timer').innerText = clickerTimeLeft;
        if (clickerTimeLeft <= 0) {
            clearInterval(clickerInterval); isClickerActive = false;
            currentBalance += clickerScore; updateBalance(); saveData(); vibrate('success');
            tg.showAlert(`Игра окончена! Ты заработал ${clickerScore} монет.`, () => { goToMenu(); });
        }
    }, 1000);
}

document.getElementById('clicker-area').addEventListener('click', () => {
    if (!isClickerActive) return;
    clickerScore += 5; document.getElementById('clicker-earned').innerText = clickerScore;
    const carImg = document.getElementById('clicker-car'); carImg.style.transform = 'scale(0.9)';
    setTimeout(() => { carImg.style.transform = 'scale(1)'; }, 100);
    vibrate('light');
});

function toggleVibration() { isVibrationOn = !isVibrationOn; localStorage.setItem('vibration', isVibrationOn); goToSettings(); if (isVibrationOn) vibrate('light'); }

// ССЫЛКА НА ТЕБЯ
function contactDev() { tg.openTelegramLink('https://t.me/QLTET'); }

function inviteFriend() { const inviteLink = `https://t.me/Krutimotorbot?start=${userId}`; const text = `Привет! Заходи в АвтоРулетку, тут можно выбить крутые тачки. Тебе дадут бонус! 🚗`; tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`); }
function resetProgress() { tg.showConfirm("Ты уверен, что хочешь сбросить весь прогресс?", (confirmed) => { if (confirmed) { localStorage.removeItem('vibration'); window.location.reload(); } }); }
