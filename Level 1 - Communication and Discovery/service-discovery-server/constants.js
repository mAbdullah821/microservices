module.exports.dashboard_html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Service Discovery Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 300;
                margin-bottom: 10px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 1.1rem;
            }
            
            .content {
                padding: 30px;
            }
            
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 25px;
                margin-bottom: 30px;
            }
            
            .card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                border: 1px solid rgba(0, 0, 0, 0.05);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
            }
            
            .card-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .card-icon {
                font-size: 1.5rem;
                margin-right: 10px;
            }
            
            .card-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #333;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-row {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .form-row input {
                flex: 1;
            }
            
            input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
                background: #fafbfc;
            }
            
            input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                background: white;
            }
            
            button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                width: 100%;
            }
            
            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            button:active {
                transform: translateY(0);
            }
            
            .btn-danger {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            }
            
            .btn-danger:hover {
                box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
            }
            
            .btn-success {
                background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
            }
            
            .btn-success:hover {
                box-shadow: 0 5px 15px rgba(81, 207, 102, 0.4);
            }
            
            .services-section {
                grid-column: 1 / -1;
            }
            
            .service-item {
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border: 1px solid #e9ecef;
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0;
                border-left: 4px solid #28a745;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .service-item:hover {
                transform: translateX(5px);
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            }
            
            .service-item.dead {
                border-left-color: #dc3545;
                opacity: 0.7;
                background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            }
            
            .service-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .service-url {
                font-size: 1.1rem;
                font-weight: 600;
                color: #2d3748;
            }
            
            .service-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #28a745;
                animation: pulse 2s infinite;
            }
            
            .status-indicator.dead {
                background: #dc3545;
                animation: none;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
                100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            }
            
            .service-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
                font-size: 0.9rem;
                color: #666;
            }
            
            .service-actions {
                display: flex;
                gap: 10px;
            }
            
            .service-actions button {
                width: auto;
                padding: 8px 15px;
                font-size: 12px;
            }
            
            .result {
                margin-top: 15px;
                padding: 15px;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                white-space: pre-wrap;
            }
            
            .result.success {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .result.error {
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                padding: 20px;
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-radius: 12px;
            }
            
            .stat {
                text-align: center;
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #1976d2;
            }
            
            .stat-label {
                color: #666;
                font-size: 0.9rem;
            }
            
            .no-services {
                text-align: center;
                padding: 40px;
                color: #666;
                font-style: italic;
            }
            
            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: 1fr;
                }
                
                .form-row {
                    flex-direction: column;
                }
                
                .service-actions {
                    flex-direction: column;
                }
                
                .stats {
                    flex-direction: column;
                    gap: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔍 Service Discovery</h1>
                <p>Manage and monitor your microservices in real-time</p>
            </div>
            
            <div class="content">
                <div class="grid">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-icon">📝</span>
                            <span class="card-title">Register Service</span>
                        </div>
                        <div class="form-group">
                            <input type="text" id="regName" placeholder="Service Name (e.g., user-service)" />
                        </div>
                        <div class="form-row">
                            <input type="number" id="regPort" placeholder="Port (e.g., 8080)" />
                            <input type="number" id="regInterval" placeholder="Heartbeat Interval (seconds)" value="30" />
                        </div>
                        <button onclick="registerService()" class="btn-success">Register Service</button>
                        <div id="regResult"></div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <span class="card-icon">💓</span>
                            <span class="card-title">Send Heartbeat</span>
                        </div>
                        <div class="form-group">
                            <input type="text" id="hbName" placeholder="Service Name" />
                        </div>
                        <div class="form-group">
                            <input type="number" id="hbPort" placeholder="Port" />
                        </div>
                        <button onclick="sendHeartbeat()">Send Heartbeat</button>
                        <div id="hbResult"></div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <span class="card-icon">🔍</span>
                            <span class="card-title">Discover Services</span>
                        </div>
                        <div class="form-group">
                            <input type="text" id="discoverName" placeholder="Service Name" />
                        </div>
                        <button onclick="discoverServices()">Discover Services</button>
                        <div id="discoverResult"></div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <span class="card-icon">🗑️</span>
                            <span class="card-title">Remove Service</span>
                        </div>
                        <div class="form-group">
                            <input type="text" id="delName" placeholder="Service Name" />
                        </div>
                        <div class="form-group">
                            <input type="number" id="delPort" placeholder="Port" />
                        </div>
                        <button onclick="removeService()" class="btn-danger">Remove Service</button>
                        <div id="delResult"></div>
                    </div>
                    
                    <div class="card services-section">
                        <div class="card-header">
                            <span class="card-icon">📊</span>
                            <span class="card-title">All Services</span>
                        </div>
                        <button onclick="getAllServices()">Refresh All Services</button>
                        <div id="serviceStats"></div>
                        <div id="allServices"></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            async function makeRequest(url, method = 'GET', body = null) {
                const options = { method };
                if (body) {
                    options.headers = { 'Content-Type': 'application/json' };
                    options.body = JSON.stringify(body);
                }
                
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                    throw new Error(errorData.error || ("HTTP" + response.status));
                }
                
                return response.json();
            }

            function showResult(elementId, result, isError = false) {
                const element = document.getElementById(elementId);
                const className = isError ? 'result error' : 'result success';
                const icon = isError ? '❌' : '✅';
                element.innerHTML = \`<div class="\${className}">\${icon} \${JSON.stringify(result, null, 2)}</div>\`;
                
                setTimeout(() => {
                    element.innerHTML = '';
                }, 5000);
            }

            async function registerService() {
                const name = document.getElementById('regName').value.trim();
                const port = parseInt(document.getElementById('regPort').value);
                const heartbeatInterval = parseInt(document.getElementById('regInterval').value);
                
                if (!name || !port || !heartbeatInterval) {
                    showResult('regResult', { error: 'Please fill in all fields' }, true);
                    return;
                }
                
                try {
                    const result = await makeRequest('/register', 'POST', { name, port, heartbeatInterval });
                    showResult('regResult', result);
                    
                    // Clear form
                    document.getElementById('regName').value = '';
                    document.getElementById('regPort').value = '';
                    document.getElementById('regInterval').value = '30';
                    
                    // Refresh services
                    setTimeout(getAllServices, 1000);
                } catch (error) {
                    showResult('regResult', { error: error.message }, true);
                }
            }

            async function sendHeartbeat() {
                const name = document.getElementById('hbName').value.trim();
                const port = parseInt(document.getElementById('hbPort').value);
                
                if (!name || !port) {
                    showResult('hbResult', { error: 'Please fill in all fields' }, true);
                    return;
                }
                
                try {
                    const result = await makeRequest('/heartbeat', 'POST', { name, port });
                    showResult('hbResult', result);
                    setTimeout(getAllServices, 1000);
                } catch (error) {
                    showResult('hbResult', { error: error.message }, true);
                }
            }

            async function discoverServices() {
                const name = document.getElementById('discoverName').value.trim();
                
                if (!name) {
                    showResult('discoverResult', { error: 'Please enter a service name' }, true);
                    return;
                }
                
                try {
                    const result = await makeRequest('/services/' + encodeURIComponent(name));
                    let html = \`<div class="stats">
                        <div class="stat">
                            <div class="stat-number">\${result.services.length}</div>
                            <div class="stat-label">Alive Instances</div>
                        </div>
                    </div>\`;
                    
                    if (result.services.length === 0) {
                        html += '<div class="no-services">No alive services found</div>';
                    } else {
                        result.services.forEach(service => {
                            const lastSeen = new Date(service.lastHeartbeat).toLocaleString();
                            const registered = new Date(service.registeredAt).toLocaleString();
                            html += \`
                                <div class="service-item">
                                    <div class="service-header">
                                        <div class="service-url">\${service.url}</div>
                                        <div class="service-status">
                                            <div class="status-indicator"></div>
                                            <span>Online</span>
                                        </div>
                                    </div>
                                    <div class="service-details">
                                        <div><strong>Last Heartbeat:</strong> \${lastSeen}</div>
                                        <div><strong>Registered:</strong> \${registered}</div>
                                        <div><strong>Interval:</strong> \${service.heartbeatInterval}s</div>
                                        <div><strong>ID:</strong> \${service.id}</div>
                                    </div>
                                </div>
                            \`;
                        });
                    }
                    
                    document.getElementById('discoverResult').innerHTML = html;
                } catch (error) {
                    showResult('discoverResult', { error: error.message }, true);
                }
            }

            async function removeService() {
                const name = document.getElementById('delName').value.trim();
                const port = parseInt(document.getElementById('delPort').value);
                
                if (!name || !port) {
                    showResult('delResult', { error: 'Please fill in all fields' }, true);
                    return;
                }
                
                try {
                    const result = await makeRequest(\`/services/\${encodeURIComponent(name)}/\${port}\`, 'DELETE');
                    showResult('delResult', result);
                    
                    // Clear form
                    document.getElementById('delName').value = '';
                    document.getElementById('delPort').value = '';
                    
                    // Refresh services
                    setTimeout(getAllServices, 1000);
                } catch (error) {
                    showResult('delResult', { error: error.message }, true);
                }
            }

            async function getAllServices() {
                try {
                    const result = await makeRequest('/services');
                    const serviceNames = Object.keys(result);
                    let totalInstances = 0;
                    let totalServices = serviceNames.length;
                    
                    // Calculate stats
                    serviceNames.forEach(serviceName => {
                        totalInstances += result[serviceName].length;
                    });
                    
                    let statsHtml = \`
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-number">\${totalServices}</div>
                                <div class="stat-label">Services</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">\${totalInstances}</div>
                                <div class="stat-label">Total Instances</div>
                            </div>
                        </div>
                    \`;
                    
                    document.getElementById('serviceStats').innerHTML = statsHtml;
                    
                    let html = '';
                    
                    if (serviceNames.length === 0) {
                        html = '<div class="no-services">No services registered</div>';
                    } else {
                        serviceNames.forEach(serviceName => {
                            html += \`<h4 style="margin: 25px 0 15px 0; color: #333; font-size: 1.3rem;">\${serviceName} (\${result[serviceName].length} instances)</h4>\`;
                            result[serviceName].forEach(service => {
                                const lastSeen = new Date(service.lastHeartbeat).toLocaleString();
                                const registered = new Date(service.registeredAt).toLocaleString();
                                const port = service.port || service.url.match(/:(\d+)$/)?.[1] || 'unknown';
                                
                                html += \`
                                    <div class="service-item">
                                        <div class="service-header">
                                            <div class="service-url">http://\${service.ip}:\${service.port}</div>
                                            <div class="service-status">
                                                <div class="status-indicator"></div>
                                                <span>Online</span>
                                            </div>
                                        </div>
                                        <div class="service-details">
                                            <div><strong>ID:</strong> \${service.id}</div>
                                            <div><strong>Last Heartbeat:</strong> \${lastSeen}</div>
                                            <div><strong>Registered:</strong> \${registered}</div>
                                            <div><strong>Interval:</strong> \${service.heartbeatInterval}s</div>
                                        </div>
                                        <div class="service-actions">
                                            <button onclick="quickHeartbeat('\${serviceName}', '\${port}')" class="btn-success">Send Heartbeat</button>
                                            <button onclick="quickRemove('\${serviceName}', '\${port}')" class="btn-danger">Remove</button>
                                        </div>
                                    </div>
                                \`;
                            });
                        });
                    }
                    
                    document.getElementById('allServices').innerHTML = html;
                } catch (error) {
                    document.getElementById('allServices').innerHTML = 
                        '<div class="result error">❌ Failed to load services: ' + error.message + '</div>';
                }
            }

            async function quickHeartbeat(serviceName, port) {
                try {
                    const result = await makeRequest('/heartbeat', 'POST', { 
                        name: serviceName, 
                        port: parseInt(port) 
                    });
                    showResult('allServices', { message: \`Heartbeat sent for \${serviceName}:\${port}\` });
                    setTimeout(getAllServices, 1000);
                } catch (error) {
                    showResult('allServices', { error: error.message }, true);
                }
            }

            async function quickRemove(serviceName, port) {
                if (!confirm(\`Are you sure you want to remove \${serviceName}:\${port}?\`)) {
                    return;
                }
                
                try {
                    const result = await makeRequest(\`/services/\${encodeURIComponent(serviceName)}/\${port}\`, 'DELETE');
                    showResult('allServices', { message: \`Removed \${serviceName}:\${port}\` });
                    setTimeout(getAllServices, 1000);
                } catch (error) {
                    showResult('allServices', { error: error.message }, true);
                }
            }

            // Auto-refresh all services every 15 seconds
            setInterval(getAllServices, 15000);
            
            // Load all services on page load
            getAllServices();
        </script>
    </body>
    </html>
  `;
