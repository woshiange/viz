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
  constructor(dom, id) {
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
      result.push(new Cell(cellDom, i))
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
.grid-stack-item-content {
  border-radius: 10px;
  padding: 3px 3px 3px 3px;
  box-shadow: 0px 1px 3px rgb(0 0 0 / 13%);
}
iframe {
  border: 0px;
  height: 100%;
  width: 100%;
  background-color: white;
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
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-2 mr-1"
          @click="edit()"
        >
          Edit
        </v-btn>
    </v-system-bar>

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
                  <v-sheet
                    height="100%"
                    width="100%"
                  >
                     <iframe
                       ref="cells"
                       scrolling="no"
                     ></iframe>
                  </v-sheet>
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
    <script src="https://woshiange.github.io/viz/utils.js"><\/script>
</body>
<script>
    new Vue({
        el: '#app',
        vuetify: new Vuetify(),
        data: {
          grid: undefined,
          cellsStart: [],
          cells: ${JSON.stringify(cellsOutput)},
          notebookHtml: '${btoa(encodeURIComponent(notebookHtml))}',
          notebookId: null,
          trash: [],
          drawerTrash: false,
          dataBeforeEdit: { cells: [], trash: [] }
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
          this.cellsStart = JSON.parse(JSON.stringify(this.cells))
          this.populate()
        },
  methods : {
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
    },
    edit() {
      this.sendNotebook()
    },
    async sendNotebook() {
      let url = 'https://asia-southeast2-dataviz-374817.cloudfunctions.net/send_notebook'
      let data = { 'notebookHtml': this.notebookHtml, cells: this.cellsStart }
      let res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        let ret = await res.json()
        this.notebookId = ret.notebook_id
        const data = {
          notebookId: this.notebookId
        }
        location.href = 'https://woshiange.github.io/viz/dashboard?' + new URLSearchParams(data)
      }
    }
  },
    })
<\/script>

</html>
      `
}

export { Notebook, createTemplate }
