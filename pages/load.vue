<template>
</template>

<script>
export default {
  methods: {
    addEventSetLocalStorage () {
      window.addEventListener('message', function(event) {
        if (!(typeof event.data == 'object' && event.data.call=='sendData')) {
          return
        }
        localStorage.setItem('notebookHtml', event.data.notebookHtml)
        localStorage.setItem('cells', JSON.stringify(event.data.cells))
        parent.postMessage("localStorageReady", "*")
      }, false)
    },
    sendEditReady () {
      parent.postMessage("editReady", "*")
    },
  },
  mounted() {
    this.sendEditReady()
    this.addEventSetLocalStorage()
  }
}
</script>

