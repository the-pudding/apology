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
    const labels = ["lower", "middle", "upper"];
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
	let $bee = null
    let $axis = null;
    let $vis = null;
    let $labels = null;

    // helper functions

    const Chart = {
      // called once at start
      init() {
        $svg = $sel.append("svg").attr("class", "pudding-chart");
        $bees = $sel.append("div").attr("class", "bees");

        const $g = $svg.append("g");

        // offset chart for margins
        $g.attr("transform", `translate(${marginLeft}, ${marginTop})`);

        // create axis
        $axis = $svg.append("g").attr("class", "g-axis");
        $axis.append("line").attr("class", "axis");
        $labels = $axis
          .selectAll(".label")
          .data(labels)
          .enter()
          .append("text")
          .attr("class", d => `label ${d}-lab`)
          .attr("y", "20px")
          .attr("text-anchor", d => {
            switch (d) {
              case "lower":
                return "start";
              case "middle":
                return "middle";
              case "upper":
                return "end";
            }
          })
          .text(d => $sel.attr(d));

        // setup viz group
        $vis = $g.append("g").attr("class", "g-vis");
      },
      // on resize, update new dimensions
      resize() {
        // defaults to grabbing dimensions from container element
        width = $sel.node().offsetWidth - marginLeft - marginRight;

        sectionHeight = $sel.node().parentElement.parentElement.offsetHeight;
        height = sectionHeight / 5 - marginTop - marginBottom;

        radius = 0.3 * height;

        $sel.style("height", `${height}px`);

        $svg
          .attr("width", width + marginLeft + marginRight)
          .attr("height", height + marginTop + marginBottom);

        $axis
          .select(".axis")
          .transition()
          .attr("y1", height / 2)
          .attr("y2", height / 2)
          .attr("x1", marginLeft)
          .attr("x2", marginLeft + width);

        $labels.transition().attr("x", d => {
          switch (d) {
            case "lower":
              return marginLeft / 2;
            case "middle":
              return marginLeft + width / 2;
            case "upper":
              return (3 * marginLeft) / 2 + width;
          }
        });

        scaleX.range([marginLeft, width + marginLeft]);

        sim
          .force("y-pos", d3.forceY(height / 2).strength(0.4))
          .force("x-pos", d3.forceX(node => scaleX(node.display)).strength(0.4))
          .force("collide", d3.forceCollide(radius / 2));

        return Chart;
      },
      // update scales and render chart
      render() {
        $bee = $bees
          .selectAll(".bee")
          .data(data, d => d.name)
          .join("div")
          .attr("class", "bee")
          .attr("data-js", d => `bee--${d.name.replace(/\s/g, "")}`)
          .style(
            "background-image",
            d => `url("assets/images/${d.name.replace(/\s/g, "")}.png")`
          )
          .style("width", `${radius}px`)
          .style("height", `${radius}px`)
          .style("background-size", `${1.15 * radius}px`);

        sim
          .alpha(1)
          .on("tick", () => {
            $bee.style("left", d => `${d.x}px`).style("top", d => `${d.y}px`);
          })
          .restart();

        return Chart;
      },
      getBees() {
        return $bee;
      }
    };
    Chart.init();

    return Chart;
  }

  // create charts
  const charts = this.nodes().map(createChart);
  return charts.length > 1 ? charts : charts.pop();
};
