import { computed } from "vue"
import { CalendarMath } from "vue-simple-calendar"
import {
  CURRENT_TIME_LINE_OFFSET_PX,
  GRID_END_MINUTES,
  GRID_START_MINUTES,
  PX_PER_MINUTE,
  SLOT_HEIGHT,
  SLOT_MINUTES,
} from "../constants/calendarGrid"
import {
  beginningOfWeekDate,
  isAllDayEvent,
  overlaps,
} from "../utils/calendarHelpers"

export function useCalendarGridState({ showDate, activeView, sortedCalendarItems, nowTick }) {
  const timeLabels = computed(() =>
    Array.from({ length: (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES }, (_, i) => {
      const total = GRID_START_MINUTES + i * SLOT_MINUTES
      const h = Math.floor(total / 60)
      const m = total % 60
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }),
  )

  const weekStart = computed(() => beginningOfWeekDate(showDate.value))
  const weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => CalendarMath.addDays(weekStart.value, i)),
  )

  const weekPeriodLabel = computed(() => {
    const start = weekDays.value[0]
    const end = weekDays.value[6]
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`
  })

  const weekAllDaySpans = computed(() => {
    const spans = []
    sortedCalendarItems.value.forEach((item) => {
      if (!isAllDayEvent(item)) return
      const normalized = CalendarMath.normalizeItem(item)
      const startDateOnly = CalendarMath.dateOnly(normalized.startDate)
      const endDateOnly = CalendarMath.dateOnly(normalized.endDate)
      const spanDays = Math.max(1, CalendarMath.dayDiff(startDateOnly, endDateOnly) + 1)
      const rawStartIndex = CalendarMath.dayDiff(weekStart.value, startDateOnly)
      const rawEndIndex = rawStartIndex + spanDays - 1
      const startIndex = Math.max(0, rawStartIndex)
      const endIndex = Math.min(6, rawEndIndex)
      if (endIndex < 0 || startIndex > 6 || startIndex > endIndex) return
      spans.push({
        ...item,
        _startIndex: startIndex,
        _endIndex: endIndex,
        _lane: 0,
      })
    })

    spans.sort((a, b) => a._startIndex - b._startIndex || a._endIndex - b._endIndex)
    const laneEnds = []
    spans.forEach((span) => {
      let lane = 0
      while (laneEnds[lane] !== undefined && laneEnds[lane] >= span._startIndex) lane++
      span._lane = lane
      laneEnds[lane] = span._endIndex
    })

    return spans
  })

  const allDayRowHeight = computed(() => {
    if (weekAllDaySpans.value.length === 0) return SLOT_HEIGHT
    const maxLane = Math.max(...weekAllDaySpans.value.map((s) => s._lane))
    return Math.max(SLOT_HEIGHT, (maxLane + 1) * 26 + 6)
  })

  function isToday(day) {
    return CalendarMath.isSameDate(day, nowTick.value)
  }

  const weekColumns = computed(() => {
    return weekDays.value.map((day) => {
      const dayStart = CalendarMath.dateOnly(day)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      const dayStartMs = dayStart.getTime()
      const dayEndMs = dayEnd.getTime()

      const allDayEvents = []
      const timedEvents = []

      sortedCalendarItems.value.forEach((item) => {
        const normalized = CalendarMath.normalizeItem(item)
        const eventStart = normalized.startDate.getTime()
        const eventEnd = normalized.endDate.getTime()
        if (!overlaps(eventStart, eventEnd, dayStartMs, dayEndMs + 1)) return

        if (isAllDayEvent(item)) {
          return
        }

        const localStart = new Date(Math.max(eventStart, dayStartMs))
        const localEnd = new Date(Math.min(eventEnd, dayEndMs))
        const startMinutesFromMidnight =
          localStart.getHours() * 60 +
          localStart.getMinutes() +
          localStart.getSeconds() / 60 +
          localStart.getMilliseconds() / 60000
        const endMinutesFromMidnight =
          localEnd.getHours() * 60 +
          localEnd.getMinutes() +
          localEnd.getSeconds() / 60 +
          localEnd.getMilliseconds() / 60000
        const durationMinutes = Math.max(endMinutesFromMidnight - startMinutesFromMidnight, 1 / 60)
        const visStart = Math.max(startMinutesFromMidnight, GRID_START_MINUTES)
        const visEnd = Math.min(endMinutesFromMidnight, GRID_END_MINUTES)
        if (visEnd <= GRID_START_MINUTES || visStart >= GRID_END_MINUTES) return

        const top = (visStart - GRID_START_MINUTES) * PX_PER_MINUTE
        const height = Math.max((visEnd - visStart) * PX_PER_MINUTE, 4)
        timedEvents.push({
          ...item,
          _top: top,
          _height: height,
          _isShort: durationMinutes <= 45,
          _startMinutes: startMinutesFromMidnight,
          _endMinutes: endMinutesFromMidnight,
        })
      })

      timedEvents.sort((a, b) => a._startMinutes - b._startMinutes || b._endMinutes - a._endMinutes)

      const assignGroupColumns = (group) => {
        const activeCols = []
        let maxCols = 1
        group.forEach((event) => {
          for (let i = activeCols.length - 1; i >= 0; i--) {
            if (activeCols[i].endMinutes <= event._startMinutes) activeCols.splice(i, 1)
          }
          const used = new Set(activeCols.map((a) => a.col))
          let col = 0
          while (used.has(col)) col++
          event._col = col
          activeCols.push({ col, endMinutes: event._endMinutes })
          maxCols = Math.max(maxCols, activeCols.length)
        })
        group.forEach((event) => {
          event._cols = maxCols
        })
      }

      let group = []
      let groupEnd = -1
      timedEvents.forEach((event) => {
        if (group.length === 0 || event._startMinutes < groupEnd) {
          group.push(event)
          groupEnd = Math.max(groupEnd, event._endMinutes)
        } else {
          assignGroupColumns(group)
          group = [event]
          groupEnd = event._endMinutes
        }
      })
      if (group.length > 0) assignGroupColumns(group)

      return { day, allDayEvents, timedEvents }
    })
  })

  const dayColumn = computed(() => {
    const day = CalendarMath.dateOnly(showDate.value)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)
    const dayStartMs = day.getTime()
    const dayEndMs = dayEnd.getTime()
    const allDayEvents = []
    const timedEvents = []

    sortedCalendarItems.value.forEach((item) => {
      const normalized = CalendarMath.normalizeItem(item)
      const eventStart = normalized.startDate.getTime()
      const eventEnd = normalized.endDate.getTime()
      if (!overlaps(eventStart, eventEnd, dayStartMs, dayEndMs + 1)) return

      if (isAllDayEvent(item)) {
        allDayEvents.push(item)
        return
      }

      const localStart = new Date(Math.max(eventStart, dayStartMs))
      const localEnd = new Date(Math.min(eventEnd, dayEndMs))
      const startMinutesFromMidnight =
        localStart.getHours() * 60 +
        localStart.getMinutes() +
        localStart.getSeconds() / 60 +
        localStart.getMilliseconds() / 60000
      const endMinutesFromMidnight =
        localEnd.getHours() * 60 +
        localEnd.getMinutes() +
        localEnd.getSeconds() / 60 +
        localEnd.getMilliseconds() / 60000
      const durationMinutes = Math.max(endMinutesFromMidnight - startMinutesFromMidnight, 1 / 60)
      const visStart = Math.max(startMinutesFromMidnight, GRID_START_MINUTES)
      const visEnd = Math.min(endMinutesFromMidnight, GRID_END_MINUTES)
      if (visEnd <= GRID_START_MINUTES || visStart >= GRID_END_MINUTES) return

      const top = (visStart - GRID_START_MINUTES) * PX_PER_MINUTE
      const height = Math.max((visEnd - visStart) * PX_PER_MINUTE, 4)
      timedEvents.push({
        ...item,
        _top: top,
        _height: height,
        _isShort: durationMinutes <= 45,
        _startMinutes: startMinutesFromMidnight,
        _endMinutes: endMinutesFromMidnight,
      })
    })

    timedEvents.sort((a, b) => a._startMinutes - b._startMinutes || b._endMinutes - a._endMinutes)
    const active = []
    let maxCols = 1
    timedEvents.forEach((event) => {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].endMinutes <= event._startMinutes) active.splice(i, 1)
      }
      const used = new Set(active.map((a) => a.col))
      let col = 0
      while (used.has(col)) col++
      event._col = col
      active.push({ col, endMinutes: event._endMinutes })
      maxCols = Math.max(maxCols, active.length)
    })
    timedEvents.forEach((event) => {
      event._cols = maxCols
    })

    return { day, allDayEvents, timedEvents }
  })

  const dayViewHeaderLabel = computed(() => {
    const d = dayColumn.value.day
    const wd = d.toLocaleDateString("en-US", { weekday: "short" })
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${wd} ${mm}/${dd}`
  })

  const showCurrentTimeLine = computed(() => {
    if (activeView.value !== "week" && activeView.value !== "day") return false
    const m =
      nowTick.value.getHours() * 60 +
      nowTick.value.getMinutes() +
      nowTick.value.getSeconds() / 60 +
      nowTick.value.getMilliseconds() / 60000
    return m >= GRID_START_MINUTES && m < GRID_END_MINUTES
  })

  const currentTimeLineTop = computed(() => {
    const nowDate = nowTick.value
    const minutes =
      nowDate.getHours() * 60 +
      nowDate.getMinutes() +
      nowDate.getSeconds() / 60 +
      nowDate.getMilliseconds() / 60000
    const headerOffset = activeView.value === "week" ? allDayRowHeight.value : SLOT_HEIGHT
    const m = Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, minutes))
    return headerOffset + (m - GRID_START_MINUTES) * PX_PER_MINUTE + CURRENT_TIME_LINE_OFFSET_PX
  })

  const currentTimeSlotIndex = computed(() => {
    const minutes = nowTick.value.getHours() * 60 + nowTick.value.getMinutes()
    if (minutes < GRID_START_MINUTES || minutes >= GRID_END_MINUTES) return -1
    return Math.floor((minutes - GRID_START_MINUTES) / SLOT_MINUTES)
  })

  return {
    timeLabels,
    weekDays,
    weekPeriodLabel,
    weekAllDaySpans,
    allDayRowHeight,
    weekColumns,
    dayColumn,
    dayViewHeaderLabel,
    showCurrentTimeLine,
    currentTimeLineTop,
    currentTimeSlotIndex,
    isToday,
  }
}
