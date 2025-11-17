import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'

const Contact = () => {
  const [socials, setSocials] = useState([])

  useEffect(() => {
    const fetchSocials = async () => {
      const { getAll } = await import('../utils/api')
      const data = await getAll('socials')
      setSocials(data)
    }
    fetchSocials()
  }, [])

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 flex justify-center"
          >
            <div className="inline-block bg-black/90 backdrop-blur-xl rounded-full px-16 py-10 border-2 border-white/30 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <h1 className="text-5xl md:text-7xl font-bold mb-3 text-white">
                Contactez-Nous
              </h1>
              <p className="text-lg text-white">
                Une question ? N'hésitez pas à nous contacter
              </p>
            </div>
          </motion.div>

          {/* Réseaux Sociaux */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="neon-border rounded-2xl p-8 bg-slate-900/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
                <span className="text-4xl mr-3">🌐</span>
                Réseaux Sociaux
              </h3>
                <div className="space-y-3">
                  {socials.map((social) => (
                    <SocialLink 
                      key={social.id}
                      icon={social.icon} 
                      name={social.name} 
                      description={social.description}
                      href={social.url}
                    />
                  ))}
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const SocialLink = ({ icon, name, description, href }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.02, x: 5 }}
    whileTap={{ scale: 0.98 }}
    className="flex items-start p-4 bg-slate-800/50 rounded-xl border border-gray-700/20 hover:border-white/50 transition-all cursor-pointer group"
  >
    <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">{icon}</span>
    <div className="flex-1">
      <h4 className="text-white font-semibold text-lg mb-1">{name}</h4>
      <p className="text-white text-sm">{description}</p>
    </div>
    <span className="text-white text-xl group-hover:translate-x-1 transition-transform">→</span>
  </motion.a>
)

export default Contact
