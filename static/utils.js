
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

function extractRenderedHTML (renderedHTMLEl, template) {
  var template = template.cloneNode(true)
  const html = template.getElementsByTagName("html")[0]
  const body = document.createElement("body")
  body.appendChild(renderedHTMLEl)
  html.appendChild(body)
  return template
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
  constructor(dom, id, styles, notebookTemplate) {
    this.id = 'cell' + String(id)
    this.dom = dom
    this.notebookStyles = styles
    this.notebookTemplate = notebookTemplate
    this.echartsEl = getElementByXpath("//script[contains(text(),'function(echarts)')]/..", this.dom)
    this.markdownEl = getElementByXpath("//div[contains(@class, 'jp-MarkdownOutput')]", this.dom)
    this.plotlyEl = getElementByXpath("//div[contains(@class, 'plotly-graph-div')]/../../../..", this.dom)
    this.renderedHTML = getElementByXpath("//div[contains(@class, 'jp-RenderedHTML')]", this.dom)
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
      case this.renderedHTML !== null:
        result = 'renderedHTML'
        break
      default:
        result = 'default'
        break
    }
    if (result !== 'renderedHTML') {
      this.notebookStyles = null
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
      case 'renderedHTML':
        result = extractRenderedHTML(this.renderedHTML, this.notebookTemplate)
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
    this.styles = this.setStyles()
    this.template = this.setTemplate()
    console.log('abc')
    console.log(this.template)
    console.log('abc')
  }

  get cells() {
    const result = []
    const cellsDom = this.dom.querySelectorAll('.jp-Cell');
    for(var i = 0; i < cellsDom.length; i++) {
      var cellDom = new DOMParser().parseFromString(cellsDom[i].outerHTML, 'text/html')
      result.push(new Cell(cellDom, i, this.styles, this.template))
    }
    return result
  }

  setStyles() {
    var result = this.dom.evaluate('//head/style', this.dom, null, XPathResult.ANY_TYPE, null)
    var node, nodes = []
    while (node = result.iterateNext())
      nodes.push(node);
    return nodes
  }

  setTemplate() {
    var template = this.dom.cloneNode(true)
    template.body.remove()
    return template
  }
}
