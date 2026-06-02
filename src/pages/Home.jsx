import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Guitar, BookOpen, Sliders, Music4, Search, Timer, Trophy, FileText, Disc, ChevronRight } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'

const bentoFeatures = [
  { 
    id: 'feature-tuner', 
    icon: Guitar, 
    label: 'Chromatic Tuner', 
    category: 'Tools', 
    categoryColor: '#FF007A',
    description: 'Chromatic pitch detection using microphone input. Fast, accurate, and optimized for quick instrument tuning.', 
    to: '/tuner',
    colspan: 'md:col-span-2'
  },
  { 
    id: 'feature-metronome', 
    icon: Timer, 
    label: 'Precision Metronome', 
    category: 'Tools', 
    categoryColor: '#FF007A',
    description: 'Precision tempo with tap input, visual beat counters, and standard signatures.', 
    to: '/metronome',
    colspan: 'md:col-span-1'
  },
  { 
    id: 'feature-trainer', 
    icon: Trophy, 
    label: 'Fretboard Trainer', 
    category: 'Tools', 
    categoryColor: '#FF007A',
    description: 'Train your muscle memory. Interactive note identification game with customizable timer thresholds.', 
    to: '/trainer',
    colspan: 'md:col-span-1'
  },
  { 
    id: 'feature-chords', 
    icon: BookOpen, 
    label: 'Chord Library', 
    category: 'Theory', 
    categoryColor: '#A855F7',
    description: 'Browse 529 guitar chord voicings across all keys. Interactive fretboard diagrams showing exact fingerings and layout variations.', 
    to: '/chords',
    colspan: 'md:col-span-2'
  },
  { 
    id: 'feature-scale', 
    icon: Music4, 
    label: 'Scale Visualizer', 
    category: 'Theory', 
    categoryColor: '#A855F7',
    description: 'Master scale structures. Map intervals and play scale sequences on an interactive 15-fret display.', 
    to: '/scale',
    colspan: 'md:col-span-1'
  },
  { 
    id: 'feature-circle', 
    icon: Disc, 
    label: 'Circle of Fifths', 
    category: 'Theory', 
    categoryColor: '#A855F7',
    description: 'Explore diatonic keys and signatures. Interactive wheel illustrating chord and key relationships.', 
    to: '/circle',
    colspan: 'md:col-span-1'
  },
  { 
    id: 'feature-songs', 
    icon: Search, 
    label: 'Song Finder', 
    category: 'Explore', 
    categoryColor: '#FF7300',
    description: 'Find tracks matching the chords you already know. Discover practice songs mapped to your skill level.', 
    to: '/songs',
    colspan: 'md:col-span-1'
  },
  { 
    id: 'feature-progression', 
    icon: Sliders, 
    label: 'Progression Builder', 
    category: 'Explore', 
    categoryColor: '#FF7300',
    description: 'Build custom loops, select tempos, choose styling genres, and play along with full backing rhythm sections.', 
    to: '/progression',
    colspan: 'md:col-span-2'
  },
  { 
    id: 'feature-sheet-creator', 
    icon: FileText, 
    label: 'Chord Sheet Creator', 
    category: 'Explore', 
    categoryColor: '#FF7300',
    description: 'Draft lyrics and stamp chord badges. Play backing tracks with the inline chord sequencer.', 
    to: '/creator',
    colspan: 'md:col-span-1'
  }
]

export default function Home() {
  const [hoveredTitle, setHoveredTitle] = useState(null)

  return (
    <PageWrapper
      className="px-0 pb-16 flex-1 flex flex-col"
    >
      {/* Decorative ambient glows for organic mesh backdrop */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF007A]/3 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#A855F7]/3 blur-[140px] pointer-events-none z-0" />

      {/* Hero Section - Open Canvas */}
      <div className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-[#FF007A]" style={{ color: '#FF007A' }}>
          WELCOME TO STRINGWAVE
        </span>

        {/* Headline with Electric Sunset gradient */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6 text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Your complete guitar ecosystem,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#FF7300]"
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,0,122,0.25))' }}>
            reimagined
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-8 font-medium">
          An all-in-one creative suite for modern guitarists. Build progressions, master scales, tune with precision, and write interactive chord sheets. No barriers, no noise.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {/* Primary button: Outlined with a magenta glow */}
          <Link
            to="/tuner"
            id="hero-cta-primary"
            className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-[#FF007A] bg-transparent shadow-[0_0_15px_rgba(255,0,122,0.4)] hover:bg-[#FF007A]/10 cursor-pointer"
          >
            Start Tuning
          </Link>

          {/* Secondary button: Subtle ghost button */}
          <Link
            to="/chords"
            id="hero-cta-secondary"
            className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Browse Chords
          </Link>
        </div>
      </div>

      {/* Bento Grid Feature Showcase */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Explore the Studio Suite
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              Unlock a workspace designed for training, songwriting, and scale discovery.
            </p>
          </div>

          {/* Asymmetrical Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
            {bentoFeatures.map((feat) => {
              const Icon = feat.icon
              return (
                <Link
                  key={feat.to}
                  to={feat.to}
                  id={feat.id}
                  className={`${feat.colspan} bg-neutral-900/30 backdrop-blur-xl border border-white/5 hover:border-[#FF007A]/30 transition-all rounded-2xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer hover:-translate-y-1`}
                  style={{ transitionDuration: '300ms' }}
                >
                  <div>
                    {/* Header: Category Badge + Icon */}
                    <div className="flex items-center justify-between mb-4 border-b border-white/[0.03] pb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5" style={{ color: feat.categoryColor }}>
                        {feat.category}
                      </span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02] group-hover:bg-[#FF007A]/10 border border-white/5 group-hover:border-[#FF007A]/25 transition-all">
                        <Icon size={14} className="text-slate-400 group-hover:text-[#FF007A] transition-colors" />
                      </div>
                    </div>

                    {/* Text Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-white leading-normal tracking-tight mb-2 group-hover:text-[#FF007A] transition-colors">
                        {feat.label}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {feat.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer arrow chevron */}
                  <div className="mt-6 flex items-center gap-1 text-[10px] font-bold text-[#FF007A] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open</span>
                    <ChevronRight size={10} />
                  </div>
                </Link>
              )
            })}
          </div>

        </div>
      </section>

    </PageWrapper>
  )
}
