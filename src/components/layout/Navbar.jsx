import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Guitar, Menu, X, Activity, ChevronDown } from 'lucide-react'
import Logo from './Logo'

const categories = [
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { label: 'Chromatic Tuner', to: '/tuner', description: 'Accurate microphone-based pitch detection' },
      { label: 'Metronome', to: '/metronome', description: 'Precision tempo tracking & beat signature presets' },
      { label: 'Fretboard Trainer', to: '/trainer', description: 'Gamified arcade practice for memory training' },
    ]
  },
  {
    id: 'theory',
    label: 'Theory',
    items: [
      { label: 'Chord Library', to: '/chords', description: 'Browse 529 chord voicings & diagrams across keys' },
      { label: 'Scale Visualizer', to: '/scale', description: 'Map intervals and listen to scale sequences' },
      { label: 'Circle of Fifths', to: '/circle', description: 'Interactive wheel mapping diatonic keys & relative minor chords' },
    ]
  },
  {
    id: 'explore',
    label: 'Explore',
    items: [
      { label: 'Progression Generator', to: '/progression', description: 'Build chord progression loops & play along' },
      { label: 'Chord Sheet Creator', to: '/creator', description: 'Create lyric sheets with interactive chord badges' },
      { label: 'Song Finder', to: '/songs', description: 'Discover tracks matching the chords you know' },
    ]
  }
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

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
          scrolled || activeDropdown
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
          <div className="hidden md:flex items-center gap-1.5 h-full">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  id={`nav-btn-${cat.id}`}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeDropdown === cat.id
                      ? 'text-white bg-white/[0.06]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 transition-transform duration-200 ${
                      activeDropdown === cat.id ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {/* Glassmorphic Dropdown List */}
                <AnimatePresence>
                  {activeDropdown === cat.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 rounded-2xl border border-white/10 bg-[#0c0c16]/98 backdrop-blur-2xl p-2.5 shadow-2xl z-50 flex flex-col gap-1"
                    >
                      {cat.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={({ isActive }) =>
                            `block px-3.5 py-2.5 rounded-xl transition-all leading-normal text-left ${
                              isActive
                                ? 'text-white bg-[#FF007A]/15 border border-[#FF007A]/20'
                                : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                            }`
                          }
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight">{item.label}</span>
                            <span className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                              {item.description}
                            </span>
                          </div>
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white border border-white/20 transition-all duration-200 ease-out hover:scale-105 hover:brightness-110 hover:shadow-[0_0_20px_#FF007A,0_0_40px_rgba(255,122,0,0.6)] active:scale-95"
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
              className="fixed top-0 right-0 h-full w-72 z-50 md:hidden flex flex-col pt-20 pb-8 px-5 gap-4 overflow-y-auto"
              style={{ background: 'var(--color-surface-800)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            >
              {categories.map((cat, catIdx) => (
                <div key={cat.id} className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3.5 mb-1 leading-normal">
                    {cat.label}
                  </span>
                  {cat.items.map((item, itemIdx) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: (catIdx * 3 + itemIdx) * 0.05 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <NavLink
                        to={item.to}
                        id={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `block px-3.5 py-2.5 rounded-xl text-sm font-semibold leading-normal transition-all duration-200 ${
                            isActive
                              ? 'text-white bg-[#FF007A]/15 border border-[#FF007A]/20'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              ))}

              <motion.div
                key="mobile-cta-wrapper"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 px-3.5"
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
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 transition-all duration-200 ease-out hover:scale-105 hover:brightness-110 hover:shadow-[0_0_20px_#FF007A,0_0_40px_rgba(255,122,0,0.6)]"
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
