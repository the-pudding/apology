/* global d3 */
import loadData from './load-data';
import './pudding-chart/impact-line';

let chartPre = null;
let chartPost = null;

const $section = d3.select('[data-js="impact"');
const $graphic = $section.select('[data-js="impact__graphic"');
const $zone = $graphic.select('[data-js="graphic__zone"');
const $figurePre = $graphic.select('[data-js="figure--pre"');
const $figurePost = $graphic.select('[data-js="figure--post"');

function updateChartDimensions() {
  const daysPre = chartPre.getDayCount();
  const daysPost = chartPost.getDayCount();
  const daysZone = Math.floor(daysPre * 0.2);
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
  const isPre = ['pre-setup', 'pre-result', 'pre-example', 'post-setup'].includes(value);
  $figurePost.classed('is-visible', !isPre);
  $zone.classed('is-visible', !isPre);
  chartPre.shrink(value === 'post-result');
  const resizePre = ['pre-exmaple', 'post-result'].includes(value);

	if (value === 'pre-example') chartPre.focus('Jake Paul').render();
	else chartPre.focus().render();

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

function setup([people, pre, post]) {
  const dataPeople = people.filter(d => d.remove_flag === 'FALSE');
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
}

function init() {
  loadData(['people.csv', 'pre.csv', 'post.csv']).then(setup);
}

export default { init, resize, slide };
