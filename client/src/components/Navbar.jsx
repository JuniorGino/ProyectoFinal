/**
 * BARRA DE NAVEGACIÓN SUPERIOR - Navbar.jsx
 * 
 * Este componente representa la cabecera común y barra de navegación de Tisinapp.
 * Contiene:
 * 1. **Marca de la Aplicación:** Muestra el logo y el nombre de la app (Tisinapp).
 * 2. **Menú de Enlaces Dinámicos:** Utiliza `<NavLink>` de `react-router-dom` para permitir
 *    la navegación asíncrona entre páginas ("/", "/register", "/contact", "/assistant").
 *    Aplica automáticamente la clase `.active` al enlace de la ruta en la que se encuentra el usuario
 *    para resaltar de forma visual en qué sección está actualmente.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UserPlus, Phone, MapPin } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="main-navbar glass-panel">
            <div className="navbar-container">
                
                {/* Branding de la aplicación (Logo + Nombre) */}
                <div className="navbar-brand">
                    <div className="brand-icon">
                        <MapPin size={24} className="text-primary" />
                    </div>
                    <h1>Tisinapp</h1>
                </div>

                {/* Lista de enlaces a las diferentes vistas */}
                <ul className="nav-links">
                    <li>
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <Home size={18} />
                            <span>Inicio</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/register" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <UserPlus size={18} />
                            <span>Registro</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/contact" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <Phone size={18} />
                            <span>Contacto</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/assistant" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <MapPin size={18} />
                            <span>Asistente</span>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
