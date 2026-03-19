
        // ===========================================
        // CONFIGURATION - Get Pi IP from PiConnect
        // ===========================================
        function getPiIp() {
            if (typeof PiConnect !== 'undefined' && PiConnect.config?.ip) {
                return PiConnect.config.ip;
            }
            return localStorage.getItem('pi_ip') || '';
        }

        function getQueryUrl() {
            const ip = getPiIp();
            return ip ? `http://${ip}:5001/query` : '';
        }

        console.log('NeuroMind Chatbot initialized');
        console.log('Query URL will be determined when connected to Pi');

        // ===========================================
        // SIDEBAR TOGGLE (match dashboard)
        // ===========================================
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
        }

        // ===========================================
        // BACKGROUND ANIMATION
        // ===========================================
        const canvas = document.getElementById('neuro-bg');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = [];
            for(let i = 0; i < 60; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1
                });
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
                ctx.beginPath(); 
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
                ctx.fill();
                ctx.shadowBlur = 0; 

                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (dist < 120) {
                        ctx.beginPath(); 
                        ctx.moveTo(p.x, p.y); 
                        ctx.lineTo(p2.x, p2.y); 
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        window.addEventListener('resize', resize);
        resize(); 
        animate();

        // ===========================================
        // CHAT LOGIC - FIXED TO MATCH classification.html
        // ===========================================
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const sendBtn = document.getElementById('sendBtn');

        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });

        function handleKeyPress(e) { 
            if(e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                sendMessage(); 
            } 
        }

        async function sendMessage() {
            const text = chatInput.value.trim();
            if(!text) return;

            // Disable input while processing
            chatInput.disabled = true;
            sendBtn.disabled = true;

            // Add user message
            addMessage(text, 'user');
            chatInput.value = '';

            // Add typing indicator
            const typingMsg = addTypingIndicator();

            try {
                const queryUrl = getQueryUrl();
                if (!queryUrl) {
                    addMessage('❌ Error: Pi not connected. Please connect to Raspberry Pi first using the Pi button.', 'bot');
                    chatInput.disabled = false;
                    sendBtn.disabled = false;
                    return;
                }

                console.log('Sending query to Pi:', text);
                console.log('Query URL:', queryUrl);

                // ✅ FIX: Use the SAME pattern as classification.html
                // Include proper headers: Content-Type AND Accept
                const response = await fetch(queryUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        question: text
                    })
                });

                // Remove typing indicator
                typingMsg.remove();

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errText}`);
                }

                const result = await response.json();
                console.log('Pi response:', result);

                if (result.success) {
                    // Add bot response with sources
                    addMessage(result.response, 'bot', result.sources, result.timing);
                } else {
                    // Show error from server
                    const errorMsg = result.error || 'Unknown error occurred';
                    addMessage(`Sorry, I encountered an error: ${errorMsg}`, 'bot');
                    console.error('Query failed:', result);
                }

            } catch (error) {
                console.error('Error querying Pi:', error);
                typingMsg.remove();

                // ✅ FIX: Show detailed error message like classification.html
                const piIp = getPiIp() || '[No IP connected]';
                addMessage(`❌ Error: ${error.message}\n\nPlease check:\n• Raspberry Pi is online at ${piIp}\n• wake_server.py is running on port 5001\n• Ollama and TinyLLaMA are installed`, 'bot');
            } finally {
                // Re-enable input
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        }

        function addTypingIndicator() {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message bot';
            msgDiv.id = 'typing-indicator';
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

            msgDiv.appendChild(avatarDiv);
            msgDiv.appendChild(contentDiv);
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            return msgDiv;
        }

        function addMessage(text, sender, sources = null, timing = null) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${sender}`;
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            avatarDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Format text with line breaks
            const formattedText = text.replace(/\n/g, '<br>');
            contentDiv.innerHTML = `<p>${formattedText}</p>`;

            // Add sources if available
            if (sources && sources.length > 0) {
                const sourcesHtml = `
                    <div class="sources-section">
                        <strong>📚 Sources:</strong>
                        ${sources.map(src => `<div class="source-item">• ${src}</div>`).join('')}
                    </div>
                `;
                contentDiv.innerHTML += sourcesHtml;
            }

            // Add timing info (optional, hidden by default)
            if (timing && Object.keys(timing).length > 0) {
                console.log('Query timing:', timing);
            }

            if(sender === 'bot') {
                msgDiv.appendChild(avatarDiv);
                msgDiv.appendChild(contentDiv);
            } else {
                msgDiv.appendChild(contentDiv);
                msgDiv.appendChild(avatarDiv);
            }

            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    
