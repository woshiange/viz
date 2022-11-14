<template>
  <iframe ref="iframe" scrolling="yes" style="position: relative; height: 100%; width: 100%; background-color:white;"></iframe>
</template>
<script>
export default {
  props: {
    dom: HTMLDocument
  },
  methods: {
    update() {
      const myIframe = this.iframeEl.contentWindow.document
      myIframe.write(new XMLSerializer().serializeToString(this.dom))
      myIframe.close()
    }
  },
  mounted() {
    this.iframeEl = this.$refs.iframe
    this.update()
  }
}
</script>
