/**
 * SVG path geometry for project thumbnails. Every path is drawn inside a
 * `0 0 320 200` viewBox. Lifted from design/Projects.dc.html.
 */
const W = 320
const H = 200

export function linePath(values: number[], pad: number): string {
  if (values.length < 2) throw new Error(`linePath needs at least 2 values, got ${values.length}`)
  let n = values.length
  let max = Math.max(...values)
  let min = Math.min(...values)
  let span = max - min || 1
  let d = ''
  for (let i = 0; i < n; i++) {
    let x = pad + (i / (n - 1)) * (W - pad * 2)
    let y = H - pad - ((values[i]! - min) / span) * (H - pad * 2)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
  }
  return d.trim()
}

export function areaPath(values: number[], pad: number): string {
  if (values.length < 2) throw new Error(`areaPath needs at least 2 values, got ${values.length}`)
  return `${linePath(values, pad)} L${W - pad} ${H - pad} L${pad} ${H - pad} Z`
}

export function barsPath(values: number[], pad: number, gap: number): string {
  if (values.length < 1) throw new Error(`barsPath needs at least 1 value, got ${values.length}`)
  let n = values.length
  let max = Math.max(...values)
  if (max <= 0) throw new Error(`barsPath needs a non-zero maximum`)
  let barWidth = (W - pad * 2 - gap * (n - 1)) / n
  let d = ''
  for (let i = 0; i < n; i++) {
    let x = pad + i * (barWidth + gap)
    let barHeight = (values[i]! / max) * (H - pad * 2)
    let y = H - pad - barHeight
    d +=
      'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
      ' h' + barWidth.toFixed(1) +
      ' v' + barHeight.toFixed(1) +
      ' h-' + barWidth.toFixed(1) + ' Z '
  }
  return d.trim()
}

export function cellsPath(
  columns: number,
  rows: number,
  pad: number,
  only: number[] | null,
): string {
  let cellWidth = (W - pad * 2) / columns
  let cellHeight = (H - pad * 2) / rows
  let size = Math.min(cellWidth, cellHeight) - 5
  let d = ''
  for (let i = 0; i < columns * rows; i++) {
    if (only && !only.includes(i)) continue
    let x = pad + (i % columns) * cellWidth
    let y = pad + Math.floor(i / columns) * cellHeight
    d +=
      'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
      ' h' + size.toFixed(1) +
      ' v' + size.toFixed(1) +
      ' h-' + size.toFixed(1) + ' Z '
  }
  return d.trim()
}

/** End marker for the line motif — computed, never hard-coded. */
export function lastPoint(values: number[], pad: number): { x: string; y: string } {
  if (values.length < 1) throw new Error(`lastPoint needs at least 1 value, got ${values.length}`)
  let max = Math.max(...values)
  let min = Math.min(...values)
  let span = max - min || 1
  let last = values[values.length - 1]!
  return {
    x: (W - pad).toFixed(1),
    y: (H - pad - ((last - min) / span) * (H - pad * 2)).toFixed(1),
  }
}
