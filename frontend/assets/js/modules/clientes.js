class ClientesModule {
    constructor() {
        this.auth = window.AuthManager;
        this.clientes = [];
        this.productos = [];
        this.clienteProductos = [];
        this.currentClienteId = null;
        this.init();
    }

    async init() {
        await this.loadClientes();
        await this.loadProductos();
        this.setupEventListeners();
        this.setupPermissions();
        this.setupTabs();
    }

    async loadClientes() {
        try {
            LoadingManager.show('clientesLoading');
            
            const response = await this.auth.apiCall('/clientes?limit=1000');
            if (response.success) {
                this.clientes = response.data.clientes || [];
                this.renderClientes();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            Utils.showNotification('Error cargando la lista de clientes', 'error');
        } finally {
            LoadingManager.hide('clientesLoading');
        }
    }

    async loadProductos() {
        try {
            const response = await this.auth.apiCall('/productos');
            if (response.success) {
                this.productos = response.data;
                this.renderProductosSelect();
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    renderClientes() {
        const grid = document.getElementById('clientesGrid');
        
        if (this.clientes.length === 0) {
            grid.innerHTML = '<div class="empty-state">No hay clientes registrados</div>';
            return;
        }

        grid.innerHTML = this.clientes.map(cliente => {
            const productosCount = cliente.ProductosCount || 0;
            
            return `
                <div class="card cliente-card">
                    <div class="card-header">
                        <h3>${cliente.Nombre}</h3>
                        <span class="badge azul">${productosCount} producto${productosCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="card-body">
                        <div class="cliente-info">
                            <p><strong>📧 Email:</strong> ${cliente.Email || 'No especificado'}</p>
                            <p><strong>📞 Teléfono:</strong> ${cliente.Telefono || 'No especificado'}</p>
                            <p><strong>👤 Contacto:</strong> ${cliente.ContactoPrincipal || 'No especificado'}</p>
                            ${cliente.Descripcion ? `<p><strong>📝 Descripción:</strong> ${cliente.Descripcion}</p>` : ''}
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="action-buttons">
                            ${this.auth.canManageClients() ? `
                                <button class="btn btn-sm btn-outline" onclick="clientesModule.editCliente('${cliente.Id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="clientesModule.deleteCliente('${cliente.Id}')">
                                    🗑️ Eliminar
                                </button>
                            ` : `
                                <span class="text-muted">Solo lectura</span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderProductosSelect() {
        const select = document.getElementById('selectProducto');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar producto</option>' +
            this.productos
                .filter(producto => producto.Activo)
                .map(producto => `
                    <option value="${producto.Id}">${producto.Nombre}</option>
                `).join('');
    }

    setupEventListeners() {
        // Botón agregar cliente
        const addBtn = document.getElementById('addClienteBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Formulario de cliente
        const clienteForm = document.getElementById('clienteForm');
        if (clienteForm) {
            clienteForm.addEventListener('submit', (e) => this.saveCliente(e));
        }

        // Botón agregar producto al cliente
        const addProductoBtn = document.getElementById('addProductoClienteBtn');
        if (addProductoBtn) {
            addProductoBtn.addEventListener('click', () => this.openProductoModal());
        }

        // Formulario de producto del cliente
        const productoForm = document.getElementById('productoClienteForm');
        if (productoForm) {
            productoForm.addEventListener('submit', (e) => this.saveProductoCliente(e));
        }

        // Búsqueda
        const searchInput = document.getElementById('searchClientes');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchClientes(e.target.value);
            }, 300));
        }

        // Cerrar modales
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    setupPermissions() {
        const addBtn = document.getElementById('addClienteBtn');
        if (addBtn) {
            addBtn.style.display = this.auth.canManageClients() ? 'flex' : 'none';
        }
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Si es el tab de productos, cargar los productos del cliente
        if (tabName === 'productos' && this.currentClienteId) {
            this.loadClienteProductos(this.currentClienteId);
        }
    }

    openModal(cliente = null) {
        this.currentClienteId = cliente ? cliente.Id : null;
        
        const modalTitle = document.getElementById('clienteModalTitle');
        modalTitle.textContent = cliente ? 'Editar Cliente' : 'Agregar Cliente';
        
        if (cliente) {
            // Llenar formulario con datos existentes
            document.getElementById('clienteNombre').value = cliente.Nombre;
            document.getElementById('clienteEmail').value = cliente.Email || '';
            document.getElementById('clienteTelefono').value = cliente.Telefono || '';
            document.getElementById('clienteDireccion').value = cliente.Direccion || '';
            document.getElementById('clienteContacto').value = cliente.ContactoPrincipal || '';
            document.getElementById('clienteDescripcion').value = cliente.Descripcion || '';
            document.getElementById('systemInformationUrl').value = cliente.SystemInformationUrl || '';
        } else {
            // Limpiar formulario
            document.getElementById('clienteForm').reset();
            document.getElementById('productosAsignadosList').innerHTML = '';
        }
        
        // Mostrar tab de información por defecto
        this.switchTab('info');
        this.clearErrors();
        
        Utils.openModal('clienteModal');
    }

    async loadClienteProductos(clienteId) {
        try {
            const response = await this.auth.apiCall(`/clientes/${clienteId}/productos`);
            if (response.success) {
                this.clienteProductos = response.data;
                this.renderClienteProductos();
            }
        } catch (error) {
            console.error('Error cargando productos del cliente:', error);
        }
    }

    renderClienteProductos() {
        const container = document.getElementById('productosAsignadosList');
        
        if (this.clienteProductos.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay productos asignados</div>';
            return;
        }

        container.innerHTML = this.clienteProductos.map(producto => {
            const productoInfo = this.productos.find(p => p.Id === producto.ProductoId);
            
            return `
                <div class="producto-asignado-card">
                    <div class="producto-info">
                        <h5>${productoInfo?.Nombre || 'Producto no encontrado'}</h5>
                        <div class="producto-details">
                            <span>Licencias: ${producto.CantidadLicencias}</span>
                            ${producto.FechaAdquisicion ? 
                                `<span>Adquisición: ${Utils.formatDate(producto.FechaAdquisicion)}</span>` : ''}
                        </div>
                        ${producto.Notas ? `<p class="producto-notas">${producto.Notas}</p>` : ''}
                    </div>
                    <div class="producto-actions">
                        <button class="btn btn-sm btn-danger" 
                                onclick="clientesModule.removeProductoCliente('${producto.Id}')">
                            🗑️ Quitar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openProductoModal() {
        Utils.openModal('productoClienteModal');
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('error');
        });
    }

    async saveCliente(e) {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('clienteNombre').value.trim(),
            email: document.getElementById('clienteEmail').value.trim(),
            telefono: document.getElementById('clienteTelefono').value.trim(),
            direccion: document.getElementById('clienteDireccion').value.trim(),
            contactoPrincipal: document.getElementById('clienteContacto').value.trim(),
            descripcion: document.getElementById('clienteDescripcion').value.trim(),
            systemInformationUrl: document.getElementById('systemInformationUrl').value.trim()
        };

        // Validaciones
        if (!formData.nombre) {
            this.showError('clienteNombre', 'El nombre es requerido');
            return;
        }

        if (formData.email && !Utils.isValidEmail(formData.email)) {
            this.showError('clienteEmail', 'El email no es válido');
            return;
        }

        try {
            if (this.currentClienteId) {
                // Actualizar cliente existente
                await this.auth.apiCall(`/clientes/${this.currentClienteId}`, 'PUT', formData);
                Utils.showNotification('Cliente actualizado exitosamente', 'success');
            } else {
                // Crear nuevo cliente
                await this.auth.apiCall('/clientes', 'POST', formData);
                Utils.showNotification('Cliente creado exitosamente', 'success');
            }

            Utils.closeModal('clienteModal');
            await this.loadClientes();
            
        } catch (error) {
            console.error('Error guardando cliente:', error);
            Utils.showNotification(error.message || 'Error guardando cliente', 'error');
        }
    }

    async saveProductoCliente(e) {
        e.preventDefault();
        
        const productoId = document.getElementById('selectProducto').value;
        const cantidadLicencias = document.getElementById('cantidadLicencias').value;
        const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
        const notas = document.getElementById('notasProducto').value;

        if (!productoId) {
            Utils.showNotification('Selecciona un producto', 'error');
            return;
        }

        try {
            await this.auth.apiCall(`/clientes/${this.currentClienteId}/productos`, 'POST', {
                productoId,
                cantidadLicencias: parseInt(cantidadLicencias),
                fechaAdquisicion,
                notas
            });

            Utils.closeModal('productoClienteModal');
            await this.loadClienteProductos(this.currentClienteId);
            Utils.showNotification('Producto asignado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error asignando producto:', error);
            Utils.showNotification(error.message || 'Error asignando producto', 'error');
        }
    }

    showError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        if (input && errorElement) {
            input.classList.add('error');
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    editCliente(clienteId) {
        const cliente = this.clientes.find(c => c.Id === clienteId);
        if (cliente) {
            this.openModal(cliente);
        }
    }

    async deleteCliente(clienteId) {
        const cliente = this.clientes.find(c => c.Id === clienteId);
        if (!cliente) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar el cliente "${cliente.Nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await this.auth.apiCall(`/clientes/${clienteId}`, 'DELETE');
            Utils.showNotification('Cliente eliminado exitosamente', 'success');
            await this.loadClientes();
        } catch (error) {
            console.error('Error eliminando cliente:', error);
            Utils.showNotification(error.message || 'Error eliminando cliente', 'error');
        }
    }

    async removeProductoCliente(clienteProductoId) {
        if (!confirm('¿Estás seguro de que deseas quitar este producto del cliente?')) {
            return;
        }

        try {
            // Necesitamos obtener el productoId para esta relación
            const clienteProducto = this.clienteProductos.find(cp => cp.Id === clienteProductoId);
            if (!clienteProducto) return;

            await this.auth.apiCall(`/clientes/${this.currentClienteId}/productos/${clienteProducto.ProductoId}`, 'DELETE');
            Utils.showNotification('Producto removido exitosamente', 'success');
            await this.loadClienteProductos(this.currentClienteId);
        } catch (error) {
            console.error('Error removiendo producto:', error);
            Utils.showNotification(error.message || 'Error removiendo producto', 'error');
        }
    }

    searchClientes(query) {
        if (!query) {
            this.renderClientes();
            return;
        }

        const filtered = this.clientes.filter(cliente =>
            cliente.Nombre.toLowerCase().includes(query.toLowerCase()) ||
            (cliente.Email && cliente.Email.toLowerCase().includes(query.toLowerCase())) ||
            (cliente.Telefono && cliente.Telefono.includes(query)) ||
            (cliente.ContactoPrincipal && cliente.ContactoPrincipal.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderClientes(filtered);
    }
}

// Inicializar el módulo cuando se cargue
if (document.getElementById('clientes-module')) {
    window.clientesModule = new ClientesModule();
}