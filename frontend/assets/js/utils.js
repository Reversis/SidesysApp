// Utilidades generales para la aplicación
class Utils {
    // Sistema de notificaciones
    static showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);

        // Auto-remove después de la duración
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    }

    static getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    // Formateo de fechas
    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    static formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('es-ES');
    }

    // Validación de email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Manejo de modales
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Carga de datos con manejo de errores
    static async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('sidesys_token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            ...options
        };

        try {
            const response = await fetch(`/api${url}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('Error en fetch:', error);
            throw error;
        }
    }

    // Debounce para búsquedas
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Calculadora de días restantes
    static calculateDaysRemaining(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Determinar color del semáforo
    static getTrafficLightColor(daysRemaining, umbralVerde = 90, umbralAmarillo = 30, umbralRojo = 15) {
        if (daysRemaining < 0) return 'gris'; // Vencido
        if (daysRemaining <= umbralRojo) return 'rojo';
        if (daysRemaining <= umbralAmarillo) return 'amarillo';
        if (daysRemaining <= umbralVerde) return 'verde';
        return 'azul'; // Más de 90 días
    }

    // Exportar a CSV
    static exportToCSV(data, filename) {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Helper para manejar estados de carga
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }

    show(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
        }
        this.loadingStates.set(elementId, true);
    }

    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('loading');
        }
        this.loadingStates.set(elementId, false);
    }

    isLoading(elementId) {
        return this.loadingStates.get(elementId) || false;
    }
}

window.Utils = Utils;
window.LoadingManager = new LoadingManager();