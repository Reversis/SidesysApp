# 🔐 Sistema de Control de Vigencias - SIDESYS

## 📋 Descripción del Proyecto

Sistema web completo para la gestión y monitoreo de vigencias de productos de software vendidos por SIDESYS. Permite controlar las fechas de caducidad de múltiples productos (e-Flow, Citas, Encuestas) asignados a diferentes clientes, con alertas automatizadas y un sistema de semáforo visual.

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js v18+ con Express.js
- **Base de Datos**: SQL Server 2019 o superior
- **Autenticación**: JWT (JSON Web Tokens)
- **Deployment**: IIS en Windows Server con iisnode
- **Notificaciones**: Resend API (Email) y Microsoft Teams Webhooks

---

## 📁 Estructura del Proyecto

```
sidesys-vigencias/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración SQL Server
│   │   └── jwt.js               # Configuración JWT
│   ├── middlewares/
│   │   ├── auth.js              # Verificación JWT
│   │   └── authorize.js         # Verificación de roles
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── usuarios.routes.js
│   │   ├── clientes.routes.js
│   │   ├── productos.routes.js
│   │   ├── vigencias.routes.js
│   │   ├── dashboard.routes.js
│   │   └── configuracion.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── usuarios.controller.js
│   │   ├── clientes.controller.js
│   │   ├── productos.controller.js
│   │   ├── vigencias.controller.js
│   │   ├── dashboard.controller.js
│   │   └── configuracion.controller.js
│   ├── models/                  # Queries SQL (opcional)
│   ├── utils/
│   │   ├── password.js          # Helpers de bcrypt
│   │   └── response.js          # Respuestas estándar
│   └── app.js                   # Configuración Express
├── public/                      # Frontend estático
│   ├── css/
│   ├── js/
│   └── assets/
├── uploads/                     # Archivos subidos
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── server.js                    # Punto de entrada
└── web.config                   # Configuración IIS + iisnode
```

---

## 👥 Sistema de Roles y Permisos

### 1. **STAC** (Soporte Técnico - Administrador)
**Permisos COMPLETOS:**
- ✅ Crear/editar/eliminar clientes
- ✅ Asignar productos a clientes
- ✅ CRUD completo de usuarios
- ✅ Configurar alertas y notificaciones
- ✅ Ver dashboard completo
- ✅ Exportar reportes
- ✅ Gestión de productos del catálogo

### 2. **PROYECTO**
**Permisos LIMITADOS:**
- ✅ Ver clientes (solo lectura)
- ✅ Crear/editar/eliminar vigencias
- ✅ Actualizar fechas de renovación
- ✅ Ver dashboard completo
- ✅ Ver sistema de semáforo
- ✅ Exportar reportes
- ❌ No puede modificar clientes ni usuarios

### 3. **SYSTEM**
**Solo VISUALIZACIÓN:**
- ✅ Ver sistema de semáforo
- ✅ Ver dashboard básico
- ✅ Filtrar por estado crítico
- ❌ Sin permisos de edición

### 4. **COMERCIAL**
**Solo REPORTES:**
- ✅ Ver dashboard
- ✅ Exportar reportes
- ❌ Sin permisos de edición

---

## 🎯 Módulos del Sistema

### 1. 🔐 Autenticación
- Login con email/password
- JWT con expiración de 8 horas
- Registro de usuarios (solo STAC)
- Logout con invalidación de token
- Badge visual por rol con colores distintivos

### 2. 📊 Dashboard
- **6 Tarjetas estadísticas:**
  - Total de vigencias
  - Vencidos
  - Críticos
  - Advertencia
  - Próximos
  - Vigentes
- Sección "Próximas 5 Caducidades"
- Tabla completa con sistema de semáforo
- Exportación a Excel/CSV
- Visible para todos los roles

### 3. 🛍️ Productos (Solo STAC)
- Catálogo de productos SIDESYS
- CRUD completo
- Campos: Nombre, Tipo, Descripción, Estado
- Gestión mediante modales

### 4. 👤 Clientes (Solo STAC)
- CRUD completo de clientes
- Grid de tarjetas responsive
- Búsqueda en tiempo real
- Modal con 2 tabs:
  - Información del cliente
  - Productos asignados
- Upload de archivo SystemInformation
- Contador de productos por cliente

### 5. 📅 Control de Vigencias (PROYECTO + STAC)
- CRUD completo de vigencias
- Asociación cliente-producto
- **Campos configurables:**
  - Fecha inicio/caducidad
  - Periodicidad (mensual, bimensual, trimestral, cuatrimestral, semestral, anual)
  - Umbrales personalizables
  - Toggle de notificaciones (email/Teams)
  - Notas
- Filtros por cliente, producto y estado
- Vista en cards con semáforo visual

### 6. 🚦 Sistema de Semáforo

**Estados automáticos según días restantes:**

| Color | Estado | Días Restantes |
|-------|--------|----------------|
| 🔵 Azul/Blanco | Vigente | > 90 días |
| 🟢 Verde | Próximo | 30-90 días |
| 🟡 Amarillo | Advertencia | 15-30 días |
| 🔴 Rojo | Crítico | < 15 días |
| ⚫ Gris | Vencido | Fecha pasada |

- Vista especial con cards grandes
- Círculo de color con días restantes
- Filtros por estado
- Accesible para SYSTEM, PROYECTO y STAC

### 7. 👥 Usuarios (Solo STAC)
- CRUD de usuarios
- Gestión de roles
- Activar/desactivar usuarios
- Protección: no puede editarse/eliminarse a sí mismo

### 8. ⚙️ Configuración de Alertas (Solo STAC)
- **Notificaciones por Email:**
  - Toggle activar/desactivar
  - Lista de destinatarios
  - Integración con Resend API
- **Notificaciones por Microsoft Teams:**
  - Toggle activar/desactivar
  - Webhook URL
- **Frecuencia personalizada:**
  - Crítico: Diario / Cada 12h / Cada 6h
  - Advertencia: Cada 3 días / Semanal / Diario
  - Próximo: Semanal / Quincenal / Mensual

---

## 🎨 Diseño UI/UX

### Paleta de Colores
- **Primary**: `#0082FB`
- **Primary Dark**: `#0064E0`
- **Background**: `#F1F5F8`
- **Dark**: `#1C2B33`

### Características
- ✨ Diseño moderno y corporativo
- 📱 Totalmente responsive
- 🎭 Modales para formularios
- 🏷️ Badges de rol con colores
- 🚦 Sistema de semáforo visual intuitivo

---

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js v18 o superior
- SQL Server 2019 o superior
- Windows Server con IIS (para producción)

### 1. Clonar el repositorio
```bash
git clone https://github.com/sidesys/vigencias-sistema.git
cd vigencias-sistema
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz:
```env
# Base de Datos
DB_SERVER=localhost
DB_DATABASE=SIDESYS_Vigencias
DB_USER=sa
DB_PASSWORD=tu_password
DB_ENCRYPT=true
DB_TRUST_CERTIFICATE=true

# JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=8h

# Servidor
PORT=3000
NODE_ENV=development

# Resend API (Email)
RESEND_API_KEY=tu_api_key_de_resend

# Microsoft Teams
TEAMS_WEBHOOK_URL=tu_webhook_url
```

### 4. Ejecutar scripts de base de datos
```bash
# Ejecutar los scripts SQL en orden:
# 1. crear_base_datos.sql
# 2. crear_tablas.sql
# 3. insertar_datos_iniciales.sql
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## 🔒 Seguridad

- ✅ **bcryptjs** para hash de contraseñas
- ✅ **JWT** para autenticación stateless
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado correctamente
- ✅ **Rate limiting** en endpoints críticos
- ✅ **Queries parametrizadas** para prevenir SQL Injection
- ✅ Validación de datos en backend
- ✅ Manejo de errores con try-catch

---

## 📦 Dependencias Principales

```json
{
  "express": "^4.18.2",
  "mssql": "^10.0.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "multer": "^1.4.5-lts.1"
}
```

---

## 🚀 Deployment en IIS

### Configuración de web.config
El archivo `web.config` está incluido para deployment con iisnode en IIS.

### Pasos:
1. Instalar iisnode en Windows Server
2. Configurar Application Pool para Node.js
3. Copiar archivos al directorio de IIS
4. Configurar permisos de carpeta `uploads/`
5. Reiniciar sitio en IIS

---

## 📈 Roadmap de Desarrollo

### Fase 1: Preparación ✅
- [x] Definir arquitectura
- [x] Estructura del proyecto
- [x] Documentación README

### Fase 2: Base de Datos y Backend
- [ ] Scripts SQL de creación
- [ ] Configuración de conexión
- [ ] Implementación de modelos

### Fase 3: Sistema de Roles y Módulos
- [ ] Autenticación JWT
- [ ] Middlewares de autorización
- [ ] Implementación de módulos por rol

### Fase 4: Frontend
- [ ] Diseño de interfaces
- [ ] Integración con API
- [ ] Sistema de semáforo visual

### Fase 5: Testing y Deployment
- [ ] Pruebas unitarias
- [ ] Pruebas de integración
- [ ] Deployment en IIS

---

## 👨‍💻 Desarrollo

### Convenciones de Código
- Usar **camelCase** para variables y funciones
- Usar **PascalCase** para clases
- Comentar funciones complejas
- Validar siempre los datos de entrada

### Git Workflow
```bash
# Feature branch
git checkout -b feature/nombre-funcionalidad

# Commit con mensaje descriptivo
git commit -m "feat: descripción de la funcionalidad"

# Push y Pull Request
git push origin feature/nombre-funcionalidad
```

---

## 📝 Licencia

Propiedad de **SIDESYS** - Todos los derechos reservados.

---

## 📞 Contacto y Soporte

Para soporte técnico o consultas:
- **Email**: soporte@sidesys.com
- **Documentación**: [Wiki del proyecto]

---

## 🙏 Créditos

Desarrollado por el equipo de STAC de SIDESYS.

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025