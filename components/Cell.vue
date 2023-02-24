<template>
  <v-hover v-slot="{ hover }">
    <div
      v-bind="gridStackAttributes"
    >
        <div
          v-if="hover"
          class="trash-tooltip"
        >
        <v-tooltip left>
          <template v-slot:activator="{ on, attrs }">
            <v-icon
              large
              color="grey darken-2"
              @click="deleteCell"
              v-bind="attrs"
              v-on="on"
            >
              mdi-delete
            </v-icon>
          </template>
          <span>Delete</span>
        </v-tooltip>


        </div>
        <div
          class="grid-stack-item-content"
        >
            <iframe ref="iframe" scrolling="yes" style="height: 100%; width: 100%; background-color:white;" class="iframe-cell"></iframe>
          <div v-if="edit" class="cell-mask"></div>
        </div>
    </div>
  </v-hover>
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
  methods: {
    deleteCell () {
      this.$emit('delete-cell', this.cell)
    }
  },
  mounted() {
    const iframeEl = this.$refs.iframe
    const myIframe = iframeEl.contentWindow.document
    myIframe.write(this.cell.iframeContent.documentElement.outerHTML)
    myIframe.close()
  }
}
</script>

<style scoped>
.grid-stack-item-content {
  border-radius: 10px;
  padding: 3px 3px 3px 3px;
  box-shadow: 0px 1px 3px rgb(0 0 0 / 13%);
}
.trash-tooltip {
  position: absolute;
  background-color: white;
  right: 35px;
  top: -10px;
  z-index: 1;
  border: 3px solid grey;
}
.iframe-cell {
  border:0
}
.cell-mask {
  position:absolute;
  left:0;
  top:0;
  background: rgba(255,255,255,.1);
  width:100%;
  height:100%;
  cursor: move;
}
</style>
