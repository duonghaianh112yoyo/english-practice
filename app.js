/* ============================================
   APP.JS - English Practice Application Logic
   ============================================ */

// ---- State ----
let currentSection = 'phan1';
let currentUtterance = null;
let speakingBtnRef = null;
let selectedVoice = null;
let availableVoices = [];

// ---- Edit State ----
let editingItem = null; // { sectionKey, unitIndex, itemIndex }
let customEdits = {}; // stored edits from localStorage

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
    loadCustomEdits();
    initParticles();
    initTheme();
    initVoices();
    renderSection(currentSection);
    initNavigation();
    initScrollTop();
    initStopSpeaking();
    initEditModal();
    updateStats();
    createSaveToast();
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
    // Get the effective data (with custom edits applied)
    const effectiveItem = getEffectiveItem(sectionKey, unitIndex, itemIndex);
    const isEdited = hasCustomEdit(sectionKey, unitIndex, itemIndex);

    const qaItem = document.createElement('div');
    qaItem.className = 'qa-item' + (isEdited ? ' edited' : '');
    qaItem.id = `qa-${sectionKey}-${unitIndex}-${itemIndex}`;

    // Question
    const questionBlock = document.createElement('div');
    questionBlock.className = 'question-block';
    questionBlock.innerHTML = `
        <span class="qa-label q-label">Q</span>
        <div class="qa-content">
            <p class="qa-english">${effectiveItem.q}</p>
            <p class="qa-vietnamese">${effectiveItem.qVi}</p>
        </div>
    `;

    const qSpeakBtn = document.createElement('button');
    qSpeakBtn.className = 'btn-speak btn-speak-q';
    qSpeakBtn.id = `speak-q-${sectionKey}-${unitIndex}-${itemIndex}`;
    qSpeakBtn.innerHTML = '🔊';
    qSpeakBtn.title = 'Nghe phát âm câu hỏi';
    qSpeakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(effectiveItem.q, qSpeakBtn);
    });
    questionBlock.appendChild(qSpeakBtn);

    // Edit button for question row
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.id = `edit-${sectionKey}-${unitIndex}-${itemIndex}`;
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Chỉnh sửa';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(sectionKey, unitIndex, itemIndex);
    });
    questionBlock.appendChild(editBtn);

    // Answer
    const answerBlock = document.createElement('div');
    answerBlock.className = 'answer-block';
    answerBlock.innerHTML = `
        <span class="qa-label a-label">A</span>
        <div class="qa-content">
            <p class="qa-english">${effectiveItem.a}</p>
            <p class="qa-vietnamese">${effectiveItem.aVi}</p>
        </div>
    `;

    const aSpeakBtn = document.createElement('button');
    aSpeakBtn.className = 'btn-speak btn-speak-a';
    aSpeakBtn.id = `speak-a-${sectionKey}-${unitIndex}-${itemIndex}`;
    aSpeakBtn.innerHTML = '🔊';
    aSpeakBtn.title = 'Nghe phát âm câu trả lời';
    aSpeakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(effectiveItem.a, aSpeakBtn);
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
        const effectiveItem = getEffectiveItem(sectionKey, unitIndex, itemIndex);
        allTexts.push({
            text: effectiveItem.q,
            btnId: `speak-q-${sectionKey}-${unitIndex}-${itemIndex}`
        });
        allTexts.push({
            text: effectiveItem.a,
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

// ---- Custom Edits (localStorage) ----
const EDITS_STORAGE_KEY = 'ep-custom-edits';

function loadCustomEdits() {
    try {
        const saved = localStorage.getItem(EDITS_STORAGE_KEY);
        customEdits = saved ? JSON.parse(saved) : {};
    } catch (e) {
        customEdits = {};
    }
}

function saveCustomEdits() {
    localStorage.setItem(EDITS_STORAGE_KEY, JSON.stringify(customEdits));
}

function getEditKey(sectionKey, unitIndex, itemIndex) {
    return `${sectionKey}_${unitIndex}_${itemIndex}`;
}

function hasCustomEdit(sectionKey, unitIndex, itemIndex) {
    return !!customEdits[getEditKey(sectionKey, unitIndex, itemIndex)];
}

function getEffectiveItem(sectionKey, unitIndex, itemIndex) {
    const original = englishData[sectionKey].units[unitIndex].items[itemIndex];
    const key = getEditKey(sectionKey, unitIndex, itemIndex);
    const edit = customEdits[key];
    if (edit) {
        return {
            q: edit.q ?? original.q,
            qVi: edit.qVi ?? original.qVi,
            a: edit.a ?? original.a,
            aVi: edit.aVi ?? original.aVi
        };
    }
    return original;
}

// ---- Edit Modal ----
function initEditModal() {
    const modal = document.getElementById('editModal');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('editCancel');
    const saveBtn = document.getElementById('editSave');
    const resetBtn = document.getElementById('editReset');

    closeBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            closeEditModal();
        }
    });

    saveBtn.addEventListener('click', () => {
        if (!editingItem) return;

        const { sectionKey, unitIndex, itemIndex } = editingItem;
        const key = getEditKey(sectionKey, unitIndex, itemIndex);

        customEdits[key] = {
            q: document.getElementById('editQ').value.trim(),
            qVi: document.getElementById('editQVi').value.trim(),
            a: document.getElementById('editA').value.trim(),
            aVi: document.getElementById('editAVi').value.trim()
        };

        saveCustomEdits();
        closeEditModal();
        // Re-render to reflect changes
        renderSection(currentSection);
        showSaveToast('✅ Đã lưu thay đổi!');
    });

    resetBtn.addEventListener('click', () => {
        if (!editingItem) return;

        const { sectionKey, unitIndex, itemIndex } = editingItem;
        const key = getEditKey(sectionKey, unitIndex, itemIndex);
        const original = englishData[sectionKey].units[unitIndex].items[itemIndex];

        // Remove custom edit
        delete customEdits[key];
        saveCustomEdits();

        // Fill modal with original values
        document.getElementById('editQ').value = original.q;
        document.getElementById('editQVi').value = original.qVi;
        document.getElementById('editA').value = original.a;
        document.getElementById('editAVi').value = original.aVi;

        closeEditModal();
        renderSection(currentSection);
        showSaveToast('🔄 Đã khôi phục về bản gốc!');
    });
}

function openEditModal(sectionKey, unitIndex, itemIndex) {
    editingItem = { sectionKey, unitIndex, itemIndex };
    const effectiveItem = getEffectiveItem(sectionKey, unitIndex, itemIndex);

    document.getElementById('editQ').value = effectiveItem.q;
    document.getElementById('editQVi').value = effectiveItem.qVi;
    document.getElementById('editA').value = effectiveItem.a;
    document.getElementById('editAVi').value = effectiveItem.aVi;

    const modal = document.getElementById('editModal');
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Focus on the first textarea
    setTimeout(() => document.getElementById('editQ').focus(), 100);
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('visible');
    document.body.style.overflow = '';
    editingItem = null;
}

// ---- Save Toast ----
function createSaveToast() {
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.id = 'saveToast';
    document.body.appendChild(toast);
}

function showSaveToast(message) {
    const toast = document.getElementById('saveToast');
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 2200);
}
