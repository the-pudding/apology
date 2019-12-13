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
    let $label = null;

    // data
    const { extentY, label, comp } = options;

    let data = $chart.datum();

    let shouldShrink = false;
    let fraction = 0;
    let offset = 0;
    let focus = [];
    let highlight = null;
    let showBeauty = true;
    let showCluster = false;

    const endLabel = label.includes('Apology');

    // dimensions
    let width = 0;
    let height = 0;
    const marginTop = 16;
    const marginBottom = 16;
    const marginLeft = 14;
    const marginRight = 28;
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
          const cluster = `${d.growth_delta}`.replace('-', 'neg');
          const g = `growth--${endLabel ? d.growth_post : d.growth_pre}`;
          const c = `cluster--${cluster}`;
          return `person ${g} ${c} ${b}`;
        })
        .attr('data-name', d => d.name);

      $person.append('path').attr('class', 'path--bg');
      $person.append('path').attr('class', 'path--fg');
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

        $label = $svg.append('g').attr('class', 'g-label');

        $axis.append('g').attr('class', 'axis--y axis--y--bg');
        $axis.append('g').attr('class', 'axis--y axis--y--fg');

        $label
          .append('text')
          .attr('class', 'text-comp text-comp--bg')
          .text(comp)
          .attr('x', -LABEL_SIZE / 2)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', 'end')
          .style('font-size', LABEL_SIZE);

        $label
          .append('text')
          .attr('class', 'text-comp text-comp--fg')
          .text(comp)
          .attr('x', -LABEL_SIZE / 2)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', 'end')
          .style('font-size', LABEL_SIZE);

        $label
          .append('text')
          .attr('class', 'text-label')
          .text(label)
          .attr('x', 0)
          .attr('y', -LABEL_SIZE / 2)
          .attr('text-anchor', endLabel ? 'end' : 'start')
          .style('font-size', LABEL_SIZE);
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

        // const axisY = endLabel ? d3.axisLeft(scaleY) : d3.axisRight(scaleY);
        const axisY = d3.axisRight(scaleY);

        axisY
          .tickValues([0.5, 1, 2])
          // .tickSize(endComp ? -width : width)
          .tickSize(width)
          .tickFormat(d => `${d}x`.replace('0', ''));

        $axis
          .select('.axis--y--bg')
          .transition()
          .duration(DUR)
          .ease(EASE)
          .call(axisY);

        $axis
          .select('.axis--y--fg')
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
        $label
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${marginLeft}, ${marginTop})`);

        $label
          .selectAll('.text-comp')
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('transform', `translate(${width}, ${scaleY(1)})`);

        $label
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
          .classed('is-focus', d => focus.includes(d.name))
          .classed('is-highlight', d => highlight === d.name)
          .classed('is-beauty', d => {
            if (showBeauty) return d.beauty;
            return focus.includes(d.name) && d.beauty;
          })
          .classed('is-cluster', !showBeauty && !focus.length && showCluster)
          .classed(
            'is-focus-cluster',
            d => showCluster && focus.includes(d.name)
          );

        $person.sort(
          (a, b) =>
            d3.ascending(a.name === highlight, b.name === highlight) ||
            d3.ascending(focus.includes(a.name), focus.includes(b.name))
        );

        if (showCluster) {
          $person.sort(
            (a, b) =>
              d3.ascending(a.name === highlight, b.name === highlight) ||
              d3.ascending(focus.includes(a.name), focus.includes(b.name)) ||
              d3.ascending(
                a.growth_delta < -2 || a.growth_delta > 0,
                b.growth_delta < -2 || b.growth_delta > 0
              )
          );
        }

        $person
          .select('.path--bg')
          .datum(d => d.values)
          .transition()
          .duration(DUR)
          .ease(EASE)
          .attr('d', generateLine);

        $person
          .select('.path--fg')
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
      focus(val) {
        if (val) focus = val;
        else focus = [];
        return Chart;
      },
      beauty(val) {
        showBeauty = val;
        return Chart;
      },
      cluster(val) {
        showCluster = val;
        return Chart;
      },
      highlight(val) {
        highlight = val;
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
