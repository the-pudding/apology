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
    const data = $sel.datum();
    // dimension stuff
    let width = 0;
    let height = 0;
    let radius = 0;
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
    let $bee = null;
    let $axis = null;
    // let $vis = null;

    // helper functions

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append('svg').attr('class', 'pudding-chart');
        $bees = $sel.append('div').attr('class', 'bees');

        // const $g = $svg.append("g");
        // offset chart for margins
        // $g.attr("transform", `translate(${marginLeft}, ${marginTop})`);
        // setup viz group
        // $vis = $g.append("g").attr("class", "g-vis");

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');
        $axis.append('line').attr('class', 'axis');
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;
        height = $sel.node().offsetHeight - marginTop - marginBottom;

        radius = 0.25 * height;

        $sel.style('height', `${height}px`);

        $svg
          .attr('width', width + marginLeft + marginRight)
          .attr('height', height + marginTop + marginBottom);

        $axis
          .select('.axis')
          .transition()
          .attr('y1', height / 2)
          .attr('y2', height / 2)
          .attr('x1', marginLeft)
          .attr('x2', marginLeft + width);

        scaleX.range([marginLeft, width + marginLeft]);

        sim
          .force(
            'y-pos',
            d3.forceY(height / 2).strength(node => (node.beauty ? 1 : 0.5))
          )
          .force(
            'x-pos',
            d3
              .forceX(node => scaleX(node.display))
              .strength(node => (node.beauty ? 1 : 0.5))
          )
          .force(
            'collide',
            d3.forceCollide(node => (node.beauty ? radius / 2 : radius / 8))
          );

        return Chart;
      },
      // update scales and render chart
      render() {
        $bee = $bees
          .selectAll('.bee')
          .data(data, d => d.name)
          .join('div')
          .attr('class', d => `bee ${d.beauty ? 'is-beauty' : ''}`)
          .attr('data-js', d => `bee--${d.name.replace(/\s/g, '')}`)
          .style('background-image', d =>
            d.beauty
              ? `url("assets/images/people/${d.name.replace(
                  /\s/g,
                  ''
                )}@2x.jpg")`
              : ''
          )
          .style('width', d => `${d.beauty ? radius : radius / 4}px`)
          .style('height', d => `${d.beauty ? radius : radius / 4}px`)
          .style('background-size', `${1.15 * radius}px`)
          .style('top', d => (d.beauty ? height / 2 : 0))
          .style('left', d => (d.beauty ? scaleX(d.display) : 0));

        sim
          .alpha(0.4)
          .on('tick', () => {
            $bee.style('left', d => `${d.x}px`).style('top', d => `${d.y}px`);
          })
          .restart();

        return Chart;
      },
      getBees() {
        return $bee;
      },
    };
    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
