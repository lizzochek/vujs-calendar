<script setup>
import { computed, ref, onBeforeMount } from "vue"
import { useStore } from "vuex"
import { CalendarMath } from "vue-simple-calendar"
import Modal from "./components/Modal.vue"
import CalendarWeekView from "./components/CalendarWeekView.vue"
import CalendarDayView from "./components/CalendarDayView.vue"
import CalendarMonthView from "./components/CalendarMonthView.vue"
import { useCalendarGridState } from "./composables/useCalendarGridState"
import {
  DEFAULT_EVENT_COLOR,
  GRID_START_MINUTES,
  PX_PER_MINUTE,
  SLOT_MINUTES,
} from "./constants/calendarGrid"
import "vue-simple-calendar/dist/vue-simple-calendar.css"
import "vue-simple-calendar/dist/css/default.css"
import "./assets/tailwind.css"
import { isAllDayEvent } from "./utils/calendarHelpers"
import { dayFromWeekOrDayGridPoint, roundToStepMinutes } from "./utils/dragDropHelpers"
import { calendarItemStyleString } from "./utils/eventStyles"
import { monthViewSameTimeColumnStyle, sameTimeColumnMeta } from "./utils/monthViewSameTimeColumns"
import { validateEventForSave } from "./utils/eventValidation"

const store = useStore()

const showDate = ref(new Date())
const activeView = ref("month")

onBeforeMount(() => {
  store.dispatch("initialiseStore")
})

const sortedCalendarItems = computed(() => store.getters.sortedCalendarItems)

const monthViewStartingDayOfWeek = 0

const itemsForCalendarView = computed(() => {
  const list = sortedCalendarItems.value
  const colMeta = sameTimeColumnMeta(list, monthViewStartingDayOfWeek)
  return list.map((item) => {
    let style = calendarItemStyleString(item)
    const extraClasses = []
    if (colMeta.has(item.id)) {
      const { col, n, dayOffset } = colMeta.get(item.id)
      style = `${style}; ${monthViewSameTimeColumnStyle(dayOffset, col, n)}`
      extraClasses.push("month-same-time-column")
    }
    return {
      ...item,
      style,
      classes: [...(item.classes || []), ...extraClasses],
    }
  })
})

const nowTick = ref(new Date())

const {
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
} = useCalendarGridState({
  showDate,
  activeView,
  sortedCalendarItems,
  nowTick,
})

function toCurrentPeriod(date) {
  showDate.value = new Date(date)
}

function setView(view) {
  if (activeView.value === view) return
  activeView.value = view
  closeModal()
}

const currentPeriodLabel = computed(() => {
  if (activeView.value === "week") return weekPeriodLabel.value
  if (activeView.value === "day") {
    return showDate.value.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return showDate.value.toLocaleDateString(undefined, { month: "long", year: "numeric" })
})

function movePeriod(delta) {
  if (activeView.value === "day") {
    toCurrentPeriod(CalendarMath.addDays(showDate.value, delta))
    return
  }
  toCurrentPeriod(CalendarMath.incrementPeriod(showDate.value, activeView.value, delta))
}

function handleItemDrop(calendarItem, date) {
  if (!calendarItem || !date) return
  const id = calendarItem.id ?? calendarItem.originalItem?.id
  const oldStart =
    calendarItem.startDate instanceof Date
      ? calendarItem.startDate
      : new Date(calendarItem.startDate)
  const oldEnd = calendarItem.endDate
    ? calendarItem.endDate instanceof Date
      ? calendarItem.endDate
      : new Date(calendarItem.endDate)
    : null

  const newStart = new Date(date)
  newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), 0)
  let newEnd = null
  if (oldEnd) {
    const diffMs = oldEnd - oldStart
    newEnd = new Date(newStart.getTime() + diffMs)
  }

  const idx = store.state.calendarItems.findIndex((item) => item.id === id)
  if (idx === -1) return
  const updated = { ...store.state.calendarItems[idx], startDate: newStart }
  if (newEnd) updated.endDate = newEnd
  else delete updated.endDate
  store.dispatch("replaceCalendarItem", { index: idx, item: updated })
}

function onWeekDayDragStart(e, item) {
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", String(item.id))
}

function onHourGridDrop(e, dayHint) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer.getData("text/plain")
  if (!id) return
  const idx = store.state.calendarItems.findIndex((x) => String(x.id) === id)
  if (idx === -1) return
  const stored = store.state.calendarItems[idx]
  const grid = e.target.closest(".hour-grid")
  if (!grid) return
  const day =
    dayFromWeekOrDayGridPoint(e) || (dayHint instanceof Date ? dayHint : new Date(dayHint))
  if (!day || Number.isNaN(day.getTime())) return
  const rect = grid.getBoundingClientRect()
  const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
  let minutes = GRID_START_MINUTES + y / PX_PER_MINUTE
  minutes = roundToStepMinutes(minutes, 5)
  const norm = CalendarMath.normalizeItem(stored)
  const durationMs = norm.endDate.getTime() - norm.startDate.getTime()
  const dayOnly = CalendarMath.dateOnly(day)
  const newStart = new Date(dayOnly)
  newStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  const newEnd = new Date(newStart.getTime() + durationMs)
  store.dispatch("replaceCalendarItem", {
    index: idx,
    item: { ...stored, startDate: newStart, endDate: newEnd },
  })
}

function onAllDayRowDrop(e, dayHint) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer.getData("text/plain")
  if (!id) return
  const idx = store.state.calendarItems.findIndex((x) => String(x.id) === id)
  if (idx === -1) return
  const stored = store.state.calendarItems[idx]
  const day =
    dayFromWeekOrDayGridPoint(e) ||
    (dayHint instanceof Date ? dayHint : dayHint != null ? new Date(dayHint) : null)
  if (!day || Number.isNaN(day.getTime())) return
  const norm = CalendarMath.normalizeItem(stored)
  const durationMs = norm.endDate.getTime() - norm.startDate.getTime()
  const target = CalendarMath.dateOnly(day)
  target.setHours(0, 0, 0, 0)
  if (isAllDayEvent(stored)) {
    const newStart = new Date(target)
    const newEnd = new Date(newStart.getTime() + durationMs)
    store.dispatch("replaceCalendarItem", {
      index: idx,
      item: { ...stored, startDate: newStart, endDate: newEnd },
    })
  } else {
    const newStart = new Date(target)
    const newEnd = CalendarMath.addDays(newStart, 1)
    newEnd.setHours(0, 0, 0, 0)
    store.dispatch("replaceCalendarItem", {
      index: idx,
      item: { ...stored, startDate: newStart, endDate: newEnd },
    })
  }
}

const showModal = ref(false)
const selectedEvent = ref(null)
const modalPosition = ref({ top: 0, left: 0 })
const saveError = ref("")

function openEvent(date, item, e) {
  saveError.value = ""
  const raw = item?.originalItem ? { ...item.originalItem } : { ...item }
  selectedEvent.value = raw
  if (!selectedEvent.value.startDate)
    selectedEvent.value.startDate = date instanceof Date ? date : new Date(date)
  if (!selectedEvent.value.endDate) selectedEvent.value.endDate = selectedEvent.value.startDate
  if (!selectedEvent.value.color) selectedEvent.value.color = DEFAULT_EVENT_COLOR

  if (e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect()
    const modalWidth = 300
    const viewportWidth = window.innerWidth
    const top = rect.bottom + 10 + window.scrollY

    let left = rect.left + window.scrollX + 10

    if (left + modalWidth > viewportWidth) {
      left = rect.right - modalWidth - window.scrollX - 10
    }

    if (left < 0) {
      left = 0
    }

    modalPosition.value = {
      top: top,
      left: left,
    }
  }

  showModal.value = true
}

function openWeekSlot(day, slotIndex, e) {
  const slotStartMinutes = GRID_START_MINUTES + slotIndex * SLOT_MINUTES
  const start = new Date(day)
  start.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0)
  const end = new Date(start.getTime() + SLOT_MINUTES * 60000)
  selectedEvent.value = {
    id: `new-${Date.now()}`,
    title: "Event name",
    startDate: start,
    endDate: end,
    description: "",
    color: DEFAULT_EVENT_COLOR,
  }
  openEvent(start, selectedEvent.value, e)
}

function openDaySlot(slotIndex, e) {
  openWeekSlot(showDate.value, slotIndex, e)
}

function openMonthNewEvent(day, e) {
  if (e?.target?.closest?.(".month-event, .cv-item")) return
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const draft = {
    id: `new-${Date.now()}`,
    title: "Event name",
    startDate: start,
    endDate: end,
    description: "",
    color: DEFAULT_EVENT_COLOR,
  }
  openEvent(start, draft, e)
}

function onCalendarViewClickDate(date, _items, e) {
  openMonthNewEvent(date, e)
}

function closeModal() {
  saveError.value = ""
  showModal.value = false
  selectedEvent.value = null
}

function saveEvent() {
  const check = validateEventForSave(selectedEvent.value)
  if (!check.ok) {
    saveError.value = check.message
    return
  }
  saveError.value = ""

  const idx = store.state.calendarItems.findIndex((e) => e.id === selectedEvent.value.id)

  const title = (selectedEvent.value.title ?? "").trim()

  if (idx !== -1) {
    store.dispatch("replaceCalendarItem", {
      index: idx,
      item: {
        id: selectedEvent.value.id,
        startDate: selectedEvent.value.startDate,
        endDate: selectedEvent.value.endDate,
        title,
        description:
          selectedEvent.value.description || selectedEvent.value.originalItem?.description,
        color: selectedEvent.value.color || DEFAULT_EVENT_COLOR,
      },
    })
  } else {
    store.dispatch("pushCalendarItem", {
      id: `e${store.state.calendarItems.length + 1}`,
      startDate: selectedEvent.value.startDate,
      endDate: selectedEvent.value.endDate,
      title,
      description: selectedEvent.value.description,
      color: selectedEvent.value.color || DEFAULT_EVENT_COLOR,
    })
  }
  closeModal()
}

function deleteEvent() {
  const idx = store.state.calendarItems.findIndex((e) => e.id === selectedEvent.value.id)

  if (idx !== -1) {
    store.dispatch("removeCalendarItem", idx)
  }
  closeModal()
}
</script>

<template>
  <Modal
    :showModal="showModal"
    :selectedEvent="selectedEvent || { title: '', startDate: '' }"
    :modalPosition="modalPosition"
    :save-error="saveError"
    @saveEvent="saveEvent"
    @closeModal="closeModal"
    @deleteEvent="deleteEvent"
  />
  <div class="calendar-shell mt-4">
    <div class="toolbar-top">
      <h2 class="title">Calendar View</h2>
      <div class="view-switch">
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'month' }"
          @click="setView('month')"
        >
          Month
        </button>
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'week' }"
          @click="setView('week')"
        >
          Week
        </button>
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'day' }"
          @click="setView('day')"
        >
          Day
        </button>
      </div>
    </div>

    <div class="toolbar-nav">
      <div class="left-buttons">
        <button class="calendar-btn" @click="toCurrentPeriod(CalendarMath.today())">Today</button>
        <button class="calendar-btn" @click="movePeriod(-1)">Back</button>
        <button class="calendar-btn" @click="movePeriod(1)">Next</button>
      </div>
      <div class="period-title">{{ currentPeriodLabel }}</div>
      <div class="spacer"></div>
    </div>

    <CalendarWeekView
      v-if="activeView === 'week'"
      :week-columns="weekColumns"
      :week-days="weekDays"
      :week-all-day-spans="weekAllDaySpans"
      :all-day-row-height="allDayRowHeight"
      :time-labels="timeLabels"
      :current-time-slot-index="currentTimeSlotIndex"
      :show-current-time-line="showCurrentTimeLine"
      :current-time-line-top="currentTimeLineTop"
      :is-today="isToday"
      @open-week-slot="openWeekSlot"
      @open-event="openEvent"
      @week-drag-start="onWeekDayDragStart"
      @hour-grid-drop="onHourGridDrop"
      @all-day-row-drop="onAllDayRowDrop"
    />

    <CalendarDayView
      v-else-if="activeView === 'day'"
      :day-column="dayColumn"
      :day-view-header-label="dayViewHeaderLabel"
      :time-labels="timeLabels"
      :current-time-slot-index="currentTimeSlotIndex"
      :show-current-time-line="showCurrentTimeLine"
      :current-time-line-top="currentTimeLineTop"
      :is-today="isToday"
      @open-day-slot="openDaySlot"
      @open-event="openEvent"
      @week-drag-start="onWeekDayDragStart"
      @hour-grid-drop="onHourGridDrop"
      @all-day-row-drop="onAllDayRowDrop"
    />

    <CalendarMonthView
      v-else
      :show-date="showDate"
      :items="itemsForCalendarView"
      :display-period-uom="activeView"
      :starting-day-of-week="monthViewStartingDayOfWeek"
      @drop-on-date="handleItemDrop"
      @click-item="(item, e) => openEvent(showDate, item, e)"
      @click-date="onCalendarViewClickDate"
    />
    <div class="spacer"></div>
  </div>
</template>
