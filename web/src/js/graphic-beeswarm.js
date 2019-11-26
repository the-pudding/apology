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
    const chart = $f.datum(data).puddingChartBeeswarm();
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
    .on("mouseover", highlightEl)
    .on("mouseout", () => {
      d3.selectAll(".bee").transition().style("opacity", 1);
    });
}

function highlightEl() {
  let $dataAttr = d3.select(this).attr("data-js");
  d3.selectAll(".bee").transition().style("opacity", 0.3);
  d3.selectAll(`[data-js=${$dataAttr}`).transition().style("opacity", 1);
}

function init() {
  $figure.each(setupGraphics);
}

export default { init, resize };
