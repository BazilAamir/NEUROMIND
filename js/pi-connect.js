// Pi Connection Manager
const PiConnect = {
    // Default configuration
    config: {
        ip: localStorage.getItem('pi_ip') || '',
        port: localStorage.getItem('pi_port') || '5001',  // Wake server port
        connected: false,
        scanning: false,
        detectedNetworkBase: '' // Auto-detected network base
    },
    // Store
    foundDevices: [], // Array to store found Pi devices during scan

    // Auto-detect local IP using WebRTC - returns all found networks
    async detectLocalNetwork() {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({ iceServers: [] });
            const noop = () => {};
            const foundNetworks = new Set(); // Use Set to avoid duplicates

            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(noop);

            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;

                const candidate = ice.candidate.candidate;
                // Extract IP from candidate string
                const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);

                if (ipMatch) {
                    const ip = ipMatch[1];
                    // Filter out non-local IPs (keep 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
                    if (ip.startsWith('192.168.') || ip.startsWith('10.') ||
                        (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
                        const parts = ip.split('.');
                        const networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
                        foundNetworks.add(networkBase);
                    }
                }
            };

            // Timeout after 3 seconds - return all found networks =====
            //this comment
            setTimeout(() => {
                pc.close();
                const networks = Array.from(foundNetworks);

                if (networks.length === 0) {
                    resolve({ primary: null, all: [] });
                } else if (networks.length === 1) {
                    resolve({ primary: networks[0], all: networks });
                } else {
                    // Prioritize 192.168.x.x networks (most common home/office)
                    const preferred = networks.find(n => n.startsWith('192.168.')) || networks[0];
                    resolve({ primary: preferred, all: networks });
                }
            }, 3000);
        });
    },

    // Initialize Pi Connect button and modal
    init() {
        this.createButton();
        this.createModal();
        this.createToast();
        this.loadSavedConfig();
        this.checkConnection();
    },

    // Create the minimalistic button
    createButton() {
        const btn = document.createElement('button');
        btn.className = 'pi-connect-btn';
        btn.id = 'piConnectBtn';
        btn.innerHTML = `
            <div class="pi-icon"><i class="fas fa-microchip"></i></div>
            <span class="pi-text">Pi</span>
            <div class="pi-status" id="piStatusDot"></div>
        `;
        btn.onclick = () => this.openModal();
        document.body.appendChild(btn);
    },

    // Create the modal
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'pi-modal-overlay';
        modal.id = 'piModal';
        modal.innerHTML = `
            <div class="pi-modal">
                <div class="pi-modal-header">
                    <h3><i class="fas fa-microchip"></i> Raspberry Pi Connection</h3>
                    <button class="pi-modal-close" onclick="PiConnect.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="pi-modal-body">
                    <div class="pi-status-display">
                        <div class="status-dot" id="piStatusDotModal"></div>
                        <span class="status-text" id="piStatusText">Checking connection...</span>
                    </div>

                    <!-- Network Scan Section -->
                    <div class="pi-scan-section">
                        <!-- Network Mode Toggle -->
                        <div class="pi-network-toggle">
                            <button class="pi-toggle-btn active" id="piAutoDetectBtn" onclick="PiConnect.setNetworkMode('auto')">
                                <i class="fas fa-wifi"></i> Auto-Detect
                            </button>
                            <button class="pi-toggle-btn" id="piManualBtn" onclick="PiConnect.setNetworkMode('manual')">
                                <i class="fas fa-keyboard"></i> Manual
                            </button>
                        </div>

                        <!-- Auto-Detect Section -->
                        <div class="pi-auto-detect-section" id="piAutoDetectSection">
                            <div class="pi-detect-status" id="piDetectStatus">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Detecting network...</span>
                            </div>
                            <div class="pi-detected-network" id="piDetectedNetwork" style="display: none;">
                                <div class="pi-detected-label">Detected Network:</div>
                                <select class="pi-network-select" id="piNetworkSelect">
                                    <option value="">Select network...</option>
                                </select>
                                <button class="pi-btn-refresh" onclick="PiConnect.refreshNetworkDetection()">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Manual Entry Section -->
                        <div class="pi-manual-section" id="piManualSection" style="display: none;">
                            <div class="pi-input-group">
                                <label for="piNetworkBase">Network Base (first 3 octets)</label>
                                <input type="text" id="piNetworkBase" placeholder="e.g., 192.168.1" value="">
                            </div>
                        </div>

                        <button class="pi-btn pi-btn-scan" id="piScanBtn" onclick="PiConnect.scanNetwork()">
                            <i class="fas fa-search"></i> Scan Network (0-255)
                        </button>
                        <div class="pi-scan-progress" id="piScanProgress" style="display: none;">
                            <div class="pi-scan-bar">
                                <div class="pi-scan-fill" id="piScanFill"></div>
                            </div>
                            <span class="pi-scan-text" id="piScanText">Scanning 0/255...</span>
                        </div>

                        <!-- Found Devices List -->
                        <div class="pi-found-devices" id="piFoundDevices" style="display: none;">
                            <label class="pi-found-label"><i class="fas fa-server"></i> Found Devices:</label>
                            <div class="pi-device-list" id="piDeviceList"></div>
                        </div>
                    </div>

                    <div class="pi-divider"><span>or enter manually</span></div>

                    <div class="pi-input-group">
                        <label for="piIpInput">IP Address</label>
                        <input type="text" id="piIpInput" placeholder="e.g., 192.168.1.100" value="${this.config.ip}">
                    </div>
                    <div class="pi-input-group">
                        <label for="piPortInput">Port</label>
                        <input type="text" id="piPortInput" placeholder="5001" value="${this.config.port}">
                    </div>
                </div>
                <div class="pi-modal-actions">
                    <button class="pi-btn pi-btn-secondary" onclick="PiConnect.closeModal()">Cancel</button>
                    <button class="pi-btn pi-btn-primary" id="piConnectAction" onclick="PiConnect.connect()">
                        <i class="fas fa-plug"></i> Connect
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    },

    // Create toast container
    createToast() {
        const toast = document.createElement('div');
        toast.className = 'pi-toast';
        toast.id = 'piToast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span id="piToastText">Connected successfully!</span>
        `;
        document.body.appendChild(toast);
    },

    // Open modal
    openModal() {
        const modal = document.getElementById('piModal');
        modal.classList.add('active');
        document.getElementById('piIpInput').value = this.config.ip;
        document.getElementById('piPortInput').value = this.config.port;

        // Reset network mode to auto-detect
        this.setNetworkMode('auto');

        // Auto-detect network base on open
        this.refreshNetworkDetection();

        // Reset scan progress
        const scanProgress = document.getElementById('piScanProgress');
        const scanFill = document.getElementById('piScanFill');
        if (scanProgress) {
            scanProgress.style.display = 'none';
            scanFill.style.width = '0%';
            scanFill.style.background = 'linear-gradient(90deg, #06b6d4, #a855f7)';
        }

        // Reset found devices
        const foundDevicesDiv = document.getElementById('piFoundDevices');
        const deviceList = document.getElementById('piDeviceList');
        if (foundDevicesDiv) {
            foundDevicesDiv.style.display = 'none';
        }
        if (deviceList) {
            deviceList.innerHTML = '';
        }
        this.foundDevices = [];
    },

    // Set network mode (auto/manual)
    setNetworkMode(mode) {
        const autoBtn = document.getElementById('piAutoDetectBtn');
        const manualBtn = document.getElementById('piManualBtn');
        const autoSection = document.getElementById('piAutoDetectSection');
        const manualSection = document.getElementById('piManualSection');

        if (mode === 'auto') {
            autoBtn.classList.add('active');
            manualBtn.classList.remove('active');
            autoSection.style.display = 'block';
            manualSection.style.display = 'none';
        } else {
            autoBtn.classList.remove('active');
            manualBtn.classList.add('active');
            autoSection.style.display = 'none';
            manualSection.style.display = 'block';

            // Pre-fill manual field with detected network if available
            const networkBaseInput = document.getElementById('piNetworkBase');
            if (this.config.detectedNetworkBase) {
                networkBaseInput.value = this.config.detectedNetworkBase;
            } else if (this.config.ip) {
                const parts = this.config.ip.split('.');
                if (parts.length === 4) {
                    networkBaseInput.value = `${parts[0]}.${parts[1]}.${parts[2]}`;
                }
            }
        }
    },

    // Refresh network detection
    async refreshNetworkDetection() {
        const detectStatus = document.getElementById('piDetectStatus');
        const detectedNetwork = document.getElementById('piDetectedNetwork');
        const networkSelect = document.getElementById('piNetworkSelect');

        // Show loading state
        detectStatus.style.display = 'flex';
        detectedNetwork.style.display = 'none';
        detectStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Detecting networks...</span>';

        try {
            const result = await this.detectLocalNetwork();

            if (result.all && result.all.length > 0) {
                // Populate dropdown with all detected networks
                networkSelect.innerHTML = '';
                result.all.forEach((network, index) => {
                    const option = document.createElement('option');
                    option.value = network;
                    option.textContent = network + '.x';
                    // Mark preferred network
                    if (network === result.primary) {
                        option.textContent += ' (Recommended)';
                        option.selected = true;
                    }
                    networkSelect.appendChild(option);
                });

                this.config.detectedNetworkBase = result.primary;
                detectStatus.style.display = 'none';
                detectedNetwork.style.display = 'flex';

                // Add change listener
                networkSelect.onchange = () => {
                    this.config.detectedNetworkBase = networkSelect.value;
                };
            } else {
                // Try to get from saved IP
                if (this.config.ip) {
                    const parts = this.config.ip.split('.');
                    if (parts.length === 4) {
                        const savedNetwork = `${parts[0]}.${parts[1]}.${parts[2]}`;
                        this.config.detectedNetworkBase = savedNetwork;
                        networkSelect.innerHTML = `<option value="${savedNetwork}" selected>${savedNetwork}.x (From saved IP)</option>`;
                        detectStatus.style.display = 'none';
                        detectedNetwork.style.display = 'flex';
                        return;
                    }
                }
                // Show error with fallback
                detectStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i><span>Could not auto-detect. Use Manual mode.</span>';
            }
        } catch (error) {
            console.error('Network detection error:', error);
            detectStatus.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i><span>Detection failed. Use Manual mode.</span>';
        }
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('piModal');
        modal.classList.remove('active');
    },

    // Load saved configuration
    loadSavedConfig() {
        const savedIp = localStorage.getItem('pi_ip');
        const savedPort = localStorage.getItem('pi_port');
        if (savedIp) this.config.ip = savedIp;
        if (savedPort) this.config.port = savedPort;
    },

    // Save configuration
    saveConfig() {
        localStorage.setItem('pi_ip', this.config.ip);
        localStorage.setItem('pi_port', this.config.port);
    },

    // Check connection to Pi - auto scans if not connected
    async checkConnection() {
        this.updateStatus('checking', 'Checking connection...');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Use /health endpoint (GET) for checking connection
            const response = await fetch(`http://${this.config.ip}:${this.config.port}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                this.config.connected = true;
                this.updateStatus('connected', `Connected to ${this.config.ip}`);
                return true;
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.config.connected = false;
            this.updateStatus('disconnected', 'Pi not connected - Auto scanning...');
            // Auto scan network when connection fails
            this.autoScanNetwork();
            return false;
        }
    },

    // Auto scan network in background (without modal)
    async autoScanNetwork() {
        if (this.config.scanning) return;

        // First try to auto-detect network
        const result = await this.detectLocalNetwork();
        let networkBase = result.primary;

        // If detection fails, try saved IP
        if (!networkBase) {
            const savedIp = this.config.ip;
            if (savedIp) {
                const parts = savedIp.split('.');
                if (parts.length === 4) {
                    networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
                }
            }
        }

        // Default fallback
        if (!networkBase) {
            networkBase = '192.168.1';
        }

        this.config.detectedNetworkBase = networkBase;

        this.config.scanning = true;
        const port = this.config.port;
        const totalIps = 255;
        let foundIp = null;

        this.updateStatus('checking', `Scanning ${networkBase}.0-254...`);

        // Create all ping promises at once (fully parallel)
        const allPromises = [];
        for (let i = 0; i <= 254; i++) {
            const testIp = `${networkBase}.${i}`;

            const pingPromise = this.parallelPing(testIp, port).then(result => {
                if (result.success && !foundIp) {
                    foundIp = result.ip;
                    console.log(`✓ Auto-scan found Pi at ${result.ip}`);

                    // Immediately update config and status
                    this.config.ip = foundIp;
                    this.config.connected = true;
                    this.saveConfig();
                    this.updateStatus('connected', `Connected to ${foundIp}`);
                    this.showToast(`Pi found at ${foundIp}!`, 'success');

                    // Update global PI_IP if it exists
                    if (typeof window.PI_IP !== 'undefined') {
                        window.PI_IP = foundIp;
                    }

                    // Update piStatus display on classification page
                    const piStatusEl = document.getElementById('piStatus');
                    if (piStatusEl) {
                        piStatusEl.textContent = foundIp;
                    }
                }
                return result;
            });

            allPromises.push(pingPromise);
        }

        // Wait for all pings to complete
        await Promise.all(allPromises);

        this.config.scanning = false;

        if (!foundIp) {
            this.updateStatus('disconnected', 'Pi not found on network');
        }
    },

    // Connect to Pi with provided settings
    async connect() {
        const ipInput = document.getElementById('piIpInput');
        const portInput = document.getElementById('piPortInput');
        const connectBtn = document.getElementById('piConnectAction');

        const newIp = ipInput.value.trim();
        const newPort = portInput.value.trim();

        if (!newIp || !newPort) {
            this.showToast('Please enter IP and Port', 'error');
            return;
        }

        // Update config
        this.config.ip = newIp;
        this.config.port = newPort;

        // Disable button while connecting
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

        this.updateStatus('checking', 'Connecting...');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // Use /health endpoint (GET) for connection check
            const response = await fetch(`http://${this.config.ip}:${this.config.port}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                this.config.connected = true;
                this.saveConfig();
                this.updateStatus('connected', `Connected to ${this.config.ip}`);
                this.showToast('Connected to Raspberry Pi!', 'success');

                // Update global PI_IP if it exists
                if (typeof window.PI_IP !== 'undefined') {
                    window.PI_IP = this.config.ip;
                }

                setTimeout(() => this.closeModal(), 1000);
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.config.connected = false;
            this.updateStatus('disconnected', 'Connection failed');
            this.showToast('Failed to connect. Check IP and ensure Pi is running.', 'error');
        } finally {
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
        }
    },

    // Update status indicators
    updateStatus(status, text) {
        const statusDot = document.getElementById('piStatusDot');
        const statusDotModal = document.getElementById('piStatusDotModal');
        const statusText = document.getElementById('piStatusText');

        // Remove all status classes
        statusDot?.classList.remove('connected', 'checking');
        statusDotModal?.classList.remove('connected', 'checking');

        if (status === 'connected') {
            statusDot?.classList.add('connected');
            statusDotModal?.classList.add('connected');
        } else if (status === 'checking') {
            statusDot?.classList.add('checking');
            statusDotModal?.classList.add('checking');
        }

        if (statusText) statusText.textContent = text;
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('piToast');
        const toastText = document.getElementById('piToastText');
        const toastIcon = toast.querySelector('i');

        toast.classList.remove('success', 'error', 'show');
        toastIcon.classList.remove('fa-check-circle', 'fa-exclamation-circle');

        if (type === 'success') {
            toast.classList.add('success');
            toastIcon.classList.add('fa-check-circle');
        } else {
            toast.classList.add('error');
            toastIcon.classList.add('fa-exclamation-circle');
        }

        toastText.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Get current Pi URL
    getUrl(endpoint = '') {
        return `http://${this.config.ip}:${this.config.port}${endpoint}`;
    },

    // Scan network to find Raspberry Pi - All IPs in parallel with 50s timeout
    async scanNetwork() {
        if (this.config.scanning) return;

        const networkBaseInput = document.getElementById('piNetworkBase');
        const scanBtn = document.getElementById('piScanBtn');
        const scanProgress = document.getElementById('piScanProgress');
        const scanFill = document.getElementById('piScanFill');
        const scanText = document.getElementById('piScanText');
        const foundDevicesDiv = document.getElementById('piFoundDevices');
        const deviceList = document.getElementById('piDeviceList');
        const autoBtn = document.getElementById('piAutoDetectBtn');

        // Check if auto or manual mode
        const isAutoMode = autoBtn.classList.contains('active');
        let networkBase = '';

        if (isAutoMode) {
            // Use auto-detected network base
            networkBase = this.config.detectedNetworkBase;
            if (!networkBase) {
                this.showToast('Network not detected. Try Manual mode.', 'error');
                return;
            }
        } else {
            // Use manual input
            networkBase = networkBaseInput.value.trim();
        }

        // If no network base, try to detect or use fallback
        if (!networkBase) {
            const savedIp = this.config.ip;
            if (savedIp) {
                const parts = savedIp.split('.');
                if (parts.length === 4) {
                    networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
                    if (!isAutoMode) networkBaseInput.value = networkBase;
                }
            }
        }

        if (!networkBase || networkBase.split('.').length !== 3) {
            this.showToast('Please enter valid network base (e.g., 192.168.1)', 'error');
            return;
        }

        this.config.scanning = true;
        this.foundDevices = []; // Reset found devices
        scanBtn.disabled = true;
        scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning all IPs...';
        scanProgress.style.display = 'block';
        foundDevicesDiv.style.display = 'none';
        deviceList.innerHTML = '';
        scanFill.style.background = 'linear-gradient(90deg, #06b6d4, #a855f7)';
        this.updateStatus('checking', 'Scanning all 255 IPs in parallel...');

        const port = this.config.port;
        const totalIps = 255; // Scan 0-254 (255 IPs)
        let completedCount = 0;
        let firstFoundIp = null;

        // Create all ping promises at once (fully parallel)
        const allPromises = [];
        for (let i = 0; i <= 254; i++) {
            const testIp = `${networkBase}.${i}`;

            // Create a promise that resolves when ping completes and updates progress
            const pingPromise = this.parallelPing(testIp, port).then(result => {
                completedCount++;
                const progress = Math.round((completedCount / totalIps) * 100);
                scanFill.style.width = `${progress}%`;
                scanText.textContent = `Scanning ${completedCount}/${totalIps}... waiting for responses`;

                if (result.success) {
                    console.log(`✓ Pi found at ${result.ip}`);
                    this.foundDevices.push(result.ip);
                    this.addDeviceToList(result.ip, deviceList, foundDevicesDiv);

                    // Auto-select first found IP immediately
                    if (!firstFoundIp) {
                        firstFoundIp = result.ip;
                        this.selectDevice(result.ip);
                        scanFill.style.background = '#22c55e';
                        scanText.textContent = `Found Pi at ${result.ip}! Continuing scan...`;
                        this.showToast(`Found Pi at ${result.ip}!`, 'success');
                    }
                }
                return result;
            });

            allPromises.push(pingPromise);
        }

        // Wait for all pings to complete (max 50 seconds timeout handled in parallelPing)
        scanText.textContent = `Pinging all 255 IPs... waiting up to 50 seconds`;
        await Promise.all(allPromises);

        this.config.scanning = false;
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="fas fa-search"></i> Auto-Scan Network';

        if (this.foundDevices.length > 0) {
            scanFill.style.width = '100%';
            scanFill.style.background = '#22c55e';
            scanText.textContent = `Scan complete! Found ${this.foundDevices.length} device(s)`;

            if (this.foundDevices.length > 1) {
                this.showToast(`Found ${this.foundDevices.length} Pi device(s). First one auto-selected.`, 'success');
            }
        } else {
            scanFill.style.width = '100%';
            scanFill.style.background = '#ef4444';
            scanText.textContent = 'No Pi devices found on network';
            this.updateStatus('disconnected', 'Pi not found');
            this.showToast('No Raspberry Pi found. Make sure wake_server.py is running on port 5001.', 'error');
        }
    },

    // Add found device to the list
    addDeviceToList(ip, deviceList, foundDevicesDiv) {
        foundDevicesDiv.style.display = 'block';

        const deviceItem = document.createElement('div');
        deviceItem.className = 'pi-device-item';
        deviceItem.innerHTML = `
            <div class="pi-device-info">
                <i class="fas fa-server"></i>
                <span class="pi-device-ip">${ip}</span>
                <span class="pi-device-badge">Responding</span>
            </div>
            <button class="pi-device-connect" onclick="PiConnect.selectDevice('${ip}')">
                <i class="fas fa-plug"></i> Select
            </button>
        `;
        deviceList.appendChild(deviceItem);
    },

    // Select a device from the found list
    selectDevice(ip) {
        document.getElementById('piIpInput').value = ip;
        this.config.ip = ip;
        this.saveConfig();
        this.updateStatus('connected', `Selected ${ip}`);
        this.showToast(`Selected ${ip}. Click Connect to establish connection.`, 'success');

        // Update global PI_IP if it exists
        if (typeof window.PI_IP !== 'undefined') {
            window.PI_IP = ip;
        }

        // Highlight selected device
        const deviceItems = document.querySelectorAll('.pi-device-item');
        deviceItems.forEach(item => {
            item.classList.remove('selected');
            if (item.querySelector('.pi-device-ip').textContent === ip) {
                item.classList.add('selected');
            }
        });
    },

    // Parallel ping with 50 second timeout - used for full subnet scan
    async parallelPing(ip, port) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

            // Use /health endpoint (GET) - always available on wake server port 5001
            const response = await fetch(`http://${ip}:${port}/health`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { success: true, ip: ip };
            }
            return { success: false, ip: ip };
        } catch (error) {
            return { success: false, ip: ip };
        }
    },

    // Deep ping with 15 second timeout for reliable detection (legacy)
    async deepPing(ip, port) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            // Use /health endpoint (GET) - always available on wake server port 5001
            const response = await fetch(`http://${ip}:${port}/health`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                console.log(`✓ Found Pi at ${ip}:${port}`);
                return { success: true, ip: ip };
            }
            return { success: false, ip: ip };
        } catch (error) {
            return { success: false, ip: ip };
        }
    },


    // Quick ping for manual connection check (shorter timeout)
    async quickPing(ip, port) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for manual check

            const response = await fetch(`http://${ip}:${port}/health`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { success: true, ip: ip };
            }
            return { success: false, ip: ip };
        } catch (error) {
            return { success: false, ip: ip };
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    PiConnect.init();
});
