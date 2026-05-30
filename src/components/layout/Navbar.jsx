import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Guitar, Menu, X, Activity } from 'lucide-react'
import Logo from './Logo'

const navLinks = [
  { label: 'Tuner', to: '/tuner' },
  { label: 'Chord Library', to: '/chords' },
  { label: 'Progression Generator', to: '/progression' },
  { label: 'Scale', to: '/scale' },
  { label: 'Song Finder', to: '/songs' },
  { label: 'Metronome', to: '/metronome' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-white/[0.06] shadow-xl shadow-black/40'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-logo">
            <div className="relative flex items-center shrink-0">
              <Logo className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
              {/* Glow backing on hover */}
              <Logo 
                className="absolute inset-0 h-10 w-auto opacity-0 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" 
                style={{ filter: 'blur(5px)' }}
              />
            </div>
            <span className="font-display font-bold text-3xl tracking-tight text-white">
              String<span className="gradient-text">Wave</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg -z-10"
                        style={{ background: 'rgba(255, 0, 122, 0.15)' }}
                        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <motion.div
              className="hidden sm:block"
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(255, 0, 122, 0.4)",
                  "0 0 0 6px rgba(255, 0, 122, 0)"
                ]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              style={{ borderRadius: '8px' }}
            >
              <Link
                to="/tuner"
                id="nav-cta-quick-tune"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
                style={{ background: 'var(--gradient-cta)' }}
              >
                <Activity size={14} strokeWidth={2.5} />
                Quick Tune
              </Link>
            </motion.div>

            {/* Mobile menu toggle */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-full w-72 z-50 md:hidden flex flex-col pt-20 pb-8 px-6 gap-2"
              style={{ background: 'var(--color-surface-800)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            >
              {navLinks.map(({ label, to }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.08 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NavLink
                    to={to}
                    id={`mobile-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`
                    }
                    style={({ isActive }) => isActive ? { background: 'rgba(255, 0, 122, 0.15)' } : {}}
                  >
                    {label}
                  </NavLink>
                </motion.div>
              ))}

              <motion.div
                key="mobile-cta-wrapper"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(255, 0, 122, 0.4)",
                      "0 0 0 6px rgba(255, 0, 122, 0)"
                    ]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  style={{ borderRadius: '12px' }}
                >
                  <Link
                    to="/tuner"
                    id="mobile-nav-cta"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white border border-white/20"
                    style={{ background: 'var(--gradient-cta)' }}
                  >
                    <Guitar size={14} className="text-white" />
                    Quick Tune
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
