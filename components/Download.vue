<template>
  <v-btn
    @click="download()"
    small
    color="grey lighten-5"
    elevation="0"
    class="blue--text"
  >
    Download
  </v-btn>
</template>

<script>
import { createTemplate } from '@/utils.js'
export default {
  props: {
    cells: {
      type: Array,
      default: []
    },
    trash: {
      type: Array,
      default: []
    },
    fileContent: {
      type: String,
      default: ''
    }
  },
  methods: {
    download () {
      const link = document.createElement('a')
      link.target = '_blank'
      link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(createTemplate(this.cells, this.grid.engine.nodes, this.fileContent))
      link.download = 'malamine.html'
      link.click()
    }
  },
  computed: {
    grid() {
      return window.grid
    }
  }
}
</script>
