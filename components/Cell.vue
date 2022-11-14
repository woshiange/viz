<template>
  <div
    class="grid-stack-item"
    v-bind="gridStackAttributes"
  >
    <div class="grid-stack-item-content">
      <iframe ref="iframe" scrolling="yes" style="position: relative; height: 100%; width: 100%; background-color:white;"></iframe>
      <div v-if="edit" id="transp">
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    cell: {
      type: Object,
      default: () => ({})
    },
    edit: Boolean
  },
  computed: {
    gridStackAttributes() {
      return {
        id: this.cell.id,
        "gs-id": this.cell.id,
        "gs-x": this.cell.layout.x,
        "gs-y": this.cell.layout.y,
        "gs-w": this.cell.layout.width,
        "gs-h": this.cell.layout.height
      }
    }
  },
  mounted() {
    const iframeEl = this.$refs.iframe
    const myIframe = iframeEl.contentWindow.document
    myIframe.write(this.cell.cellData.documentElement.outerHTML)
    myIframe.close()
  }
}
</script>

<style>
.grid-stack-item {
  margin: 10px;
}
.grid-stack-item-content {
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
#transp {
    position:absolute;
    left:0;
    top:0;
    background: rgba(255,255,255,.5);
    width:100%;
    height:100%;
}
</style>
