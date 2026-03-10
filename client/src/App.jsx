import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Assistant from './pages/Assistant';
import './components/Navbar.css';

// Importar el vídeo
import bgVideo from './images/videosF/videotopob.mp4';

function App() {
    return (
        <>
            {/* Video Background */}
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
                    opacity: 0.1, // Opacidad ajustada
                    filter: 'brightness(0.6)' // Oscurecido para legibilidad
                }}
            >
                <source src={bgVideo} type="video/mp4" />
            </video>

            <Navbar />
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
