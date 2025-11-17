import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EventDecorations = ({ eventKey }) => {
  const [decorations, setDecorations] = useState([])

  useEffect(() => {
    if (!eventKey) {
      setDecorations([])
      return
    }

    // Créer des décorations selon l'événement avec plusieurs types d'effets
    const createDecorations = () => {
      const newDecorations = []
      
      switch (eventKey) {
        case 'noel':
          // Sapin de Noël central fixe (pas trop animé)
          newDecorations.push({
            id: 'tree-center',
            type: 'tree',
            left: 50, // Au centre
            delay: 0,
            duration: 20,
            size: 80 + Math.random() * 40,
            opacity: 0.85,
            animation: 'static',
            fixed: true,
            position: 'center'
          })
          // Père Noël fixe
          newDecorations.push({
            id: 'santa-left',
            type: 'santa',
            left: 15,
            delay: 0,
            duration: 20,
            size: 60 + Math.random() * 30,
            opacity: 0.8,
            animation: 'static',
            fixed: true
          })
          // Lutins fixes (2-3)
          for (let i = 0; i < 3; i++) {
            newDecorations.push({
              id: `elf-${i}`,
              type: 'elf',
              left: 20 + (i * 25),
              delay: 0,
              duration: 20,
              size: 50 + Math.random() * 25,
              opacity: 0.75 + Math.random() * 0.15,
              animation: 'static',
              fixed: true
            })
          }
          // Quelques flocons de neige subtils (moins nombreux)
          for (let i = 0; i < 8; i++) {
            newDecorations.push({
              id: `snowflake-${i}`,
              type: 'snowflake',
              left: Math.random() * 100,
              delay: Math.random() * 3,
              duration: 15 + Math.random() * 5,
              size: 12 + Math.random() * 8,
              opacity: 0.4 + Math.random() * 0.2,
              animation: 'gentle-float'
            })
          }
          break
          
        case 'paques':
          // Lapins, œufs, carottes, fleurs - effets flottants variés et visibles
          const paquesTypes = ['bunny', 'egg', 'carrot', 'flower']
          for (let i = 0; i < 15; i++) {
            const type = paquesTypes[Math.floor(Math.random() * paquesTypes.length)]
            newDecorations.push({
              id: `paques-${type}-${i}`,
              type: type,
              left: Math.random() * 100,
              delay: Math.random() * 4,
              duration: 10 + Math.random() * 6,
              size: 18 + Math.random() * 14,
              opacity: 0.6 + Math.random() * 0.3,
              animation: 'bounce'
            })
          }
          // Panier de Pâques décoratif
          for (let i = 0; i < 4; i++) {
            newDecorations.push({
              id: `basket-${i}`,
              type: 'basket',
              left: Math.random() * 100,
              delay: Math.random() * 2,
              duration: 12 + Math.random() * 4,
              size: 35 + Math.random() * 20,
              opacity: 0.7 + Math.random() * 0.2,
              animation: 'float',
              fixed: true
            })
          }
          break
          
        case 'saintValentin':
          // Cœurs, roses, pétales, cupidon - effets flottants et visibles
          const valentinTypes = ['heart', 'rose', 'cupid', 'heart']
          for (let i = 0; i < 18; i++) {
            const type = valentinTypes[Math.floor(Math.random() * valentinTypes.length)]
            newDecorations.push({
              id: `valentin-${type}-${i}`,
              type: type,
              left: Math.random() * 100,
              delay: Math.random() * 3,
              duration: 8 + Math.random() * 5,
              size: 16 + Math.random() * 12,
              opacity: 0.6 + Math.random() * 0.3,
              animation: 'float'
            })
          }
          // Guirlandes de cœurs
          for (let i = 0; i < 3; i++) {
            newDecorations.push({
              id: `heart-garland-${i}`,
              type: 'heart-garland',
              left: Math.random() * 100,
              delay: Math.random() * 1,
              duration: 10 + Math.random() * 5,
              size: 28 + Math.random() * 15,
              opacity: 0.8,
              animation: 'sparkle',
              fixed: true
            })
          }
          break
          
        case 'halloween':
          // Chauves-souris, citrouilles, fantômes, toiles d'araignée - effets visibles
          const halloweenTypes = ['bat', 'pumpkin', 'ghost', 'spider']
          for (let i = 0; i < 15; i++) {
            const type = halloweenTypes[Math.floor(Math.random() * halloweenTypes.length)]
            newDecorations.push({
              id: `halloween-${type}-${i}`,
              type: type,
              left: Math.random() * 100,
              delay: Math.random() * 4,
              duration: 10 + Math.random() * 6,
              size: 18 + Math.random() * 14,
              opacity: 0.6 + Math.random() * 0.3,
              animation: 'fly'
            })
          }
          // Citrouilles décoratives fixes
          for (let i = 0; i < 5; i++) {
            newDecorations.push({
              id: `pumpkin-fixed-${i}`,
              type: 'pumpkin',
              left: Math.random() * 100,
              delay: Math.random() * 2,
              duration: 12 + Math.random() * 4,
              size: 40 + Math.random() * 25,
              opacity: 0.7 + Math.random() * 0.2,
              animation: 'float',
              fixed: true
            })
          }
          break
          
        case 'nouvelAn':
          // Confettis, étoiles, feux d'artifice, champagne - effets visibles
          const nouvelAnTypes = ['confetti', 'star', 'firework', 'champagne']
          for (let i = 0; i < 25; i++) {
            const type = nouvelAnTypes[Math.floor(Math.random() * nouvelAnTypes.length)]
            newDecorations.push({
              id: `nouvelan-${type}-${i}`,
              type: type,
              left: Math.random() * 100,
              delay: Math.random() * 2,
              duration: 6 + Math.random() * 4,
              size: 14 + Math.random() * 12,
              opacity: 0.6 + Math.random() * 0.3,
              animation: 'sparkle',
              rotation: Math.random() * 360
            })
          }
          // Feux d'artifice fixes
          for (let i = 0; i < 6; i++) {
            newDecorations.push({
              id: `firework-fixed-${i}`,
              type: 'firework',
              left: Math.random() * 100,
              delay: Math.random() * 1,
              duration: 8 + Math.random() * 4,
              size: 35 + Math.random() * 20,
              opacity: 0.8 + Math.random() * 0.2,
              animation: 'sparkle',
              fixed: true,
              rotation: Math.random() * 360
            })
          }
          break
          
        default:
          break
      }
      
      setDecorations(newDecorations)
    }

    createDecorations()
    
    // Recréer les décorations toutes les 25 secondes
    const interval = setInterval(createDecorations, 25000)
    
    return () => clearInterval(interval)
  }, [eventKey])

  if (!eventKey || decorations.length === 0) {
    return null
  }

  // Fonction pour obtenir les propriétés d'animation selon le type
  const getAnimationProps = (decoration) => {
    const baseY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
    const baseX = decoration.left
    
    switch (decoration.animation) {
      case 'static':
        // Animation très subtile pour éléments fixes
        return {
          y: [baseY, baseY - 5, baseY, baseY - 3, baseY],
          x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
          rotate: [0, 1, 0, -1, 0],
          opacity: [decoration.opacity || 0.8, decoration.opacity || 0.85, decoration.opacity || 0.8, decoration.opacity || 0.82, decoration.opacity || 0.8],
          scale: [1, 1.02, 1, 1.01, 1],
          ease: 'easeInOut'
        }
      case 'gentle-float':
        // Flottement très doux pour flocons
        return {
          y: [baseY, baseY - 20, baseY - 10, baseY + 5, baseY],
          x: [baseX + '%', baseX + 1 + '%', baseX + '%', baseX - 1 + '%', baseX + '%'],
          rotate: [0, 5, 0, -5, 0],
          opacity: [0, decoration.opacity || 0.4, decoration.opacity || 0.5, decoration.opacity || 0.3, 0],
          scale: [0.6, 0.7, 0.65, 0.68, 0.6],
          ease: 'easeInOut'
        }
      case 'float':
        // Flottement doux mais visible
        if (decoration.fixed) {
          // Pour les éléments fixes comme les sapins
          return {
            y: [baseY, baseY - 8, baseY, baseY - 5, baseY],
            x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
            rotate: [0, 2, 0, -2, 0],
            opacity: [decoration.opacity || 0.7, decoration.opacity || 0.75, decoration.opacity || 0.7, decoration.opacity || 0.72, decoration.opacity || 0.7],
            scale: [0.9, 0.95, 0.92, 0.94, 0.9],
            ease: 'easeInOut'
          }
        }
        return {
          y: [baseY, baseY - 30, baseY - 15, baseY + 5, baseY],
          x: [baseX + '%', baseX + 2 + '%', baseX + '%', baseX - 2 + '%', baseX + '%'],
          rotate: [0, 10, 0, -10, 0],
          opacity: [0, decoration.opacity || 0.5, decoration.opacity || 0.6, decoration.opacity || 0.4, 0],
          scale: [0.6, 0.75, 0.65, 0.7, 0.6],
          ease: 'easeInOut'
        }
      case 'bounce':
        // Rebond visible et animé
        return {
          y: [baseY, baseY - 30, baseY, baseY - 25, baseY],
          x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
          rotate: [0, 10, 0, -10, 0],
          opacity: [0, decoration.opacity || 0.6, decoration.opacity || 0.7, decoration.opacity || 0.5, 0],
          scale: [0.5, 0.8, 0.6, 0.75, 0.5],
          ease: 'easeInOut'
        }
      case 'sparkle':
        // Scintillement visible et animé
        if (decoration.fixed) {
          // Pour les guirlandes fixes
          return {
            y: [baseY, baseY - 5, baseY, baseY - 3, baseY],
            x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
            rotate: [0, decoration.rotation || 0, 180, 360, decoration.rotation || 0],
            opacity: [decoration.opacity || 0.8, decoration.opacity || 1, decoration.opacity || 0.9, decoration.opacity || 0.95, decoration.opacity || 0.8],
            scale: [0.7, 0.9, 0.8, 0.85, 0.7],
            ease: 'easeInOut'
          }
        }
        return {
          y: [baseY, baseY - 20, baseY - 10, baseY - 5, baseY],
          x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
          rotate: [0, decoration.rotation || 0, 180, 360, decoration.rotation || 0],
          opacity: [0, decoration.opacity || 0.5, decoration.opacity || 0.7, decoration.opacity || 0.4, 0],
          scale: [0.4, 0.8, 0.6, 0.9, 0.4],
          ease: 'easeInOut'
        }
      case 'fly':
        // Vol horizontal léger
        return {
          y: [baseY, baseY - 15, baseY - 10, baseY - 5, baseY],
          x: [baseX + '%', baseX + 3 + '%', baseX + 5 + '%', baseX + 2 + '%', baseX + '%'],
          rotate: [0, 15, 0, -15, 0],
          opacity: [0, decoration.opacity || 0.2, decoration.opacity || 0.2, decoration.opacity || 0.15, 0],
          scale: [0.4, 0.5, 0.5, 0.45, 0.4],
          ease: 'easeInOut'
        }
      default:
        // Par défaut : flottement
        return {
          y: [baseY, baseY - 20, baseY, baseY + 10, baseY],
          x: [baseX + '%', baseX + '%', baseX + '%', baseX + '%', baseX + '%'],
          rotate: [0, 5, 0, -5, 0],
          opacity: [0, decoration.opacity || 0.2, decoration.opacity || 0.2, decoration.opacity || 0.15, 0],
          scale: [0.4, 0.5, 0.5, 0.4, 0.3],
          ease: 'easeInOut'
        }
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <AnimatePresence>
        {decorations.map((decoration) => {
          const animProps = getAnimationProps(decoration)
          
          const commonProps = {
            key: decoration.id,
            initial: { 
              opacity: 0,
              scale: 0
            },
            animate: animProps,
            exit: { opacity: 0, scale: 0 },
            transition: {
              duration: decoration.duration,
              delay: decoration.delay,
              repeat: Infinity,
              ease: animProps.ease || 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1]
            },
            style: {
              position: decoration.fixed ? 'fixed' : 'absolute',
              left: decoration.position === 'center' ? '50%' : (decoration.left + '%'),
              top: decoration.position === 'center' ? '50%' : (decoration.fixed ? (Math.random() * 20 + 10) + '%' : '0%'),
              fontSize: decoration.size + 'px',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.4))',
              willChange: 'transform',
              pointerEvents: 'none',
              zIndex: decoration.position === 'center' ? 3 : (decoration.fixed ? 4 : 2),
              WebkitTextStroke: '1px rgba(255,255,255,0.3)',
              textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)',
              transform: decoration.position === 'center' ? 'translate(-50%, -50%)' : 'none'
            }
          }

          switch (decoration.type) {
            case 'snowflake':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8)) drop-shadow(0 0 4px rgba(173,216,230,0.6))',
                  fontSize: decoration.size + 'px'
                }}>
                  ❄️
                </motion.div>
              )
              
            case 'tree':
              return (
                <motion.div {...commonProps}>
                  🎄
                </motion.div>
              )
              
            case 'santa':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 12px rgba(220,38,38,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.7))',
                  fontSize: decoration.size + 'px',
                  zIndex: 2
                }}>
                  🎅
                </motion.div>
              )
              
            case 'elf':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 10px rgba(34,139,34,0.8)) drop-shadow(0 0 5px rgba(255,215,0,0.6))',
                  fontSize: decoration.size + 'px',
                  zIndex: 2
                }}>
                  🧝
                </motion.div>
              )
              
            case 'garland':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 15px rgba(255,215,0,1)) drop-shadow(0 0 8px rgba(255,255,0,0.9)) drop-shadow(0 0 4px rgba(220,38,38,0.8))',
                  fontSize: decoration.size + 'px',
                  zIndex: 3
                }}>
                  🎀✨🎀✨🎀
                </motion.div>
              )
              
            case 'basket':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 12px rgba(255,192,203,0.9)) drop-shadow(0 0 6px rgba(255,182,193,0.7))',
                  fontSize: decoration.size + 'px',
                  zIndex: 2
                }}>
                  🧺
                </motion.div>
              )
              
            case 'heart-garland':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 12px rgba(255,20,147,0.9)) drop-shadow(0 0 6px rgba(255,105,180,0.8))',
                  fontSize: decoration.size + 'px',
                  zIndex: 3
                }}>
                  💕💖💕💖💕
                </motion.div>
              )
              
            case 'ornament':
              const ornaments = ['🔴', '🟢', '🔵', '🟡', '🟣', '⚪']
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 4px rgba(255,215,0,0.7))',
                  fontSize: decoration.size + 'px'
                }}>
                  {ornaments[Math.floor(Math.random() * ornaments.length)]}
                </motion.div>
              )
              
            case 'egg':
              return (
                <motion.div {...commonProps}>
                  🥚
                </motion.div>
              )
              
            case 'carrot':
              return (
                <motion.div {...commonProps}>
                  🥕
                </motion.div>
              )
              
            case 'bunny':
              return (
                <motion.div {...commonProps}>
                  🐰
                </motion.div>
              )
              
            case 'flower':
              return (
                <motion.div {...commonProps}>
                  🌸
                </motion.div>
              )
              
            case 'heart':
              return (
                <motion.div {...commonProps}>
                  💕
                </motion.div>
              )
              
            case 'rose':
              return (
                <motion.div {...commonProps}>
                  🌹
                </motion.div>
              )
              
            case 'cupid':
              return (
                <motion.div {...commonProps}>
                  💘
                </motion.div>
              )
              
            case 'bat':
              return (
                <motion.div {...commonProps}>
                  🦇
                </motion.div>
              )
              
            case 'pumpkin':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.9)) drop-shadow(0 0 6px rgba(255,140,0,0.8))',
                  fontSize: decoration.size + 'px',
                  zIndex: decoration.fixed ? 2 : 1
                }}>
                  🎃
                </motion.div>
              )
              
            case 'ghost':
              return (
                <motion.div {...commonProps}>
                  👻
                </motion.div>
              )
              
            case 'spider':
              return (
                <motion.div {...commonProps}>
                  🕷️
                </motion.div>
              )
              
            case 'confetti':
              const colors = ['🎉', '✨', '⭐', '💫', '🌟']
              return (
                <motion.div {...commonProps}>
                  {colors[Math.floor(Math.random() * colors.length)]}
                </motion.div>
              )
              
            case 'star':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 10px rgba(255,255,0,0.9)) drop-shadow(0 0 5px rgba(255,215,0,0.7))',
                  fontSize: decoration.size + 'px'
                }}>
                  ⭐
                </motion.div>
              )
              
            case 'firework':
              return (
                <motion.div {...commonProps} style={{
                  ...commonProps.style,
                  filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.9)) drop-shadow(0 0 8px rgba(139,92,246,0.8)) drop-shadow(0 0 4px rgba(251,191,36,0.7))',
                  fontSize: decoration.size + 'px',
                  zIndex: decoration.fixed ? 3 : 1
                }}>
                  🎆
                </motion.div>
              )
              
            case 'champagne':
              return (
                <motion.div {...commonProps}>
                  🍾
                </motion.div>
              )
              
            default:
              return null
          }
        })}
      </AnimatePresence>
    </div>
  )
}

export default EventDecorations
