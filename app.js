/* ============================================
   APP.JS - English Practice Application Logic
   ============================================ */

// ---- State ----
let currentSection = 'phan1';
let currentUtterance = null;
let speakingBtnRef = null;
let selectedVoice = null;
let availableVoices = [];

// ---- DOM References ----
const mainContent = document.getElementById('mainContent');
const sectionNav = document.getElementById('sectionNav');
const speakingToast = document.getElementById('speakingToast');
const stopSpeakingBtn = document.getElementById('stopSpeaking');
const scrollTopBtn = document.getElementById('scrollTop');
const themeToggle = document.getElementById('themeToggle');
const speedSelect = document.getElementById('speechSpeed');
const voiceSelect = document.getElementById('voiceSelect');
const particlesContainer = document.getElementById('particles');

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTheme();
    initVoices();
    renderSection(currentSection);
    initNavigation();
    initScrollTop();
    initStopSpeaking();
    updateStats();
});

// ---- Particles ----
function initParticles() {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#22c55e'];
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 20 + 15}s;
            animation-delay: ${Math.random() * 10}s;
        `;
        particlesContainer.appendChild(particle);
    }
}

// ---- Theme ----
function initTheme() {
    const saved = localStorage.getItem('ep-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ep-theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ---- Navigation ----
function initNavigation() {
    const tabs = sectionNav.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentSection = tab.dataset.section;
            renderSection(currentSection);
            // Scroll to content
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ---- Stats ----
function updateStats() {
    let totalUnits = 0;
    let totalQA = 0;
    Object.values(englishData).forEach(section => {
        totalUnits += section.units.length;
        section.units.forEach(unit => {
            totalQA += unit.items.length;
        });
    });
    document.getElementById('totalUnits').textContent = totalUnits;
    document.getElementById('totalQA').textContent = totalQA;
}

// ---- Render Section ----
function renderSection(sectionKey) {
    const section = englishData[sectionKey];
    if (!section) return;

    mainContent.innerHTML = '';

    section.units.forEach((unit, unitIndex) => {
        const card = createUnitCard(unit, unitIndex, sectionKey);
        mainContent.appendChild(card);
    });
}

function createUnitCard(unit, unitIndex, sectionKey) {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.style.animationDelay = `${unitIndex * 0.08}s`;
    card.id = `unit-${sectionKey}-${unitIndex}`;

    // Header
    const header = document.createElement('div');
    header.className = 'unit-header';
    header.innerHTML = `
        <div class="unit-header-left">
            <div class="unit-icon" style="background: ${unit.color}22;">
                <span>${unit.icon}</span>
            </div>
            <div class="unit-info">
                <h3>${unit.name}: ${unit.topic}</h3>
                <span class="unit-topic">${unit.topicVi} • ${unit.items.length} câu hỏi</span>
            </div>
        </div>
        <div class="unit-toggle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
    `;

    header.addEventListener('click', () => {
        card.classList.toggle('expanded');
    });

    // Body
    const body = document.createElement('div');
    body.className = 'unit-body';

    const bodyInner = document.createElement('div');
    bodyInner.className = 'unit-body-inner';

    // QA items
    unit.items.forEach((item, itemIndex) => {
        const qaItem = createQAItem(item, sectionKey, unitIndex, itemIndex);
        bodyInner.appendChild(qaItem);
    });

    // Play All Button
    const playAllBtn = document.createElement('button');
    playAllBtn.className = 'btn-play-all';
    playAllBtn.id = `play-all-${sectionKey}-${unitIndex}`;
    playAllBtn.innerHTML = '▶️ Phát tất cả câu hỏi & trả lời';
    playAllBtn.addEventListener('click', () => {
        playAllInUnit(unit, sectionKey, unitIndex);
    });
    bodyInner.appendChild(playAllBtn);

    body.appendChild(bodyInner);
    card.appendChild(header);
    card.appendChild(body);

    return card;
}

function createQAItem(item, sectionKey, unitIndex, itemIndex) {
    const qaItem = document.createElement('div');
    qaItem.className = 'qa-item';

    // Question
    const questionBlock = document.createElement('div');
    questionBlock.className = 'question-block';
    questionBlock.innerHTML = `
        <span class="qa-label q-label">Q</span>
        <div class="qa-content">
            <p class="qa-english">${item.q}</p>
            <p class="qa-vietnamese">${item.qVi}</p>
        </div>
    `;

    const qSpeakBtn = document.createElement('button');
    qSpeakBtn.className = 'btn-speak btn-speak-q';
    qSpeakBtn.id = `speak-q-${sectionKey}-${unitIndex}-${itemIndex}`;
    qSpeakBtn.innerHTML = '🔊';
    qSpeakBtn.title = 'Nghe phát âm câu hỏi';
    qSpeakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(item.q, qSpeakBtn);
    });
    questionBlock.appendChild(qSpeakBtn);

    // Answer
    const answerBlock = document.createElement('div');
    answerBlock.className = 'answer-block';
    answerBlock.innerHTML = `
        <span class="qa-label a-label">A</span>
        <div class="qa-content">
            <p class="qa-english">${item.a}</p>
            <p class="qa-vietnamese">${item.aVi}</p>
        </div>
    `;

    const aSpeakBtn = document.createElement('button');
    aSpeakBtn.className = 'btn-speak btn-speak-a';
    aSpeakBtn.id = `speak-a-${sectionKey}-${unitIndex}-${itemIndex}`;
    aSpeakBtn.innerHTML = '🔊';
    aSpeakBtn.title = 'Nghe phát âm câu trả lời';
    aSpeakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(item.a, aSpeakBtn);
    });
    answerBlock.appendChild(aSpeakBtn);

    qaItem.appendChild(questionBlock);
    qaItem.appendChild(answerBlock);

    return qaItem;
}

// ---- Voice Selection ----
function initVoices() {
    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;

        // Filter English voices
        availableVoices = voices.filter(v => v.lang.startsWith('en'));

        // Sort: Google first, then Microsoft, then others
        const priority = (v) => {
            const name = v.name.toLowerCase();
            if (name.includes('google')) return 0;
            if (name.includes('microsoft')) return 1;
            if (name.includes('samantha') || name.includes('daniel') || name.includes('alex')) return 2;
            return 3;
        };
        availableVoices.sort((a, b) => priority(a) - priority(b) || a.name.localeCompare(b.name));

        populateVoiceSelect();
    }

    // Voices may load asynchronously
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    voiceSelect.addEventListener('change', () => {
        const idx = parseInt(voiceSelect.value);
        selectedVoice = isNaN(idx) ? null : availableVoices[idx];
        localStorage.setItem('ep-voice', voiceSelect.value);

        // Preview: speak a short sample
        window.speechSynthesis.cancel();
        const sample = new SpeechSynthesisUtterance('Hello!');
        sample.lang = 'en-US';
        sample.rate = parseFloat(speedSelect.value);
        if (selectedVoice) sample.voice = selectedVoice;
        window.speechSynthesis.speak(sample);
    });
}

function populateVoiceSelect() {
    voiceSelect.innerHTML = '';

    if (availableVoices.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Không tìm thấy giọng Anh';
        voiceSelect.appendChild(opt);
        return;
    }

    // Group voices by provider
    const groups = {
        'Google': [],
        'Microsoft': [],
        'Apple': [],
        'Khác': []
    };

    availableVoices.forEach((voice, idx) => {
        const name = voice.name.toLowerCase();
        let group = 'Khác';
        if (name.includes('google')) group = 'Google';
        else if (name.includes('microsoft')) group = 'Microsoft';
        else if (name.includes('samantha') || name.includes('daniel') || name.includes('alex') || name.includes('karen') || name.includes('moira') || name.includes('tessa') || name.includes('fiona')) group = 'Apple';

        groups[group].push({ voice, idx });
    });

    // Create optgroups
    const providerLabels = {
        'Google': '🔵 Google (Tự nhiên)',
        'Microsoft': '🟦 Microsoft',
        'Apple': '🍎 Apple',
        'Khác': '🔸 Khác'
    };

    for (const [groupKey, entries] of Object.entries(groups)) {
        if (entries.length === 0) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = providerLabels[groupKey];

        entries.forEach(({ voice, idx }) => {
            const opt = document.createElement('option');
            opt.value = idx;

            // Build a friendly name
            const langTag = voice.lang;
            let displayName = voice.name
                .replace('Google ', '')
                .replace('Microsoft ', '')
                .replace(' Online (Natural)', '')
                .replace(' - English', '');
            displayName += ` (${langTag})`;

            opt.textContent = displayName;
            if (groupKey === 'Google') opt.className = 'voice-opt-google';
            if (groupKey === 'Microsoft') opt.className = 'voice-opt-microsoft';

            optgroup.appendChild(opt);
        });

        voiceSelect.appendChild(optgroup);
    }

    // Restore saved selection
    const saved = localStorage.getItem('ep-voice');
    if (saved !== null && saved !== '') {
        voiceSelect.value = saved;
        const idx = parseInt(saved);
        selectedVoice = isNaN(idx) ? null : availableVoices[idx];
    } else {
        // Default: pick the first Google voice if available
        const firstGoogle = availableVoices.findIndex(v => v.name.toLowerCase().includes('google'));
        if (firstGoogle >= 0) {
            voiceSelect.value = firstGoogle;
            selectedVoice = availableVoices[firstGoogle];
        } else {
            voiceSelect.selectedIndex = 0;
            selectedVoice = availableVoices[0];
        }
        localStorage.setItem('ep-voice', voiceSelect.value);
    }
}

// ---- Text-to-Speech ----
function speak(text, btnElement) {
    // Stop any current speech
    window.speechSynthesis.cancel();

    // Remove speaking state from previous button
    if (speakingBtnRef) {
        speakingBtnRef.classList.remove('speaking');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = parseFloat(speedSelect.value);
    utterance.pitch = 1;

    // Use the user-selected voice
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        // Fallback: try any English voice
        const voices = window.speechSynthesis.getVoices();
        const anyEnglish = voices.find(v => v.lang.startsWith('en'));
        if (anyEnglish) utterance.voice = anyEnglish;
    }

    // Set speaking state
    btnElement.classList.add('speaking');
    speakingBtnRef = btnElement;
    showSpeakingToast(true);

    utterance.onend = () => {
        btnElement.classList.remove('speaking');
        speakingBtnRef = null;
        showSpeakingToast(false);
    };

    utterance.onerror = () => {
        btnElement.classList.remove('speaking');
        speakingBtnRef = null;
        showSpeakingToast(false);
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
}

function playAllInUnit(unit, sectionKey, unitIndex) {
    window.speechSynthesis.cancel();

    const allTexts = [];
    unit.items.forEach((item, itemIndex) => {
        allTexts.push({
            text: item.q,
            btnId: `speak-q-${sectionKey}-${unitIndex}-${itemIndex}`
        });
        allTexts.push({
            text: item.a,
            btnId: `speak-a-${sectionKey}-${unitIndex}-${itemIndex}`
        });
    });

    let index = 0;

    function playNext() {
        if (index >= allTexts.length) {
            showSpeakingToast(false);
            return;
        }

        const current = allTexts[index];
        const btn = document.getElementById(current.btnId);
        if (btn) {
            speak(current.text, btn);
            // Wait for this utterance to end, then play next
            const checkEnd = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(checkEnd);
                    index++;
                    // Small delay between sentences
                    setTimeout(playNext, 400);
                }
            }, 100);
        } else {
            index++;
            playNext();
        }
    }

    playNext();
}

// ---- Speaking Toast ----
function showSpeakingToast(show) {
    if (show) {
        speakingToast.classList.add('visible');
    } else {
        speakingToast.classList.remove('visible');
    }
}

// ---- Stop Speaking ----
function initStopSpeaking() {
    stopSpeakingBtn.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        if (speakingBtnRef) {
            speakingBtnRef.classList.remove('speaking');
            speakingBtnRef = null;
        }
        showSpeakingToast(false);
    });
}

// ---- Scroll Top ----
function initScrollTop() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Voice loading is now handled by initVoices()
