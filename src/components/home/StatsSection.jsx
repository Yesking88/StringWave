import { motion } from 'framer-motion'

const stats = [
  { id: 'stat-chords', value: '300+', label: 'Chord Voicings' },
  { id: 'stat-tunings', value: '12', label: 'Tuning Presets' },
  { id: 'stat-songs', value: '1000+', label: 'Songs Indexed' },
  { id: 'stat-keys', value: 'All 12', label: 'Musical Keys' },
]

export default function StatsSection() {
  return (
    <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div
          className="glass rounded-2xl px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{ boxShadow: '0 0 60px rgba(255,0,122,0.06)' }}
        >
          {stats.map(({ id, value, label }, i) => (
            <motion.div
              key={id}
              id={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center gap-1"
            >
              <span
                className="font-display text-3xl font-bold gradient-text"
              >
                {value}
              </span>
              <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
