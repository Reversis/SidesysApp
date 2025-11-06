class ProductosModule {
    constructor() {
        this.auth = window.AuthManager;
        this.productos = [];
        this.currentProductoId = null;
        this.init();
    }

    async init() {
        await this.loadProductos();
        this.setupEventListeners();
        this.setupPermissions();
    }

    async loadProductos() {
        try {
            LoadingManager.show('productosLoading');
            
            const response = await this.auth.apiCall('/productos');
            if (response.success) {
                this.productos = response.data;
                this.renderProductos();
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            Utils.showNotification('Error cargando la lista de productos', 'error');
        } finally {
            LoadingManager.hide('productosLoading');
        }
    }

    renderProductos() {
        const tbody = document.getElementById('productosTableBody');
        
        if (this.productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No hay productos registrados</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.productos.map(producto => `
            <tr>
                <td>
                    <strong>${producto.Nombre}</strong>
                </td>
                <td>${producto.Descripcion || 'Sin descripción'}</td>
                <td>
                    <span class="badge azul">${producto.Tipo || 'Software'}</span>
                </td>
                <td>
                    <span class="badge ${producto.Activo ? 'verde' : 'gris'}">
                        ${producto.Activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${Utils.formatDate(producto.FechaCreacion)}</td>
                <td>
                    <div class="action-buttons">
                        ${this.auth.canManageProducts() ? `
                            <button class="btn btn-sm btn-outline" onclick="productosModule.editProducto('${producto.Id}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="productosModule.deleteProducto('${producto.Id}')">
                                🗑️ Eliminar
                            </button>
                        ` : `
                            <span class="text-muted">Solo lectura</span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Botón agregar producto
        const addBtn = document.getElementById('addProductoBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Formulario de producto
        const form = document.getElementById('productoForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveProducto(e));
        }

        // Búsqueda
        const searchInput = document.getElementById('searchProductos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchProductos(e.target.value);
            }, 300));
        }

        // Cerrar modal
        const modalClose = document.querySelector('#productoModal .modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => Utils.closeModal('productoModal'));
        }
    }

    setupPermissions() {
        const addBtn = document.getElementById('addProductoBtn');
        if (addBtn) {
            addBtn.style.display = this.auth.canManageProducts() ? 'flex' : 'none';
        }
    }

    openModal(producto = null) {
        this.currentProductoId = producto ? producto.Id : null;
        
        const modalTitle = document.getElementById('productoModalTitle');
        const form = document.getElementById('productoForm');
        
        modalTitle.textContent = producto ? 'Editar Producto' : 'Agregar Producto';
        
        if (producto) {
            // Llenar formulario con datos existentes
            document.getElementById('productoNombre').value = producto.Nombre;
            document.getElementById('productoDescripcion').value = producto.Descripcion || '';
            document.getElementById('productoTipo').value = producto.Tipo || 'Software';
            document.getElementById('productoActivo').checked = producto.Activo;
        } else {
            // Limpiar formulario
            form.reset();
            document.getElementById('productoActivo').checked = true;
        }
        
        // Limpiar errores
        this.clearErrors();
        
        Utils.openModal('productoModal');
    }

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('error');
        });
    }

    async saveProducto(e) {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('productoNombre').value.trim(),
            descripcion: document.getElementById('productoDescripcion').value.trim(),
            tipo: document.getElementById('productoTipo').value,
            activo: document.getElementById('productoActivo').checked
        };

        // Validaciones
        if (!formData.nombre) {
            this.showError('productoNombre', 'El nombre es requerido');
            return;
        }

        try {
            if (this.currentProductoId) {
                // Actualizar producto existente
                await this.auth.apiCall(`/productos/${this.currentProductoId}`, 'PUT', formData);
                Utils.showNotification('Producto actualizado exitosamente', 'success');
            } else {
                // Crear nuevo producto
                await this.auth.apiCall('/productos', 'POST', formData);
                Utils.showNotification('Producto creado exitosamente', 'success');
            }

            Utils.closeModal('productoModal');
            await this.loadProductos();
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            Utils.showNotification(error.message || 'Error guardando producto', 'error');
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

    editProducto(productoId) {
        const producto = this.productos.find(p => p.Id === productoId);
        if (producto) {
            this.openModal(producto);
        }
    }

    async deleteProducto(productoId) {
        const producto = this.productos.find(p => p.Id === productoId);
        if (!producto) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.Nombre}"?`)) {
            return;
        }

        try {
            await this.auth.apiCall(`/productos/${productoId}`, 'DELETE');
            Utils.showNotification('Producto eliminado exitosamente', 'success');
            await this.loadProductos();
        } catch (error) {
            console.error('Error eliminando producto:', error);
            Utils.showNotification(error.message || 'Error eliminando producto', 'error');
        }
    }

    searchProductos(query) {
        if (!query) {
            this.renderProductos();
            return;
        }

        const filtered = this.productos.filter(producto =>
            producto.Nombre.toLowerCase().includes(query.toLowerCase()) ||
            (producto.Descripcion && producto.Descripcion.toLowerCase().includes(query.toLowerCase())) ||
            (producto.Tipo && producto.Tipo.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderProductos(filtered);
    }
}

// Inicializar el módulo cuando se cargue
if (document.getElementById('productos-module')) {
    window.productosModule = new ProductosModule();
}