document.addEventListener('DOMContentLoaded', () => {
    // Session ID management
    let sessionId = localStorage.getItem('voice_session_id');
    if (!sessionId) {
        sessionId = 'web-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('voice_session_id', sessionId);
    }

    // Tab Navigation Logic
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabContents.forEach(content => {
            if (content.id === `tab-${tabId}`) {
                content.classList.remove('hidden');
                content.classList.add('flex');
            } else {
                content.classList.add('hidden');
                content.classList.remove('flex');
            }
        });

        navTabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.className = "nav-tab px-4 py-1.5 rounded-full text-sm font-semibold transition-all bg-surface-container text-primary shadow-[inset_0_0_12px_rgba(6,182,212,0.15)] border border-primary/20";
            } else {
                tab.className = "nav-tab px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-all";
            }
        });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // DOM Elements
    const startCallBtn = document.getElementById('startCallBtn');
    const orbContainer = document.getElementById('orbContainer');
    const callOverlay = document.getElementById('callOverlay');
    const endCallBtn = document.getElementById('endCallBtn');
    const transcriptEl = document.getElementById('transcript');
    const latestReply = document.getElementById('latestReply');
    const speakAgainBtn = document.getElementById('speakAgainBtn');
    const toolExecutionBody = document.getElementById('toolExecutionBody');
    const consoleStatus = document.getElementById('consoleStatus');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const langSelect = document.getElementById('langSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    const muteAudioBtn = document.getElementById('muteAudioBtn');
    const muteBtnLabel = document.getElementById('muteBtnLabel');
    const textInputToggleBtn = document.getElementById('textInputToggleBtn');
    const textInputRow = document.getElementById('textInputRow');
    const textInput = document.getElementById('textInput');
    const sendBtn = document.getElementById('sendBtn');
    const heroStatusHeading = document.getElementById('heroStatusHeading');
    const heroStatusSubtext = document.getElementById('heroStatusSubtext');
    const directivePills = document.querySelectorAll('.directive-pill');

    // Telephony Elements
    const webhookUrlInput = document.getElementById('webhookUrlInput');
    const copyWebhookBtn = document.getElementById('copyWebhookBtn');
    const startSimulatedCallBtn = document.getElementById('startSimulatedCallBtn');
    const simulatedPhoneInput = document.getElementById('simulatedPhoneInput');
    const simulatedCallLog = document.getElementById('simulatedCallLog');
    const directCallModalBtn = document.getElementById('directCallModalBtn');

    let isListening = false;
    let isMuted = false;
    let recognition = null;
    let currentReplyText = "";
    let availableVoices = [];

    if (webhookUrlInput) {
        webhookUrlInput.value = `${window.location.origin}/twilio/voice`;
    }

    // Voice Synthesis Population
    function populateVoices() {
        if (!('speechSynthesis' in window)) return;
        availableVoices = window.speechSynthesis.getVoices();
        
        if (voiceSelect) {
            voiceSelect.innerHTML = '';
            if (availableVoices.length === 0) {
                voiceSelect.innerHTML = '<option value="">Default System Voice</option>';
                return;
            }
            availableVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `🗣️ ${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            const savedVoiceIdx = localStorage.getItem('voice_index');
            if (savedVoiceIdx !== null && availableVoices[savedVoiceIdx]) {
                voiceSelect.value = savedVoiceIdx;
            }
        }
    }
    populateVoices();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    if (voiceSelect) {
        voiceSelect.addEventListener('change', () => {
            localStorage.setItem('voice_index', voiceSelect.value);
            if (currentReplyText) speakText("Voice changed.");
        });
    }

    // Web Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = langSelect.value;

        recognition.onstart = () => {
            isListening = true;
            callOverlay.classList.remove('opacity-0', 'pointer-events-none');
            callOverlay.classList.add('opacity-100', 'pointer-events-auto');
            heroStatusHeading.textContent = "Vocalis AI is listening...";
            heroStatusSubtext.textContent = "Speak clearly into your microphone...";
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (transcriptEl) transcriptEl.textContent = finalTranscript || interimTranscript || "Listening...";

            if (finalTranscript.trim() !== '') {
                stopListening();
                sendToAgent(finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            stopListening();
            if (transcriptEl) {
                transcriptEl.textContent = event.error === 'no-speech'
                    ? "No speech detected. Tap to try again."
                    : `Speech error: ${event.error}`;
            }
        };

        recognition.onend = () => {
            stopListening();
        };

        langSelect.addEventListener('change', () => {
            if (recognition) recognition.lang = langSelect.value;
        });
    }

    function startListening() {
        if (recognition && !isListening) {
            try { recognition.start(); } catch (e) {}
        }
    }

    function stopListening() {
        isListening = false;
        callOverlay.classList.add('opacity-0', 'pointer-events-none');
        callOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        heroStatusHeading.textContent = "Vocalis AI is standing by";
        heroStatusSubtext.textContent = "Tap once to initiate real-time audio and assign complex operations.";
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
    }

    if (startCallBtn) startCallBtn.addEventListener('click', startListening);
    if (orbContainer) orbContainer.addEventListener('click', startListening);
    if (endCallBtn) endCallBtn.addEventListener('click', stopListening);

    // Directive Pills Click Handlers
    directivePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const promptText = pill.getAttribute('data-prompt');
            if (promptText) {
                if (transcriptEl) transcriptEl.textContent = promptText;
                sendToAgent(promptText);
            }
        });
    });

    // Mute Audio Toggle
    if (muteAudioBtn) {
        muteAudioBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (isMuted) {
                window.speechSynthesis.cancel();
                muteBtnLabel.textContent = "Unmute Audio";
                muteAudioBtn.classList.add('text-error');
            } else {
                muteBtnLabel.textContent = "Mute Audio";
                muteAudioBtn.classList.remove('text-error');
            }
        });
    }

    // Text Input Toggle
    if (textInputToggleBtn && textInputRow) {
        textInputToggleBtn.addEventListener('click', () => {
            textInputRow.classList.toggle('hidden');
            if (!textInputRow.classList.contains('hidden')) {
                textInput.focus();
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                if (transcriptEl) transcriptEl.textContent = text;
                textInput.value = '';
                sendToAgent(text);
            }
        });
    }

    if (textInput) {
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendBtn.click();
        });
    }

    // Send Request to Backend
    async function sendToAgent(text) {
        if (consoleStatus) consoleStatus.textContent = "Running Gemini Agent...";

        try {
            const response = await fetch('/api/agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, text: text })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'API request failed');
            }

            const data = await response.json();

            // Update Tool Execution Receipts Console
            if (data.tools_used && data.tools_used.length > 0) {
                if (consoleStatus) consoleStatus.textContent = `Executed: ${data.tools_used.join(', ')}`;
                if (toolExecutionBody) {
                    toolExecutionBody.innerHTML = data.tools_used.map(t => `
                        <div class="bg-surface-container/60 border border-outline/10 p-3 rounded-lg mb-2">
                            <span class="text-tertiary font-bold">⚡ Tool Execution Receipt: ${t}</span>
                            <div class="text-on-surface-variant mt-1">Status: Success • Allowed Sandbox Context</div>
                        </div>
                    `).join('');
                }
            } else {
                if (consoleStatus) consoleStatus.textContent = "Direct Gemini Synthesis";
                if (toolExecutionBody) {
                    toolExecutionBody.innerHTML = `
                        <div class="text-outline">
                            <code>Direct Gemini LLM reply generated without tool invocation.</code>
                        </div>
                    `;
                }
            }

            currentReplyText = data.reply;
            if (latestReply) latestReply.textContent = currentReplyText;

            // Audio Speech Synthesis Playback
            speakText(currentReplyText);

            // Refresh History
            loadHistory();

        } catch (error) {
            console.error("Agent error:", error);
            if (latestReply) latestReply.textContent = `Error: ${error.message}`;
            if (consoleStatus) consoleStatus.textContent = "Execution Error";
        }
    }

    // Text to Speech
    function speakText(text) {
        if (isMuted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langSelect.value;
        if (voiceSelect && voiceSelect.value !== "" && availableVoices[voiceSelect.value]) {
            utterance.voice = availableVoices[voiceSelect.value];
        }
        window.speechSynthesis.speak(utterance);
    }

    if (speakAgainBtn) {
        speakAgainBtn.addEventListener('click', () => {
            if (currentReplyText) speakText(currentReplyText);
        });
    }

    // Session History Feed
    async function loadHistory() {
        if (!historyList) return;
        try {
            const response = await fetch(`/api/history/${sessionId}`);
            if (!response.ok) return;

            const data = await response.json();
            historyList.innerHTML = '';

            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    const node = document.createElement('div');
                    node.className = `bg-surface-container/50 border border-outline/10 p-3 rounded-xl text-xs ${msg.role === 'user' ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-tertiary'}`;
                    node.innerHTML = `
                        <div class="font-label-mono-sm text-[10px] text-outline uppercase font-bold mb-1">${msg.role}</div>
                        <div class="text-on-surface font-body-sm">${escapeHtml(msg.content)}</div>
                    `;
                    historyList.appendChild(node);
                });
                historyList.scrollTop = historyList.scrollHeight;
            } else {
                historyList.innerHTML = '<div class="text-outline text-xs p-2">No conversation history recorded yet.</div>';
            }
        } catch (e) {
            console.error("Failed to load history:", e);
        }
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            sessionId = 'web-' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('voice_session_id', sessionId);
            if (latestReply) latestReply.textContent = "Session history cleared. Started new session.";
            if (historyList) historyList.innerHTML = '';
        });
    }

    // Telephony Button Actions
    if (directCallModalBtn) {
        directCallModalBtn.addEventListener('click', () => {
            switchTab('live-call');
        });
    }

    if (copyWebhookBtn && webhookUrlInput) {
        copyWebhookBtn.addEventListener('click', () => {
            webhookUrlInput.select();
            navigator.clipboard.writeText(webhookUrlInput.value);
            copyWebhookBtn.textContent = 'Copied!';
            setTimeout(() => { copyWebhookBtn.textContent = 'Copy'; }, 2000);
        });
    }

    if (startSimulatedCallBtn && simulatedPhoneInput && simulatedCallLog) {
        startSimulatedCallBtn.addEventListener('click', async () => {
            const phone = simulatedPhoneInput.value.trim() || '+1 (555) 019-2834';
            simulatedCallLog.innerHTML += `<div class="text-primary mt-1">📞 Dialing Twilio session to ${escapeHtml(phone)}...</div>`;
            simulatedCallLog.scrollTop = simulatedCallLog.scrollHeight;

            try {
                const res = await fetch('/twilio/voice', { method: 'POST' });
                const xmlText = await res.text();
                simulatedCallLog.innerHTML += `<div class="text-tertiary mt-1">✅ TwiML Response:</div>`;
                simulatedCallLog.innerHTML += `<div class="text-on-surface opacity-80">${escapeHtml(xmlText.substring(0, 140))}...</div>`;
                simulatedCallLog.scrollTop = simulatedCallLog.scrollHeight;
            } catch (err) {
                simulatedCallLog.innerHTML += `<div class="text-error mt-1">❌ Connection error: ${err.message}</div>`;
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    loadHistory();
});
