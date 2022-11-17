<template>
  <v-app>
    <v-system-bar
      app
      height="50"
      color="blue"
    >
      <v-spacer></v-spacer>
      <v-icon
        color="white"
      >
        mdi-pencil
      </v-icon>
      <span style="color:white; font-weight: bold;">
        You're editing this presentation.
      </span>
      <download :cells="cells" class="ml-2"/>
      <v-spacer></v-spacer>
    </v-system-bar>

    <v-app-bar
      v-if="trash.length > 0"
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
            @click.stop="drawerTrash = !drawerTrash"
            style="margin-right: 250px;"
            v-bind="attrs"
            v-on="on"
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
          <trash-item
            v-for="cell in trash"
            :cell="cell"
            :key="cell.id"
            @restore-cell="restoreCell"
          />
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main class="ma-0 pa-0">
        <section class="grid-stack dashboard">
          <cell
            v-for="cell in cells"
            :cell="cell"
            :key="cell.id"
            :edit="edit"
            @delete-cell="deleteCell"
          />
        </section>
    </v-main>

  </v-app>
</template>

<script>
import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'
import Cell from '@/components/Cell'
import Download from '@/components/Download'
export default {
  components: {
    Cell,
    Download
  },
  data() {
    return {
      edit: true,
      grid: null,
      cells: [],
      trash: [],
      drawerTrash: false
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
      if(this.trash.length == 0) {
        this.drawerTrash = false
      }
    }
  },
  methods: {
    addCell(cellData, cellType) {
      let index = this.cells.length
      const lastCellLayout = index == 0 ?
        {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        } : this.cells.at(-1).layout
      var layout = {}
      var isTitle = false
      if (cellType === 'markdown') {
        let firstLine = cellData.querySelector('.jp-MarkdownOutput > :first-child')
        isTitle = ['H1', 'H2'].includes(firstLine.nodeName)
      }
      if (isTitle) {
        layout = {
          y: lastCellLayout.y + lastCellLayout.height,
          x: 0,
          width: 12,
          height: cellData.querySelector('.jp-MarkdownOutput').children.length
        }
      } else {
        let isNewRow = lastCellLayout.x + lastCellLayout.width > 8
        let x = isNewRow ? 0 : lastCellLayout.x + lastCellLayout.width
        let y = isNewRow ? lastCellLayout.y + lastCellLayout.height : lastCellLayout.y
        layout = {
          x,
          y,
          width: 4,
          height: 4
        }
      }
      const cell = {
        id: `cell${index}`,
        cellData,
        cellType,
        layout
      }
      this.cells.push(cell)
      this.$nextTick(() => {
        this.grid.makeWidget(`#${cell.id}`)
      })
    },
    runXpath(path, doc) {
      return doc.evaluate(path, doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)
    },
    getElementByXpath(path, doc) {
      return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    },
    deleteCell (cell) {
      this.cells = this.cells.filter(x => {
        return x.id != cell.id
      })
      this.grid.removeWidget(`#${cell.id}`)
      this.trash.push(cell)
    },
    restoreCell (cell) {
      cell.layout.x = 0
      cell.layout.y = this.gridLastRow
      this.cells.push(cell)
      this.$nextTick(() => {
        this.grid.makeWidget(`#${cell.id}`)
      })
      this.trash = this.trash.filter(x => {
        return x.id != cell.id
      })
    },
    async update() {
      const fileContent = this.$route.params.fileContent
      const dom = new DOMParser().parseFromString(fileContent, 'text/html')
      const cells = dom.querySelectorAll('.jp-Cell');
      // const cells = dom.querySelectorAll('.jp-OutputArea-output')
      for(var i = 0; i < cells.length; i++) {
        const domCell = new DOMParser().parseFromString(cells[i].outerHTML, 'text/html')
        const echart = this.getElementByXpath("//script[contains(text(),'function(echarts)')]/..", domCell)
        const markdown = this.getElementByXpath("//div[contains(@class, 'jp-MarkdownOutput')]", domCell)
        const plotly = this.getElementByXpath("//div[contains(@class, 'plotly-graph-div')]/../../../..", domCell)
        var cellType = null
        var cellData = null
        if (echart) {
          cellType = 'echarts'
          // const echartDom = this.getElementByXpath("
          cellData = this.extractEchartOption(echart)
        } else if (plotly) {
          cellType = 'plotly'
          cellData = this.extractPlotly(plotly)
        } else if (markdown) {
          cellType = 'markdown'
          cellData = this.extractMarkdown(domCell)
        } else {
          cellType = 'default'
          cellData = this.extractDefaultDom(domCell)
        }
        this.addCell(cellData, cellType)
      }

    },
    extractEchartOption (echart) {
      const dom = new DOMParser().parseFromString(echart.outerHTML, 'text/html')
      var script = dom.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
      dom.head.appendChild(script)
      const mainDiv = dom.querySelector('div[id]')
      const divId = mainDiv.getAttribute('id')
      mainDiv.setAttribute("style", "width:100%; height:100%;")
      const echartScript = this.getElementByXpath("//script[contains(text(),'function(echarts)')]", dom)
      const strToReplace = `chart_${divId}.setOption(option_${divId})`
      echartScript.text = echartScript.text.replace(
        strToReplace,
        `${strToReplace}
        window.onresize = function() {
          chart_${divId}.resize()
        }`
      )
      return dom
    },
    extractPlotly (plotly) {
      const domPlotly = new DOMParser().parseFromString(plotly.outerHTML, 'text/html')
      var script = domPlotly.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
      domPlotly.head.appendChild(script)
      const mainDiv = domPlotly.querySelector('div.plotly-graph-div')
      mainDiv.setAttribute("style", "width:100%; height:100%;")
      return domPlotly
    },
    extractMarkdown (domCell) {
      domCell.querySelectorAll('.anchor-link').forEach(el => {
        el.remove()
      })
      return domCell
    },
    extractDefaultDom (domCell) {
      var script = domCell.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js'
      domCell.head.appendChild(script)
      domCell.querySelectorAll('.jp-Cell-inputWrapper').forEach(el => {
        el.remove()
      })
      return domCell
    }
  },
  computed: {
    gridLastRow () {
      var gridLastRow = 0
      for(var i = 0; i < this.cells.length; i++) {
        var temp = this.cells[i].layout.y + this.cells[i].layout.height
        gridLastRow = temp > gridLastRow ? temp : gridLastRow
      }
      return gridLastRow
    }
  },
  mounted() {
    this.grid = GridStack.init({
      acceptWidgets: true,
      float: false,
      cellHeight: '70px',
      minRow: 1,
      margin: '5px',
      resizable: {
        handles: 'e,se,s,sw,w,nw,n,ne'
      }
    })
    window.grid = this.grid;
    this.update()
  }
}
</script>

<style scoped>
.dashboard {
  background-color: #f9fbfc;
}
</style>
