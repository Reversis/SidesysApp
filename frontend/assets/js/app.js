// Configuración global de la aplicación
const APP_CONFIG = {
    API_BASE_URL: '/api',
    STORAGE_KEYS: {
        TOKEN: 'sidesys_token',
        USER: 'sidesys_user'
    }
};

// Estado global de la aplicación
let AppState = {
    user: null,
    token: null,
    currentView: null
};

// Inicialización de la aplicación
class SidesysApp {
    constructor() {
        console.log('🚀 Inicializando SIDESYS App...');
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Verificando autenticación...');
            // Ocultar loading
            this.hideLoading();
            
            // Verificar autenticación
            await this.checkAuth();
            
            // Configurar interceptores de fetch
            this.setupInterceptors();
            
            // Cargar la vista apropiada
            this.loadView();
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            this.showLogin();
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    async checkAuth() {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
        const user = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER);

        console.log('📝 Token en localStorage:', token ? 'Presente' : 'No presente');
        console.log('👤 User en localStorage:', user ? 'Presente' : 'No presente');

        if (token && user) {
            try {
                console.log('🔐 Verificando token...');
                // Verificar si el token es válido haciendo una llamada a /api/auth/me
                const response = await this.apiCall('/auth/me', 'GET');
                
                if (response.success) {
                    AppState.token = token;
                    AppState.user = response.data; // Usar los datos del servidor
                    console.log('✅ Usuario autenticado:', AppState.user);
                    return true;
                }
            } catch (error) {
                console.error('❌ Error verificando token:', error);
                // Si hay error, limpiar localStorage y mostrar login
                this.clearAuthData();
                return false;
            }
        }
        return false;
    }

    clearAuthData() {
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
        AppState.token = null;
        AppState.user = null;
    }

    setupInterceptors() {
        console.log('🔧 Configurando interceptores...');
        // Guardar el fetch original
        const originalFetch = window.fetch;
        
        // Sobrescribir fetch para agregar headers automáticamente
        window.fetch = async (url, options = {}) => {
            const config = { 
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            // Agregar token si existe
            if (AppState.token) {
                config.headers['Authorization'] = `Bearer ${AppState.token}`;
            }

            console.log(`🌐 Fetch: ${url}`, config.method || 'GET');
            
            try {
                const response = await originalFetch(url, config);
                
                // Si es una respuesta no autorizada, limpiar auth
                if (response.status === 401) {
                    this.clearAuthData();
                    this.showLogin();
                    throw new Error('No autorizado');
                }
                
                return response;
            } catch (error) {
                console.error('❌ Error en fetch:', error);
                throw error;
            }
        };
    }

    loadView() {
        console.log('📱 Cargando vista...', AppState.user ? 'Dashboard' : 'Login');
        
        if (AppState.user) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        console.log('🔓 Mostrando pantalla de login...');
        
        // Crear contenido del login directamente
        const loginHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h1>🔐 SIDESYS Vigencias</h1>
                    <p>Sistema de Control de Vigencias</p>
                </div>

                <div class="login-form">
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required 
                                   placeholder="usuario@sidesys.com" value="stac@sidesys.com">
                        </div>

                        <div class="form-group">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" required 
                                   placeholder="••••••••" value="Admin123">
                        </div>

                        <div id="error-message" class="error-message" style="display: none;"></div>

                        <button type="submit" class="btn btn-primary btn-block">
                            <span class="btn-text">Iniciar Sesión</span>
                        </button>
                    </form>

                    <div class="login-info">
                        <h3>💡 Credenciales de Prueba</h3>
                        <div class="demo-credentials">
                            <p><strong>Email:</strong> stac@sidesys.com</p>
                            <p><strong>Contraseña:</strong> Admin123</p>
                            <p><strong>Rol:</strong> STAC (Administrador)</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    color: white;
                }

                .login-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }

                .login-form {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    width: 100%;
                    max-width: 400px;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e1e5e9;
                    border-radius: 5px;
                    font-size: 1rem;
                }

                .btn-block {
                    width: 100%;
                }

                .error-message {
                    background: #fee;
                    color: #c33;
                    padding: 0.75rem;
                    border-radius: 5px;
                    margin-bottom: 1rem;
                    display: none;
                }

                .login-info {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #eee;
                }

                .demo-credentials {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 5px;
                    font-size: 0.9rem;
                }
            </style>
        `;

        document.getElementById('app').innerHTML = loginHTML;
        
        // Configurar el evento del formulario
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            // Mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="btn-spinner"></div> Iniciando sesión...';

            console.log('🔐 Intentando login...', { email });

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log('📨 Respuesta del login:', result);

            if (result.success) {
                // Guardar en localStorage
                localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN, result.data.token);
                localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER, JSON.stringify(result.data.user));
                
                AppState.token = result.data.token;
                AppState.user = result.data.user;
                
                console.log('✅ Login exitoso, redirigiendo...');
                
                // Redirigir al dashboard
                this.showDashboard();
            } else {
                this.showError(errorDiv, result.message || 'Error en el login');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showError(errorDiv, 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Iniciar Sesión</span>';
        }
    }

    showError(errorDiv, message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showDashboard() {
        console.log('📊 Mostrando dashboard...');
        
        // Crear contenido básico del dashboard
        const dashboardHTML = `
            <div class="app-container">
                <nav class="sidebar">
                    <div class="sidebar-header">
                        <h3>🏢 SIDESYS</h3>
                        <p>Control de Vigencias</p>
                    </div>
                    <ul class="sidebar-nav">
                        <li><a href="#dashboard" class="active">📊 Dashboard</a></li>
                        <li><a href="#clientes">🏢 Clientes</a></li>
                        <li><a href="#productos">📦 Productos</a></li>
                        <li><a href="#vigencias">📅 Vigencias</a></li>
                        <li><a href="#semaforo">🚦 Semáforo</a></li>
                        <li><a href="#usuarios">👥 Usuarios</a></li>
                        <li><a href="#configuracion">⚙️ Configuración</a></li>
                    </ul>
                </nav>

                <main class="main-content">
                    <header class="header">
                        <div class="header-left">
                            <h1>Dashboard</h1>
                        </div>
                        <div class="header-right">
                            <div class="user-menu">
                                <span class="user-role">${AppState.user.rol}</span>
                                <span class="user-info">${AppState.user.nombreCompleto}</span>
                                <button class="btn btn-outline" id="logoutBtnDashboard">Cerrar Sesión</button>
                            </div>
                        </div>
                    </header>

                    <div class="content">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon total">📊</div>
                                <div class="stat-info">
                                    <h3 id="totalVigencias">0</h3>
                                    <p>Total Vigencias</p>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon critico">🔥</div>
                                <div class="stat-info">
                                    <h3 id="vigenciasRojo">0</h3>
                                    <p>Estado Crítico</p>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon advertencia">⚠️</div>
                                <div class="stat-info">
                                    <h3 id="vigenciasAmarillo">0</h3>
                                    <p>Por Vencer</p>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon vigentes">✅</div>
                                <div class="stat-info">
                                    <h3 id="vigenciasVerde">0</h3>
                                    <p>Vigentes</p>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h2>Bienvenido al Sistema de Vigencias</h2>
                            </div>
                            <div class="card-body">
                                <p>¡Hola ${AppState.user.nombreCompleto}!</p>
                                <p>Tu rol es: <strong>${AppState.user.rol}</strong></p>
                                <p>Selecciona una opción del menú lateral para comenzar.</p>
                                
                                <div style="margin-top: 20px;">
                                    <button class="btn btn-primary" onclick="window.SidesysApp.loadModule('dashboard')">
                                        📊 Ir al Dashboard Completo
                                    </button>
                                    <button class="btn btn-outline" onclick="window.SidesysApp.logout()">
                                        🔒 Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style>
                .app-container { display: flex; min-height: 100vh; }
                .sidebar { width: 250px; background: #2c3e50; color: white; }
                .sidebar-header { padding: 1rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .sidebar-nav { list-style: none; padding: 1rem 0; }
                .sidebar-nav li { margin: 0.5rem 0; }
                .sidebar-nav a { color: white; text-decoration: none; padding: 0.75rem 1.5rem; display: block; }
                .sidebar-nav a.active { background: rgba(255,255,255,0.1); border-left: 3px solid #3498db; }
                .main-content { flex: 1; background: #f8f9fa; }
                .header { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .content { padding: 2rem; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
                .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem; }
                .stat-icon { font-size: 2rem; }
                .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
                .card-header { padding: 1.5rem; border-bottom: 1px solid #eee; }
                .card-body { padding: 1.5rem; }
                .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin: 0.25rem; }
                .btn-primary { background: #3498db; color: white; }
                .btn-outline { background: transparent; border: 2px solid #3498db; color: #3498db; }
                .user-menu { display: flex; align-items: center; gap: 1rem; }
                .user-role { background: #3498db; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; }
            </style>
        `;

        document.getElementById('app').innerHTML = dashboardHTML;
        
        // Configurar el botón de logout
        this.setupDashboardEvents();
    }

    setupDashboardEvents() {
        //Boton de logout

        const logoutBtn = document.getElementById('logoutBtnDashboard');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🔓 Cerrando sesión...');
                this.logout();
            });
        }
    }

    // Boton de cargar dashboard completo

    async loadModule(moduleName) {
        console.log(`📂 Cargando módulo: ${moduleName}`);
        // Implementación básica - puedes expandir esto
        alert(`Módulo ${moduleName} - Esta funcionalidad se cargará dinámicamente`);
    }

    logout() {
        console.log('🔓 Cerrando sesión...');
        this.clearAuthData();
        this.showLogin();
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        if (AppState.token) {
            config.headers['Authorization'] = `Bearer ${AppState.token}`;
        }

        const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

// Sistema de notificaciones simple
class NotificationSystem {
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado, iniciando aplicación...');
    
    // Agregar estilos para el spinner
    const spinnerStyles = `
        <style>
            .btn-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', spinnerStyles);
    
    // Inicializar la aplicación
    window.SidesysApp = new SidesysApp();
    window.NotificationSystem = NotificationSystem;
});

// Manejar errores no capturados
window.addEventListener('error', (event) => {
    console.error('❌ Error global no capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazada no manejada:', event.reason);
});