function getElementByXpath(path, doc) {
  return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

function extractEcharts (echartEl) {
  const dom = new DOMParser().parseFromString(echartEl.outerHTML, 'text/html')
  var script = dom.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  dom.head.appendChild(script)
  const mainDiv = dom.querySelector('div[id]')
  const divId = mainDiv.getAttribute('id')
  mainDiv.setAttribute("style", "width:100%; height:100%;")
  const echartScript = getElementByXpath("//script[contains(text(),'function(echarts)')]", dom)
  const strToReplace = `chart_${divId}.setOption(option_${divId})`
  echartScript.text = echartScript.text.replace(
    strToReplace,
    `${strToReplace}
    window.onresize = function() {
      chart_${divId}.resize()
    }`
  )
  return dom
}

function extractPlotly (plotlyEl) {
  const domPlotly = new DOMParser().parseFromString(plotlyEl.outerHTML, 'text/html')
  var script = domPlotly.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  domPlotly.head.appendChild(script)
  const mainDiv = domPlotly.querySelector('div.plotly-graph-div')
  mainDiv.setAttribute("style", "width:100%; height:100%;")
  return domPlotly
}

function extractMarkdown (markdownEl) {
  markdownEl.querySelectorAll('.anchor-link').forEach(el => {
    el.remove()
  })
  return new DOMParser().parseFromString(markdownEl.outerHTML, 'text/html')
}

function extractDefault (defaultEl) {
  var script = defaultEl.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  defaultEl.head.appendChild(script)
  defaultEl.querySelectorAll('.jp-Cell-inputWrapper').forEach(el => {
    el.remove()
  })
  return defaultEl
}

class Cell {
  constructor(dom) {
    this.dom = dom
    this.echartsEl = getElementByXpath("//script[contains(text(),'function(echarts)')]/..", this.dom)
    this.markdownEl = getElementByXpath("//div[contains(@class, 'jp-MarkdownOutput')]", this.dom)
    this.plotlyEl = getElementByXpath("//div[contains(@class, 'plotly-graph-div')]/../../../..", this.dom)
  }

  get type() {
    var result = ''
    switch (true) {
      case this.echartsEl !== null:
        result = 'echarts'
        break
      case this.markdownEl !== null:
        result = 'markdown'
        break
      case this.plotlyEl !== null:
        result = 'plotly'
        break
      default:
        result = 'default'
        break
    }
    return result
  }

  get iframeContent() {
    var result = ''
    switch(this.type) {
      case 'echarts':
        result = extractEcharts(this.echartsEl)
        break
      case 'markdown':
        result = extractMarkdown(this.markdownEl)
        break
      case 'plotly':
        result = extractPlotly(this.plotlyEl)
        break
      default:
        result = extractDefault(this.dom)
        break
    }
    return result
  }

  get isTitle() {
    if(this.type !== 'markdown') {
      return false
    }
    let firstLine = this.dom.querySelector('.jp-MarkdownOutput > :first-child')
    return ['H1', 'H2'].includes(firstLine.nodeName)
  }
}

class Notebook {
  constructor(dom) {
    this.dom = dom
  }

  get cells() {
    const result = []
    const cellsDom = this.dom.querySelectorAll('.jp-Cell');
    for(var i = 0; i < cellsDom.length; i++) {
      var cellDom = new DOMParser().parseFromString(cellsDom[i].outerHTML, 'text/html')
      result.push(new Cell(cellDom))
    }
    return result
  }
}

function createTemplate(cells, nodesGridstack, notebookHtml) {
      var cellsOutput = []
      for (const cell of cells) {
        const cellGridstack = nodesGridstack.find(node => node.id === cell.id)
        cellsOutput.push({
          id: cell.id,
          html: '',
          "gs-id": cell.id,
          "gs-x": cellGridstack.x,
          "gs-y": cellGridstack.y,
          "gs-w": cellGridstack.w,
          "gs-h": cellGridstack.h
        })
      }
      return `
<!doctype html>
<html>

<head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@3.x/css/materialdesignicons.min.css" />
    <link rel="stylesheet" href="https://gridstackjs.com/node_modules/gridstack/dist/gridstack.min.css"/>
    <script src="https://gridstackjs.com/node_modules/gridstack/dist/gridstack-all.js"><\/script>
<style>
.trash-tooltip {
  position: absolute;
  background-color: white;
  right: 35px;
  top: -1px;
  z-index: 1;
  border: 3px solid grey;
}
.trash-restore {
  position: absolute;
  background-color: white;
  right: 20px;
  top: -10px;
  z-index: 1;
  border: 3px solid grey;
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
.trash-item {
  border-radius: 10px;
  border: 2px;
  border-style: solid;
}
.trash-cell-mask {
    position:absolute;
    left:0;
    top:0;
    background: rgba(255,255,255,0);
    width:100%;
    height:100%;
}
</style>
</head>

<body>
    <div id="app">
        <v-app>
    <v-system-bar
      app
      height="50"
      color="blue"
    >
      <div v-if="edit">
        <v-icon
          color="white"
        >
          mdi-pencil
        </v-icon>
        <span style="color:white; font-weight: bold;">
          You're editing this presentation.
        </span>
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-2 mr-1"
        >
          Cancel
        </v-btn>
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-1"
          @click="edit = !edit"
        >
          Save
        </v-btn>
      </div>
      <div v-else>
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-2 mr-1"
          @click="edit = !edit"
        >
          Edit
        </v-btn>
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-1"
        >
          Download
        </v-btn>
      </div>
    </v-system-bar>
    <v-app-bar
      v-if="edit && trash.length > 0"
      class="d-flex justify-end"
      app
      fixed
      flat
      clipped-right
    >
      <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            large
            color="grey darken-2"
            style="margin-right: 250px;"
            v-bind="attrs"
            v-on="on"
            @click="drawerTrash = !drawerTrash"
          >
            mdi-delete
          </v-icon>
        </template>
        <span v-if="drawerTrash">Close the trash</span>
        <span v-else>Open the trash</span>
      </v-tooltip>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawerTrash"
      :width="500"
      app
      clipped
      right
    >
      <v-list
        nav
        dense
      >
        <v-list-item-group
          active-class="deep-grey--text text--accent-4"
        >
  <v-list-item
    class="mt-5"
    v-for="trashItem in trash"
  >
    <div
      class="trash-restore"
    >
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            color="grey darken-2"
            v-bind="attrs"
            v-on="on"
            @click="restoreCell(trashItem)"
          >
            mdi-undo
          </v-icon>
        </template>
        <span>Restore</span>
      </v-tooltip>
    </div>
    <iframe scrolling="yes" class="trash-item" style="height: 100%; width: 100%; background-color:white;"></iframe>
    <div class="trash-cell-mask"></div>
  </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
            <v-main>
                <v-container>

      <div id="dashboard" class="h-screen w-screen flex flex-col items-center bg-gray-100 p-10">
        <section class="grid-stack h-full w-full">
          <div
            v-for="cell in cellsGridstack"
            class="grid-stack-item"
            v-bind="cell"
          >
            <div class="grid-stack-item-content">
                <v-hover v-slot="{ hover }">
                  <v-card
                    height="100%"
                    width="100%"
                  >
                     <div
                       v-if="hover && edit"
                       class="trash-tooltip"
                     >
                       <v-tooltip left>
                         <template v-slot:activator="{ on, attrs }">
                           <v-icon
                             large
                             color="grey darken-2"
                             v-bind="attrs"
                             v-on="on"
                             @click="deleteCell(cell)"
                           >
                             mdi-delete
                           </v-icon>
                         </template>
                         <span>Delete</span>
                       </v-tooltip>
                     </div>
                     <iframe ref="cells" scrolling="yes" style="height: 100%; width: 100%; background-color:white;"></iframe>
                     <div v-if="edit" class="cell-mask"></div>
                  </v-card>
                </v-hover>
            </div>
          </div>
        </section>
      </div>
                </div>
            </v-main>
        </v-app>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/vue@2.x/dist/vue.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.js"><\/script>
    <script>
function getElementByXpath(path, doc) {
  return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

function extractEcharts (echartEl) {
  const dom = new DOMParser().parseFromString(echartEl.outerHTML, 'text/html')
  var script = dom.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  dom.head.appendChild(script)
  const mainDiv = dom.querySelector('div[id]')
  const divId = mainDiv.getAttribute('id')
  mainDiv.setAttribute("style", "width:100%; height:100%;")
  const echartScript = getElementByXpath("//script[contains(text(),'function(echarts)')]", dom)
  const strToReplace = 'chart_' + divId + '.setOption(option_' + divId + '})'
  echartScript.text = echartScript.text.replace(
    strToReplace,
    strToReplace + ' window.onresize = function() { chart_' + divId + '.resize() }'
  )
  return dom
}

function extractPlotly (plotlyEl) {
  const domPlotly = new DOMParser().parseFromString(plotlyEl.outerHTML, 'text/html')
  var script = domPlotly.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  domPlotly.head.appendChild(script)
  const mainDiv = domPlotly.querySelector('div.plotly-graph-div')
  mainDiv.setAttribute("style", "width:100%; height:100%;")
  return domPlotly
}

function extractMarkdown (markdownEl) {
  markdownEl.querySelectorAll('.anchor-link').forEach(el => {
    el.remove()
  })
  return new DOMParser().parseFromString(markdownEl.outerHTML, 'text/html')
}

function extractDefault (defaultEl) {
  var script = defaultEl.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
  defaultEl.head.appendChild(script)
  defaultEl.querySelectorAll('.jp-Cell-inputWrapper').forEach(el => {
    el.remove()
  })
  return defaultEl
}

class Cell {
  constructor(id, dom) {
    this.id = 'cell' + String(id)
    this.dom = dom
    this.echartsEl = getElementByXpath("//script[contains(text(),'function(echarts)')]/..", this.dom)
    this.markdownEl = getElementByXpath("//div[contains(@class, 'jp-MarkdownOutput')]", this.dom)
    this.plotlyEl = getElementByXpath("//div[contains(@class, 'plotly-graph-div')]/../../../..", this.dom)
  }

  get type() {
    var result = ''
    switch (true) {
      case this.echartsEl !== null:
        result = 'echarts'
        break
      case this.markdownEl !== null:
        result = 'markdown'
        break
      case this.plotlyEl !== null:
        result = 'plotly'
        break
      default:
        result = 'default'
        break
    }
    return result
  }

  get iframeContent() {
    var result = ''
    switch(this.type) {
      case 'echarts':
        result = extractEcharts(this.echartsEl)
        break
      case 'markdown':
        result = extractMarkdown(this.markdownEl)
        break
      case 'plotly':
        result = extractPlotly(this.plotlyEl)
        break
      default:
        result = extractDefault(this.dom)
        break
    }
    return result
  }

  get isTitle() {
    if(this.type !== 'markdown') {
      return false
    }
    let firstLine = this.dom.querySelector('.jp-MarkdownOutput > :first-child')
    return ['H1', 'H2'].includes(firstLine.nodeName)
  }
}

class Notebook {
  constructor(dom) {
    this.dom = dom
  }

  get cells() {
    const result = []
    const cellsDom = this.dom.querySelectorAll('.jp-Cell');
    for(var i = 0; i < cellsDom.length; i++) {
      var cellDom = new DOMParser().parseFromString(cellsDom[i].outerHTML, 'text/html')
      result.push(new Cell(i, cellDom))
    }
    return result
  }
}
    <\/script>
</body>
<script>
    new Vue({
        el: '#app',
        vuetify: new Vuetify(),
        data: {
          grid: undefined,
          cells: ${JSON.stringify(cellsOutput)},
          notebookHtml: '${btoa(encodeURIComponent(notebookHtml))}',
          trash: [],
          drawerTrash: false,
          edit: false
        },
        computed: {
          cellsGridstack() {
            const result = []
            for (var i = 0; i < this.cells.length; i++) {
              const cell = this.cells[i]
              const { html, ...cellGridstack } = cell
              result.push(cellGridstack)
            }
            return result
          }
        },
        mounted: function () {
          this.grid = GridStack.init({
            acceptWidgets: true,
            float: false,
            cellHeight: '70px',
            minRow: 1,
            margin: '5px',
          })
          if(!this.edit) {
            this.grid.enableMove(false)
            this.grid.enableResize(false)
          }
          this.populate()
        },
  methods : {
    async deleteCell (cellArg) {
      const cellId = cellArg['gs-id']
      const cellEl = this.grid.engine.nodes.find(
        x => String(x.id) === String(cellId)
      ).el
      this.grid.removeWidget(cellEl) 
      const cell = this.cells.find(
        x => String(x.id) === String(cellId)
      )
      this.trash.push(cell)
      await this.$nextTick()
      this.updateTrashIframe(cell.html)
    },
    updateTrashIframe(html) {
      const trashItemsEl = document.getElementsByClassName("trash-item")
      const iframeEl = trashItemsEl[trashItemsEl.length - 1]
      const iframe = iframeEl.contentWindow.document
      iframe.write(html)
      iframe.close()
    },
    async restoreCell (trashItem) {
      const cell = {
        id: trashItem.id,
        'gs-id': trashItem.id,
        html: trashItem.html,
        'gs-auto-position': true
      }
      this.cells.push(cell)
      await this.$nextTick()
      this.grid.makeWidget(document.getElementById(cell.id))
      this.trash = this.trash.filter(x => {
         return x.id != trashItem.id
       })
      this.updateIframe(trashItem.id, trashItem.html)
      this.cells.forEach((cell, index) => {
        if(index == this.cells.length - 1) {
          return
        }
        if(cell.id != trashItem.id) {
          return
        }
        cell.id = -1
        cell['gs-id'] = -1
        cell.html = ''
          })
    },
    updateIframe(gsId, html) {
      const iframeEl = document.getElementById(gsId).getElementsByTagName("iframe")[0]
      const iframe = iframeEl.contentWindow.document
      iframe.write(html)
      iframe.close()
    },
    populate() {
      this.notebookHtml = decodeURIComponent(window.atob(this.notebookHtml))
      const dom = new DOMParser().parseFromString(this.notebookHtml, 'text/html')
      new Notebook(dom).cells.forEach(cell => {
        this.addCellHtml(cell)
      })
    },
    async addCellHtml(cellArg) {
      var html = cellArg.iframeContent.documentElement.outerHTML
      var cellIndex = this.cells.findIndex((cell => cell.id == cellArg.id))
      if(cellIndex > - 1) {
        this.cells[cellIndex].html = html
        this.updateIframe(cellArg.id, html)
        return
      }
      this.trash.push({id: cellArg.id, 'gs-id': cellArg.id, html: html})
      await this.$nextTick()
      this.updateTrashIframe(html)
    }
  },
  watch: {
    edit() {
      if(this.edit) {
        this.grid.enableMove(true)
        this.grid.enableResize(true)
      } else {
        this.grid.enableMove(false)
        this.grid.enableResize(false)
      }
    },
    trash () {
      if(this.trash.length == 0 && this.drawerTrash) {
        this.drawerTrash = false
      }
    }
  }
    })
<\/script>

</html>
      `
}

export { Notebook, createTemplate }
