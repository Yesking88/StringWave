# 🎸 StringWave

StringWave is a web application for guitarists featuring a dark interface and an Electric Sunset color palette (purple, magenta, and orange). It includes a chromatic tuner, a chord catalog, a chord-matching song database, an interactive chord progression generator with a multi-instrument mixer, and a metronome.

---

## 🚀 Features

### 1. 🎛️ Chromatic Tuner
* **Pitch Detection**: Uses autocorrelation via the `pitchy` algorithm for frequency estimation.
* **Tuning Presets**: Supports 9 built-in presets (Standard, Drop D, Drop C, Half-Step Down, Whole-Step Down, Open D, Open E, Open G, DADGAD) selectable from a glassmorphic dropdown.
* **Tuning Feedback**: Snaps target markers and centering needles to 0 when pitch is within $\pm3$ cents, triggering a green success indicator.
* **Metrics Display**: Displays notes with high-contrast labels and text-shadow glow effects.
* **Idle State**: Hides the needle and tuning indicators when inactive.
* **Octave Correction**: Uses frequency distance checks to prevent harmonic jumps on standard guitar frequencies.
* **Audio Reference**: Plucks reference notes using real acoustic steel string guitar samples.

### 2. 📖 Chord Library
* **Expanded Chord Dataset**: Contains a massive database of **529 chords** across Major, Minor, 7th, Maj7, Min7, Suspended, Diminished, Augmented (full keys for `aug`, `aug7`, `aug9`), Add9, 6th, and 9th categories, matching standard schemas from `tombatossals/chords-db`.
* **Interactive Audio Preview**: Added direct click-to-trigger "Play" buttons on both the `ChordCard` grid and the glassmorphic focus `ChordModal` that play a realistic, smooth arpeggiated downward guitar strum sweep over ~250–300ms.
* **Alternative Chord Shapes (Variations)**: An interactive variation slider (`< Shape X of Y >`) allows guitarists to scroll through multiple shapes, barre patterns, and finger combinations for any chord.
* **Dynamic SVG Rendering**: Chord diagrams auto-adjust the drawing viewport. If `baseFret > 1`, the thick white nut line is hidden, and the base fret number is dynamically rendered on the side (e.g., "5fr").
* **Root Note Filtering**: Filters chords with flat/sharp accidental equivalency support.
* **Performance**: Limits initial card rendering to 24 items to avoid DOM layout shift.
* **Favorites**: Synchronizes favorited chords with local storage and provides a filtered view.

### 3. 🎹 Chord Progression Generator
* **Archetype Formulas**: Generates chord progressions based on Pop, Jazz, Classic Rock, and Neo-Soul formulas.
* **Key Transposition**: Transposes progression formulas dynamically to target keys.
* **6 Rhythmic Styles**: Provides Pop/Rock, Arpeggio, Sustained, Jazz Swing, Neo-Soul, and Blues Shuffle rhythm block generators.
* **4-Channel Mixer**: Features a floating glassmorphic mixer panel with volume controls and toggles for Guitar, Piano, Bass, and Drums.
* **Gain Staging & Anti-Clipping**: Routes the drum synthesizers (Kick, Snare, Hi-hat, Crash, Ride) through a dedicated `DynamicsCompressorNode` (`threshold: -24`, `knee: 30`, `ratio: 4`, `attack: 0.01`, `release: 0.25`) and limits the drum channel master multiplier to a safe `0.15` coefficient to guarantee distortion-free headroom.
* **Intelligent Cymbal Phrasing**: Implements loop-wide `measureIndex` structural tracking:
  - *Pop/Rock / Arpeggio*: Triggers a sharp crash accent only on beat 1 of every 4th bar (`measureIndex % 4 === 0`).
  - *Jazz Swing / Neo-Soul*: Disables the crash cymbal entirely, replacing it with a soft metallic ride cymbal tap with automated velocity variations (accented on 4th bar boundaries, softer on standard downbeats).
  - *Blues Shuffle*: Triggers a low-volume crash accent exclusively on beat 1 of the 12-bar loop boundary (`measureIndex % 12 === 0`).
* **Sustained Transitions**: Samplers (Guitar, Piano, Bass) and fallback oscillators include a minimum `250ms` release envelope overlap to let notes bleed naturally over downbeats for continuous harmonic flow.
* **Modern Interface**: Custom page background using the upgraded `chord-progression-new.png` asset.
* **Library Integration**: Links directly to chord diagrams in the Chord Library.

### 4. 🔍 Chord-Matching Song Finder
* **Chord Filtering**: Searches and filters songs based on known chords, genre, difficulty, or artist.
* **Chord Diagrams**: Integrates chord diagram overlays directly inside lyrics displays.

### 5. ⏱️ Metronome
* **BPM Controls**: Adjusts tempo from 40 to 240 BPM via a slider and buttons.
* **LED Beat Tracker**: Supports 2/4, 3/4, 4/4, and 6/8 time signatures with sequential LED flashes and colored downbeat accents.
* **Tap Tempo**: Calculates and updates BPM from average tap intervals.

### 6. 🎨 Design & Layout
* **Theme**: Uses CSS custom properties to define the dark purple, neon magenta, and sunset orange palette.
* **Typography**: Styled with Plus Jakarta Sans for headings and Inter for body text via Tailwind CSS v4.
* **Branding**: Displays a high-resolution, transparent, glowing neon 3D guitar soundwave contour logo (`logo.png`) in the header and footer, cropped dynamically in the SVG viewBox for an enlarged display.
* **Transitions**: Applies slide and fade page transitions via Framer Motion.
* **Layout**: Implements consistent padding and spacing to ensure elements do not overlap.

---

## 🛠️ Tech Stack

* **Core**: [React 19](https://react.dev/) & [Vite 8](https://vite.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (configured via `@theme` in `src/index.css`)
* **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [Inter](https://fonts.google.com/specimen/Inter)
* **Animations**: [Framer Motion v12](https://www.framer.com/motion/)
* **Audio Engine**: Web Audio API sampler mapped to [Gleitz MusyngKite Soundfonts](https://github.com/gleitz/midi-js-soundfonts) (acoustic guitar steel, grand piano, electric bass) with synthesized fallback drum oscillators. Features dynamic anti-clipping gain protection, a dedicated `DynamicsCompressorNode` for drum staging, structural cymbal phrasing logic, muted string bypass rules, active voice cleanup, and robust `try/catch` asset-loading safety wrappers.
* **Icons**: [Lucide React](https://lucide.dev/)
* **Pitch Processing**: [Pitchy](https://www.npmjs.com/package/pitchy)

---

## 📂 Project Structure

```text
StringWave/
├── src/
│   ├── assets/          # Static media, logo.png, hero backgrounds
│   ├── components/      # Modular component layouts
│   │   ├── chords/      # ChordCard, ChordModal, ChordDiagram vectors
│   │   ├── home/        # HeroSection, FeaturesSection
│   │   ├── layout/      # Navbar, Footer, Logo.jsx (SVG image wrapper), PageWrapper.jsx
│   │   ├── progression/ # MixerPanel.jsx (Floating glassmorphism mixer)
│   │   ├── songs/       # SongList, SongPlayer
│   │   └── tuner/       # TunerMeter, NoteDisplay, StringSelector.jsx (Tuning matrix plucker)
│   ├── data/            # Local data models (scales formulas, song library)
│   ├── hooks/           # useFavorites, usePitchDetection (Tuning matrix analyzer), useMetronome, useProgressionPlayer APIs
│   ├── pages/           # Routed views:
│   │                    #  - Home.jsx (Main Dashboard)
│   │                    #  - Tuner.jsx (Guitar Tuner with selection dropdown)
│   │                    #  - Chords.jsx (Chord Catalog)
│   │                    #  - ProgressionGenerator.jsx (Chord flow tool with 6 styles)
│   │                    #  - Scale.jsx (Scale Visualizer with modal filters)
│   │                    #  - SongFinder.jsx (Song Search engine)
│   │                    #  - Metronome.jsx (Tempo tool)
│   │                    #  - NotFound.jsx (Error Fallback)
│   │   utils/           # Web Audio APIs, tonePlayer.js (Sample loading), progressionAudio.js (Style scheduler)
│   ├── App.jsx          # Route mappings & Shell wrappers
│   ├── main.jsx         # App mounting point
│   └── index.css        # Tailwind v4 theme definitions, fonts, global styles
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

---

## ⚙️ Development Setup

To run StringWave locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run Vite development server**:
   ```bash
   npm run dev
   ```

3. **Verify/Compile production build**:
   ```bash
   npm run build
   ```

4. **Preview the compiled bundle**:
   ```bash
   npm run preview
   ```
