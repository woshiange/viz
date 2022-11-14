<template>
  <div class="grid-stack-item" v-bind="gridStackAttributes">
    <div class="grid-stack-item-content">
      <iframe ref="iframe" scrolling="yes" style="position: relative; height: 100%; width: 100%; background-color:white;"></iframe>
      <div id="transp">
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    widget: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    gridStackAttributes() {
      console.log(this.widget.layout.width)
      console.log(this.widget)
      return {
        id: this.widget.id,
        "gs-id": this.widget.id,
        "gs-x": this.widget.layout.x,
        "gs-y": this.widget.layout.y,
        "gs-w": this.widget.layout.width,
        "gs-h": this.widget.layout.height
      };
    }
  },
  methods: {
    update() {
      this.$axios.$get("http://192.168.1.67:3000/echarts.html").then(response => {
        const dom = new DOMParser().parseFromString(response, 'text/html');
        const echart = this.getElementByXpath("//script[contains(text(),'function(echarts)')]/text()", dom)
        const echartArray= echart.textContent.split("\n")
        while(!(echartArray[0].includes("var option_"))) {
          echartArray.shift()
        }
        echartArray[0] = "{"
        while(!(echartArray.at(-1).includes(".setOption(option_"))) {
          echartArray.pop()
        }
        echartArray.pop()
        echartArray[echartArray.length - 1] = "}"
        const echartOption = JSON.parse(echartArray.join("\n"))
        const serbe = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="echarts.js"><\/script>
  </head>
  <body>
<style>
  #main,
  html,
  body {
    width: 100%;
    height: 100%;
  }
</style>
<div id="main"></div>
<script type="text/javascript">
  var myChart = echarts.init(document.getElementById('main'));
  // Specify the configuration items and data for the chart
  var option = ${JSON.stringify(echartOption)}

  // Display the chart using the configuration items and data just specified.
  myChart.setOption(option);

  window.onresize = function() {
    myChart.resize();
  };
    <\/script>
  </body>
</html>
        `
        const myIframe = this.iframeEl.contentWindow.document
        myIframe.write(serbe)
        myIframe.close()
      })
    },
    getElementByXpath(path, doc) {
      return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    }
  },
  mounted() {
    this.iframeEl = this.$refs.iframe;
    this.update();
  }
};
</script>
<style>
.grid-stack-item {
  margin: 10px;
}
.grid-stack-item-content {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #3182CE;
  background-color: #BEE3F8;
  font-weight: 600;
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
