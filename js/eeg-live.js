// EEG Live - Real-time Signal Visualization
// Connects to Raspberry Pi via WebSocket for Cyton board data

const EEGLive = {
    // Configuration
    config: {
        wsUrl: null,
        sampleRate: 250,
        channels: 8,
        timeWindow: 10, // seconds
        maxDataPoints: 2500, // 10 seconds * 250 Hz
        connected: false,
        streaming: false,
        recording: false
    },

    // WebSocket connection
    ws: null,

    // Chart instances
    charts: [],

    // Data buffers for each channel
    dataBuffers: [],

    // Recording data
    recordingData: [],
    recordingStartTime: null,
    recordingTimer: null,

    // Data point counter
    totalDataPoints: 0,

    // Initialize
    init() {
        this.initDataBuffers();
        this.initCharts();
        this.setupEventListeners();
        this.checkPiConnection();
    },

    // Initialize data buffers
    initDataBuffers() {
        for (let i = 0; i < this.config.channels; i++) {
            this.dataBuffers[i] = [];
        }
    },

    // Initialize Chart.js charts for all channels
    initCharts() {
        const chartColors = [
            '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
            '#06b6d4', '#14b8a6', '#22c55e', '#84cc16'
        ];

        for (let i = 1; i <= this.config.channels; i++) {
            const ctx = document.getElementById(`chart${i}`);
            if (!ctx) continue;

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: chartColors[i - 1],
                        borderWidth: 1.5,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            display: true,
                            min: -100,
                            max: 100,
                            grid: {
                                color: 'rgba(139, 92, 246, 0.1)'
                            },
                            ticks: {
                                display: false
                            }
                        }
                    }
                }
            });

            this.charts.push(chart);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Time window change
        const timeWindowSelect = document.getElementById('timeWindow');
        if (timeWindowSelect) {
            timeWindowSelect.addEventListener('change', (e) => {
                this.config.timeWindow = parseInt(e.target.value);
                this.config.maxDataPoints = this.config.timeWindow * this.config.sampleRate;
                this.clearBuffers();
            });
        }

        // Display mode change
        const displayModeSelect = document.getElementById('displayMode');
        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', (e) => {
                this.updateDisplayMode(e.target.value);
            });
        }
    },

    // Check Pi connection status
    async checkPiConnection() {
        const piStatusInfo = document.getElementById('piStatusInfo');

        // Wait for PiConnect to initialize
        setTimeout(async () => {
            if (typeof PiConnect !== 'undefined' && PiConnect.config.ip) {
                const ip = PiConnect.config.ip;
                const port = PiConnect.config.port || '5001';

                try {
                    const response = await fetch(`http://${ip}:${port}/health`, {
                        method: 'GET',
                        signal: AbortSignal.timeout(5000)
                    });

                    if (response.ok) {
                        piStatusInfo.textContent = `Connected (${ip})`;
                        piStatusInfo.style.color = '#22c55e';
                        this.config.wsUrl = `ws://${ip}:${port}/eeg-stream`;
                    } else {
                        piStatusInfo.textContent = 'Pi offline';
                        piStatusInfo.style.color = '#ef4444';
                    }
                } catch (error) {
                    piStatusInfo.textContent = 'Not connected';
                    piStatusInfo.style.color = '#f59e0b';
                }
            } else {
                piStatusInfo.textContent = 'Configure Pi connection';
                piStatusInfo.style.color = '#6b7280';
            }
        }, 1500);
    },

    // Connect WebSocket
    connectWebSocket() {
        if (!this.config.wsUrl) {
            // Try to get from PiConnect
            if (typeof PiConnect !== 'undefined' && PiConnect.config.ip) {
                const ip = PiConnect.config.ip;
                const port = PiConnect.config.port || '5001';
                this.config.wsUrl = `ws://${ip}:${port}/eeg-stream`;
            } else {
                this.showError('Please connect to Raspberry Pi first');
                return false;
            }
        }

        this.updateConnectionStatus('connecting');

        try {
            this.ws = new WebSocket(this.config.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.config.connected = true;
                this.updateConnectionStatus('connected');
            };

            this.ws.onmessage = (event) => {
                this.handleData(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showError('Connection error. Check Pi and Cyton board.');
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.config.connected = false;
                this.config.streaming = false;
                this.updateConnectionStatus('disconnected');
                this.updateButtonStates();
            };

            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            this.showError('Failed to establish WebSocket connection');
            return false;
        }
    },

    // Handle incoming data
    handleData(rawData) {
        try {
            const data = JSON.parse(rawData);

            // Expected format: { channels: [ch1, ch2, ..., ch8], timestamp: ms }
            if (data.channels && Array.isArray(data.channels)) {
                for (let i = 0; i < this.config.channels; i++) {
                    const value = data.channels[i] || 0;

                    // Add to buffer
                    this.dataBuffers[i].push(value);

                    // Trim buffer if exceeds max
                    if (this.dataBuffers[i].length > this.config.maxDataPoints) {
                        this.dataBuffers[i].shift();
                    }

                    // Update value display
                    const valueEl = document.getElementById(`ch${i + 1}Value`);
                    if (valueEl) {
                        valueEl.textContent = `${value.toFixed(2)} uV`;
                    }
                }

                // Update charts
                this.updateCharts();

                // Update data points counter
                this.totalDataPoints++;
                const dataPointsEl = document.getElementById('dataPoints');
                if (dataPointsEl) {
                    dataPointsEl.textContent = this.totalDataPoints.toLocaleString();
                }

                // Store recording data
                if (this.config.recording) {
                    this.recordingData.push({
                        timestamp: Date.now(),
                        channels: [...data.channels]
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    },

    // Update all charts
    updateCharts() {
        for (let i = 0; i < this.config.channels; i++) {
            if (this.charts[i]) {
                this.charts[i].data.datasets[0].data = [...this.dataBuffers[i]];
                this.charts[i].data.labels = this.dataBuffers[i].map((_, idx) => idx);
                this.charts[i].update('none');
            }
        }
    },

    // Clear data buffers
    clearBuffers() {
        for (let i = 0; i < this.config.channels; i++) {
            this.dataBuffers[i] = [];
        }
        this.updateCharts();
    },

    // Update display mode
    updateDisplayMode(mode) {
        const channelCards = document.querySelectorAll('.channel-card');

        channelCards.forEach(card => {
            const channel = parseInt(card.dataset.channel);

            if (mode === 'all') {
                card.style.display = 'block';
            } else if (mode === '1-4') {
                card.style.display = channel <= 4 ? 'block' : 'none';
            } else if (mode === '5-8') {
                card.style.display = channel > 4 ? 'block' : 'none';
            }
        });
    },

    // Update connection status UI
    updateConnectionStatus(status) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        indicator.className = 'status-indicator ' + status;

        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
                break;
            case 'disconnected':
            default:
                statusText.textContent = 'Disconnected';
        }
    },

    // Update button states
    updateButtonStates() {
        const btnStart = document.getElementById('btnStart');
        const btnStop = document.getElementById('btnStop');

        if (this.config.streaming) {
            btnStart.disabled = true;
            btnStop.disabled = false;
        } else {
            btnStart.disabled = false;
            btnStop.disabled = true;
        }
    },

    // Show error message
    showError(message) {
        if (typeof PiConnect !== 'undefined' && PiConnect.showToast) {
            PiConnect.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    // Show success message
    showSuccess(message) {
        if (typeof PiConnect !== 'undefined' && PiConnect.showToast) {
            PiConnect.showToast(message, 'success');
        } else {
            alert(message);
        }
    }
};

// Global functions for button handlers
function startStream() {
    if (!EEGLive.config.connected) {
        if (!EEGLive.connectWebSocket()) {
            return;
        }
    }

    // Send start command to Pi
    if (EEGLive.ws && EEGLive.ws.readyState === WebSocket.OPEN) {
        EEGLive.ws.send(JSON.stringify({ command: 'start' }));
        EEGLive.config.streaming = true;
        EEGLive.updateButtonStates();
        EEGLive.showSuccess('Stream started');
    } else {
        // Wait for connection then start
        setTimeout(() => {
            if (EEGLive.ws && EEGLive.ws.readyState === WebSocket.OPEN) {
                EEGLive.ws.send(JSON.stringify({ command: 'start' }));
                EEGLive.config.streaming = true;
                EEGLive.updateButtonStates();
                EEGLive.showSuccess('Stream started');
            }
        }, 1000);
    }
}

function stopStream() {
    if (EEGLive.ws && EEGLive.ws.readyState === WebSocket.OPEN) {
        EEGLive.ws.send(JSON.stringify({ command: 'stop' }));
    }

    EEGLive.config.streaming = false;
    EEGLive.updateButtonStates();
    EEGLive.showSuccess('Stream stopped');
}

function toggleRecording() {
    const btnRecord = document.getElementById('btnRecord');
    const recordingPanel = document.getElementById('recordingPanel');

    if (!EEGLive.config.recording) {
        // Start recording
        EEGLive.config.recording = true;
        EEGLive.recordingData = [];
        EEGLive.recordingStartTime = Date.now();

        btnRecord.classList.add('recording');
        btnRecord.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        recordingPanel.style.display = 'flex';

        // Start recording timer
        EEGLive.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - EEGLive.recordingStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            document.getElementById('recordingDuration').textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            document.getElementById('recordingSamples').textContent =
                `${EEGLive.recordingData.length} samples`;
        }, 1000);

        EEGLive.showSuccess('Recording started');
    } else {
        // Stop recording
        EEGLive.config.recording = false;
        clearInterval(EEGLive.recordingTimer);

        btnRecord.classList.remove('recording');
        btnRecord.innerHTML = '<i class="fas fa-circle"></i> Record';

        EEGLive.showSuccess(`Recording stopped. ${EEGLive.recordingData.length} samples captured.`);
    }
}

function saveRecording() {
    if (EEGLive.recordingData.length === 0) {
        EEGLive.showError('No data recorded');
        return;
    }

    // Create CSV content
    let csv = 'Timestamp,CH1,CH2,CH3,CH4,CH5,CH6,CH7,CH8\n';

    EEGLive.recordingData.forEach(sample => {
        csv += `${sample.timestamp},${sample.channels.join(',')}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eeg_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    EEGLive.showSuccess('Recording saved as CSV');

    // Hide recording panel
    document.getElementById('recordingPanel').style.display = 'none';
    EEGLive.recordingData = [];
}

function goToClassification() {
    window.location.href = '/results-classification';
}

function goToAutoencoder() {
    window.location.href = '/results-autoencoder';
}

// Sidebar toggle function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    EEGLive.init();
});
