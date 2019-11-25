/* global d3 */
/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartLine = function init(options) {
  function createChart(el) {
    // dom elements
    const $chart = d3.select(el);
    let $svg = null;
    let $axis = null;
    let $vis = null;

    // data
    const { extentY } = options;
    let data = $chart.datum();

    // dimensions
    let width = 0;
    let height = 0;
    const marginTop = 0;
    const marginBottom = 0;
    let marginLeft = 0;
    let marginRight = 0;
    const MARGIN_FACTOR = 0.05;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLinear().domain(extentY);

    // helper functions
    function enterPerson($e) {
      const $person = $e
        .append('g')
        .attr('class', d => {
          const b = d.beauty ? 'is-beauty' : '';
          const c = `cluster--${d.cluster}`;
          return `person ${c} ${b}`;
        })
        .attr('data-name', d => d.name);

      $person.append('path');
      $person.append('text').text(d => d.name);

      return $person;
    }

    const Chart = {
      // called once at start
      init() {
        $svg = $chart.append('svg').attr('class', 'pudding-chart');

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');

        // setup viz group
        $vis = $svg.append('g').attr('class', 'g-vis');
      },
      // on resize, update new dimensions
      resize() {
        marginLeft = Math.floor(Chart.getDayCount() * MARGIN_FACTOR);
        marginRight = marginLeft;

        // defaults to grabbing dimensions from container element
        width = $chart.node().offsetWidth - marginLeft - marginRight;
        height = $chart.node().offsetHeight - marginTop - marginBottom;
        console.log(height);
        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        scaleX.range([0, width]);
        scaleY.range([height, 0]);

        return Chart;
      },
      // update scales and render chart
      render() {
        const flat = [].concat(...data.map(d => d.values)).map(d => d.days);
        const extentX = d3.extent(flat);
        scaleX.domain(extentX);

        const axisX = d3.axisBottom(scaleX).ticks(Chart.getDayCount() * 0.1);
        $axis
          .call(axisX)
          .attr('transform', `translate(${marginLeft}, ${scaleY(1)})`);

        // offset chart for margins
        $vis.attr('transform', `translate(${marginLeft}, ${marginTop})`);

        const generateLine = d3
          .line()
          .curve(d3.curveMonotoneX)
          .x(d => scaleX(d.days))
          .y(d => scaleY(d.value));

        const $person = $vis
          .selectAll('.person')
          .data(data, d => d.key)
          .join(enterPerson);

        $person
          .select('path')
          .datum(d => d.values)
          .attr('d', generateLine);

        return Chart;
      },
      // get / set data
      data(val) {
        if (!arguments.length) return data;
        data = val;
        $chart.datum(data);
        return Chart;
      },
      // get day count
      getDayCount() {
        return d3.max(data, d => d.values.length);
      },
    };
    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
