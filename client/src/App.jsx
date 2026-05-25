/**
 * ENRUTADOR GENERAL Y CONTENEDOR PRINCIPAL - App.jsx
 * 
 * Este archivo es el componente raíz del árbol de renderizado del cliente en React.
 * Sus responsabilidades principales son:
 * 1. **Fondo de Vídeo Premium:** Configura una capa de vídeo en bucle (`bgVideo`) de fondo con baja opacidad
 *    y filtro oscuro para garantizar una visualización estética de la interfaz premium.
 * 2. **Menú de Navegación Común:** Renderiza la barra de navegación `<Navbar />` compartida en todas las páginas.
 * 3. **Definición de Rutas (React Router DOM):** Asocia rutas relativas a sus respectivos componentes de página:
 *    - "/" -> Página de Inicio (`Home`)
 *    - "/register" y "/login" -> Autenticación (`Register`)
 *    - "/contact" -> Formulario de Soporte (`Contact`)
 *    - "/assistant" -> Gestor interactivo con Mapa de Recordatorios (`Assistant`)
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Assistant from './pages/Assistant';
import './components/Navbar.css';

// Importación del vídeo de fondo premium
import bgVideo from './images/videosF/videotopob.mp4';

function App() {
    return (
        <>
            {/* Capa de vídeo en bucle de fondo premium */}
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: 'fixed',
                    right: 0,
                    bottom: 0,
                    minWidth: '100%',
                    minHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    zIndex: -1,
                    objectFit: 'cover',
                    opacity: 0.1, // Opacidad ajustada para legibilidad
                    filter: 'brightness(0.6)' // Oscurecido para mayor contraste con textos claros
                }}
            >
                <source src={bgVideo} type="video/mp4" />
            </video>

            {/* Barra de navegación superior común a todas las páginas */}
            <Navbar />

            {/* Configuración de enrutamiento dinámico */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Register />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/assistant" element={<Assistant />} />
            </Routes>
        </>
    );
}

export default App;
