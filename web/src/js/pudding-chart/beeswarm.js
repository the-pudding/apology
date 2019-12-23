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
    let margin = 0;

    const sim = d3.forceSimulation(data);

    // scales
    const scaleX = d3.scaleLinear();
    const scaleY = d3.scaleLinear();

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
        // $g.attr("transform", `translate(${margin}, ${margin})`);
        // setup viz group
        // $vis = $g.append("g").attr("class", "g-vis");

        // create axis
        $axis = $svg.append('g').attr('class', 'g-axis');
        $axis.append('line').attr('class', 'axis');
      },
      // on resize, update new dimensions
      resize(mobile) {
        // defaults to grabbing dimensions from container element
        const titleH = d3.select('#beeswarm .graphic__title').node()
          .offsetHeight;
        width = $sel.node().parentElement.offsetWidth;
        height = $sel.node().parentElement.offsetHeight - titleH;
        radius = Math.floor(mobile ? 0.33 * width : 0.25 * height);
        margin = Math.floor(radius * 0.5);
        width -= margin * 2;
        height -= margin * 2;

        $sel.style('height', `${height + margin * 2}px`);

        $svg
          .attr('width', width + margin * 2)
          .attr('height', height + margin * 2);

        $axis
          .select('.axis')
          .attr('transform', `translate(${margin}, ${margin})`)
          .transition()
          .attr('y1', mobile ? 0 : height / 2)
          .attr('y2', mobile ? 0 + height : height / 2)
          .attr('x1', mobile ? width / 2 : 0)
          .attr('x2', mobile ? width / 2 : 0 + width);

        scaleX.range([0, width]);
        scaleY.range([height, 0]);

        $bees.style('top', `${margin}px`).style('left', `${margin}px`);

        sim
          .force(
            'y-pos',
            mobile
              ? d3
                  .forceY(node => scaleY(node.display))
                  .strength(node => (node.beauty ? 1 : 0.5))
              : d3.forceY(height / 2).strength(node => (node.beauty ? 1 : 0.5))
          )
          .force(
            'x-pos',
            mobile
              ? d3.forceX(width / 2).strength(node => (node.beauty ? 1 : 0.5))
              : d3
                  .forceX(node => scaleX(node.display))
                  .strength(node => (node.beauty ? 1 : 0.5))
          )
          .force(
            'collide',
            d3.forceCollide(node => (node.beauty ? radius / 1.95 : radius / 8))
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
