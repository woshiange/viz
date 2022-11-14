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
      // Remove the anchor links created by Jupyter Notebook
      var anchorLinks = this.dom.getElementsByClassName('anchor-link')
      for(var i = 0; i < anchorLinks.length; i++){
        anchorLinks[i].parentNode.removeChild(anchorLinks[i])
      }
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
