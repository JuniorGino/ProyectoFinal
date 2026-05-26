# Tisinapp 📍 - Asistente de Recordatorios Inteligentes por Ubicación

**Tisinapp** es una aplicación web interactiva premium diseñada para ayudarte a gestionar tus recordatorios y tareas pendientes asociándolas a una ubicación física en el mapa. Utiliza tecnología de **Geofencing (geocercas)** para enviarte notificaciones push automáticas al navegador cuando entras dentro del radio de cercanía configurado.

La interfaz de usuario destaca por su cuidada estética moderna basada en el diseño **Glassmorphism (efecto cristal)**, temática oscura y tipografías personalizadas que ofrecen una experiencia visualmente atractiva y fluida.

---

## 🚀 Características Principales

- 🔐 **Autenticación Completa de Usuarios:** Sistema de registro e inicio de sesión seguro persistido de manera local.
- 🗺️ **Mapa Interactivo (Leaflet + OpenStreetMap):** Coloca pines fácilmente haciendo clic en cualquier parte del mapa para marcar tus recordatorios.
- ⭕ **Geocercas Personalizables:** Elige un radio de proximidad (desde 100 metros hasta 10 kilómetros) para cada alerta. El mapa muestra círculos translúcidos dinámicos que delimitan estas zonas.
- 🛰️ **Monitoreo GPS en Tiempo Real:** Calcula la distancia exacta entre tu ubicación actual y los recordatorios mediante la librería `geolib`.
- 🔔 **Notificaciones Push en Navegador:** Avisos instantáneos con sonido/vibración del sistema al cruzar el radio de un recordatorio activo.
- 📂 **Gestión Completa (CRUD) de Tareas:** Crea, lee, actualiza (marcar como hecho) o elimina recordatorios con persistencia automática.
- 🔍 **Búsqueda e Información de Direcciones:** Integración con la API de Nominatim para geocodificación inversa automática (muestra la dirección física al marcar un punto).
- ✉️ **Formulario de Contacto:** Sección dedicada de soporte técnico con interfaz glassmorphism.
- 🎬 **Detalles Visuales Premium:** Fondo de video animado en alta definición con filtros de contraste suavizados que enriquecen la inmersión del usuario sin afectar la legibilidad.

---

## 🛠️ Stack Tecnológico

El proyecto está construido bajo una arquitectura **MERN Stack** ligera con base de datos embebida:

### Frontend
- **React.js** (utilizando **Vite** para un desarrollo ultra-rápido).
- **React Router DOM** para la navegación multipágina fluida.
- **Leaflet & React-Leaflet** para la integración y renderizado del mapa interactivo.
- **Geolib** para cálculos de distancias geográficas de alta precisión.
- **Lucide React** para un catálogo estético de iconos vectoriales.
- **CSS Vanilla (Custom Properties)** para el diseño responsivo y Glassmorphism personalizado.

### Backend
- **Node.js** & **Express** para la creación de la API REST.
- **neDB-Promises** (Base de datos embebida no relacional rápida y ligera en un archivo local `reminders.db`).
- **File System (fs/promises)** para la persistencia local de la información de usuarios en `users.json`.
- **CORS** & **Dotenv** para configuraciones de red y variables de entorno.

---

## 📂 Estructura del Proyecto

```text
MemoryAppWeb/
├── client/                     # Frontend de la aplicación (React)
│   ├── src/
│   │   ├── components/         # Componentes reutilizables (Navbar, Map, etc.)
│   │   ├── pages/              # Páginas principales (Home, Register, Contact, Assistant)
│   │   ├── images/
│   │   │   ├── videosF/        # Archivos de video para fondos premium (LFS)
│   │   │   └── imagenesF/      # Logotipos y recursos visuales
│   │   ├── App.jsx             # Enrutador y contenedor raíz del cliente
│   │   ├── main.jsx            # Punto de entrada de React
│   │   └── index.css           # Sistema de diseño y estilos globales (Glassmorphism)
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend de la aplicación (Node + Express)
│   ├── data/                   # Almacenamiento local (Archivos JSON y base de datos DB)
│   │   ├── reminders.db        # Base de datos neDB para recordatorios
│   │   └── users.json          # Registro JSON local para usuarios
│   ├── server.js               # Código del servidor y endpoints de la API
│   └── package.json
├── .gitattributes              # Configuración de Git LFS para videos pesados
├── .gitignore                  # Exclusiones de archivos temporales y dependencias
├── package.json                # Configuración de ejecución global (concurrently)
└── README.md                   # Documentación del proyecto
```

---

## 🔧 Instalación y Configuración Local

### Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
- Navegador moderno con permisos de **Ubicación GPS** y **Notificaciones de Escritorio** habilitados.

### Pasos para Ejecutar
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JuniorGino/ProyectoFinal.git
   cd ProyectoFinal
   ```

2. **Instalar dependencias globales:**
   Desde la raíz del proyecto, ejecuta el comando para instalar las librerías necesarias tanto en el servidor como en el cliente de forma automática:
   ```bash
   npm install
   ```

3. **Ejecutar el entorno de desarrollo:**
   Para iniciar tanto el cliente de React (Vite) como el servidor de Express de manera simultánea en una sola terminal, utiliza:
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación:**
   - Abre tu navegador en: `http://localhost:5173`
   - El servidor API correrá en segundo plano en: `http://localhost:5000`

---

## 📦 Gestión de Archivos Grandes (Git LFS)

Este repositorio hace uso de **Git Large File Storage (LFS)** para la gestión y carga de los archivos de video decorativos (`.mp4`) localizados en `client/src/images/videosF/`. Esto previene fallos al subir cambios a GitHub y optimiza los tiempos de clonado.

Si deseas descargar los videos en tu copia local tras clonar el repositorio, asegúrate de tener instalado Git LFS y ejecuta:
```bash
git lfs pull
```
