import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="font-display text-8xl font-black gradient-text">404</div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-white">Page not found</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Looks like this string is out of tune. Let's get you back on track.
          </p>
        </div>
        <Link
          to="/"
          id="not-found-home"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'var(--gradient-cta)' }}
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
