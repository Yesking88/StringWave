import { Guitar, BookOpen, Sliders, Music4, Search, Timer, ArrowRight } from 'lucide-react'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const features = [
  { id: 'feature-tuner', icon: Guitar, label: 'Guitar Tuner', gradientFrom: '#FF007A', gradientTo: '#FF7300', description: 'Chromatic pitch detection using your microphone. Fast and accurate.', to: '/tuner', cta: 'Open Tuner' },
  { id: 'feature-chords', icon: BookOpen, label: 'Chord Library', gradientFrom: '#CC00AA', gradientTo: '#7B00FF', description: 'Browse 529 chord voicings across all keys with fingering diagrams.', to: '/chords', cta: 'Browse Chords' },
  { id: 'feature-progression', icon: Sliders, label: 'Progression Builder', gradientFrom: '#10b981', gradientTo: '#34d399', description: 'Build chord progressions by section, generate by genre, and play back at any tempo.', to: '/progression', cta: 'Build Progression' },
  { id: 'feature-scale', icon: Music4, label: 'Scale Visualizer', gradientFrom: '#CC00AA', gradientTo: '#FF007A', description: 'Master the fretboard. Map intervals, visualize root anchor notes across 15 frets, and listen to scale sequences dynamically.', to: '/scale', cta: 'Explore Scales' },
  { id: 'feature-songs', icon: Search, label: 'Song Finder', gradientFrom: '#ec4899', gradientTo: '#f472b6', description: 'Discover songs that match the chords you already know.', to: '/songs', cta: 'Find Songs' },
  { id: 'feature-metronome', icon: Timer, label: 'Metronome', gradientFrom: '#f59e0b', gradientTo: '#fbbf24', description: 'Precision tempo with tap tempo, time signatures, and genre presets.', to: '/metronome', cta: 'Open Metronome' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#FF007A' }}>
            Everything you need
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Five tools. One workspace.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
            Everything a guitarist needs — tuning, chords, songs, progressions, and rhythm.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {features.map(({ id, icon: Icon, label, gradientFrom, gradientTo, description, to, cta }) => (
            <motion.div
              key={id}
              id={id}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              className="group glass rounded-2xl p-7 flex flex-col gap-5 cursor-pointer"
              style={{ transition: 'box-shadow 0.3s' }}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}22, ${gradientTo}22)`, border: `1px solid ${gradientFrom}33` }}>
                <Icon size={20} style={{ color: gradientFrom }} strokeWidth={1.75} />
              </div>

              {/* Text */}
              <div className="flex-1 space-y-2">
                <h3 className="font-display text-lg font-semibold text-white">{label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {description}
                </p>
              </div>

              {/* CTA */}
              <Link
                to={to}
                id={`${id}-link`}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: gradientFrom }}
              >
                {cta}
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
