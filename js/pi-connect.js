// Pi Connection Manager
const PiConnect = {
    // Default configuration
    config: {
        ip: localStorage.getItem('pi_ip') || '',
        port: localStorage.getItem('pi_port') || '5001',  // Wake server port
        connected: false,
        scanning: false
    },
    foundDevices: [], // Array to store found Pi devices during scan

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
                        <div class="pi-input-group">
                            <label for="piNetworkBase">Network Base (first 3 octets)</label>
                            <input type="text" id="piNetworkBase" placeholder="e.g., 192.168.1" value="">
                        </div>
                        <button class="pi-btn pi-btn-scan" id="piScanBtn" onclick="PiConnect.scanNetwork()">
                            <i class="fas fa-search"></i> Auto-Scan Network
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

        // Auto-detect network base from current IP
        const networkBaseInput = document.getElementById('piNetworkBase');
        if (this.config.ip) {
            const parts = this.config.ip.split('.');
            if (parts.length === 4) {
                networkBaseInput.value = `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }

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

        // Get network base from saved IP
        let networkBase = '';
        const savedIp = this.config.ip;
        if (savedIp) {
            const parts = savedIp.split('.');
            if (parts.length === 4) {
                networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }

        if (!networkBase) {
            // Default network base if no saved IP
            networkBase = '192.168.1';
        }

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

        let networkBase = networkBaseInput.value.trim();

        // If no network base provided, try to detect from current saved IP
        if (!networkBase) {
            const savedIp = this.config.ip;
            if (savedIp) {
                const parts = savedIp.split('.');
                if (parts.length === 4) {
                    networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
                    networkBaseInput.value = networkBase;
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
