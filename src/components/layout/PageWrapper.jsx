import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import homePageBg from '../../assets/home-page.png'
import instrumentBg from '../../assets/tuner.png'
import fretboardBg from '../../assets/scale.png'
import studioBg from '../../assets/chord-progression-new.png'

export default function PageWrapper({ 
  children, 
  className = "px-4 sm:px-6 lg:px-8 pb-16" 
}) {
  const location = useLocation()
  const path = location.pathname

  // Determine standard background image based on route path
  let backgroundImageSrc = null

  if (path === '/') {
    backgroundImageSrc = homePageBg
  } else if (['/tuner', '/metronome', '/trainer'].includes(path)) {
    backgroundImageSrc = instrumentBg
  } else if (['/chords', '/scale', '/circle'].includes(path)) {
    backgroundImageSrc = fretboardBg
  } else if (['/progression', '/creator', '/songs'].includes(path)) {
    backgroundImageSrc = studioBg
  }

  const isHome = path === '/'
  const opacityClass = isHome ? 'opacity-100' : 'opacity-90'

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] pt-20">
      {/* Centralized Background Image Layer */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {backgroundImageSrc && (
          <motion.img
            src={backgroundImageSrc}
            alt="Page Background"
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 w-full h-full object-cover ${opacityClass} pointer-events-none select-none z-0`}
            style={{
              filter: isHome 
                ? 'brightness(0.22) saturate(0.35) blur(16px)' 
                : 'brightness(0.28) blur(16px)',
            }}
          />
        )}

        {/* Ambient Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-35"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Main Content Layout Container */}
      <div className={`relative z-10 w-full leading-normal ${className}`}>
        {children}
      </div>
    </div>
  )
}
