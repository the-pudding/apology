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
  let $fig = elem.parentElement.parentElement;
  let dims = elem.getBoundingClientRect();
  let hovertext_pre = $fig.getAttribute("hovertext-pre");
  let hovertext_post = $fig.getAttribute("hovertext-post");
  d3.select('[data-js="beeswarm__hovertext"')
    .style("left", `${dims.x + dims.width / 2}px`)
    .style("top", `${dims.y}px`)
    .style("background-color", data.beauty == "TRUE" ? "#c20" : "grey")
    .style("color", data.beauty == "TRUE" ? "#e7e5e4" : "black")
    .transition()
    .style("opacity", 1);

  d3.select('[data-js="beeswarm__hovertext__title"').html(`${data.name}`);
  d3.select('[data-js="beeswarm__hovertext__content"').html(
    `${hovertext_pre}: ${data.value}${hovertext_post}`
  );
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
