import { motion } from 'framer-motion'

export default function PageWrapper({ 
  children, 
  bgImage, 
  className = "px-4 sm:px-6 lg:px-8 pb-16", 
  bgPosition = "bg-center", 
  overlayGradient = "bg-[#0a0a0f]/80" 
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] pt-20">
      {/* Cinematic Breathing Background Image */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`w-full h-full bg-cover bg-no-repeat ${bgPosition}`}
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        {/* Dark overlay for readability */}
        {overlayGradient === 'bg-black/75' ? (
          <div 
            className="absolute inset-0 z-10 pointer-events-none" 
            style={{
              background: 'linear-gradient(to bottom, rgba(60, 0, 80, 0.72), rgba(20, 0, 10, 0.82))'
            }}
          />
        ) : (
          <div className={`absolute inset-0 z-10 pointer-events-none ${overlayGradient}`} />
        )}

        {/* Background grid (overlayed on top of image at low opacity) */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-35"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Global Page Entrance/Exit Animation Container */}
      <div className={`relative z-10 w-full ${className}`}>
        {children}
      </div>
    </div>
  )
}
