import { DEFAULT_EVENT_COLOR } from "../constants/calendarGrid"

export function eventBorderColor(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || "").trim())
  if (!m) return "#2b75d8"
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const d = 0.88
  return `rgb(${Math.round(r * d)},${Math.round(g * d)},${Math.round(b * d)})`
}

export function eventBlockStyle(color) {
  const bg = color || DEFAULT_EVENT_COLOR
  return {
    backgroundColor: bg,
    borderColor: eventBorderColor(bg),
  }
}

export function calendarItemStyleString(item) {
  const bg = item.color || DEFAULT_EVENT_COLOR
  return `background-color: ${bg}; border-color: ${eventBorderColor(bg)};`
}

export function weekTimedEventLayoutStyle(event) {
  return {
    ...eventBlockStyle(event.color),
    top: `${event._top}px`,
    height: `${event._height}px`,
    left: `calc(${event._col} * (100% / ${event._cols}) + 2px)`,
    width: `calc((100% / ${event._cols}) - 4px)`,
    zIndex: 10 + event._col,
  }
}

export function weekSpanLayoutStyle(span) {
  return {
    ...eventBlockStyle(span.color),
    left: `calc(${(span._startIndex * 100) / 7}% + 2px)`,
    width: `calc(${((span._endIndex - span._startIndex + 1) * 100) / 7}% - 4px)`,
    top: `${span._lane * 26 + 4}px`,
  }
}
