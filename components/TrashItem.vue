<template>
  <v-list-item
    class="mt-5"
    @click="restoreCell"
  >
    <div
      class="serbe"
    >
      <v-icon
        color="grey darken-2"
        @click="restoreCell"
      >
        mdi-arrow-down-right
      </v-icon>
    </div>
    <iframe ref="iframe" scrolling="yes" class="trash-item" style="height: 100%; width: 100%; background-color:white;"></iframe>
    <div class="trash-cell-mask"></div>
  </v-list-item>
</template>
<script>
export default {
  props: {
    cell: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    restoreCell () {
      this.$emit('restore-cell', this.cell)
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
.serbe {
  position: absolute;
  background-color: white;
  right: 20px;
  top: -10px;
  z-index: 1;
  border: 3px solid grey;
}
.trash-cell-mask {
    position:absolute;
    left:0;
    top:0;
    background: rgba(255,255,255,0);
    width:100%;
    height:100%;
}
.trash-item {
  border-radius: 10px;
  border: 2px;
  border-style: solid;
}
</style>
