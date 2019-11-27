import loadData from "./load-data";
import "./pudding-chart/beeswarm";

const $section = d3.select('[data-js="beeswarm"');
const $graphic = $section.select('[data-js="beeswarm__graphic"');
const $figure = $graphic.selectAll('[data-js="graphic__figure"');

const charts = [];

function resize() {
  charts.forEach(chart => {
    chart.resize().render();
  });
}

function setupGraphics() {
  const $f = d3.select(this);
  const id = $f.attr("data-id");

  const file = `beeswarm--${id}.csv`;
  loadData(file).then(data => {
    let plotData = data.filter(d => d.value != "NA");
    const chart = $f.datum(plotData).puddingChartBeeswarm();
    chart.resize().render();
    chart
      .getBees()
      .nodes()
      .map(setupHover);
    charts.push(chart);
  });
}

function setupHover(el) {
  d3.select(el)
    .on("mouseover", mouseInHandler)
    .on("mouseout", mouseOutHandler);
}

function mouseInHandler(data) {
  highlightEl(this);
  hoverText(this, data);
}

function mouseOutHandler() {
  d3.selectAll(".bee")
    .transition()
    .style("opacity", 1);
  d3.select('[data-js="beeswarm__hovertext"')
    .transition()
    .style("opacity", 0);
}

function hoverText(elem, data) {
  let dims = elem.getBoundingClientRect();
  d3.select('[data-js="beeswarm__hovertext"')
    .html(`${data.name}:<br/>${data.value}`)
    .style("left", `${dims.x + dims.width / 2}px`)
    .style("top", `${dims.y - dims.height}px`)
    .transition()
    .style("opacity", 1);
}

function highlightEl(elem) {
  let $dataAttr = d3.select(elem).attr("data-js");
  d3.selectAll(".bee")
    .transition()
    .style("opacity", 0.3);
  d3.selectAll(`[data-js=${$dataAttr}`)
    .transition()
    .style("opacity", 1);
}

function init() {
  $figure.each(setupGraphics);
}

export default { init, resize };
