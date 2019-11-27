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
    const { extentY, label, comp } = options;

    let data = $chart.datum();

    let shouldShrink = false;
    let fraction = 0;
    let offset = 0;
    const endLabel = label.includes('Apology');
    const endComp = comp.includes('Apology');

    // dimensions
    let width = 0;
    let height = 0;
    const marginTop = 16;
    const marginBottom = 16;
    const marginLeft = 32;
    const marginRight = 32;
    const DUR = 500;
    const LABEL_SIZE = 12;
    const EASE = d3.easeCubicInOut;

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLog().domain(extentY);

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

        // setup viz group
        $vis = $svg.append('g').attr('class', 'g-vis');

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');

        $axis.append('g').attr('class', 'axis--y');

        $axis
          .append('text')
          .attr('class', 'text-comp text-comp--bg')
          .text(comp)
          .attr('x', LABEL_SIZE / 2)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', endComp ? 'start' : 'end')
          .style('font-size', LABEL_SIZE);

        $axis
          .append('text')
          .attr('class', 'text-comp text-comp--fg')
          .text(comp)
          .attr('x', LABEL_SIZE / 2)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', endComp ? 'start' : 'end')
          .style('font-size', LABEL_SIZE);

        $axis
          .append('text')
          .attr('class', 'text-label')
          .text(label)
          .attr('x', 0)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', endLabel ? 'end' : 'start')
          .style('font-size', LABEL_SIZE);

        $axis.append('line');
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        const w = $chart.node().offsetWidth;
        const h = $chart.node().offsetHeight;
        const factor = shouldShrink ? fraction : 1;

        // marginLeft = Math.floor(
        //   Chart.getDayCount() * MARGIN_FACTOR * w * factor
        // );
        // marginRight = marginLeft;

        width = w * factor - marginLeft - marginRight;
        height = h - marginTop - marginBottom;
        scaleX.range([0, width]);
        scaleY.range([height, 0]);

        $svg.style('margin-left', d3.format('%')(offset));
        return Chart;
      },
      // update scales and render chart
      render() {
        const flat = [].concat(...data.map(d => d.values)).map(d => d.days);
        const extentX = d3.extent(flat);
        scaleX.domain(extentX);

        $svg
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        const axisY = endLabel ? d3.axisLeft(scaleY) : d3.axisRight(scaleY);

        axisY
          .tickValues([0.5, 1, 2])
          .tickSize(endComp ? -width : width)
          .tickFormat(d => `${d}x`);

        $axis
          .select('.axis--y')
          .transition()
          .duration(DUR)
          .ease(EASE)
          .call(axisY);

        // offset chart for margins
        $axis
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${marginLeft}, ${marginTop})`);
        $vis
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${marginLeft}, ${marginTop})`);

        // $axis
        //   .select('line')
        //   .transition()
        //   .duration(DUR)
        //   .ease(EASE)
        //   .attr('transform', `translate(0, ${scaleY(1)})`)
        //   .attr('x1', 0)
        //   .attr('x2', width)
        //   .attr('y1', 0)
        //   .attr('y2', 0);

        $axis
          .selectAll('.text-comp')
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${endComp ? 0 : width}, ${scaleY(1)})`);

        $axis
          .select('.text-label')
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${endLabel ? width : 0}, ${height})`);

        const generateLine = d3
          .line()
          // .curve(d3.curveMonotoneX)
          .x(d => scaleX(d.days))
          .y(d => scaleY(d.value));

        const $person = $vis
          .selectAll('.person')
          .data(data, d => d.key)
          .join(enterPerson);

        $person
          .select('path')
          .datum(d => d.values)
          .transition()
          .duration(DUR)
          .ease(EASE)
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
      shrink(val) {
        shouldShrink = val;
        return Chart;
      },
      fraction(val) {
        if (!arguments.length) return fraction;
        fraction = val;
        return Chart;
      },
      offset(val) {
        if (!arguments.length) return offset;
        offset = val;
        return Chart;
      },
    };
    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
