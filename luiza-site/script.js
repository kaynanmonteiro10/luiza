// === POKÉMON CUBONE INTERACTION ===
const cuboneSprite = document.getElementById('cuboneSprite');
const feedCuboneBtn = document.getElementById('feedCuboneBtn');
const berryContainer = document.getElementById('berryContainer');

feedCuboneBtn.addEventListener('click', () => {
    // Spawn a berry dropping
    const berry = document.createElement('div');
    berry.classList.add('berry');
    berry.innerText = ['🍒', '🍎', '🍇', '🍉'][Math.floor(Math.random() * 4)];
    berry.style.left = (Math.random() * 60 + 20) + '%';
    berry.style.top = '-20px';
    berryContainer.appendChild(berry);

    // Make Cubone jump
    cuboneSprite.classList.remove('jump');
    void cuboneSprite.offsetWidth; // trigger reflow
    cuboneSprite.classList.add('jump');

    setTimeout(() => {
        if(berryContainer.contains(berry)) {
            berryContainer.removeChild(berry);
        }
    }, 1000);
});

// Cubone cry on click
cuboneSprite.addEventListener('click', () => {
    // Pokecries API for Cubone (ID 104)
    const audio = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/104.ogg');
    audio.volume = 0.5;
    audio.play();

    cuboneSprite.classList.remove('jump');
    void cuboneSprite.offsetWidth;
    cuboneSprite.classList.add('jump');
});


// === ROCK N' ROLL SYNTH (Web Audio API) ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const pads = document.querySelectorAll('.pad');

function playSynth(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'kick') {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } 
    else if (type === 'snare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        const bufferSize = audioCtx.sampleRate * 0.2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(gainNode);
        
        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.2);
    }
    else if (type === 'guitar1') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220.00, now); // A3
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
    }
    else if (type === 'guitar2') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(329.63, now); // E4
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
    }
}

pads.forEach(pad => {
    pad.addEventListener('mousedown', () => {
        pad.classList.add('playing');
        playSynth(pad.dataset.sound);
    });
    pad.addEventListener('mouseup', () => pad.classList.remove('playing'));
    pad.addEventListener('mouseleave', () => pad.classList.remove('playing'));
    
    pad.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pad.classList.add('playing');
        playSynth(pad.dataset.sound);
    });
    pad.addEventListener('touchend', () => pad.classList.remove('playing'));
});


// === WORD SEARCH (Caça-Palavras) ===
// 8x5 grid
const gridData = [
  ['C','U','R','I','T','I','B','A'],
  ['X','Y','O','Z','A','K','P','L'],
  ['C','U','B','O','N','E','R','X'],
  ['V','I','A','G','E','M','O','Y'],
  ['Z','W','R','O','C','K','Q','P']
];

const targetWords = [
    { name: "CURITIBA", startRow: 0, startCol: 0, dx: 0, dy: 1, length: 8, id: "word-curitiba" },
    { name: "CUBONE", startRow: 2, startCol: 0, dx: 0, dy: 1, length: 6, id: "word-cubone" },
    { name: "VIAGEM", startRow: 3, startCol: 0, dx: 0, dy: 1, length: 6, id: "word-viagem" },
    { name: "ROCK", startRow: 4, startCol: 2, dx: 0, dy: 1, length: 4, id: "word-rock" }
];

const gridEl = document.getElementById('wordGrid');
let isSelecting = false;
let selectedCells = [];
let foundWordsCount = 0;

// Build grid
for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.classList.add('wd-cell');
        cell.innerText = gridData[r][c];
        cell.dataset.r = r;
        cell.dataset.c = c;
        
        // Mouse events
        cell.addEventListener('mousedown', (e) => {
            isSelecting = true;
            clearSelection();
            selectCell(cell);
        });
        
        cell.addEventListener('mouseenter', (e) => {
            if (isSelecting && !cell.classList.contains('found')) {
                selectCell(cell);
            }
        });
        
        // Touch events for mobile
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isSelecting = true;
            clearSelection();
            selectCell(cell);
        });
        
        gridEl.appendChild(cell);
    }
}

window.addEventListener('mouseup', endSelection);
window.addEventListener('touchend', endSelection);

// Handle mobile touch move over elements
gridEl.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isSelecting) {
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('wd-cell') && !el.classList.contains('found')) {
            if (!selectedCells.includes(el)) {
                selectCell(el);
            }
        }
    }
});

function selectCell(cell) {
    if(!cell.classList.contains('found')) {
        cell.classList.add('highlighted');
        selectedCells.push(cell);
    }
}

function clearSelection() {
    selectedCells.forEach(c => c.classList.remove('highlighted'));
    selectedCells = [];
}

function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;
    
    // check if current selection matches any target word
    let matchFound = false;
    for (let wordObj of targetWords) {
        if(document.getElementById(wordObj.id).classList.contains('found-word')) continue; // already found
        
        if (selectedCells.length === wordObj.length) {
            // Check if cells correspond to the word
            let correct = true;
            let currentR = wordObj.startRow;
            let currentC = wordObj.startCol;
            
            for(let i=0; i<wordObj.length; i++) {
                // we sort selected cells or just check if all necessary cells are in selectedCells
                const requiredCell = gridEl.querySelector(`.wd-cell[data-r="${currentR}"][data-c="${currentC}"]`);
                if (!selectedCells.includes(requiredCell)) {
                    correct = false;
                    break;
                }
                currentR += wordObj.startRow !== 0 && wordObj.dx !== 0 ? wordObj.dx : 0; // simplistic check, since we just do horizontal
                currentC += wordObj.dy;
            }
            
            if (correct && !matchFound) {
                // Word found!
                matchFound = true;
                selectedCells.forEach(c => {
                    c.classList.remove('highlighted');
                    c.classList.add('found');
                });
                document.getElementById(wordObj.id).classList.add('found-word');
                foundWordsCount++;
                
                // Play success sound logic if we had one
                
                if (foundWordsCount === targetWords.length) {
                     // All words found
                     setTimeout(() => {
                         alert("Você encontrou todas as palavras da jornada!");
                     }, 500);
                }
            }
        }
    }
    
    if(!matchFound) {
        clearSelection();
    }
}


// === SURPRISE MODAL & COUNTDOWN ===
const modal = document.getElementById("surpriseModal");
const btn = document.getElementById("surpriseBtn");
const closeBtn = document.getElementById("closeModalBtn");
const countdownEl = document.getElementById("countdown");

let countdownInterval;

// The target is Tomorrow at 10:00 AM.
function getTargetDate() {
    // Current local time
    const nowLocal = new Date();
    // Setting to tomorrow at 10:00:00
    const target = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1, 10, 0, 0);
    return target;
}

const targetDate = getTargetDate();

function updateTimer() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        countdownEl.innerHTML = "CHEGOL!!!! 🎉";
        clearInterval(countdownInterval);
        return;
    }
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    countdownEl.innerHTML = `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

btn.onclick = function() {
    modal.classList.add("show");
    
    // Start countdown when opened or just always update
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
    
    createFloatingAirplanes();
}

closeBtn.onclick = function() {
    modal.classList.remove("show");
    clearInterval(countdownInterval);
}

// Particle effect on modal open
function createFloatingAirplanes() {
    const emojis = ['✈️', '☁️', '❤️'];
    for(let i=0; i<15; i++) {
        const span = document.createElement('span');
        span.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.position = 'fixed';
        span.style.left = Math.random() * window.innerWidth + 'px';
        span.style.top = window.innerHeight + 'px';
        span.style.fontSize = (Math.random() * 20 + 20) + 'px';
        span.style.zIndex = '9999';
        span.style.pointerEvents = 'none';
        span.style.transition = 'all 2s ease-out';
        document.body.appendChild(span);
        
        setTimeout(() => {
            span.style.top = (Math.random() * window.innerHeight * 0.5) + 'px';
            span.style.opacity = '0';
            span.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${Math.random() + 0.5})`;
        }, 50);
        
        setTimeout(() => span.remove(), 2050);
    }
}

// Particles.js Configuration
if(typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": ["#c084fc", "#3b82f6", "#ffffff"] },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": {
                "enable": true, "distance": 150, "color": "#c084fc", "opacity": 0.2, "width": 1
            },
            "move": { "enable": true, "speed": 1.5, "direction": "none", "random": true }
        },
        "interactivity": {
            "events": { "onhover": { "enable": true, "mode": "bubble" } }
        }
    });
}
