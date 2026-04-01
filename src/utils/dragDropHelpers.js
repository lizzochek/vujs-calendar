import { GRID_END_MINUTES, GRID_START_MINUTES } from "../constants/calendarGrid"

export function roundToStepMinutes(minutes, step) {
  const r = Math.round(minutes / step) * step
  return Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES - 1, r))
}

export function dayFromWeekOrDayGridPoint(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const col = el?.closest?.(".day-column")
  if (!col?.dataset?.dayTs) return null
  const ts = Number(col.dataset.dayTs)
  if (Number.isNaN(ts)) return null
  return new Date(ts)
}
