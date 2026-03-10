import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <div className="page-container" style={{ width: '100%' }}>
            <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center' }}
                >
                    <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>Soporte & Contacto</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                        ¿Necesitas ayuda con Tisinapp? Nuestro equipo está listo para asistirte en cualquier momento.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>

                    {/* Info Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { icon: Mail, title: "Correo Electrónico", detail: "soporte@tisinapp.com", color: 'var(--accent)' },
                            { icon: Phone, title: "Teléfono 24/7", detail: "+34 900 123 456", color: 'var(--primary)' },
                            { icon: MapPin, title: "Oficinas Centrales", detail: "Av. Tecnología 42, Madrid, España", color: '#f59e0b' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel"
                                style={{ padding: '2rem', borderRadius: '24px', display: 'flex', alignItems: 'flex-start', gap: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <div style={{ padding: '0.9rem', background: `${item.color}15`, color: item.color, borderRadius: '16px', border: `1px solid ${item.color}30` }}>
                                    <item.icon size={26} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.4rem', color: 'white' }}>{item.title}</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>{item.detail}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel"
                        style={{ padding: '3rem', borderRadius: '32px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '2rem', color: 'white' }}>Envíanos un mensaje</h3>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Tu nombre"
                                    style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>Mensaje</label>
                                <textarea
                                    placeholder="Dinos qué necesitas..."
                                    rows="4"
                                    style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none' }}
                                ></textarea>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                style={{
                                    marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem',
                                    padding: '1.2rem', borderRadius: '16px', background: 'var(--primary)', color: 'white',
                                    border: 'none', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                Enviar Consulta <Send size={20} />
                            </motion.button>
                        </form>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default Contact;
