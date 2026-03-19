
        // ── Get Pi IP from PiConnect (no hardcoded IP) ──
        function getPiIp() {
            if (typeof PiConnect !== 'undefined' && PiConnect.config?.ip) {
                return PiConnect.config.ip;
            }
            return localStorage.getItem('pi_ip') || '';
        }

        function getPiBaseUrl() {
            const ip = getPiIp();
            return ip ? `http://${ip}:5001` : '';
        }

        function getStartUrl() {
            const base = getPiBaseUrl();
            return base ? `${base}/autoencoder/start` : '';
        }

        function getStatusUrl() {
            const base = getPiBaseUrl();
            return base ? `${base}/autoencoder/status` : '';
        }

        let pollInterval = null;
        let elapsedSec   = 0;
        let timerInterval = null;
        let START_URL = '';
        let STATUS_URL = '';
        let PI_BASE = '';

        // ─────────────────────────────────────────
        // OVERLAY HELPERS
        // ─────────────────────────────────────────
        function setLoadingText(status, detail) {
            const s = document.getElementById('loading-status');
            const d = document.getElementById('loading-detail');
            if (s) s.textContent = status;
            if (d) d.textContent = detail;
        }

        function hideOverlay() {
            const ov = document.getElementById('loading-overlay');
            ov.style.opacity = '0';
            ov.style.pointerEvents = 'none';
            setTimeout(() => ov.style.display = 'none', 500);
        }

        function showError(title, detail) {
            stopPolling();
            const ov = document.getElementById('loading-overlay');
            ov.style.display = 'flex';
            ov.style.opacity = '1';
            ov.style.pointerEvents = 'auto';
            ov.innerHTML = `
                <div class="error-box">
                    <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="error-title">${title}</div>
                    <div class="error-message">${detail}</div>
                    <div class="error-actions">
                        <button class="btn-retry" onclick="startAnalysis()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                        <a class="btn-goback" href="/classification">
                            <i class="fas fa-arrow-left"></i> Go Back
                        </a>
                    </div>
                </div>`;
        }

        function restoreOverlay() {
            const ov = document.getElementById('loading-overlay');
            ov.style.display = 'flex';
            ov.style.opacity = '1';
            ov.style.pointerEvents = 'auto';
            ov.innerHTML = `
                <div class="loader"></div>
                <p id="loading-status">Starting autoencoder on Raspberry Pi...</p>
                <p id="loading-detail">Auto.py is running — this may take several minutes</p>
                <p id="loading-timer">Elapsed: 0s</p>`;
        }

        // ─────────────────────────────────────────
        // TIMER
        // ─────────────────────────────────────────
        function startTimer() {
            elapsedSec = 0;
            timerInterval = setInterval(() => {
                elapsedSec++;
                const el = document.getElementById('loading-timer');
                if (el) el.textContent = `Elapsed: ${elapsedSec}s`;
            }, 1000);
        }

        function stopTimer() {
            if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        }

        // ─────────────────────────────────────────
        // STOP POLLING
        // ─────────────────────────────────────────
        function stopPolling() {
            if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            stopTimer();
        }

        // ─────────────────────────────────────────
        // POPULATE RESULTS — called when Pi returns done+success
        // ─────────────────────────────────────────
        function populateResults(data) {
            const res    = data.parsed_data;
            const stats = res.mad_statistics;

            document.getElementById('pi-mad-mean').innerText = stats.mean || '0.0';
            const count = (res.anomalies_detected || '0/0').split('/')[0];
            document.getElementById('pi-anomaly-count').innerText = count;
            document.getElementById('pi-file-info').innerText =
                `File: ${res.file_loaded} • Signal: ${res.signal_shape} • Anomaly: ${res.anomaly_percentage}`;

            const maxMAD    = parseFloat(stats.max);
            const maxBadge = maxMAD > 100 ? 'badge-critical' : maxMAD > 50 ? 'badge-warning' : 'badge-normal';
            const maxLabel = maxMAD > 100 ? 'Critical Spike' : maxMAD > 50 ? 'High' : 'Normal';

            document.getElementById('pi-log-body').innerHTML = `
                <tr>
                    <td>Maximum MAD Error</td>
                    <td>${stats.max}</td>
                    <td><span class="${maxBadge}">${maxLabel}</span></td>
                    <td>Anomaly ${maxMAD > 50 ? 'Flagged' : 'Monitored'}</td>
                </tr>
                <tr>
                    <td>Mean MAD Error</td>
                    <td>${stats.mean}</td>
                    <td><span class="badge-warning">Moderate</span></td>
                    <td>Baseline Tracked</td>
                </tr>
                <tr>
                    <td>Median Error (Baseline)</td>
                    <td>${stats.median}</td>
                    <td><span class="badge-normal">Low</span></td>
                    <td>Signal Reconstructed</td>
                </tr>
                <tr>
                    <td>Minimum Error</td>
                    <td>${stats.min}</td>
                    <td><span class="badge-normal">Minimal</span></td>
                    <td>Nominal</td>
                </tr>
                <tr>
                    <td>Anomaly Percentage</td>
                    <td>${res.anomaly_percentage}</td>
                    <td><span class="badge-warning">Detection Rate</span></td>
                    <td>${res.anomalies_detected}</td>
                </tr>`;

            // ─────────────────────────────────────────
            //  RECONSTRUCTION LOGIC FIX
            // ─────────────────────────────────────────
            const iframe = document.getElementById('reconstructionFrame');
            const canvas = document.getElementById('aeCanvas');
            const legend = document.getElementById('wave-legend');
            
            // Check if valid URL exists and is not empty
            if (data.reconstruction_url && data.reconstruction_url.trim() !== '') {
                console.log('Using real reconstruction from Pi:', data.reconstruction_url);
                
                // 1. Hide the dummy animation and legend
                canvas.style.display = 'none';
                if (legend) legend.style.display = 'none';

                // 2. Show the iframe
                iframe.style.display = 'block';

                // 3. Set the source with a timestamp to prevent caching
                iframe.src = data.reconstruction_url + "?t=" + new Date().getTime();
            } else {
                console.warn('No reconstruction URL returned. Using fallback animation.');
                // Fallback: Show dummy animation
                initAEAnimation();
            }

            hideOverlay();
        }

        // ─────────────────────────────────────────
        // POLL /autoencoder/status every 3 seconds
        // Exactly like chatbot sends a new fetch per message — short fast requests
        // ─────────────────────────────────────────
        async function pollStatus() {
            try {
                const resp = await fetch(STATUS_URL, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                if (!resp.ok) {
                    const txt = await resp.text();
                    showError('Pi Server Error', `HTTP ${resp.status}\n\n${txt}`);
                    return;
                }

                const data = await resp.json();

                if (data.state === 'running') {
                    setLoadingText(
                        'Auto.py is running on Pi...',
                        'Analyzing EDF signal — anomaly detection in progress'
                    );
                    return; // keep polling
                }

                if (data.state === 'done') {
                    stopPolling();
                    if (data.success) {
                        populateResults(data);
                    } else {
                        showError(
                            'Autoencoder Analysis Failed',
                            data.error || 'Auto.py returned an error — check uploads folder has an EDF file'
                        );
                    }
                    return;
                }

                if (data.state === 'idle') {
                    // Should not happen after we called /start — but handle it
                    setLoadingText('Waiting for Pi to start...', 'Retrying start...');
                    await triggerStart();
                }

            } catch (err) {
                // Network error during poll — don't stop, Pi might briefly be busy
                console.warn('Poll error (will retry):', err.message);
                setLoadingText('Polling Pi...', `Connection issue — retrying... (${err.message})`);
            }
        }

        // ─────────────────────────────────────────
        // STEP 1: POST /autoencoder/start — returns immediately
        // Then we poll status every 3s
        // ─────────────────────────────────────────
        async function triggerStart() {
            const resp = await fetch(START_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`HTTP ${resp.status}\n\n${txt}`);
            }

            const data = await resp.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to start autoencoder');
            }
        }

        async function startAnalysis() {
            restoreOverlay();
            startTimer();

            try {
                setLoadingText('Sending start command to Pi...', 'Calling /autoencoder/start');
                await triggerStart();

                setLoadingText('Auto.py started on Pi!', 'Polling for results every 3 seconds...');

                // Begin polling — identical pattern to how chatbot sends a new fetch per message
                pollInterval = setInterval(pollStatus, 3000);

                // Also poll immediately so we don't wait 3s for first check
                await pollStatus();

            } catch (err) {
                const isNetwork = err instanceof TypeError;
                showError(
                    isNetwork ? 'Cannot Reach Raspberry Pi' : 'Failed to Start Autoencoder',
                    isNetwork
                        ? `Network error — is wake_server.py running on port 5001?\n\n${err.message}`
                        : err.message
                );
            }
        }

        // ─────────────────────────────────────────
        // SIDEBAR
        // ─────────────────────────────────────────
        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

        // ─────────────────────────────────────────
        // BACKGROUND ANIMATION
        // ─────────────────────────────────────────
        function initBgAnimation() {
            const canvas = document.getElementById('neuro-bg');
            const ctx = canvas.getContext('2d');
            let width, height, particles = [];
            function resize() {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
                particles = [];
                const count = Math.floor(width / 15);
                for (let i = 0; i < count; i++) {
                    particles.push({ x: Math.random()*width, y: Math.random()*height, vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5, size:Math.random()*2.5+1 });
                }
            }
            function animate() {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = 'rgba(168,85,247,0.9)';
                ctx.strokeStyle = 'rgba(168,85,247,0.2)';
                for (let i = 0; i < particles.length; i++) {
                    let p = particles[i];
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                    for (let j = i+1; j < particles.length; j++) {
                        let p2 = particles[j];
                        let dist = Math.sqrt((p.x-p2.x)**2+(p.y-p2.y)**2);
                        if (dist < 120) { ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
                    }
                }
                requestAnimationFrame(animate);
            }
            window.addEventListener('resize', resize);
            resize(); animate();
        }

        // ─────────────────────────────────────────
        // WAVE PLOTTER (runs after results arrive)
        // ─────────────────────────────────────────
        function initAEAnimation() {
            const canvas = document.getElementById('aeCanvas');
            const ctx = canvas.getContext('2d');
            let animId, progress = 0;
            const speed = 15;
            function render(limit) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const cy = canvas.height / 2;
                ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = '#06b6d4';
                ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 15;
                for (let x = 0; x < limit; x++) {
                    const y = cy + Math.sin(x*0.02)*60 + Math.sin(x*0.08)*15;
                    x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
                }
                ctx.stroke(); ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = '#e879f9';
                for (let x = 0; x < limit; x++) {
                    const noise = Math.sin(x*0.5)*3 + Math.cos(x*0.9)*2;
                    const y = cy + Math.sin(x*0.02)*55 + Math.sin(x*0.08)*12 + noise;
                    x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
                }
                ctx.stroke();
            }
            function anim() {
                if (progress < canvas.width) { progress += speed; render(progress); animId = requestAnimationFrame(anim); }
                else render(canvas.width);
            }
            canvas.width  = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
            anim();
        }

        // ─────────────────────────────────────────
        // CHAT
        // ─────────────────────────────────────────
        function toggleChat(show) {
            const panel = document.getElementById('chatPanel');
            const fab = document.getElementById('fabChat');
            if (show) { panel.classList.add('active'); fab.classList.add('hidden'); }
            else { panel.classList.remove('active'); fab.classList.remove('hidden'); }
        }

        function handleKeyPress(e) { if(e.key === 'Enter') sendChatMessage(); }

        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const body = document.getElementById('chatBody');
            const txt = input.value.trim();
            if (!txt) return;

            body.innerHTML += `<div class="msg msg-user">${txt}</div>`;
            input.value = '';
            body.scrollTop = body.scrollHeight;

            try {
                const resp = await fetch(`${PI_BASE}/query`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({query: txt})
                });
                const data = await resp.json();
                body.innerHTML += `<div class="msg msg-bot">${data.response || 'No response from AI'}</div>`;
            } catch (e) {
                body.innerHTML += `<div class="msg msg-bot" style="color:#fca5a5">Error: ${e.message}</div>`;
            }
            body.scrollTop = body.scrollHeight;
        }

        // ─────────────────────────────────────────
        // INIT
        // ─────────────────────────────────────────
        window.addEventListener('load', () => {
            // Initialize URL variables
            START_URL = getStartUrl();
            STATUS_URL = getStatusUrl();
            PI_BASE = getPiBaseUrl();

            initBgAnimation();
            startAnalysis();
        });

    
