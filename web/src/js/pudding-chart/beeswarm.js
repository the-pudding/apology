/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartBeeswarm = function init(options) {
	function createChart(el) {
		const $sel = d3.select(el);
		let data = $sel.datum();
		// dimension stuff
		let width = 0;
		let height = 0;
		let radius = 30;
		const marginTop = 0;
		const marginBottom = 0;
		const marginLeft = 0;
		const marginRight = 0;

		const sim = d3.forceSimulation(data);

		// scales
		const scaleX = d3.scaleLinear();
		const scaleY = null;

		// dom elements
		let $svg = null;
		let $bees = null;
		let $axis = null;
		let $vis = null;

		// helper functions

		const Chart = {
			// called once at start
			init() {
				$svg = $sel.append('svg').attr('class', 'pudding-chart');
				$bees = $sel.append('div').attr('class', 'bees');

				const $g = $svg.append('g');

				// offset chart for margins
				$g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

				// create axis
				$axis = $svg.append('g').attr('class', 'g-axis');

				// setup viz group
				$vis = $g.append('g').attr('class', 'g-vis');
			},
			// on resize, update new dimensions
			resize() {
				// defaults to grabbing dimensions from container element
				width = $sel.node().offsetWidth - marginLeft - marginRight;
				height = $sel.node().offsetHeight - marginTop - marginBottom;
				
				$svg
					.attr('width', width + marginLeft + marginRight)
					.attr('height', height + marginTop + marginBottom);

				scaleX.range([marginLeft, width - marginRight]);

				sim
					.force("y-pos", d3.forceY(height / 2))
					.force("x-pos", d3.forceX(node => scaleX(node.value)))
					.force("collide", d3.forceCollide([radius / 2]))

				return Chart;
			},
			// update scales and render chart
			render() {
				const $bee = $bees
					.selectAll('.bee')
					.data(data, d => d.name)
					.join('div')
					.attr("class", d => `bee bee--${d.name.replace(/\s/g, "")}`)
					.text(d => d.name.slice(0, 2));

				sim.alpha(0.3)
					.on('tick', () => {
						$bee.style("left", d => `${d.x}px`).style("top", d => `${d.y}px`);
					})
					.restart()
					

				return Chart;
			},
			// get / set data
			data(val) {
				if (!arguments.length) return data;
				data = val;
				$sel.datum(data);
				Chart.render();
				return Chart;
			}
		};
		Chart.init();

		return Chart;
	}

	// create charts
	const charts = this.nodes().map(createChart);
	return charts.length > 1 ? charts : charts.pop();
};