<template>
  <v-app>
    <v-system-bar
      app
      height="50"
      color="blue"
    >
      <v-spacer></v-spacer>
      <span v-if="edit" style="color:white; font-weight: bold;">
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
          class="blue--text ml-2"
          @click="edit = !edit"
        >
          Done
        </v-btn>
      </span>
      <span v-else>
        <v-btn
          small
          color="grey lighten-5"
          elevation="0"
          class="blue--text ml-2"
          @click="edit = !edit"
        >
          Edit
        </v-btn>
        <download
          :cells="cells"
          :fileContent="fileContent"
          class="ml-2"
        />
      </span>
      <v-spacer></v-spacer>
    </v-system-bar>

    <v-app-bar
      v-if="trash.length > 0 && edit"
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
      disable-resize-watcher
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

    <div v-if="loaderFromEdit" class="d-flex justify-center">
      <v-progress-circular indeterminate></v-progress-circular>
      <span> Loading...</span>
    </div>

    <v-main class="ma-0 pa-4">
        <section class="grid-stack" ref="dashboard" :style="gridStyles">
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
import { Notebook } from '@/utils.js'
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
      fileContent: null,
      cells: [],
      cellsEdit: [],
      trash: [],
      drawerTrash: false,
      sizeObserver: null,
      cellWidthUnitPx: null,
      gridStyles: {},
      loaderFromEdit: false
    }
  },
  watch: {
    edit() {
      if(this.edit) {
        this.grid.enableMove(true)
        this.grid.enableResize(true)
        this.setGridCss()
      } else {
        this.grid.enableMove(false)
        this.grid.enableResize(false)
        this.removeGridCss()
      }
    },
    trash () {
      if(this.trash.length == 0) {
        this.drawerTrash = false
      }
    },
    cellWidthUnitPx () {
      this.setGridCss()
    }
  },
  methods: {
    addCell(cell) {
      var index
      if('id' in cell) {
        index = parseInt(cell.id.match(/\d/g).join(""))
      } else {
        index = this.cells.length
      }
      const lastCellLayout = index == 0 ?
        {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        } : this.cells.at(-1).layout
      var layout = {}
      if (cell.isTitle) {
        layout = {
          y: lastCellLayout.y + lastCellLayout.height,
          x: 0,
          width: 12,
          height: cell.iframeContent.querySelector('.jp-MarkdownOutput').children.length
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
      const cellResult = {
        id: `cell${index}`,
        layout,
        iframeContent: cell.iframeContent
      }
      this.cells.push(cellResult)
      this.$nextTick(() => {
        this.grid.makeWidget(`#${cellResult.id}`)
      })
    },
    addCellEdit(cellArg, index) {
      var cellEditIndex = this.cellsEdit.findIndex((cell => cell.id == index))
      if (cellEditIndex < 0) {
        // cellArg belongs to the trash
        this.trash.push(cellArg)
        return
      }
      var cellEdit = this.cellsEdit[cellEditIndex]
      var layout = {
        x: cellEdit['gs-x'],
        y: cellEdit['gs-y'],
        width: cellEdit['gs-w'],
        height: cellEdit['gs-h']
      }
      const cellResult = {
        id: index,
        layout,
        iframeContent: cellArg.iframeContent
      }
      this.cells.push(cellResult)
      this.$nextTick(() => {
        this.grid.makeWidget(`#${cellResult.id}`)
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
      if('layout' in cell) {
        cell.layout.x = 0
        cell.layout.y = this.gridLastRow
        this.cells.push(cell)
        this.$nextTick(() => {
          this.grid.makeWidget(`#${cell.id}`)
        })
      } else {
        // from edit
        this.addCell(cell)
      }
      this.trash = this.trash.filter(x => {
        return x.id != cell.id
      })
    },
    async update() {
      var fromEdit = this.$route.query.fromEdit
      if (typeof fromEdit !== 'undefined') {
        this.fromEdit()
      } else {
        this.fileContent = this.$route.params.fileContent
        const dom = new DOMParser().parseFromString(this.fileContent, 'text/html')
        new Notebook(dom).cells.forEach(cell => {
          this.addCell(cell)
        })
      }
    },
    fromEdit () {
      this.fileContent = localStorage.getItem('notebookHtml')
      this.cellsEdit = JSON.parse(localStorage.getItem('cells'))
      const dom = new DOMParser().parseFromString(this.fileContent, 'text/html')
      var count = 0
      new Notebook(dom).cells.forEach(cell => {
        this.addCellEdit(cell, 'cell' + count)
        count += 1
      })
    },
    onResize () {
      if(!(this.edit)) {
        return
      }
      if(this.grid.engine.length === 0) {
        return
      }
      const firstCell = this.grid.engine.nodes[0]
      if (typeof firstCell !== 'undefined') {
        this.cellWidthUnitPx = firstCell.el.offsetWidth/firstCell.w
      }
    },
    removeGridCss () {
      this.gridStyles = {}
    },
    setGridCss () {
      this.gridStyles = {
        background: '#efefef',
        'background-image': 'linear-gradient(#ffffff .4rem, transparent .4rem), linear-gradient(90deg, #ffffff .4rem, transparent .4rem)',
        'background-size': `${this.cellWidthUnitPx}px 70px`
      }
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
      margin: '3px',
      resizable: {
        handles: 'e,se,s,sw,w,nw,n,ne'
      }
    })
    window.grid = this.grid;
    this.update()
    this.sizeObserver = new ResizeObserver(this.onResize)
    this.sizeObserver.observe(this.$refs.dashboard)
  },
  beforeDestroy () {
    this.sizeObserver.unobserve(this.$refs.dashboard)
  }
}
</script>

<style>
.grid-stack {
  width: 100%;
}  
</style>
