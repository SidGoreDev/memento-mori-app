import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LIFE_EXPECTANCY_MAX, LIFE_EXPECTANCY_MIN } from './lib/defaults'
import { drawGridToContext, getGridLayout, getWeekIndexAtPoint } from './lib/gridRender'
import { clearStoredState, loadStateFromStorage, saveStateToStorage } from './lib/persistence'
import { decodeStateFromHash, encodeStateToHash } from './lib/shareState'
import { computeDerivedMetrics, getWeekDateRange, parseDateInput } from './lib/weekMath'
import { useAppStore } from './store/useAppStore'

interface TooltipState {
  weekIndex: number
  x: number
  y: number
}

interface Countdown {
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface Grain {
  x: number
  y: number
  speed: number
}

function computeCountdown(birthDate: string, lifeExpectancyYears: number): Countdown {
  const birth = parseDateInput(birthDate)
  const endDate = new Date(birth.getTime())
  endDate.setUTCFullYear(endDate.getUTCFullYear() + lifeExpectancyYears)
  const remainingMs = Math.max(0, endDate.getTime() - Date.now())
  return {
    weeks: Math.floor(remainingMs / 604_800_000),
    days: Math.floor(remainingMs / 86_400_000),
    hours: Math.floor(remainingMs / 3_600_000),
    minutes: Math.floor(remainingMs / 60_000),
    seconds: Math.floor(remainingMs / 1_000),
  }
}

function getWeekProgress(birthDate: string): number {
  const birth = parseDateInput(birthDate)
  const now = Date.now()
  const msSinceBirth = now - birth.getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return (msSinceBirth % weekMs) / weekMs
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

function App() {
  const {
    birthDate,
    lifeExpectancyYears,
    step,
    setBirthDate,
    setLifeExpectancyYears,
    setStep,
    reset,
  } = useAppStore()

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [countdown, setCountdown] = useState<Countdown | null>(null)
  const [gridCellSize, setGridCellSize] = useState(8)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')
  const [sandTooltip, setSandTooltip] = useState<{ x: number; y: number } | null>(null)
  const [sandProgress, setSandProgress] = useState(0)
  const [blinkOn, setBlinkOn] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridAreaRef = useRef<HTMLDivElement | null>(null)
  const hourglassCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const grainsRef = useRef<Grain[]>([])
  const sandAnimRef = useRef<number>(0)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sandTextureRef = useRef<HTMLCanvasElement | null>(null)
  const lastFillHeightRef = useRef(-1)

  const today = new Date().toISOString().slice(0, 10)
  const isBirthDateValid = birthDate.length > 0 && birthDate <= today

  const metrics = useMemo(() => {
    if (!isBirthDateValid) return null
    return computeDerivedMetrics(birthDate, lifeExpectancyYears)
  }, [birthDate, lifeExpectancyYears, isBirthDateValid])

  const gap = 1
  const layout = useMemo(() => {
    if (!metrics) return null
    return getGridLayout(metrics.totalWeeks, gridCellSize, gap)
  }, [gridCellSize, gap, metrics])

  const showNotice = useCallback((message: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    setNotice(message)
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3000)
  }, [])

  // Mobile layout detection
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Hydrate from hash or storage
  useEffect(() => {
    const fromHash = decodeStateFromHash(window.location.hash)
    if (fromHash) {
      const { schemaVersion, ...state } = fromHash
      void schemaVersion
      useAppStore.setState({ ...state, step: 'input' })
      showNotice('Loaded shared state.')
      setIsHydrated(true)
      return
    }
    if (window.location.hash.length > 1) showNotice('Invalid share link.')
    const fromStorage = loadStateFromStorage()
    if (fromStorage) {
      useAppStore.setState({ ...fromStorage, step: 'input' })
      showNotice('Session restored.')
    }
    setIsHydrated(true)
  }, [showNotice])

  // Persist
  useEffect(() => {
    if (!isHydrated || !birthDate) return
    saveStateToStorage({ birthDate, lifeExpectancyYears })
  }, [birthDate, isHydrated, lifeExpectancyYears])

  // Auto-size grid cells to fit container
  useEffect(() => {
    if (step !== 'visualization' || !metrics || !gridAreaRef.current) return
    const computeSize = () => {
      const el = gridAreaRef.current
      if (!el) return
      const pad = 16
      const w = el.clientWidth - pad
      const h = el.clientHeight - pad
      const rows = metrics.gridRows
      const maxByW = Math.floor(w / 52) - gap
      const maxByH = Math.floor(h / rows) - gap
      setGridCellSize(Math.max(2, Math.min(maxByW, maxByH)))
    }
    computeSize()
    const observer = new ResizeObserver(computeSize)
    observer.observe(gridAreaRef.current)
    return () => observer.disconnect()
  }, [step, metrics, gap])

  // Draw grid
  useEffect(() => {
    if (!metrics || !layout || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = layout.width
    canvas.height = layout.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    drawGridToContext(ctx, {
      totalWeeks: metrics.totalWeeks,
      weeksLived: metrics.weeksLived,
      selectedWeek,
      cellSize: gridCellSize,
      gap,
      livedColor: '#555',
      emptyColor: '#1a1a1a',
      currentColor: prefersReduced ? '#fff' : (blinkOn ? '#fff' : '#555'),
    })
  }, [metrics, selectedWeek, gridCellSize, gap, layout, blinkOn])

  // Set selected week on entering visualization
  useEffect(() => {
    if (step !== 'visualization' || !metrics) return
    setSelectedWeek(metrics.todayWeekIndex)
  }, [step, metrics])

  // Blink current week
  useEffect(() => {
    if (step !== 'visualization') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const blinkInterval = setInterval(() => setBlinkOn(prev => !prev), 800)
    return () => clearInterval(blinkInterval)
  }, [step])

  // Countdown ticker + document title
  useEffect(() => {
    if (step !== 'visualization' || !isBirthDateValid) return
    const update = () => {
      const cd = computeCountdown(birthDate, lifeExpectancyYears)
      setCountdown(cd)
      setSandProgress(getWeekProgress(birthDate))
      document.title = `${formatNum(cd.weeks)} weeks \u2013 Memento Mori`
    }
    update()
    const interval = setInterval(update, 1000)
    return () => {
      clearInterval(interval)
      document.title = 'Memento Mori'
    }
  }, [step, birthDate, lifeExpectancyYears, isBirthDateValid])

  // Sand hourglass animation
  useEffect(() => {
    if (step !== 'visualization' || !isBirthDateValid) return
    const canvas = hourglassCanvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight - 30
    }
    resize()
    const resizeObs = new ResizeObserver(resize)
    resizeObs.observe(canvas.parentElement!)

    // Reduced motion: draw static fill and stop
    if (prefersReduced) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const progress = getWeekProgress(birthDate)
        const fillHeight = Math.floor(canvas.height * progress)
        ctx.fillStyle = '#0a0a0a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        if (fillHeight > 0) {
          ctx.fillStyle = '#555'
          ctx.fillRect(0, canvas.height - fillHeight, canvas.width, fillHeight)
        }
      }
      return () => resizeObs.disconnect()
    }

    // Create offscreen canvas for stipple texture cache
    if (!sandTextureRef.current) {
      sandTextureRef.current = document.createElement('canvas')
    }
    const textureCanvas = sandTextureRef.current
    lastFillHeightRef.current = -1

    const grains = grainsRef.current
    let frameCount = 0

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      if (w === 0 || h === 0) {
        sandAnimRef.current = requestAnimationFrame(draw)
        return
      }

      const progress = getWeekProgress(birthDate)
      const fillHeight = Math.floor(h * progress)
      const grainSize = 2

      // Spawn new grains
      frameCount++
      if (frameCount % 3 === 0) {
        const gx = Math.floor(Math.random() * (w / grainSize)) * grainSize
        grains.push({ x: gx, y: 0, speed: 1 + Math.random() * 2 })
      }

      // Limit active grains
      if (grains.length > 120) grains.splice(0, grains.length - 120)

      // Update grain positions
      const landingY = h - fillHeight
      for (let i = grains.length - 1; i >= 0; i--) {
        grains[i].y += grains[i].speed
        if (grains[i].y >= landingY) {
          grains.splice(i, 1)
        }
      }

      // Regenerate stipple texture only when fill level changes
      if (fillHeight !== lastFillHeightRef.current) {
        textureCanvas.width = w
        textureCanvas.height = h
        const tctx = textureCanvas.getContext('2d')
        if (tctx) {
          tctx.fillStyle = '#0a0a0a'
          tctx.fillRect(0, 0, w, h)
          if (fillHeight > 0) {
            tctx.fillStyle = '#444'
            tctx.fillRect(0, h - fillHeight, w, fillHeight)
            tctx.fillStyle = '#555'
            for (let px = 0; px < w; px += grainSize) {
              for (let py = h - fillHeight; py < h; py += grainSize) {
                if (Math.random() > 0.6) {
                  tctx.fillRect(px, py, grainSize, grainSize)
                }
              }
            }
            tctx.fillStyle = '#666'
            for (let px = 0; px < w; px += grainSize) {
              if (Math.random() > 0.3) {
                tctx.fillRect(px, h - fillHeight, grainSize, grainSize)
              }
            }
          }
        }
        lastFillHeightRef.current = fillHeight
      }

      // Composite cached texture + dynamic grains
      ctx.drawImage(textureCanvas, 0, 0)
      ctx.fillStyle = '#888'
      for (const g of grains) {
        ctx.fillRect(g.x, g.y, grainSize, grainSize)
      }

      sandAnimRef.current = requestAnimationFrame(draw)
    }

    sandAnimRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(sandAnimRef.current)
      resizeObs.disconnect()
      grains.length = 0
      lastFillHeightRef.current = -1
    }
  }, [step, birthDate, isBirthDateValid])

  // Tooltip / interaction helpers
  const getTooltipPos = useCallback((rx: number, ry: number) => {
    const el = gridAreaRef.current
    if (!el) return { x: rx + 12, y: ry + 12 }
    let x = rx + 12
    let y = ry + 12
    if (rx + 170 > el.clientWidth) x = rx - 160
    if (ry + 60 > el.clientHeight) y = ry - 60
    return { x: Math.max(4, x), y: Math.max(4, y) }
  }, [])

  const onCanvasMove = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !metrics) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const index = getWeekIndexAtPoint(x, y, metrics.totalWeeks, gridCellSize, gap)
    if (index === null) { setTooltip(null); return }
    const pos = getTooltipPos(x, y)
    setTooltip({ weekIndex: index, x: pos.x, y: pos.y })
  }

  const setTooltipByIndex = (index: number) => {
    const col = index % 52
    const row = Math.floor(index / 52)
    const rx = col * (gridCellSize + gap) + gridCellSize + 4
    const ry = row * (gridCellSize + gap) + 4
    const pos = getTooltipPos(rx, ry)
    setTooltip({ weekIndex: index, x: pos.x, y: pos.y })
  }

  const moveSelectedWeek = (delta: number) => {
    if (!metrics) return
    const from = selectedWeek ?? metrics.todayWeekIndex
    const next = Math.max(0, Math.min(metrics.totalWeeks - 1, from + delta))
    setSelectedWeek(next)
    setTooltipByIndex(next)
    const range = getWeekDateRange(birthDate, next)
    if (range) {
      const lbl = next < metrics.weeksLived ? 'lived' : next === metrics.weeksLived ? 'now' : 'remaining'
      setLiveAnnouncement(`Week ${next + 1}, ${range.start} to ${range.end}, ${lbl}`)
    }
  }

  const handleExportPng = () => {
    if (!metrics || !layout) return
    const scale = Math.max(1, Math.floor(4096 / layout.width))
    const off = document.createElement('canvas')
    off.width = layout.width * scale
    off.height = layout.height * scale
    const ctx = off.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.scale(scale, scale)
    drawGridToContext(ctx, {
      totalWeeks: metrics.totalWeeks,
      weeksLived: metrics.weeksLived,
      selectedWeek,
      cellSize: gridCellSize,
      gap,
      livedColor: '#555',
      emptyColor: '#1a1a1a',
      currentColor: '#fff',
    })
    const link = document.createElement('a')
    link.href = off.toDataURL('image/png')
    link.download = `memento-mori-${new Date().toISOString().slice(0, 10)}.png`
    link.click()
    showNotice('Exported.')
  }

  const handleShare = async () => {
    if (!birthDate) { showNotice('Enter birth date first.'); return }
    const hash = encodeStateToHash({ birthDate, lifeExpectancyYears })
    const url = `${window.location.origin}${window.location.pathname}#${hash}`
    try {
      await navigator.clipboard.writeText(url)
      showNotice('Link copied.')
    } catch {
      showNotice('Copy from URL bar.')
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset all data? This cannot be undone.')) return
    clearStoredState()
    window.history.replaceState({}, '', window.location.pathname)
    reset()
    setTooltip(null)
    setSelectedWeek(null)
    setCountdown(null)
    document.title = 'Memento Mori'
  }

  const hoveredRange = tooltip && isBirthDateValid
    ? getWeekDateRange(birthDate, tooltip.weekIndex)
    : null

  // Current week position on canvas for connecting line
  const currentWeekPos = useMemo(() => {
    if (!metrics || !canvasRef.current) return null
    const idx = metrics.todayWeekIndex
    const col = idx % 52
    const row = Math.floor(idx / 52)
    const cx = col * (gridCellSize + gap) + gridCellSize / 2
    const cy = row * (gridCellSize + gap) + gridCellSize / 2
    return { cx, cy }
  }, [metrics, gridCellSize, gap])

  return (
    <main className="app">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {step === 'input' && (
        <>
          <div className="top-bar">
            <div />
            {notice && <p className="notice" role="status">{notice}</p>}
            <div />
          </div>
          <section className="onboarding" data-testid="onboarding-form">
            <div className="onboarding-inner">
              <h1 className="onboarding-title">MEMENTO MORI</h1>
              <p className="onboarding-sub">your life in weeks</p>

              <div className="field">
                <label htmlFor="birthDate">Birth date</label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={today}
                  data-testid="birth-date-input"
                />
                {birthDate && !isBirthDateValid && (
                  <p className="field-error" role="alert">&gt; Date must be today or earlier</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="lifeExpectancy">
                  Life expectancy: {lifeExpectancyYears} yrs
                </label>
                <div className="slider-group">
                  <input
                    id="lifeExpectancy"
                    type="range"
                    min={LIFE_EXPECTANCY_MIN}
                    max={LIFE_EXPECTANCY_MAX}
                    value={lifeExpectancyYears}
                    onChange={(e) => setLifeExpectancyYears(Number.parseInt(e.target.value, 10))}
                    data-testid="life-expectancy-slider"
                  />
                  <input
                    type="number"
                    min={LIFE_EXPECTANCY_MIN}
                    max={LIFE_EXPECTANCY_MAX}
                    value={lifeExpectancyYears}
                    aria-label="Life expectancy in years"
                    onChange={(e) =>
                      setLifeExpectancyYears(
                        Math.max(LIFE_EXPECTANCY_MIN, Math.min(LIFE_EXPECTANCY_MAX, Number.parseInt(e.target.value || '0', 10)))
                      )
                    }
                    data-testid="life-expectancy-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={!isBirthDateValid}
                  onClick={() => setStep('visualization')}
                  data-testid="render-grid-button"
                >
                  Begin
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {step === 'visualization' && metrics && (
        <>
          <div className="top-bar">
            <h1>MEMENTO MORI</h1>
            {notice && <p className="notice" role="status">{notice}</p>}
            <div className="top-bar-actions">
              <button type="button" onClick={handleShare} aria-label="Copy share link" data-testid="copy-share-link-button">Share</button>
              <button type="button" onClick={handleExportPng} aria-label="Export grid as PNG" data-testid="export-png-button">Export</button>
              <button type="button" onClick={() => setStep('input')} aria-label="Edit birth date and life expectancy">Edit</button>
              <button type="button" onClick={handleReset} aria-label="Reset all data" data-testid="reset-button">Reset</button>
            </div>
          </div>

          <div className="vis-body" data-testid="visualization-view">
            {/* Grid area */}
            <div className="grid-area" ref={gridAreaRef}>
              <canvas
                ref={canvasRef}
                className="grid-canvas"
                tabIndex={0}
                role="grid"
                aria-roledescription="life week grid"
                aria-label={
                  selectedWeek !== null
                    ? `Life grid: ${metrics.totalWeeks} weeks total, ${metrics.weeksLived} lived. Currently on week ${selectedWeek + 1}. Arrow keys to navigate.`
                    : `Life grid: ${metrics.totalWeeks} weeks total, ${metrics.weeksLived} lived. Arrow keys to navigate.`
                }
                onMouseMove={(e) => onCanvasMove(e.clientX, e.clientY)}
                onClick={(e) => onCanvasMove(e.clientX, e.clientY)}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={(e) => {
                  const t = e.touches[0]
                  onCanvasMove(t.clientX, t.clientY)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); moveSelectedWeek(1) }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSelectedWeek(-1) }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelectedWeek(52) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelectedWeek(-52) }
                }}
                data-testid="memento-grid"
              >
                Your life visualized as a grid of {metrics.totalWeeks} weeks.
                {metrics.weeksLived} weeks lived, {metrics.weeksRemaining} remaining.
              </canvas>

              {/* Connecting line from current week to sidebar */}
              {!isMobile && layout && currentWeekPos && canvasRef.current && (
                <svg className="line-overlay" aria-hidden="true">
                  <line
                    x1={canvasRef.current.offsetLeft + currentWeekPos.cx}
                    y1={canvasRef.current.offsetTop + currentWeekPos.cy}
                    x2={gridAreaRef.current ? gridAreaRef.current.clientWidth - 2 : 0}
                    y2={canvasRef.current.offsetTop + currentWeekPos.cy}
                    stroke="#444"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}

              {tooltip && hoveredRange && (
                <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }} data-testid="week-tooltip">
                  <p>Week {tooltip.weekIndex + 1}</p>
                  <p>{hoveredRange.start} &ndash; {hoveredRange.end}</p>
                  <p>{tooltip.weekIndex < metrics.weeksLived ? 'Lived' : tooltip.weekIndex === metrics.weeksLived ? 'Now' : 'Remaining'}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="sidebar">
              <p className="sidebar-label">This week</p>
              <div className="hourglass-wrap">
                <canvas
                  ref={hourglassCanvasRef}
                  className="hourglass-canvas"
                  role="img"
                  aria-label={`Sand hourglass showing ${(sandProgress * 100).toFixed(0)}% of the current week elapsed`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setSandTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 40 })
                  }}
                  onMouseLeave={() => setSandTooltip(null)}
                />
                {sandTooltip && (
                  <div className="sand-tooltip" style={{ left: sandTooltip.x, top: sandTooltip.y }}>
                    <p className="sand-tooltip-pct">{(sandProgress * 100).toFixed(2)}%</p>
                    <p className="sand-tooltip-frac">
                      Day {Math.floor(sandProgress * 7) + 1} of 7
                    </p>
                    <p className="sand-tooltip-bar">
                      <span className="sand-tooltip-fill" style={{ width: `${sandProgress * 100}%` }} />
                    </p>
                  </div>
                )}
                <p className="hourglass-label">
                  Week {metrics.weeksLived + 1} of {metrics.totalWeeks.toLocaleString()}
                </p>
              </div>

              {countdown && (
                <section aria-label="Remaining time" className="counters-section">
                  <p className="sidebar-label">Life remaining</p>
                  <div className="counters-compact">
                    <div className="counter-mini" role="group" aria-label={`${formatNum(countdown.weeks)} weeks remaining`}>
                      <p className="counter-mini-label" aria-hidden="true">Weeks</p>
                      <p className="counter-mini-value" aria-hidden="true">{formatNum(countdown.weeks)}</p>
                    </div>
                    <div className="counter-mini" role="group" aria-label={`${formatNum(countdown.days)} days remaining`}>
                      <p className="counter-mini-label" aria-hidden="true">Days</p>
                      <p className="counter-mini-value" aria-hidden="true">{formatNum(countdown.days)}</p>
                    </div>
                    <div className="counter-mini" role="group" aria-label={`${formatNum(countdown.hours)} hours remaining`}>
                      <p className="counter-mini-label" aria-hidden="true">Hours</p>
                      <p className="counter-mini-value" aria-hidden="true">{formatNum(countdown.hours)}</p>
                    </div>
                    <div className="counter-mini" role="group" aria-label={`${formatNum(countdown.minutes)} minutes remaining`}>
                      <p className="counter-mini-label" aria-hidden="true">Minutes</p>
                      <p className="counter-mini-value" aria-hidden="true">{formatNum(countdown.minutes)}</p>
                    </div>
                    <div className="counter-mini ticking" role="group" aria-label={`${formatNum(countdown.seconds)} seconds remaining`}>
                      <p className="counter-mini-label" aria-hidden="true">Seconds</p>
                      <p className="counter-mini-value" aria-hidden="true">{formatNum(countdown.seconds)}</p>
                    </div>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  )
}

export default App
