<script setup>
import { ref } from "vue"
import { CalendarView, CalendarViewHeader } from "vue-simple-calendar"
// import 'vue-simple-calendar/dist/style.css'
// import 'vue-simple-calendar/dist/css/default.css'
// import 'vue-simple-calendar/dist/css/holidays-us.css'

const showDate = ref(new Date())

function setShowDate(date) {
  showDate.value = date
}
</script>

<template>
  <div id="app">
    <h1>My Calendar</h1>
    <!-- <CalendarView
      @input="setShowDate"
      :show-date="showDate"
      class="theme-default holiday-us-traditional holiday-us-official"
    >
      <template #header>
        <CalendarViewHeader @input="setShowDate" />
      </template>
    </CalendarView> -->
  </div>
</template>

<style scoped></style>
