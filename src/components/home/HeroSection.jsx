import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import homePageBg from '../../assets/home-page.png'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function HeroSection() {
  const [primaryHovered, setPrimaryHovered] = useState(false)

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16 lg:pb-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${homePageBg})` }}
    >
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, rgba(60, 0, 80, 0.72), rgba(20, 0, 10, 0.82))'
        }}
      />

      {/* Background grid (overlayed on top of image at low opacity) */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-35"
        style={{
          backgroundImage: `linear-gradient(rgba(255,0,122,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,0,122,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Dynamic Ambient Glows (Behind text column) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 0.9, 1],
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF007A]/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 0.9, 1.1, 1.2],
            x: [40, -60, 20, 40],
            y: [-30, 40, -50, -30],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#CC00AA]/10 blur-[120px]"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main text content column */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">


            {/* Headline */}
            <motion.h1
              variants={fadeUp} custom={1} initial="hidden" animate="visible"
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-tight mb-2 text-white"
            >
              Play smarter.
              <br />
              <span 
                style={{
                  background: 'var(--gradient-text)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 12px rgba(255,0,122,0.4))'
                }}
              >
                Sound better.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp} custom={2} initial="hidden" animate="visible"
              className="text-base sm:text-lg lg:text-xl max-w-xl mb-8 leading-relaxed font-normal"
              style={{ color: '#94a3b8' }}
            >
              All your guitar tools in one workspace.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link
                to="/tuner"
                id="hero-cta-primary"
                className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--gradient-cta)',
                  boxShadow: primaryHovered ? 'var(--glow-pink)' : '0 0 30px rgba(255, 0, 122, 0.3)',
                }}
                onMouseEnter={() => setPrimaryHovered(true)}
                onMouseLeave={() => setPrimaryHovered(false)}
              >
                Start Tuning
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/chords"
                id="hero-cta-secondary"
                className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 backdrop-blur-md hover:bg-white/[0.07]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #CC00AA',
                  color: '#CC00AA',
                }}
              >
                Browse Chords
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
