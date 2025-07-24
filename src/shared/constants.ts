export const API_GATEWAY_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Gateway Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .controls-bar {
            display: flex;
            gap: 15px;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            margin: 20px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.9);
            color: #667eea;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .control-btn:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .control-btn.active {
            background: #48bb78;
            color: white;
            border-color: #48bb78;
        }

        .refresh-slider {
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
            font-size: 0.9rem;
        }

        .slider {
            width: 100px;
            height: 5px;
            border-radius: 5px;
            background: rgba(255,255,255,0.3);
            outline: none;
            -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
        }

        .slider::-moz-range-thumb {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }

        .section-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
            min-height: 400px;
        }

        .section-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
        }

        .section-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-icon {
            font-size: 1.5rem;
        }

        .test-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .test-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .test-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .section-content {
            min-height: 300px;
            position: relative;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #718096;
            font-size: 0.9rem;
        }

        .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error-message {
            background: #fed7d7;
            color: #742a2a;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            border: 1px solid #feb2b2;
            font-size: 0.9rem;
        }

        .success-message {
            background: #c6f6d5;
            color: #22543d;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            border: 1px solid #9ae6b4;
            font-size: 0.9rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .stat-item {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }

        .stat-value {
            font-size: 1.4rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 0.75rem;
            color: #718096;
            font-weight: 500;
        }

        .users-list {
            display: grid;
            gap: 12px;
            max-height: 280px;
            overflow-y: auto;
        }

        .user-item {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }

        .user-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .user-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .user-details h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .user-details p {
            font-size: 0.8rem;
            color: #718096;
        }

        .user-age {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .orders-grid {
            display: grid;
            gap: 12px;
            max-height: 280px;
            overflow-y: auto;
        }

        .order-item {
            background: linear-gradient(135deg, #f0fff4 0%, #f0fdf4 100%);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #d4edda;
            transition: all 0.2s ease;
        }

        .order-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .order-id {
            font-weight: 600;
            color: #667eea;
            font-size: 0.9rem;
        }

        .order-user {
            font-size: 0.8rem;
            color: #718096;
        }

        .order-products {
            font-size: 0.85rem;
            color: #4a5568;
        }

        .combined-users {
            display: grid;
            gap: 15px;
            max-height: 280px;
            overflow-y: auto;
        }

        .combined-user-card {
            background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
            padding: 18px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }

        .combined-user-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .combined-user-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .combined-user-orders {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        .combined-order-tag {
            background: #667eea;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
        }

        .health-grid {
            display: grid;
            gap: 15px;
        }

        .health-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }

        .health-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 0.9rem;
        }

        .cache-item {
            background: #f0f4f8;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
        }

        .cache-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .cache-name {
            font-weight: 600;
            color: #2d3748;
            font-size: 0.85rem;
        }

        .cache-status {
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
        }

        .cache-valid { background: #c6f6d5; color: #22543d; }
        .cache-invalid { background: #fed7d7; color: #742a2a; }

        .cache-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 0.75rem;
            color: #718096;
        }

        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 2s infinite;
        }

        .status-healthy { background: #48bb78; }
        .status-unhealthy { background: #f56565; }
        .status-warning { background: #ed8936; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .timestamp {
            font-size: 0.75rem;
            color: #a0aec0;
            font-style: italic;
            text-align: center;
            margin-top: 15px;
        }

        .user-id-input {
            width: 60px;
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            margin-right: 10px;
            font-size: 0.85rem;
        }

        @media (max-width: 1200px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .controls-bar {
                flex-direction: column;
                gap: 10px;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Gateway Dashboard</h1>
            <p>Real-time monitoring and testing of microservices endpoints</p>
        </div>

        <div class="controls-bar">
            <div class="control-group">
                <button class="control-btn" onclick="refreshAll()">🔄 Refresh All</button>
                <button class="control-btn" id="auto-refresh-btn" onclick="toggleAutoRefresh()">
                    ⏱️ Auto Refresh: <span id="auto-refresh-status">OFF</span>
                </button>
                <a href="http://localhost:3000" target="_blank" class="control-btn">
                    🌐 Service Discovery Dashboard
                </a>
            </div>
            
            <div class="refresh-slider">
                <span>Refresh Rate:</span>
                <input type="range" id="refresh-rate" class="slider" min="1" max="10" value="5" 
                       onchange="updateRefreshRate()" disabled>
                <span id="refresh-rate-value">5s</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Users Section -->
            <div class="section-card">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">👥</span>
                        All Users
                    </div>
                    <button class="test-btn" onclick="loadUsers()">Test Endpoint</button>
                </div>
                <div class="section-content" id="users-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading users...
                    </div>
                </div>
            </div>

            <!-- User Orders Section -->
            <div class="section-card">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">📦</span>
                        User Orders
                    </div>
                    <div style="display: flex; align-items: center;">
                        <input type="number" id="user-id-input" class="user-id-input" 
                               placeholder="ID" min="1" value="1">
                        <button class="test-btn" onclick="loadUserOrders()">Test Endpoint</button>
                    </div>
                </div>
                <div class="section-content" id="orders-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading orders...
                    </div>
                </div>
            </div>

            <!-- Users with Orders Section -->
            <div class="section-card">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">🔗</span>
                        Users with Orders
                    </div>
                    <button class="test-btn" onclick="loadUsersWithOrders()">Test Endpoint</button>
                </div>
                <div class="section-content" id="combined-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading combined data...
                    </div>
                </div>
            </div>

            <!-- Health & Cache Section -->
            <div class="section-card">
                <div class="section-header">
                    <div class="section-title">
                        <span class="status-indicator" id="health-indicator"></span>
                        Health & Cache
                    </div>
                    <button class="test-btn" onclick="loadHealth()">Test Endpoint</button>
                </div>
                <div class="section-content" id="health-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading health status...
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:8000';
        let autoRefreshInterval = null;
        let isAutoRefreshEnabled = false;
        let refreshRate = 5; // seconds

        // Utility functions
        function formatTimestamp(timestamp) {
            return new Date(timestamp).toLocaleString();
        }

        function formatTimeToExpiry(milliseconds) {
            if (milliseconds <= 0) return 'Expired';
            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            if (minutes > 0) return \`\${minutes}m \${seconds % 60}s\`;
            return \`\${seconds}s\`;
        }

        function showLoading(elementId, message = 'Loading...') {
            document.getElementById(elementId).innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    \${message}
                </div>
            \`;
        }

        function showError(elementId, message) {
            document.getElementById(elementId).innerHTML = \`
                <div class="error-message">
                    \${message}
                </div>
            \`;
        }

        function showSuccess(elementId, message) {
            document.getElementById(elementId).innerHTML = \`
                <div class="success-message">
                    \${message}
                </div>
            \`;
        }

        // Load Users
        async function loadUsers() {
            showLoading('users-content', 'Fetching all users...');
            
            try {
                const response = await fetch(\`\${API_BASE}/users\`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch users');
                }

                const usersHtml = \`
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">\${data.users.length}</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">✅</div>
                            <div class="stat-label">Status</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">🔄</div>
                            <div class="stat-label">\${data.meta.source}</div>
                        </div>
                    </div>
                    <div class="users-list">
                        \${data.users.map(user => \`
                            <div class="user-item">
                                <div class="user-info">
                                    <div class="user-details">
                                        <h4>\${user.name}</h4>
                                        <p>\${user.email}</p>
                                    </div>
                                    <div class="user-age">\${user.age}y</div>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    <div class="timestamp">
                        Instance: \${data.meta.instance}<br>
                        Last Updated: \${formatTimestamp(data.meta.timestamp)}
                    </div>
                \`;
                
                document.getElementById('users-content').innerHTML = usersHtml;
                
            } catch (error) {
                showError('users-content', \`Failed to load users: \${error.message}\`);
            }
        }

        // Load User Orders
        async function loadUserOrders() {
            const userId = document.getElementById('user-id-input').value || '1';
            showLoading('orders-content', \`Fetching orders for user \${userId}...\`);
            
            try {
                const response = await fetch(\`\${API_BASE}/orders/user/\${userId}\`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch orders');
                }

                const ordersHtml = \`
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">\${data.orders.length}</div>
                            <div class="stat-label">Orders Found</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${userId}</div>
                            <div class="stat-label">User ID</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">✅</div>
                            <div class="stat-label">Status</div>
                        </div>
                    </div>
                    <div class="orders-grid">
                        \${data.orders.map(order => \`
                            <div class="order-item">
                                <div class="order-header">
                                    <span class="order-id">Order #\${order.id}</span>
                                    <span class="order-user">User \${order.userId}</span>
                                </div>
                                <div class="order-products">
                                    Products: \${order.products.join(', ')}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    <div class="timestamp">
                        Instance: \${data.meta.instance}<br>
                        Last Updated: \${formatTimestamp(data.meta.timestamp)}
                    </div>
                \`;
                
                document.getElementById('orders-content').innerHTML = ordersHtml;
                
            } catch (error) {
                showError('orders-content', \`Failed to load orders: \${error.message}\`);
            }
        }

        // Load Users with Orders
        async function loadUsersWithOrders() {
            showLoading('combined-content', 'Fetching users with their orders...');
            
            try {
                const response = await fetch(\`\${API_BASE}/users-with-orders\`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch combined data');
                }

                const combinedHtml = \`
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">\${data.meta.totalUsers}</div>
                            <div class="stat-label">Users</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${data.meta.totalOrders}</div>
                            <div class="stat-label">Orders</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${(data.meta.totalOrders / data.meta.totalUsers).toFixed(1)}</div>
                            <div class="stat-label">Avg/User</div>
                        </div>
                    </div>
                    <div class="combined-users">
                        \${data.users.map(user => \`
                            <div class="combined-user-card">
                                <div class="combined-user-header">
                                    <div class="user-details">
                                        <h4>\${user.name}</h4>
                                        <p>\${user.email}</p>
                                    </div>
                                    <div class="user-age">\${user.age}y</div>
                                </div>
                                <div class="combined-user-orders">
                                    \${user.orders.map(order => \`
                                        <span class="combined-order-tag">#\${order.id}</span>
                                    \`).join('')}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    <div class="timestamp">
                        Instance: \${data.meta.instance}<br>
                        Last Updated: \${formatTimestamp(data.meta.timestamp)}
                    </div>
                \`;
                
                document.getElementById('combined-content').innerHTML = combinedHtml;
                
            } catch (error) {
                showError('combined-content', \`Failed to load combined data: \${error.message}\`);
            }
        }

        // Load Health & Cache
        async function loadHealth() {
            showLoading('health-content', 'Checking system health...');
            
            try {
                const response = await fetch(\`\${API_BASE}/health\`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch health status');
                }

                // Update health indicator
                const indicator = document.getElementById('health-indicator');
                indicator.className = \`status-indicator \${data.status === 'healthy' ? 'status-healthy' : 'status-unhealthy'}\`;

                const healthHtml = \`
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">\${data.status === 'healthy' ? '✅' : '❌'}</div>
                            <div class="stat-label">Gateway</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${data.serviceDiscovery.status === 'healthy' ? '🟢' : '🔴'}</div>
                            <div class="stat-label">Discovery</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${data.port}</div>
                            <div class="stat-label">Port</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">\${Object.keys(data.cache || {}).length}</div>
                            <div class="stat-label">Cached</div>
                        </div>
                    </div>
                    <div class="health-grid">
                        <div class="health-section">
                            <div class="health-title">🏥 System Status</div>
                            <p><strong>Gateway:</strong> \${data.status}</p>
                            <p><strong>Service Discovery:</strong> \${data.serviceDiscovery.status}</p>
                            <p><strong>Instance:</strong> \${data.instance}</p>
                            \${data.serviceDiscovery.error ? \`<p style="color: #e53e3e;"><strong>Error:</strong> \${data.serviceDiscovery.error}</p>\` : ''}
                        </div>
                        <div class="health-section">
                            <div class="health-title">🗄️ Service Cache</div>
                            \${Object.keys(data.cache || {}).length === 0 ? 
                                '<p style="color: #718096;">No cached services</p>' :
                                Object.entries(data.cache).map(([serviceName, cacheData]) => \`
                                    <div class="cache-item">
                                        <div class="cache-header">
                                            <span class="cache-name">\${serviceName}</span>
                                            <span class="cache-status \${cacheData.isValid ? 'cache-valid' : 'cache-invalid'}">
                                                \${cacheData.isValid ? 'Valid' : 'Expired'}
                                            </span>
                                        </div>
                                        <div class="cache-details">
                                            <div><strong>\${cacheData.servicesCount}</strong> instances</div>
                                            <div>TTL: <strong>\${formatTimeToExpiry(cacheData.timeToExpiry)}</strong></div>
                                        </div>
                                    </div>
                                \`).join('')
                            }
                        </div>
                    </div>
                    <div class="timestamp">
                        Last Updated: \${formatTimestamp(data.timestamp)}
                    </div>
                \`;
                
                document.getElementById('health-content').innerHTML = healthHtml;
                
            } catch (error) {
                showError('health-content', \`Failed to load health status: \${error.message}\`);
                document.getElementById('health-indicator').className = 'status-indicator status-unhealthy';
            }
        }

        // Auto-refresh controls
        function toggleAutoRefresh() {
            const btn = document.getElementById('auto-refresh-btn');
            const status = document.getElementById('auto-refresh-status');
            const slider = document.getElementById('refresh-rate');
            
            if (isAutoRefreshEnabled) {
                clearInterval(autoRefreshInterval);
                status.textContent = 'OFF';
                btn.classList.remove('active');
                slider.disabled = true;
                isAutoRefreshEnabled = false;
            } else {
                startAutoRefresh();
                status.textContent = \`ON (\${refreshRate}s)\`;
                btn.classList.add('active');
                slider.disabled = false;
                isAutoRefreshEnabled = true;
            }
        }

        function startAutoRefresh() {
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(() => {
                loadHealth(); // Only auto-refresh health by default
            }, refreshRate * 1000);
        }

        function updateRefreshRate() {
            refreshRate = parseInt(document.getElementById('refresh-rate').value);
            document.getElementById('refresh-rate-value').textContent = \`\${refreshRate}s\`;
            
            if (isAutoRefreshEnabled) {
                document.getElementById('auto-refresh-status').textContent = \`ON (\${refreshRate}s)\`;
                startAutoRefresh();
            }
        }

        function refreshAll() {
            Promise.all([
                loadUsers(),
                loadUserOrders(),
                loadUsersWithOrders(),
                loadHealth()
            ]).then(() => {
                console.log('All sections refreshed');
            }).catch(error => {
                console.error('Error refreshing sections:', error);
            });
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            // Load health immediately and start auto-refresh
            loadHealth();
            
            // Start auto-refresh for health after 5 seconds
            setTimeout(() => {
                if (!isAutoRefreshEnabled) {
                    toggleAutoRefresh();
                }
            }, 5000);
            
            // Load other sections with slight delays
            setTimeout(loadUsers, 1000);
            setTimeout(loadUserOrders, 2000);
            setTimeout(loadUsersWithOrders, 3000);
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && isAutoRefreshEnabled) {
                clearInterval(autoRefreshInterval);
            } else if (!document.hidden && isAutoRefreshEnabled) {
                startAutoRefresh();
            }
        });
    </script>
</body>
</html>`;
