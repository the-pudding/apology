import loadData from './load-data';
import './pudding-chart/beeswarm'

const $section = d3.select('[data-js="beeswarm"');
const $graphic = $section.select('[data-js="beeswarm__graphic"');
const $figure = $graphic.selectAll('[data-js="graphic__figure"');

const RADIUS = 30;
const MARGIN = 50;
const HEIGHT = 300;

let width, scale, sim;

const charts = [];

function resize() {
	//  todo chart resizes
	charts.forEach(chart => {
		chart.resize().render();
	});
}

function setupGraphics() {
	const $f = d3.select(this);
    const id = $f.attr('data-id');
    
	const file = `beeswarm--${id}.csv`;
	loadData(file).then(data => {
		const chart = $f.datum(data).puddingChartBeeswarm();
		chart.resize().render();
		charts.push(chart);
    });
}

function init() {
    $figure.each(setupGraphics);
}

export default { init, resize };
