<script setup>
import { ref } from "vue"
import { CalendarView } from "vue-simple-calendar"
import Modal from "./components/Modal.vue"
import "vue-simple-calendar/dist/vue-simple-calendar.css"
import "vue-simple-calendar/dist/css/default.css"
import "./assets/tailwind.css"

const showDate = ref(new Date())
const activeView = ref("month")

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()

function eventDate(y, m, d, h = 0, min = 0) {
  const dt = new Date(y, m, d, h, min)
  dt.setSeconds(0, 0)
  return dt
}

const calendarItems = ref([
  {
    id: "e1",
    startDate: eventDate(year, month, 4, 14, 0),
    endDate: eventDate(year, month, 4, 15, 30),
    title: "Morning Meeting",
  },
  {
    id: "e2",
    startDate: eventDate(year, month, 4, 14, 0),
    endDate: eventDate(year, month, 4, 15, 0),
    title: "Project Discussion",
  },
  {
    id: "e3",
    startDate: eventDate(year, month, 5, 8, 30),
    endDate: eventDate(year, month, 5, 9, 30),
    title: "Coffee with Client",
  },
  {
    id: "e4",
    startDate: eventDate(year, month, 14, 12, 15),
    endDate: eventDate(year, month, 14, 13, 0),
    title: "Lunch Break",
  },
  {
    id: "e5",
    startDate: eventDate(year, month, 20, 16, 0),
    endDate: eventDate(year, month, 20, 17, 30),
    title: "Afternoon Review",
  },
  {
    id: "e6",
    startDate: eventDate(year, month, 28, 10, 0),
    endDate: eventDate(year, month, 28, 10, 45),
    title: "Stand-up",
  },
  {
    id: "e7",
    startDate: eventDate(year, month, 29, 18, 0),
    endDate: eventDate(year, month, 29, 20, 0),
    title: "Team Dinner",
  },
])

function toCurrentPeriod(date) {
  showDate.value = new Date(date)
}

function setView(view) {
  if (view === "agenda") return
  activeView.value = view
}

function handleItemDrop(calendarItem, date, windowEvent) {
  if (calendarItem && date) {
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
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
    let newEnd = null
    if (oldEnd) {
      const diffMs = oldEnd - oldStart
      newEnd = new Date(newStart.getTime() + diffMs)
    }

    const idx = calendarItems.value.findIndex((item) => item.id === calendarItem.id)
    if (idx !== -1) {
      const updated = { ...calendarItems.value[idx], startDate: newStart }
      if (newEnd) updated.endDate = newEnd
      else delete updated.endDate
      calendarItems.value.splice(idx, 1, updated)
    }
  }
}

const showModal = ref(false)
const selectedEvent = ref(null)
const modalPosition = ref({ top: 0, left: 0 })

function openEvent(item, e) {
  selectedEvent.value = { ...item }

  // 📍 position near clicked element
  const rect = e.currentTarget.getBoundingClientRect()

  modalPosition.value = {
    top: rect.top + window.scrollY + rect.height + 10,
    left: rect.left + window.scrollX,
  }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedEvent.value = null
}

function saveEvent() {
  const idx = calendarItems.value.findIndex((e) => e.id === selectedEvent.value.id)

  if (idx !== -1) {
    calendarItems.value.splice(idx, 1, selectedEvent.value)
  }

  closeModal()
}
</script>

<template>
  <Modal
    :showModal="showModal"
    :selectedEvent="selectedEvent || { title: '', startDate: '' }"
    :modalPosition="modalPosition"
    @saveEvent="saveEvent"
    @closeModal="closeModal"
  />
  <div class="calendar-shell">
    <CalendarView
      :show-date="showDate"
      :items="calendarItems"
      :display-period-uom="activeView"
      :display-period-count="1"
      :enableDragDrop="true"
      @drop-on-date="handleItemDrop"
      @click-item="(item, e) => openEvent(item, e)"
      class="theme-default"
    >
      <template #header="{ headerProps }">
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
            <button class="calendar-btn">Agenda</button>
          </div>
        </div>

        <div class="toolbar-nav">
          <div class="left-buttons">
            <button class="calendar-btn" @click="toCurrentPeriod(headerProps.currentPeriod)">
              Today
            </button>
            <button class="calendar-btn" @click="toCurrentPeriod(headerProps.previousPeriod)">
              Back
            </button>
            <button class="calendar-btn" @click="toCurrentPeriod(headerProps.nextPeriod)">
              Next
            </button>
          </div>
          <div class="period-title">{{ headerProps.periodLabel }}</div>
          <div class="spacer"></div>
        </div>
      </template>
    </CalendarView>
    <div class="spacer"></div>
  </div>
</template>
