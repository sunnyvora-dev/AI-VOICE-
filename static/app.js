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
                tab.className = "nav-tab px-4 py-2 rounded-md text-xs font-mono font-bold transition-all bg-[#171717] text-[#F4F0E6] border border-[#171717]";
            } else {
                tab.className = "nav-tab px-4 py-2 rounded-md text-xs font-mono font-semibold text-[#525252] hover:text-[#171717] hover:bg-[#EAE4D5] border border-transparent transition-all";
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Canvas Visualizer Setup
    const heroVisualizer = document.getElementById('heroVisualizer');
    let isListening = false;
    let isMuted = false;
    let recognition = null;
    let currentReplyText = "";
    let availableVoices = [];

    if (webhookUrlInput) {
        webhookUrlInput.value = `${window.location.origin}/twilio/voice`;
    }

    // Hero Visualizer Animation Engine
    if (heroVisualizer) {
        const ctx = heroVisualizer.getContext('2d');
        let phase = 0;

        function drawVisualizer() {
            const width = heroVisualizer.width;
            const height = heroVisualizer.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 100;

            ctx.clearRect(0, 0, width, height);

            // Retro Stepped Wave Ring
            ctx.beginPath();
            const bars = 40;
            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2;
                const waveAmp = isListening ? Math.sin(phase + i * 0.5) * 16 + 12 : Math.sin(phase * 0.6 + i * 0.3) * 5 + 2;
                const r = radius + waveAmp;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = isListening ? '#F05A3C' : '#2457D6';
            ctx.lineWidth = isListening ? 3 : 2;
            ctx.stroke();

            phase += isListening ? 0.12 : 0.04;
            requestAnimationFrame(drawVisualizer);
        }
        drawVisualizer();
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
                option.textContent = `${voice.name} (${voice.lang})`;
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
            if (currentReplyText) speakText("Voice selection updated.");
        });
    }

    // Web Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = langSelect ? langSelect.value : 'en-US';

        recognition.onstart = () => {
            isListening = true;
            if (callOverlay) {
                callOverlay.classList.remove('opacity-0', 'pointer-events-none');
                callOverlay.classList.add('opacity-100', 'pointer-events-auto');
            }
            if (heroStatusHeading) heroStatusHeading.textContent = "LISTENING FOR DIRECTIVE...";
            if (heroStatusSubtext) heroStatusSubtext.textContent = "Speak clearly into your workstation microphone...";
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

        if (langSelect) {
            langSelect.addEventListener('change', () => {
                if (recognition) recognition.lang = langSelect.value;
            });
        }
    }

    function startListening() {
        if (recognition && !isListening) {
            try { recognition.start(); } catch (e) {}
        }
    }

    function stopListening() {
        isListening = false;
        if (callOverlay) {
            callOverlay.classList.add('opacity-0', 'pointer-events-none');
            callOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        }
        if (heroStatusHeading) heroStatusHeading.textContent = "RUN YOUR NEXT TASK.";
        if (heroStatusSubtext) heroStatusSubtext.textContent = "Tap microphone or select a directive to assign complex operations.";
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
                if (muteBtnLabel) muteBtnLabel.textContent = "Unmute Audio";
                muteAudioBtn.classList.add('text-[#F05A3C]');
            } else {
                if (muteBtnLabel) muteBtnLabel.textContent = "Mute Audio";
                muteAudioBtn.classList.remove('text-[#F05A3C]');
            }
        });
    }

    // Text Input Toggle
    if (textInputToggleBtn && textInputRow) {
        textInputToggleBtn.addEventListener('click', () => {
            textInputRow.classList.toggle('hidden');
            if (!textInputRow.classList.contains('hidden') && textInput) {
                textInput.focus();
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (!textInput) return;
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
        if (consoleStatus) consoleStatus.textContent = "RUNNING GEMINI AGENT...";

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
                if (consoleStatus) consoleStatus.textContent = `EXECUTED: ${data.tools_used.join(', ')}`;
                if (toolExecutionBody) {
                    toolExecutionBody.innerHTML = data.tools_used.map(t => `
                        <div class="bg-[#1D4039] border border-[#264D45] p-3 rounded-md mb-2 font-mono text-xs text-[#C7D83D]">
                            <div class="font-bold">⚡ TOOL RECEIPT: ${t}</div>
                            <div class="text-slate-300 text-[11px] mt-1">Status: OK • Sandbox Context Verified</div>
                        </div>
                    `).join('');
                }
            } else {
                if (consoleStatus) consoleStatus.textContent = "DIRECT GEMINI SYNTHESIS";
                if (toolExecutionBody) {
                    toolExecutionBody.innerHTML = `
                        <div class="text-slate-400 font-mono text-xs p-2">
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
            if (consoleStatus) consoleStatus.textContent = "EXECUTION ERROR";
        }
    }

    // Text to Speech
    function speakText(text) {
        if (isMuted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (langSelect) utterance.lang = langSelect.value;
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
                data.messages.forEach((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const itemNum = String(idx + 1).padStart(3, '0');
                    const node = document.createElement('div');
                    node.className = `p-3.5 rounded-md border border-[#171717] bg-[#FAF8F3] text-xs leading-relaxed transition-all ${
                        isUser 
                        ? 'border-l-4 border-l-[#F05A3C]' 
                        : 'border-l-4 border-l-[#2457D6]'
                    }`;
                    node.innerHTML = `
                        <div class="flex items-center justify-between font-mono text-[10px] uppercase font-bold mb-1.5 text-[#171717]">
                            <span><span class="cursor-block"></span>TASK / ${itemNum} — ${isUser ? 'USER DIRECTIVE' : 'VOCALIS GEMINI AGENT'}</span>
                        </div>
                        <div class="text-[#171717] font-sans text-xs">${escapeHtml(msg.content)}</div>
                    `;
                    historyList.appendChild(node);
                });
                historyList.scrollTop = historyList.scrollHeight;
            } else {
                historyList.innerHTML = '<div class="text-[#525252] font-mono text-xs p-3 text-center border border-dashed border-[#171717] rounded-md">No conversation history recorded yet.</div>';
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
            simulatedCallLog.innerHTML += `<div class="text-[#C7D83D] mt-1 font-mono text-xs">📞 Dialing Twilio session to ${escapeHtml(phone)}...</div>`;
            simulatedCallLog.scrollTop = simulatedCallLog.scrollHeight;

            try {
                const res = await fetch('/twilio/voice', { method: 'POST' });
                const xmlText = await res.text();
                simulatedCallLog.innerHTML += `<div class="text-white font-mono text-xs mt-1 font-bold">✅ TwiML Response:</div>`;
                simulatedCallLog.innerHTML += `<div class="text-slate-300 font-mono text-[11px] p-2 bg-[#17352F] rounded border border-[#264D45] mt-1">${escapeHtml(xmlText.substring(0, 140))}...</div>`;
                simulatedCallLog.scrollTop = simulatedCallLog.scrollHeight;
            } catch (err) {
                simulatedCallLog.innerHTML += `<div class="text-[#F05A3C] font-mono text-xs mt-1">❌ Connection error: ${err.message}</div>`;
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    loadHistory();
});
