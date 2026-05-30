import { Link } from 'react-router-dom'
import { GitBranch, ExternalLink, Heart } from 'lucide-react'
import Logo from './Logo'

const toolsList = [
  { label: 'Chromatic Tuner', to: '/tuner' },
  { label: 'Chord Library', to: '/chords' },
  { label: 'Progression Generator', to: '/progression' },
  { label: 'Scale Visualizer', to: '/scale' },
  { label: 'Song Finder', to: '/songs' },
  { label: 'Metronome', to: '/metronome' },
]

export default function Footer() {
  return (
    <footer
      className="relative mt-auto pt-16 pb-8"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,122,0.4), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2" id="footer-logo">
              <Logo className="h-7 w-auto" />
              <span className="font-display font-bold text-lg text-white">
                String<span className="gradient-text">Wave</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              Six premium guitar tools in one workspace. No login, no distractions.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                id="footer-github"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <GitBranch size={15} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                id="footer-twitter"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Tools List Column (Spans remaining columns with 2-column list grid) */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#6b7280' }}>
              Tools
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {toolsList.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    id={`footer-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200"
                    onMouseEnter={e => {
                      e.target.style.color = '#FF007A';
                      e.target.style.textShadow = '0 0 8px rgba(255, 0, 122, 0.6)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.color = '';
                      e.target.style.textShadow = '';
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#4b5563' }}>
            © {new Date().getFullYear()} StringWave. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs" style={{ color: '#4b5563' }}>
            Made with <Heart size={11} className="text-pink-500" /> for guitarists
          </p>
        </div>
      </div>
    </footer>
  )
}
