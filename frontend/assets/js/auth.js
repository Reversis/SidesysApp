class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.setupEventListeners();
    }

    loadUserFromStorage() {
        const userData = localStorage.getItem('sidesys_user');
        const token = localStorage.getItem('sidesys_token');
        
        if (userData && token) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Mostrar estado de carga
            submitBtn.innerHTML = '<div class="btn-spinner"></div> Cargando...';
            submitBtn.disabled = true;

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Guardar en localStorage
                localStorage.setItem('sidesys_token', result.data.token);
                localStorage.setItem('sidesys_user', JSON.stringify(result.data.user));
                
                this.currentUser = result.data.user;
                Utils.showNotification('Login exitoso', 'success');
                
                // Redirigir al dashboard
                setTimeout(() => {
                    window.location.href = '/views/dashboard.html';
                }, 1000);
            } else {
                Utils.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            Utils.showNotification('Error de conexión con el servidor', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        localStorage.removeItem('sidesys_token');
        localStorage.removeItem('sidesys_user');
        this.currentUser = null;
        Utils.showNotification('Sesión cerrada exitosamente', 'info');
        setTimeout(() => {
            window.location.href = '/views/login.html';
        }, 1000);
    }

    updateUI() {
        // Actualizar UI según el usuario actual
        const userInfo = document.getElementById('userInfo');
        const userRole = document.getElementById('userRole');
        
        if (userInfo && this.currentUser) {
            userInfo.textContent = this.currentUser.nombreCompleto;
        }
        
        if (userRole && this.currentUser) {
            userRole.textContent = this.getRoleDisplayName(this.currentUser.rol);
            userRole.className = `role-badge role-${this.currentUser.rol.toLowerCase()}`;
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'STAC': 'Administrador STAC',
            'PROYECTO': 'Gestor de Proyectos',
            'COMERCIAL': 'Comercial',
            'SYSTEM': 'Sistema'
        };
        return roleNames[role] || role;
    }

    // Verificar permisos
    hasPermission(requiredPermission) {
        if (!this.currentUser) return false;

        const permissions = this.getRolePermissions(this.currentUser.rol);
        return permissions.includes(requiredPermission);
    }

    getRolePermissions(role) {
        const permissions = {
            'STAC': [
                'view_dashboard', 'view_clients', 'manage_clients', 'view_products', 
                'manage_products', 'view_vigencias', 'manage_vigencias', 'view_users', 
                'manage_users', 'view_config', 'manage_config', 'export_reports'
            ],
            'PROYECTO': [
                'view_dashboard', 'view_clients', 'view_products', 'view_vigencias', 
                'manage_vigencias', 'export_reports'
            ],
            'COMERCIAL': [
                'view_dashboard', 'export_reports'
            ],
            'SYSTEM': [
                'view_dashboard', 'view_vigencias'
            ]
        };
        return permissions[role] || [];
    }

    // Métodos de verificación específicos
    canViewClients() {
        return this.hasPermission('view_clients');
    }

    canManageClients() {
        return this.hasPermission('manage_clients');
    }

    canManageProducts() {
        return this.hasPermission('manage_products');
    }

    canManageVigencias() {
        return this.hasPermission('manage_vigencias');
    }

    canManageUsers() {
        return this.hasPermission('manage_users');
    }

    canManageConfig() {
        return this.hasPermission('manage_config');
    }

    canExportReports() {
        return this.hasPermission('export_reports');
    }

    // API Call con manejo de autenticación
    async apiCall(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('sidesys_token');
        
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`/api${endpoint}`, config);
            const result = await response.json();

            if (!response.ok) {
                // Si es error de autenticación, redirigir al login
                if (response.status === 401) {
                    this.handleLogout();
                    throw new Error('Sesión expirada');
                }
                throw new Error(result.message || 'Error en la petición');
            }

            return result;
        } catch (error) {
            console.error('Error en API call:', error);
            throw error;
        }
    }
}

// Inicializar manager de autenticación
window.AuthManager = new AuthManager();