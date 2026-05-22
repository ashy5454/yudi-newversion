/* Yudi AI Labs - Chatbot Widget Logic */

(function() {
    // 1. Create and inject chatbot CSS stylesheet if not loaded
    if (!document.getElementById('yudi-chatbot-css')) {
        const link = document.createElement('link');
        link.id = 'yudi-chatbot-css';
        link.rel = 'stylesheet';
        link.href = 'assets/chatbot.css';
        document.head.appendChild(link);
    }

    // 2. Create the Chatbot markup and inject it on page load
    function initChatbot() {
        if (document.getElementById('yudi-chat-container')) return;

        const container = document.createElement('div');
        container.id = 'yudi-chat-container';
        container.innerHTML = `
            <!-- Chat Launcher -->
            <button class="yudi-chat-launcher" aria-label="Open Chat">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
            </button>

            <!-- Chat Widget Window -->
            <div class="yudi-chat-widget">
                <div class="yudi-chat-header">
                    <div class="yudi-chat-header-info">
                        <div class="yudi-chat-status"></div>
                        <span class="yudi-chat-title">YUDI AI Companion</span>
                    </div>
                    <button class="yudi-chat-close" aria-label="Close Chat">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="yudi-chat-messages" id="yudi-chat-msgs">
                    <div class="yudi-chat-msg bot">
                        Hello! I am the Yudi AI Assistant. How can I help you understand Yudi's brain-native AI research, our Conversational Token System (CTS), NARA, SAM, or our company roadmap?
                    </div>
                </div>

                <div class="yudi-chat-suggestions">
                    <button class="yudi-chat-chip" data-question="What is Yudi AI?">What is Yudi?</button>
                    <button class="yudi-chat-chip" data-question="What is CTS?">What is CTS?</button>
                    <button class="yudi-chat-chip" data-question="Tell me about Yudi's research programs">Research focus?</button>
                </div>

                <div class="yudi-chat-input-area">
                    <input type="text" class="yudi-chat-input" placeholder="Ask anything about Yudi AI..." aria-label="Chat input">
                    <button class="yudi-chat-send" aria-label="Send message">
                        <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // 3. Set up event handlers
        const launcher = container.querySelector('.yudi-chat-launcher');
        const widget = container.querySelector('.yudi-chat-widget');
        const closeBtn = container.querySelector('.yudi-chat-close');
        const sendBtn = container.querySelector('.yudi-chat-send');
        const inputField = container.querySelector('.yudi-chat-input');
        const messageBox = container.querySelector('#yudi-chat-msgs');
        const chips = container.querySelectorAll('.yudi-chat-chip');

        // Toggle widget active state
        launcher.addEventListener('click', () => {
            const isActive = widget.classList.toggle('active');
            launcher.classList.toggle('active', isActive);
            if (isActive) {
                inputField.focus();
                scrollToBottom();
            }
        });

        closeBtn.addEventListener('click', () => {
            widget.classList.remove('active');
            launcher.classList.remove('active');
        });

        // Send logic
        function sendMessage(text) {
            if (!text.trim()) return;

            // Render user message
            appendMessage('user', text);
            inputField.value = '';

            // Add typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.className = 'yudi-chat-typing';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            messageBox.appendChild(typingDiv);
            scrollToBottom();

            // API Call
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            })
            .then(res => res.json())
            .then(data => {
                typingDiv.remove();
                appendMessage('bot', data.reply || "Sorry, I am having trouble connecting to the Yudi AI knowledge base. Please try again later.");
            })
            .catch(err => {
                console.error("Chat error:", err);
                typingDiv.remove();
                appendMessage('bot', "I couldn't reach the Yudi brain server. Please make sure the backend server is running.");
            });
        }

        sendBtn.addEventListener('click', () => sendMessage(inputField.value));
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(inputField.value);
        });

        // Chips click handler
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.getAttribute('data-question');
                sendMessage(question);
            });
        });

        function appendMessage(sender, text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `yudi-chat-msg ${sender}`;
            msgDiv.textContent = text;
            messageBox.appendChild(msgDiv);
            scrollToBottom();
        }

        function scrollToBottom() {
            messageBox.scrollTop = messageBox.scrollHeight;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
