import { CalendarMath } from "vue-simple-calendar"
import { isAllDayEvent } from "./calendarHelpers"

const ITEM_TOP = "1.4em"

function isSingleDayTimedSegment(item) {
  if (isAllDayEvent(item)) return false
  const norm = CalendarMath.normalizeItem(item)
  const a = CalendarMath.dateOnly(norm.startDate)
  const b = CalendarMath.dateOnly(norm.endDate)
  return CalendarMath.dayDiff(a, b) < 1
}

export function sameTimeColumnMeta(items, startingDayOfWeek = 0) {
  const groups = new Map()
  for (const item of items) {
    if (!isSingleDayTimedSegment(item)) continue
    const norm = CalendarMath.normalizeItem(item)
    const day = CalendarMath.dateOnly(norm.startDate)
    const start = norm.startDate
    const key = `${day.getTime()}_${start.getHours() * 60 + start.getMinutes()}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }

  const colMap = new Map()
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const sorted = [...group].sort((a, b) => String(a.id).localeCompare(String(b.id)))
    const n = sorted.length
    const firstNorm = CalendarMath.normalizeItem(sorted[0])
    const day = CalendarMath.dateOnly(firstNorm.startDate)
    const weekStart = CalendarMath.beginningOfWeek(day, startingDayOfWeek)
    const dayOffset = CalendarMath.dayDiff(weekStart, day)
    if (dayOffset < 0 || dayOffset > 6) continue
    sorted.forEach((item, col) => {
      colMap.set(item.id, { col, n, dayOffset })
    })
  }
  return colMap
}

export function monthViewSameTimeColumnStyle(dayOffset, col, n) {
  if (n < 2 || col < 0 || col >= n) return ""
  const gapPx = 2
  const left = `calc(${dayOffset} * (100% / 7) + ${col} * (((100% / 7) - 0.05em) / ${n}) + ${col * gapPx}px)`
  const width = `calc((((100% / 7) - 0.05em) / ${n}) - ${gapPx * 2}px)`
  const top = `calc(${ITEM_TOP})`
  return `top: ${top}; left: ${left}; width: ${width}; margin-top: 30px;`
}
