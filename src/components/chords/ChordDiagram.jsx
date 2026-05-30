import { memo } from 'react'

// ── SVG layout constants ──────────────────────────────────────────────────────
const VB_W = 160   // viewBox width
const VB_H = 168   // viewBox height

// 6 strings (index 0 = low E/left, index 5 = high e/right), spacing 24 px
const STRING_X = [20, 44, 68, 92, 116, 140]

const NUT_Y   = 38   // y of nut / topmost fret line
const FRETS   = 4    // number of fret spaces shown

// 5 horizontal lines define 4 fret spaces, spacing 27 px
const FRET_Y  = [38, 65, 92, 119, 146]

// Vertical center of each fret space (where dots live)
const FRET_MID = FRET_Y.slice(0, -1).map((y, i) => (y + FRET_Y[i + 1]) / 2)
// → [51.5, 78.5, 105.5, 132.5]

const SYM_Y   = 20   // y for open-circle / muted-X markers
const DOT_R   = 9    // fretted dot radius
const OPEN_R  = 6    // open-string circle radius
const X_HALF  = 5    // half-arm of the muted-X

// ── Colour palette (stays within the dark aesthetic) ─────────────────────────
const CLR = {
  stringLine  : '#2d3748',
  fretLine    : '#1e2433',
  nut         : '#4a5568',
  dot         : '#6366f1',    // brand-500
  dotGlow     : 'rgba(99,102,241,0.5)',
  dotText     : '#ffffff',
  open        : '#818cf8',    // brand-400
  openStroke  : '#818cf8',
  muted       : '#475569',
  barreGrad1  : '#6366f1',
  barreGrad2  : '#a855f7',
  labelText   : '#64748b',
}

// ── Helper: convert guitar string number (1–6) to frets[] index (0–5) ────────
// String 6 = low E = index 0 (leftmost in diagram)
// String 1 = high e = index 5 (rightmost)
function strToIdx(stringNum) { return 6 - stringNum }

// ── Helper: absolute fret number → y position ────────────────────────────────
function dotY(fretNum, baseFret) {
  const row = fretNum - baseFret
  if (row < 0 || row >= FRET_MID.length) return null
  return FRET_MID[row]
}

// ─────────────────────────────────────────────────────────────────────────────

function ChordDiagram({ chord }) {
  const { frets, fingers, baseFret = 1, barre } = chord
  const showNut = baseFret === 1

  // Pre-compute barre string range so we can skip individual dots inside it
  let barreMin = -1, barreMax = -1
  if (barre) {
    barreMin = Math.min(strToIdx(barre.fromString), strToIdx(barre.toString))
    barreMax = Math.max(strToIdx(barre.fromString), strToIdx(barre.toString))
  }

  const isBarredDot = (stringIdx, fretNum) =>
    barre !== null && barre !== undefined &&
    fretNum === barre.fret &&
    stringIdx >= barreMin &&
    stringIdx <= barreMax

  // Unique gradient IDs per chord to avoid SVG conflicts
  const gradId = `bg-${chord.id}`

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label={`${chord.fullName} chord diagram`}
      role="img"
    >
      <defs>
        {/* Barre gradient */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={CLR.barreGrad1} />
          <stop offset="100%" stopColor={CLR.barreGrad2} />
        </linearGradient>
      </defs>

      {/* ── String lines ── */}
      {STRING_X.map((x, i) => (
        <line
          key={`s${i}`}
          x1={x} y1={NUT_Y}
          x2={x} y2={FRET_Y[FRETS]}
          stroke={CLR.stringLine}
          strokeWidth={i === 0 ? 1.8 : 1.2}
        />
      ))}

      {/* ── Fret lines ── */}
      {FRET_Y.map((y, i) => (
        <line
          key={`f${i}`}
          x1={STRING_X[0]} y1={y}
          x2={STRING_X[5]} y2={y}
          stroke={i === 0 && showNut ? CLR.nut : CLR.fretLine}
          strokeWidth={i === 0 && showNut ? 4 : 1.5}
          strokeLinecap="round"
        />
      ))}

      {/* ── BaseFret number (shown when chord starts above the nut) ── */}
      {baseFret > 1 && (
        <text
          x={STRING_X[0] - 6}
          y={FRET_MID[0] + 4}
          textAnchor="end"
          fontSize="10"
          fontWeight="600"
          fontFamily="Inter, monospace"
          fill={CLR.labelText}
        >
          {baseFret}fr
        </text>
      )}

      {/* ── Open-string circles and muted-string Xs ── */}
      {frets.map((fret, i) => {
        const x = STRING_X[i]
        if (fret === 0) {
          return (
            <circle
              key={`o${i}`}
              cx={x} cy={SYM_Y}
              r={OPEN_R}
              fill="none"
              stroke={CLR.openStroke}
              strokeWidth={1.5}
            />
          )
        }
        if (fret === -1) {
          return (
            <g key={`m${i}`}>
              <line
                x1={x - X_HALF} y1={SYM_Y - X_HALF}
                x2={x + X_HALF} y2={SYM_Y + X_HALF}
                stroke={CLR.muted} strokeWidth={1.5} strokeLinecap="round"
              />
              <line
                x1={x + X_HALF} y1={SYM_Y - X_HALF}
                x2={x - X_HALF} y2={SYM_Y + X_HALF}
                stroke={CLR.muted} strokeWidth={1.5} strokeLinecap="round"
              />
            </g>
          )
        }
        return null
      })}

      {/* ── Barre bar ── */}
      {barre && (() => {
        const y = dotY(barre.fret, baseFret)
        if (y === null) return null
        const x1 = STRING_X[barreMin]
        const x2 = STRING_X[barreMax]
        return (
          <rect
            key="barre"
            x={x1 - DOT_R}
            y={y - DOT_R}
            width={x2 - x1 + DOT_R * 2}
            height={DOT_R * 2}
            rx={DOT_R}
            fill={`url(#${gradId})`}
            opacity={0.9}
          />
        )
      })()}

      {/* ── Individual fret dots ── */}
      {frets.map((fret, i) => {
        if (fret <= 0) return null
        if (isBarredDot(i, fret)) return null   // covered by barre bar

        const x = STRING_X[i]
        const y = dotY(fret, baseFret)
        if (y === null) return null

        const finger = fingers[i]

        return (
          <g key={`d${i}`}>
            {/* Subtle glow halo */}
            <circle cx={x} cy={y} r={DOT_R + 3} fill={CLR.dotGlow} opacity={0.4} />
            {/* Main dot */}
            <circle cx={x} cy={y} r={DOT_R} fill={CLR.dot} />
            {/* Finger number */}
            {finger > 0 && (
              <text
                x={x} y={y + 4}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                fill={CLR.dotText}
              >
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default memo(ChordDiagram)
