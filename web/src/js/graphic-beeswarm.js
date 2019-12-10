import loadData from "./load-data";
import "./pudding-chart/beeswarm";

const $section = d3.select('[data-js="beeswarm"]');
const $graphic = $section.select('[data-js="beeswarm__graphic"]');
const $figure = $graphic.selectAll('[data-js="graphic__figure"]');
const $chart = $graphic.selectAll('[data-js="graphic__chart"]');

const charts = [];

function slide(value) {
  let $els = null;
  const focusSlides = ["GabrielZamora"];

  if (focusSlides.includes(value)) {
    d3.select(".swiper").style("pointer-events", "auto");
    $els = d3.selectAll(`[data-js="bee--${value}"`);
    highlightEl($els.node());
    $els.each(function(d) {
      hoverText(this, d);
    });
  } else {
    d3.select(".swiper").style("pointer-events", "none");
    mouseOutHandler();
  }
}

function resize() {
  const h = d3.select('[data-type="text"] .slide__text').node().offsetHeight;
  const sz = Math.floor(($section.node().offsetHeight - h) / $chart.size());
  $chart.style("height", `${sz}px`);
  charts.forEach(chart => {
    chart.resize().render();
  });
}

function cleanData(data) {
  const clean = data.map(d => ({
    ...d,
    beauty: d.beauty === "TRUE"
  }));
  const filtered = clean.filter(d => d.value !== "NA");
  return filtered;
}

function setupGraphics() {
  const $f = d3.select(this);
  const id = $f.attr("data-id");

  const file = `beeswarm--${id}.csv`;
  loadData(file)
    .then(cleanData)
    .then(data => {
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
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 1);
  d3.selectAll('[data-js="beeswarm__hovertext"]')
    .transition()
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 0);
}

function hoverText(elem, data) {
  const $fig = elem.parentElement.parentElement;
  const dims = elem.getBoundingClientRect();
  const $hoverBox = d3.select(
    `[data-id=beeswarm__hovertext_${$fig.getAttribute("data-id")}`
  );
  $hoverBox
    .classed("is-beauty", data.beauty)
    .style("left", `${dims.x + dims.width / 2}px`)
    .style("top", `${dims.y}px`)
    .transition()
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 1);
  $hoverBox.select('[data-js="beeswarm__hovertext__title"]').html(data.name);
  $hoverBox.select('[data-js="beeswarm__hovertext__content"]').html(data.value);
}

function highlightEl(elem) {
  const $dataAttr = d3.select(elem).attr("data-js");
  d3.selectAll(".bee")
    .transition()
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 0.25);
  d3.selectAll(`[data-js=${$dataAttr}]`)
    .transition()
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 1);
}

function init() {
  $figure.each(setupGraphics);
  resize();
}

export default { init, resize, slide };
