import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CtaSection() {
  return (
    <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden text-center px-8 py-16"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.12) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 70%)',
            }} />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#818cf8' }}>
              Get started
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
              Your guitar tools,{' '}
              <span className="gradient-text">all in one place.</span>
            </h2>
            <p className="text-base mb-10 leading-relaxed" style={{ color: '#64748b' }}>
              No account needed. Open any tool and start playing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/tuner"
                id="cta-section-tuner"
                className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.35)',
                }}
              >
                Open Tuner
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/songs"
                id="cta-section-songs"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/[0.07]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94a3b8',
                }}
              >
                Find Songs
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
