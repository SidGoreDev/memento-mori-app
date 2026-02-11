import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { buildAllWeekCategoryIndices } from './lib/categoryAllocation'
import { LIFE_EXPECTANCY_MAX, LIFE_EXPECTANCY_MIN } from './lib/defaults'
import { drawGridToContext, getGridLayout, getWeekIndexAtPoint } from './lib/gridRender'
import { THEMES } from './lib/themes'
import { computeDerivedMetrics, getWeekDateRange } from './lib/weekMath'
import { useAppStore } from './store/useAppStore'

interface TooltipState {
  weekIndex: number
  x: number
  y: number
}

function App() {
  const {
    birthDate,
    lifeExpectancyYears,
    categories,
    colorScheme,
    step,
    setBirthDate,
    setLifeExpectancyYears,
    updateCategory,
    setColorScheme,
    setStep,
    reset,
  } = useAppStore()

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const theme = THEMES[colorScheme]
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const isBirthDateValid = birthDate.length > 0 && birthDate <= today
  const pastTotal = categories.reduce((acc, category) => acc + category.pastPercent, 0)
  const futureTotal = categories.reduce(
    (acc, category) => acc + category.futurePercent,
    0,
  )
  const areCategoryTotalsValid = pastTotal === 100 && futureTotal === 100
  const isFormValid = isBirthDateValid && areCategoryTotalsValid

  const metrics = useMemo(() => {
    if (!isBirthDateValid) return null
    return computeDerivedMetrics(birthDate, lifeExpectancyYears)
  }, [birthDate, lifeExpectancyYears, isBirthDateValid])

  const categoryIndices = useMemo(() => {
    if (!metrics) return []
    return buildAllWeekCategoryIndices(metrics.weeksLived, metrics.totalWeeks, categories)
  }, [categories, metrics])

  const cellSize = isMobile ? 6 : 10
  const gap = isMobile ? 1 : 2
  const layout = useMemo(() => {
    if (!metrics) return null
    return getGridLayout(metrics.totalWeeks, cellSize, gap)
  }, [cellSize, gap, metrics])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!metrics || !layout || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = layout.width
    canvas.height = layout.height
    const context = canvas.getContext('2d')
    if (!context) return
    drawGridToContext(context, {
      totalWeeks: metrics.totalWeeks,
      weeksLived: metrics.weeksLived,
      categoryIndices,
      categories,
      cellSize,
      gap,
      emptyColor: theme.gridEmpty,
      accentColor: theme.accent,
    })
  }, [metrics, categoryIndices, categories, cellSize, gap, theme, layout])

  const hoveredCategory =
    tooltip && categories[categoryIndices[tooltip.weekIndex] ?? -1]
      ? categories[categoryIndices[tooltip.weekIndex]]
      : null

  const hoveredRange =
    tooltip && isBirthDateValid ? getWeekDateRange(birthDate, tooltip.weekIndex) : null

  const onCanvasMove = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !metrics) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const index = getWeekIndexAtPoint(x, y, metrics.totalWeeks, cellSize, gap)
    if (index === null) {
      setTooltip(null)
      return
    }
    setTooltip({ weekIndex: index, x: x + 16, y: y + 16 })
  }

  const handleExportPng = () => {
    if (!metrics || !layout) return

    const targetWidth = 4096
    const scale = Math.max(1, Math.floor(targetWidth / layout.width))
    const offscreen = document.createElement('canvas')
    offscreen.width = layout.width * scale
    offscreen.height = layout.height * scale
    const context = offscreen.getContext('2d')
    if (!context) return

    context.scale(scale, scale)
    drawGridToContext(context, {
      totalWeeks: metrics.totalWeeks,
      weeksLived: metrics.weeksLived,
      categoryIndices,
      categories,
      cellSize,
      gap,
      emptyColor: theme.gridEmpty,
      accentColor: theme.accent,
    })

    const link = document.createElement('a')
    link.href = offscreen.toDataURL('image/png')
    link.download = `memento-mori-${new Date().toISOString().slice(0, 10)}.png`
    link.click()
  }

  return (
    <main
      className="app"
      style={
        {
          '--bg-primary': theme.bgPrimary,
          '--bg-surface': theme.bgSurface,
          '--text-primary': theme.textPrimary,
          '--text-muted': theme.textMuted,
          '--grid-empty': theme.gridEmpty,
          '--accent': theme.accent,
        } as CSSProperties
      }
    >
      <header className="hero">
        <p className="tagline">Memento Mori</p>
        <h1>Your life in weeks.</h1>
        <p className="subtle">
          Reflective visualization only. Not medical or predictive advice.
        </p>
      </header>

      {step === 'input' && (
        <section className="panel" data-testid="onboarding-form">
          <div className="field">
            <label htmlFor="birthDate">Birth date</label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              max={today}
              data-testid="birth-date-input"
            />
            {!isBirthDateValid && birthDate.length > 0 && (
              <p className="error">Birth date must be in the past.</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="lifeExpectancy">Life expectancy (years)</label>
            <input
              id="lifeExpectancy"
              type="range"
              min={LIFE_EXPECTANCY_MIN}
              max={LIFE_EXPECTANCY_MAX}
              value={lifeExpectancyYears}
              onChange={(event) =>
                setLifeExpectancyYears(Number.parseInt(event.target.value, 10))
              }
              data-testid="life-expectancy-slider"
            />
            <input
              type="number"
              min={LIFE_EXPECTANCY_MIN}
              max={LIFE_EXPECTANCY_MAX}
              value={lifeExpectancyYears}
              onChange={(event) =>
                setLifeExpectancyYears(
                  Math.max(
                    LIFE_EXPECTANCY_MIN,
                    Math.min(
                      LIFE_EXPECTANCY_MAX,
                      Number.parseInt(event.target.value || '0', 10),
                    ),
                  ),
                )
              }
              data-testid="life-expectancy-input"
            />
          </div>

          <fieldset className="field">
            <legend>Categories</legend>
            <div className="category-head">
              <span>Name</span>
              <span>Past %</span>
              <span>Future %</span>
              <span>Color</span>
            </div>
            {categories.map((category) => (
              <div className="category-row" key={category.id}>
                <input
                  type="text"
                  value={category.name}
                  onChange={(event) =>
                    updateCategory(category.id, { name: event.target.value })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={category.pastPercent}
                  onChange={(event) =>
                    updateCategory(category.id, {
                      pastPercent: Number.parseInt(event.target.value || '0', 10),
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={category.futurePercent}
                  onChange={(event) =>
                    updateCategory(category.id, {
                      futurePercent: Number.parseInt(event.target.value || '0', 10),
                    })
                  }
                />
                <input
                  type="color"
                  value={category.color}
                  onChange={(event) =>
                    updateCategory(category.id, { color: event.target.value })
                  }
                />
              </div>
            ))}
            <p className="subtle">
              Past total: <strong>{pastTotal}%</strong> | Future total:{' '}
              <strong>{futureTotal}%</strong>
            </p>
            {!areCategoryTotalsValid && (
              <p className="error">
                Past and future category totals must each equal 100.
              </p>
            )}
            {categoryError && <p className="error">{categoryError}</p>}
          </fieldset>

          <div className="field">
            <label htmlFor="colorScheme">Color scheme</label>
            <select
              id="colorScheme"
              value={colorScheme}
              onChange={(event) =>
                setColorScheme(event.target.value as typeof colorScheme)
              }
            >
              <option value="obsidian">Obsidian</option>
              <option value="paper">Paper</option>
              <option value="midnight">Midnight</option>
            </select>
          </div>

          <button
            type="button"
            className="primary"
            disabled={!isFormValid}
            onClick={() => {
              setCategoryError(null)
              if (!isFormValid) {
                setCategoryError('Please fix form errors before continuing.')
                return
              }
              setStep('visualization')
            }}
            data-testid="render-grid-button"
          >
            Visualize my life
          </button>
        </section>
      )}

      {step === 'visualization' && metrics && layout && (
        <section className="visualization" data-testid="visualization-view">
          <div className="toolbar">
            <button type="button" onClick={() => setStep('input')}>
              Edit inputs
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleExportPng}
              data-testid="export-png-button"
            >
              Export PNG
            </button>
            <button type="button" onClick={reset}>
              Reset all
            </button>
          </div>

          <div className="visualization-layout">
            <div className="canvas-wrap">
              <canvas
                ref={canvasRef}
                className="grid-canvas"
                onMouseMove={(event) =>
                  onCanvasMove(event.clientX, event.clientY)
                }
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={(event) => {
                  const touch = event.touches[0]
                  onCanvasMove(touch.clientX, touch.clientY)
                }}
                data-testid="memento-grid"
                aria-label={`Life grid with ${metrics.totalWeeks} weeks`}
              />
              {tooltip && hoveredRange && hoveredCategory && (
                <div
                  className="tooltip"
                  style={{ left: tooltip.x, top: tooltip.y }}
                  data-testid="week-tooltip"
                >
                  <p>Week #{tooltip.weekIndex + 1}</p>
                  <p>
                    {hoveredRange.start} to {hoveredRange.end}
                  </p>
                  <p>{hoveredCategory.name}</p>
                </div>
              )}
            </div>

            <aside className="panel insights" data-testid="insights-panel">
              <h2>Insights</h2>
              <p>Weeks lived: {metrics.weeksLived.toLocaleString()}</p>
              <p>Weeks remaining: {metrics.weeksRemaining.toLocaleString()}</p>
              <p>Life lived: {metrics.percentLived.toFixed(1)}%</p>
              {metrics.weeksRemaining === 0 && (
                <p className="subtle">You are beyond your selected expectancy.</p>
              )}
              <h3>Category settings</h3>
              <ul className="legend">
                {categories.map((category) => (
                  <li key={category.id}>
                    <span
                      className="swatch"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}: {category.pastPercent}% past /{' '}
                    {category.futurePercent}% future
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
