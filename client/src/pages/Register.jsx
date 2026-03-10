import React, { useState } from 'react';
import { UserPlus, Mail, Lock, ArrowRight, LogIn as LogInIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({ name: '', email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const resp = await axios.post('http://localhost:5000/api/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('user', JSON.stringify(resp.data));
                navigate('/assistant');
            } else {
                await axios.post('http://localhost:5000/api/auth/register', formData);
                setIsLogin(true);
                setError('¡Registro completado! Ahora puedes entrar.');
            }
        } catch (err) {
            setError(err.response?.data?.message || (isLogin ? 'Credenciales incorrectas' : 'Error al registrar.'));
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem', minHeight: 'calc(100vh - 100px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel"
                style={{
                    padding: '3.5rem 3rem',
                    borderRadius: '32px',
                    width: '100%',
                    maxWidth: '480px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >

                <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <motion.div
                        key={isLogin ? 'login-icon' : 'reg-icon'}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        style={{ width: '70px', height: '70px', background: 'var(--primary)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)' }}
                    >
                        {isLogin ? <LogInIcon size={34} color="white" /> : <UserPlus size={34} color="white" />}
                    </motion.div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white', letterSpacing: '-1px' }}>
                        {isLogin ? 'Bienvenido' : 'Únete a Tisinapp'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
                        {isLogin ? 'Introduce tus datos para continuar.' : 'Crea tu cuenta en menos de un minuto.'}
                    </p>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    color: error.includes('completado') ? '#10b981' : '#ef4444',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    background: error.includes('completado') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    border: `1px solid ${error.includes('completado') ? '#10b98140' : '#ef444440'}`
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isLogin && (
                        <div className="input-group" style={{ position: 'relative' }}>
                            <UserPlus size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                name="name"
                                type="text"
                                placeholder="Nombre completo"
                                value={formData.name}
                                onChange={handleChange}
                                required={!isLogin}
                                style={{ width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '1rem' }}
                            />
                        </div>
                    )}

                    <div className="input-group" style={{ position: 'relative' }}>
                        <Mail size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            name="email"
                            type="email"
                            placeholder="Correo electrónico"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            name="password"
                            type="password"
                            placeholder="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.5rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        style={{
                            marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
                            padding: '1.1rem', borderRadius: '16px', background: 'var(--primary)', color: 'white',
                            border: 'none', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        {isLogin ? 'Entrar' : 'Registrarse'} <ArrowRight size={20} />
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)' }}>
                    {isLogin ? '¿Todavía sin cuenta? ' : '¿Ya eres miembro? '}
                    <span onClick={toggleMode} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                        {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                    </span>
                </p>
            </motion.div>
        </div>
    );
};

export default Auth;
