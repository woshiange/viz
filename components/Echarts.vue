<template>
  <iframe ref="iframe" scrolling="yes" style="position: relative; height: 100%; width: 100%; background-color:white;"></iframe>
</template>
<script>
export default {
  props: {
    echartOption: Object,
    default: () => ({})
  },
  methods: {
    update() {
      const template = `
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
  var option = ${JSON.stringify(this.echartOption)}

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
      myIframe.write(template)
      myIframe.close()
    }
  },
  mounted() {
    this.iframeEl = this.$refs.iframe
    this.update()
  }
}
</script>
