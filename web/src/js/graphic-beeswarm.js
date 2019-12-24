import loadData from "./load-data";
import "./pudding-chart/beeswarm";

const $body = d3.select("body");
const $section = d3.select('[data-js="beeswarm"]');
const $graphic = $section.select('[data-js="beeswarm__graphic"]');
const $figure = $graphic.selectAll('[data-js="graphic__figure"]');
const $chart = $graphic.selectAll('[data-js="graphic__chart"]');

const BP = 480;
const TITLE_H = 2.5 * 16;

const charts = [];

let mobile = false;

function slide(value) {
  const focusSlides = [
    "GabrielZamora",
    "JeffreeStar",
    "JamesCharles",
    "JaclynHill",
    "LauraLee"
  ];

  mouseOutHandler();

  if (focusSlides.includes(value)) {
    const $els = d3.selectAll(`[data-js="bee--${value}"`);
    highlightEl($els.node());
    $els.each(function(d) {
      hoverText(this, d);
    });
  }
}

function resize() {
  mobile = $body.node().offsetWidth < BP;
  // const h = d3.select('[data-type="text"] .slide__text').node().offsetHeight;
  const sz = mobile
    ? $section.node().offsetHeight - TITLE_H
    : Math.floor($section.node().offsetHeight / $chart.size());
  $chart.style("height", `${sz}px`);
  charts.forEach(chart => {
    chart.resize(mobile).render();
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
      chart.resize(mobile).render();
      chart
        .getBees()
        .nodes()
        .forEach(setupHover);
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
  const id = $fig.getAttribute("data-id");
  const $hoverBox = d3.select(`[data-id="beeswarm__hovertext_${id}"]`);
  if (!mobile)
    $hoverBox.select('[data-js="beeswarm__hovertext__title"]').html(data.name);
  $hoverBox.select('[data-js="beeswarm__hovertext__content"]').html(data.value);
  const xoff = mobile
    ? $hoverBox.node().getBoundingClientRect().width / 2
    : data.display < 0.2
    ? 0
    : data.display < 0.8
    ? $hoverBox.node().getBoundingClientRect().width / 2
    : $hoverBox.node().getBoundingClientRect().width;
  const yoff = mobile
    ? -elem.offsetHeight * 1.75
    : -elem.offsetHeight * 0.5;
  $hoverBox
    .classed("is-beauty", data.beauty)
    .style("left", `${data.x - xoff + elem.parentElement.offsetLeft}px`)
    .style("top", `${data.y - yoff + elem.parentElement.offsetTop}px`)
    .transition()
    .duration(250)
    .ease(d3.easeCubicInOut)
    .style("opacity", 1);
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
  $graphic.classed("is-interactive", !$body.classed("is-mobile"));
}

export default { init, resize, slide };
