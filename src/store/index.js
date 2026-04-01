import { createStore } from "vuex"
import { CalendarMath } from "vue-simple-calendar"
import { createEventDate, isAllDayEvent } from "../utils/calendarHelpers"
import { calendarPersistencePlugin, loadCalendarItems } from "../utils/calendarLocalStorage"

const seedDate = new Date()
const seedYear = seedDate.getFullYear()
const seedMonth = seedDate.getMonth()

const initialCalendarItems = [
  {
    id: "e1",
    startDate: createEventDate(seedYear, seedMonth, 4, 14, 0),
    endDate: createEventDate(seedYear, seedMonth, 4, 15, 30),
    title: "Morning Meeting",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#2f80ed",
  },
  {
    id: "e2",
    startDate: createEventDate(seedYear, seedMonth, 4, 14, 0),
    endDate: createEventDate(seedYear, seedMonth, 4, 15, 0),
    title: "Project Discussion",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#9b59b6",
  },
  {
    id: "e3",
    startDate: createEventDate(seedYear, seedMonth, 5, 8, 30),
    endDate: createEventDate(seedYear, seedMonth, 5, 9, 30),
    title: "Coffee with Client",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#27ae60",
  },
  {
    id: "e4",
    startDate: createEventDate(seedYear, seedMonth, 14, 12, 15),
    endDate: createEventDate(seedYear, seedMonth, 14, 13, 0),
    title: "Lunch Break",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#f39c12",
  },
  {
    id: "e5",
    startDate: createEventDate(seedYear, seedMonth, 20, 16, 0),
    endDate: createEventDate(seedYear, seedMonth, 20, 17, 30),
    title: "Afternoon Review",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#1abc9c",
  },
  {
    id: "e6",
    startDate: createEventDate(seedYear, seedMonth, 28, 10, 0),
    endDate: createEventDate(seedYear, seedMonth, 28, 10, 45),
    title: "Stand-up",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e74c3c",
  },
  {
    id: "e7",
    startDate: createEventDate(seedYear, seedMonth, 29, 18, 0),
    endDate: createEventDate(seedYear, seedMonth, 29, 20, 0),
    title: "Team Dinner",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e91e8c",
  },
  {
    id: "e8",
    startDate: createEventDate(seedYear, seedMonth, 1, 0, 0),
    endDate: createEventDate(seedYear, seedMonth, 2, 0, 0),
    title: "Day off",
    description: "No work today.",
    color: "#607d8b",
  },
]

export default createStore({
  state: {
    calendarItems: initialCalendarItems,
  },
  getters: {
    sortedCalendarItems(state) {
      return [...state.calendarItems].sort((a, b) => {
        const aAllDay = isAllDayEvent(a)
        const bAllDay = isAllDayEvent(b)
        if (aAllDay !== bAllDay) return aAllDay ? -1 : 1

        const aNorm = CalendarMath.normalizeItem(a)
        const bNorm = CalendarMath.normalizeItem(b)
        const aStart = aNorm.startDate.getTime()
        const bStart = bNorm.startDate.getTime()
        if (aStart !== bStart) return aStart - bStart
        return aNorm.endDate.getTime() - bNorm.endDate.getTime()
      })
    },
  },
  mutations: {
    initialiseStore() {
      const items = loadCalendarItems()
      if (items) {
        this.replaceState({ calendarItems: items })
      }
    },
    replaceCalendarItem(state, { index, item }) {
      state.calendarItems.splice(index, 1, item)
    },
    pushCalendarItem(state, item) {
      state.calendarItems.push(item)
    },
    removeCalendarItem(state, index) {
      state.calendarItems.splice(index, 1)
    },
  },
  actions: {
    replaceCalendarItem(context, { index, item }) {
      context.commit("replaceCalendarItem", { index, item })
    },
    pushCalendarItem(context, item) {
      context.commit("pushCalendarItem", item)
    },
    removeCalendarItem(context, index) {
      context.commit("removeCalendarItem", index)
    },
    initialiseStore(context) {
      context.commit("initialiseStore")
    },
  },
  plugins: [calendarPersistencePlugin()],
})
