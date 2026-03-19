
        // ── Get Pi IP from PiConnect (no hardcoded IP) ──
        function getPiIp() {
            if (typeof PiConnect !== 'undefined' && PiConnect.config?.ip) {
                return PiConnect.config.ip;
            }
            return localStorage.getItem('pi_ip') || '';
        }

        function getApiUrl() {
            const ip = getPiIp();
            return ip ? `http://${ip}:5001/classify` : '';
        }

        async function runAnalysis() {
            const API_URL = getApiUrl();
            if (!API_URL) {
                console.error('Pi not connected');
                document.getElementById('metric-status').innerText = "Pi Not Connected";
                document.getElementById('metric-status').style.color = "#f87171";
                if (typeof PiConnect !== 'undefined') {
                    PiConnect.openModal();
                }
                return;
            }

            try {
                console.log('Starting classification analysis...');
                const response = await fetch(API_URL, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received data:', data);

                if (data.success && data.result) {
                    const result = data.result;

                    // Update Metrics
                    document.getElementById('metric-mean').innerText = result["Mean Prediction"] || '--';
                    document.getElementById('metric-conf').innerText = result["Confidence"] || '--';
                    document.getElementById('metric-duration').innerText = result["File Duration"] || '--';
                    document.getElementById('metric-status').innerText = "Success";
                    document.getElementById('metric-status').style.color = "#34d399";
                    
                    // Update Verdict Badge
                    const badge = document.getElementById('diag-badge');
                    const isDravet = result.results && result.results.includes("Dravet");
                    
                    badge.innerHTML = isDravet ? 
                        `<i class="fas fa-exclamation-triangle"></i> ${result.results}` : 
                        `<i class="fas fa-check-circle"></i> ${result.results}`;
                    
                    badge.className = 'class-badge';
                    badge.style.background = isDravet ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                    badge.style.color = isDravet ? '#f87171' : '#34d399';
                    badge.style.border = isDravet ? '1px solid #f87171' : '1px solid #34d399';

                    document.getElementById('diag-description').innerText = isDravet ? 
                        "Patterns identified match clinical indicators for Dravet Syndrome. Please consult with a neurologist for further validation." :
                        "The EEG signal analysis does not show indicators of Dravet Syndrome. Patient falls within the control group parameters.";

                    // Show and update probabilities
                    if (data.probabilities) {
                        document.getElementById('probabilities-card').style.display = 'block';
                        document.getElementById('prob-dravet').innerText = data.probabilities["Dravet Syndrome"] || '--';
                        document.getElementById('prob-control').innerText = data.probabilities["Control Group"] || '--';
                    }

                    // Update Metadata
                    document.getElementById('meta-file').innerText = result.file_name || '--';
                    document.getElementById('meta-time').innerText = new Date().toLocaleString();
                    document.getElementById('file-title').innerText = `Report for ${result.file_name || 'Unknown File'}`;
                    document.getElementById('meta-timing').innerText = data.timing || '--';

                    // Hide Loader
                    setTimeout(() => {
                        document.getElementById('loading-overlay').style.opacity = '0';
                        setTimeout(() => document.getElementById('loading-overlay').style.display = 'none', 500);
                    }, 500);

                } else {
                    throw new Error(data.error || 'Classification failed');
                }
            } catch (err) {
                console.error("Analysis Failed:", err);
                
                // Update status
                document.getElementById('metric-status').innerText = "Failed";
                document.getElementById('metric-status').style.color = "#ef4444";

                // Show error message
                const errorContainer = document.getElementById('error-container');
                errorContainer.innerHTML = `
                    <div class="error-message">
                        <strong><i class="fas fa-exclamation-circle"></i> Analysis Failed</strong><br>
                        ${err.message || 'Unable to connect to Raspberry Pi. Please check the connection and try again.'}
                    </div>
                `;

                // Hide loader
                setTimeout(() => {
                    document.getElementById('loading-overlay').style.opacity = '0';
                    setTimeout(() => document.getElementById('loading-overlay').style.display = 'none', 500);
                }, 500);
            }
        }

        function toggleSidebar() { 
            document.getElementById('sidebar').classList.toggle('active'); 
        }

        window.onload = function() {
            // Background Animation
            const canvas = document.getElementById('neuro-bg');
            const ctx = canvas.getContext('2d');
            let width = canvas.width = window.innerWidth;
            let height = canvas.height = window.innerHeight;
            let particles = [];
            
            for(let i=0; i<100; i++) {
                particles.push({
                    x: Math.random() * width, 
                    y: Math.random() * height, 
                    vx: (Math.random() - 0.5), 
                    vy: (Math.random() - 0.5)
                });
            }
            
            function animate() {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
                particles.forEach(p => {
                    p.x += p.vx; 
                    p.y += p.vy;
                    if(p.x < 0 || p.x > width) p.vx *= -1;
                    if(p.y < 0 || p.y > height) p.vy *= -1;
                    ctx.beginPath(); 
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); 
                    ctx.fill();
                });
                requestAnimationFrame(animate);
            }
            animate();

            // Resize canvas on window resize
            window.addEventListener('resize', () => {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            });
            
            // Start the Pi Analysis
            runAnalysis();
        };
    