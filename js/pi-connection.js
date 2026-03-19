// ===========================================
// RASPBERRY PI CONNECTION BUTTON
// Shared component for all authenticated pages
// ===========================================

(function() {
    // Get Pi config from localStorage (set by PiConnect)
    function getPiIp() {
        return localStorage.getItem('pi_ip') || '';
    }

    function getPiPort() {
        return localStorage.getItem('pi_port') || '5001';
    }

    function getHealthUrl() {
        const ip = getPiIp();
        const port = getPiPort();
        return ip ? `http://${ip}:${port}/health` : '';
    }

    // Inject CSS styles
    const styles = `
        .pi-connection-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.15);
            font-family: 'Inter', sans-serif;
        }

        .pi-connection-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.25);
            border-color: rgba(139, 92, 246, 0.4);
        }

        .pi-status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #9ca3af;
            transition: all 0.3s ease;
        }

        .pi-status-dot.checking {
            background: #f59e0b;
            animation: pulse-status 1s infinite;
        }

        .pi-status-dot.connected {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        .pi-status-dot.disconnected {
            background: #ef4444;
        }

        @keyframes pulse-status {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.9); }
        }

        .pi-btn-icon {
            font-size: 1rem;
            color: #8b5cf6;
        }

        .pi-btn-text {
            font-size: 0.85rem;
            font-weight: 500;
            color: #374151;
        }

        .pi-dropdown {
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 9998;
            min-width: 280px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(139, 92, 246, 0.2);
            padding: 1rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }

        .pi-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .pi-dropdown-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
            margin-bottom: 12px;
        }

        .pi-dropdown-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
        }

        .pi-dropdown-title {
            font-size: 1rem;
            font-weight: 600;
            color: #1e1e2e;
            margin: 0;
        }

        .pi-dropdown-subtitle {
            font-size: 0.75rem;
            color: #6b7280;
            margin: 0;
        }

        .pi-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 0.85rem;
        }

        .pi-info-label {
            color: #6b7280;
        }

        .pi-info-value {
            color: #1e1e2e;
            font-weight: 500;
            font-family: 'Courier New', monospace;
        }

        .pi-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .pi-status-badge.online {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        }

        .pi-status-badge.offline {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        }

        .pi-status-badge.checking {
            background: rgba(245, 158, 11, 0.1);
            color: #d97706;
        }

        .pi-connect-btn {
            width: 100%;
            margin-top: 12px;
            padding: 12px;
            background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .pi-connect-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }

        .pi-connect-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .pi-connect-btn.success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create HTML (dynamic)
    function createButtonHTML() {
        const ip = getPiIp() || 'Not connected';
        const port = getPiPort();

        return `
        <div class="pi-connection-btn" id="piConnectionBtn" onclick="window.togglePiDropdown()">
            <div class="pi-status-dot" id="piStatusDot"></div>
            <i class="fas fa-microchip pi-btn-icon"></i>
            <span class="pi-btn-text">Pi</span>
        </div>

        <div class="pi-dropdown" id="piDropdown">
            <div class="pi-dropdown-header">
                <div class="pi-dropdown-icon">
                    <i class="fas fa-server"></i>
                </div>
                <div>
                    <p class="pi-dropdown-title">Raspberry Pi</p>
                    <p class="pi-dropdown-subtitle">ML Processing Server</p>
                </div>
            </div>
            <div class="pi-info-row">
                <span class="pi-info-label">IP Address</span>
                <span class="pi-info-value" id="piIpDisplay">${ip}</span>
            </div>
            <div class="pi-info-row">
                <span class="pi-info-label">Port</span>
                <span class="pi-info-value">${port}</span>
            </div>
            <div class="pi-info-row">
                <span class="pi-info-label">Status</span>
                <span class="pi-status-badge checking" id="piStatusBadge">
                    <i class="fas fa-circle-notch fa-spin"></i> Checking...
                </span>
            </div>
            <button class="pi-connect-btn" id="piConnectBtn" onclick="window.checkPiConnection()">
                <i class="fas fa-plug"></i>
                <span id="piConnectBtnText">Check Connection</span>
            </button>
        </div>
    `;
    }

    // Inject HTML when DOM is ready
    function injectButton() {
        const container = document.createElement('div');
        container.innerHTML = createButtonHTML();
        document.body.appendChild(container);

        // Initial connection check
        setTimeout(checkPiConnection, 1000);
    }

    // Toggle dropdown
    window.togglePiDropdown = function() {
        const dropdown = document.getElementById('piDropdown');
        dropdown.classList.toggle('show');
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const btn = document.getElementById('piConnectionBtn');
        const dropdown = document.getElementById('piDropdown');
        if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Check Pi connection
    window.checkPiConnection = async function() {
        const statusDot = document.getElementById('piStatusDot');
        const statusBadge = document.getElementById('piStatusBadge');
        const connectBtn = document.getElementById('piConnectBtn');
        const connectBtnText = document.getElementById('piConnectBtnText');
        const piIpDisplay = document.getElementById('piIpDisplay');

        // Update IP display
        const currentIp = getPiIp() || 'Not connected';
        if (piIpDisplay) {
            piIpDisplay.textContent = currentIp;
        }

        // Set checking state
        statusDot.className = 'pi-status-dot checking';
        statusBadge.className = 'pi-status-badge checking';
        statusBadge.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking...';
        connectBtn.disabled = true;
        connectBtnText.textContent = 'Checking...';

        const healthUrl = getHealthUrl();
        if (!healthUrl) {
            statusDot.className = 'pi-status-dot disconnected';
            statusBadge.className = 'pi-status-badge offline';
            statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Not Configured';
            connectBtn.className = 'pi-connect-btn';
            connectBtnText.textContent = 'Configure Pi';
            connectBtn.disabled = false;
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Use GET for /health endpoint
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                // Connected
                statusDot.className = 'pi-status-dot connected';
                statusBadge.className = 'pi-status-badge online';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Online';
                connectBtn.className = 'pi-connect-btn success';
                connectBtnText.textContent = 'Connected';
            } else {
                throw new Error('Server responded with error');
            }
        } catch (error) {
            // Disconnected
            statusDot.className = 'pi-status-dot disconnected';
            statusBadge.className = 'pi-status-badge offline';
            statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Offline';
            connectBtn.className = 'pi-connect-btn';
            connectBtnText.textContent = 'Retry Connection';
        }

        connectBtn.disabled = false;
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectButton);
    } else {
        injectButton();
    }
})();
