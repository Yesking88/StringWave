import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Tuner from './pages/Tuner'
import Chords from './pages/Chords'
import SongFinder from './pages/SongFinder'
import ProgressionGenerator from './pages/ProgressionGenerator'
import Scale from './pages/Scale'
import Metronome from './pages/Metronome'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface-900)' }}>
      <Navbar />
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/tuner" element={<Tuner />} />
              <Route path="/chords" element={<Chords />} />
              <Route path="/songs" element={<SongFinder />} />
              <Route path="/progression" element={<ProgressionGenerator />} />
              <Route path="/scale" element={<Scale />} />
              <Route path="/metronome" element={<Metronome />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
