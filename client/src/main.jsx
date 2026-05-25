/**
 * PUNTO DE ENTRADA (BOOTSTRAP) DE REACT - main.jsx
 * 
 * Este archivo inicia el renderizado y ciclo de vida de la aplicación React en el DOM.
 * Sus tareas son:
 * 1. **Cargar Estilos Globales:** Importa `index.css` que contiene todas las variables de HSL y estilos de vidrio.
 * 2. **Habilitar Enrutamiento Global:** Envuelve la aplicación `<App />` con `<BrowserRouter>` para permitir
 *    el cambio dinámico de vistas en el cliente sin recargar la página.
 * 3. **Modo Estricto de React (`StrictMode`):** Ayuda a identificar problemas potenciales en el código.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Monta y renderiza el árbol de componentes dentro de la etiqueta div con ID "root" en index.html
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
