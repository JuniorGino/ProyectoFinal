import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    return (
        <div className="page-container" style={{ width: '100%' }}>
            <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hero"
                    style={{ textAlign: 'center', marginTop: '3rem' }}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            padding: '0.5rem 1.2rem',
                            borderRadius: '30px',
                            color: 'var(--primary)',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            marginBottom: '2rem',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}
                    >
                        <Sparkles size={14} /> EL FUTURO DE LOS RECORDATORIOS
                    </motion.div>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                        fontWeight: '900',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(to right, #fff 30%, var(--primary))',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        display: 'block',
                        letterSpacing: '-2px',
                        lineHeight: '1.05'
                    }}>
                        Tisinapp: Tu Ubicación, <br /> Tu Memoria Inteligente.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', maxWidth: '750px', margin: '0 auto 3.5rem', lineHeight: '1.7' }}>
                        Deja de preocuparte por olvidar tareas importantes. Tisinapp utiliza IA y geolocalización avanzada para recordarte qué hacer justo en el momento y lugar exactos.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <NavLink to="/register" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            backgroundColor: 'white', color: 'black', padding: '1.2rem 2.8rem',
                            borderRadius: '18px', textDecoration: 'none', fontWeight: '800',
                            fontSize: '1.1rem', boxShadow: '0 15px 35px rgba(255, 255, 255, 0.15)', transition: 'all 0.3s ease'
                        }}>
                            Empezar Ahora
                        </NavLink>
                        <NavLink to="/assistant" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', padding: '1.2rem 2.8rem',
                            borderRadius: '18px', textDecoration: 'none', fontWeight: '700',
                            fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}>
                            Ver el Asistente <ArrowRight size={20} />
                        </NavLink>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    {[
                        { icon: MapPin, title: "Alertas Geo-al Instante", desc: "Define perímetros inteligentes. Recibe notificaciones push en el momento exacto en que cruzas el radio de tu destino.", color: 'var(--primary)' },
                        { icon: Zap, title: "Asistente con IA", desc: "Habla de forma natural. Nuestra IA entiende frases complejas y las traduce en geoperímetros automáticos.", color: '#f59e0b' },
                        { icon: Shield, title: "Seguridad End-to-End", desc: "Tus datos de ubicación son privados. Solo tú decides qué lugares recordar y cómo se gestiona tu historial.", color: '#10b981' }
                    ].map((feat, i) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.6 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            key={i}
                            className="glass-panel"
                            style={{
                                padding: '3rem 2.5rem',
                                borderRadius: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ width: '64px', height: '64px', background: `${feat.color}15`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.color, border: `1px solid ${feat.color}30` }}>
                                <feat.icon size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>{feat.title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', fontSize: '1.05rem' }}>{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Social / Trust Section Placeholder */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    © 2026 Tisinapp Tecnologías. Todos los derechos reservados.
                </motion.div>
            </div>
        </div>
    );
};

export default Home;
