class DashboardModule {
    constructor() {
        this.auth = window.AuthManager;
        this.vigencias = [];
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
        this.setupPermissions();
    }

    async loadDashboardData() {
        try {
            // Cargar estadísticas
            const statsResponse = await this.auth.apiCall('/dashboard/stats');
            if (statsResponse.success) {
                this.stats = statsResponse.data;
                this.renderStats();
            }

            // Cargar vigencias próximas
            const proximasResponse = await this.auth.apiCall('/dashboard/proximas?limite=5');
            if (proximasResponse.success) {
                this.renderProximasVigencias(proximasResponse.data);
            }

            // Cargar todas las vigencias
            await this.loadAllVigencias();

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            Utils.showNotification('Error cargando datos del dashboard', 'error');
        }
    }

    renderStats() {
        document.getElementById('totalVigencias').textContent = this.stats.TotalVigenciasActivas || 0;
        document.getElementById('vigenciasVencidas').textContent = this.stats.VigenciasVencidas || 0;
        document.getElementById('vigenciasRojo').textContent = this.stats.VigenciasRojo || 0;
        document.getElementById('vigenciasAmarillo').textContent = this.stats.VigenciasAmarillo || 0;
        document.getElementById('vigenciasProximas').textContent = this.stats.ProximasVencer || 0;
        document.getElementById('vigenciasVerde').textContent = this.stats.VigenciasVerde || 0;
    }

    renderProximasVigencias(vigencias) {
        const container = document.getElementById('proximasVigenciasList');
        const countElement = document.getElementById('proximasCount');
        
        if (!vigencias || vigencias.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay vigencias próximas a vencer</div>';
            countElement.textContent = '0';
            return;
        }

        countElement.textContent = vigencias.length;
        
        container.innerHTML = vigencias.map(vigencia => {
            const diasRestantes = vigencia.DiasRestantes;
            const estadoColor = Utils.getTrafficLightColor(diasRestantes);
            
            return `
                <div class="vigencia-item ${estadoColor}">
                    <div class="vigencia-info">
                        <strong>${vigencia.ClienteNombre}</strong>
                        <span>${vigencia.ProductoNombre}</span>
                    </div>
                    <div class="vigencia-dias">
                        <span class="dias-badge ${estadoColor}">${diasRestantes} días</span>
                    </div>
                    <div class="vigencia-fecha">
                        ${Utils.formatDate(vigencia.FechaCaducidad)}
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadAllVigencias() {
        try {
            LoadingManager.show('vigenciasLoading');
            
            const response = await this.auth.apiCall('/vigencias?limit=1000');
            if (response.success) {
                this.vigencias = response.data.vigencias || [];
                this.renderAllVigencias();
            }
        } catch (error) {
            console.error('Error cargando vigencias:', error);
            Utils.showNotification('Error cargando la lista de vigencias', 'error');
        } finally {
            LoadingManager.hide('vigenciasLoading');
        }
    }

    renderAllVigencias() {
        const tbody = document.getElementById('vigenciasTableBody');
        
        if (this.vigencias.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">No hay vigencias registradas</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.vigencias.map(vigencia => {
            const diasRestantes = vigencia.DiasRestantes;
            const estadoColor = Utils.getTrafficLightColor(
                diasRestantes, 
                vigencia.UmbralVerde, 
                vigencia.UmbralAmarillo, 
                vigencia.UmbralRojo
            );
            
            return `
                <tr>
                    <td>${vigencia.ClienteNombre}</td>
                    <td>${vigencia.ProductoNombre}</td>
                    <td>${Utils.formatDate(vigencia.FechaInicio)}</td>
                    <td>${Utils.formatDate(vigencia.FechaCaducidad)}</td>
                    <td>
                        <span class="dias-restantes ${estadoColor}">${diasRestantes}</span>
                    </td>
                    <td>
                        <span class="badge ${estadoColor}">${estadoColor.toUpperCase()}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${this.auth.canManageVigencias() ? `
                                <button class="btn btn-sm btn-outline" onclick="dashboardModule.editVigencia('${vigencia.Id}')">
                                    ✏️ Editar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupEventListeners() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    setupPermissions() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.style.display = this.auth.canExportReports() ? 'flex' : 'none';
        }
    }

    async exportToExcel() {
        try {
            const response = await fetch('/api/export/vigencias', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sidesys_token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `vigencias-sidesys-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                Utils.showNotification('Reporte exportado exitosamente', 'success');
            } else {
                throw new Error('Error en la exportación');
            }
        } catch (error) {
            console.error('Error exportando reporte:', error);
            Utils.showNotification('Error exportando reporte', 'error');
        }
    }

    editVigencia(vigenciaId) {
        // Navegar al módulo de vigencias con el ID específico
        window.DashboardManager.loadModule('vigencias', { editId: vigenciaId });
    }
}

// Inicializar el módulo cuando se cargue
if (document.getElementById('dashboard-module')) {
    window.dashboardModule = new DashboardModule();
}