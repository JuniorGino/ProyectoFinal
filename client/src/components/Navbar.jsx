import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UserPlus, Phone, MapPin, LogIn } from 'lucide-react';
import './Navbar.css'; // Crearemos esto después o usaremos index.css

const Navbar = () => {
    return (
        <nav className="main-navbar glass-panel">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <div className="brand-icon">
                        <MapPin size={24} className="text-primary" />
                    </div>
                    <h1>Tisinapp</h1>
                </div>

                <ul className="nav-links">
                    <li>
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <Home size={18} />
                            <span>Home</span>
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
