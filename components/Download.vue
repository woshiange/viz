<template>
  <v-btn
    @click="download()"
  >
    Download
  </v-btn>
</template>

<script>
export default {
  props: {
    cells: {
      type: Array,
      default: []
    }
  },
  data () {
    return {
      template: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>my title</title>
    <link rel="stylesheet" href="https://gridstackjs.com/node_modules/gridstack/dist/gridstack.min.css"/>
    <script src="https://gridstackjs.com/node_modules/gridstack/dist/gridstack-all.js"><\/script>
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
</style>
  </head>
  <body>
    <main id="app">
      <div id="dashboard" class="h-screen w-screen flex flex-col items-center bg-gray-100 p-10">
        <div class="grid-stack h-full w-full">
  
          <div
            v-for="cell in cellsGridstack"
            class="grid-stack-item"
            v-bind="cell"
          >
            <div class="grid-stack-item-content">
              <iframe ref="cells" scrolling="yes" style="position: relative; height: 100%; width: 100%; background-color:white;"></iframe>
            </div>
          </div>

        </div>
      </div>
    </main>
    <script type="module">
      import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.esm.browser.js";

      let app = new Vue({
        el: "#app",
        data: {
          grid: undefined,
          cells:
          // start variable to change
            [
              { id: 0, html: btoa(unescape(encodeURIComponent('<p>first cell</p>'))), "gs-id": 1, "gs-x": 1,  "gs-y": 2, "gs-w": 1, "gs-h": 3},
              { id: 0, html: btoa(unescape(encodeURIComponent('<p>second cell</p>'))), "gs-id": 1, "gs-x": 1,  "gs-y": 2, "gs-w": 2, "gs-h": 1}
          ]
          // end variable to change
        },
        computed: {
          cellsGridstack() {
            const result = []
            for (var i = 0; i < this.cells.length; i++) {
              const cell = this.cells[i]
              const { html, id, ...cellGridstack } = cell
              result.push(cellGridstack)
            }
            return result
          }
        },
        mounted: function () {
          this.grid = GridStack.init({
            acceptWidgets: true,
            float: true,
            cellHeight: '70px',
            minRow: 1
          })
          this.cells.forEach((cell, index) => {
            const iframeEl = this.$refs.cells[index]
            const iframe = iframeEl.contentWindow.document
            iframe.write(decodeURIComponent(window.atob(cell.html)))
            iframe.close()
          })

          this.grid.enableMove(false)
          this.grid.enableResize(false)
        }
      });
    <\/script>
  </body>
</html>
      `
    }
  },
  methods: {
    download () {
      const link = document.createElement('a')
      var cellsOutput = []
      for (const cell of this.cells) {
        const cellGridstack = this.grid.engine.nodes.find(node => node.id === cell.id)
        cellsOutput.push({
          id: cell.id,
          html: btoa(encodeURIComponent(cell.cellData.documentElement.outerHTML)),
          "gs-id": cell.id,
          "gs-x": cellGridstack.x,
          "gs-y": cellGridstack.y,
          "gs-w": cellGridstack.w,
          "gs-h": cellGridstack.h
        })
      }
      var output = this.template.split('// start variable to change')[0] + ' ' + JSON.stringify(cellsOutput) + ' ' + this.template.split('// end variable to change').at(-1)
      link.target = '_blank'
      link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(output)
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
