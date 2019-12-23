/* global d3 */
import loadData from './load-data';
import './pudding-chart/impact-line';

const BP = 480;

let mobile = false;
let chartPre = null;
let chartPost = null;

const $section = d3.select('[data-js="impact"');
const $graphic = $section.select('[data-js="impact__graphic"');
const $zone = $graphic.select('[data-js="graphic__zone"');
const $figurePre = $graphic.select('[data-js="figure--pre"');
const $figurePost = $graphic.select('[data-js="figure--post"');
const $select = $graphic.select('[data-js="graphic__select"');

function handleSelectChange() {
  const name = this.value;
  if (name === 'Highlight') chartPre.highlight().render();

  chartPre.highlight(name).render();
  chartPost.highlight(name).render();
}

function updateChartDimensions() {
  mobile = $section.node().offsetWidth < BP;
  const daysPre = chartPre.getDayCount();
  const daysPost = chartPost.getDayCount();
  const daysZone = Math.floor(daysPre * (mobile ? 0.05 : 0.2));
  const total = daysPre + daysPost + daysZone;
  const perPre = daysPre / total;
  const perPost = daysPost / total;
  const perZone = daysZone / total;

  chartPre.fraction(perPre);
  chartPost.fraction(perPost).offset(perPre + perZone);
  $zone
    .style('width', d3.format('%')(perZone))
    .style('left', d3.format('%')(perPre));

  // const gtc = `${daysPre}fr ${zone}fr ${daysPost}fr`;
  // $graphic.style('grid-template-columns', gtc);
}

function resize() {
  updateChartDimensions();
}

function slide(value) {
  // reset option
  $select.selectAll('option').property('selected', d => d.name === 'Highlight');

  const isPre = [
    'pre-setup',
    'pre-result',
    'pre-example',
    'post-setup',
  ].includes(value);

  const ignoreBeauty = [
    'post-positive',
    'post-negative',
    'post-cluster',
  ].includes(value);

  $select.classed('is-visible', !isPre);
  $figurePost.classed('is-visible', !isPre);
  $zone.classed('is-visible', !isPre);
  chartPre.shrink(value === 'post-result');

  chartPre.beauty(!ignoreBeauty);
  chartPost.beauty(!ignoreBeauty);
  chartPre.highlight();
  chartPost.highlight();

  chartPre.pre(isPre);

  if (value === 'pre-example') chartPre.focus(['Jake Paul']).render();
  else if (value === 'post-positive') {
    chartPre
      .cluster(true)
      .focus(['Gabriel Zamora'])
      .render();
    chartPost
      .cluster(true)
      .focus(['Gabriel Zamora'])
      .render();
  } else if (value === 'post-negative') {
    chartPre
      .cluster(true)
      .focus(['Laura Lee'])
      .render();
    chartPost
      .cluster(true)
      .focus(['Laura Lee'])
      .render();
  } else if (value === 'post-cluster') {
    chartPre.cluster(true).render();
    chartPost.cluster(true).render();
  } else {
    chartPre
      .focus()
      .cluster()
      .render();
    chartPost
      .focus()
      .cluster()
      .render();
  }

  const resizePre = ['pre-example', 'post-result'].includes(value);

  if (resizePre) chartPre.resize().render();
}

function cleanData(data, pre) {
  const factor = pre ? -1 : 1;
  const side = pre ? 'pre' : 'post';
  return data.map(d => ({
    ...d,
    days: +d.days * factor,
    value: +d.value,
    side,
  }));
}

function setupSelect(data) {
  $select
    .selectAll('option')
    .data([{ name: 'Highlight' }].concat(data))
    .join('option')
    .text(d => d.name);

  $select.on('change', handleSelectChange);
}

function setup([people, pre, post]) {
  const dataPeople = people
    .filter(d => d.remove_flag === 'FALSE')
    .map(d => ({
      ...d,
      growth_delta: +d.growth_delta,
    }));

  const dataPre = cleanData(pre, true);
  const dataPost = cleanData(post, false);

  const joined = dataPre.concat(dataPost);
  const extentY = d3.extent(joined, d => d.value);

  const nestedPre = d3
    .nest()
    .key(d => d.id)
    .entries(dataPre)
    .map(d => ({
      ...d,
      cluster: d.values[0].cluster,
      ...dataPeople.find(v => v.id === d.key),
    }))
    .filter(d => d.id);

  const nestedPost = d3
    .nest()
    .key(d => d.id)
    .entries(dataPost)
    .map(d => ({
      ...d,
      cluster: d.values[0].cluster,
      ...dataPeople.find(v => v.id === d.key),
    }))
    .filter(d => d.id);

  nestedPre.sort((a, b) => d3.ascending(a.beauty, b.beauty));
  nestedPost.sort((a, b) => d3.ascending(a.beauty, b.beauty));

  chartPre = $figurePre.datum(nestedPre).puddingChartLine({
    extentY,
    label: '90 Days Until Controversy',
    comp: 'Pre-Controversy Max',
  });
  chartPost = $figurePost.datum(nestedPost).puddingChartLine({
    extentY,
    label: '180 Days Since Apology',
    comp: 'Pre-Apology Max',
  });

  updateChartDimensions();

  chartPre.resize().render();
  chartPost
    .shrink(true)
    .resize()
    .render();

  setupSelect(dataPeople);
}

function init() {
  loadData(['people.csv', 'pre.csv', 'post.csv']).then(setup);
}

export default { init, resize, slide };
