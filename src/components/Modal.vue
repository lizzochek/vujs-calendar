<template>
  <div
    v-if="showModal"
    class="fixed inset-0 flex items-start justify-center z-50"
    :style="{
      alignItems: modalPosition.top !== undefined ? 'flex-start' : 'center',
    }"
  >
    <div
      class="fixed inset-0 bg-black bg-opacity-20"
      style="z-index: 49"
      @click="$emit('closeModal')"
    ></div>
    <div
      class="relative bg-white w-[360px] rounded-2xl border border-gray-300 shadow-xl p-6"
      :style="{
        position: 'absolute',
        top: modalPosition.top !== undefined ? Math.round(modalPosition.top) + 'px' : '50%',
        left: modalPosition.left !== undefined ? Math.round(modalPosition.left) + 'px' : '50%',
        transform:
          modalPosition.top !== undefined && modalPosition.left !== undefined
            ? 'none'
            : 'translate(-50%, -50%)',
        zIndex: 50,
      }"
    >
      <div
        class="absolute -top-3 left-10 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-300"
      ></div>

      <button
        @click="$emit('closeModal')"
        class="absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>

      <input
        v-model="selectedEvent.title"
        class="w-full border-b border-gray-300 pb-2 mb-6 outline-none text-gray-700"
        placeholder="Event title"
      />

      <div class="flex items-center justify-between border-b border-gray-300 pb-3 mb-6">
        <input
          type="date"
          v-model="selectedEvent.startDate"
          class="outline-none w-full text-gray-600"
        />
        <span class="text-gray-400">📅</span>
      </div>

      <div class="flex items-center justify-between border-b border-gray-300 pb-3 mb-6">
        <input
          type="time"
          class="outline-none w-full text-gray-600"
          @change="
            (e) => {
              const [h, m] = e.target.value.split(':')
              const d = new Date(selectedEvent.startDate)
              d.setHours(h, m)
              selectedEvent.startDate = d
            }
          "
        />
        <span class="text-gray-400">🕒</span>
      </div>

      <textarea
        placeholder="take my PC with me"
        class="w-full border-b border-gray-300 pb-2 mb-8 outline-none text-gray-400 resize-none"
      />

      <div class="flex justify-between items-center">
        <button @click="$emit('closeModal')" class="text-red-500 text-sm tracking-wide">
          DISCARD
        </button>

        <button @click="$emit('saveEvent')" class="text-indigo-500 text-sm tracking-wide">
          EDIT
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
const props = defineProps({
  showModal: {
    type: Boolean,
    required: true,
  },
  selectedEvent: {
    type: Object,
    required: true,
  },
  modalPosition: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["closeModal", "saveEvent"])
</script>
