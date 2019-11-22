/* Start with hardcoded JSON data, each value scaled from 0-1 */
const swarmData = [
  {
    name: "Gabriel Zamora",
    type: "sorries",
    value: 0.6479,
    type_code: 2
  },
  {
    name: "Grav3yardgirl",
    type: "sorries",
    value: 0,
    type_code: 2
  },
  {
    name: "Jaclyn Hill",
    type: "sorries",
    value: 0.1491,
    type_code: 2
  },
  {
    name: "James Charles",
    type: "sorries",
    value: 0.0439,
    type_code: 2
  },
  {
    name: "Jeffree Star",
    type: "sorries",
    value: 0.147,
    type_code: 2
  },
  {
    name: "Laura Lee",
    type: "sorries",
    value: 1,
    type_code: 2
  },
  {
    name: "Olivia Jade",
    type: "sorries",
    value: 0.4834,
    type_code: 2
  },
  {
    name: "Zoella",
    type: "sorries",
    value: 0.0612,
    type_code: 2
  },
  {
    name: "Gabriel Zamora",
    type: "avg_sub_change",
    value: 1,
    type_code: 1
  },
  {
    name: "Grav3yardgirl",
    type: "avg_sub_change",
    value: 0.1084,
    type_code: 1
  },
  {
    name: "Jaclyn Hill",
    type: "avg_sub_change",
    value: 0.1093,
    type_code: 1
  },
  {
    name: "James Charles",
    type: "avg_sub_change",
    value: 0.272,
    type_code: 1
  },
  {
    name: "Jeffree Star",
    type: "avg_sub_change",
    value: 0.1392,
    type_code: 1
  },
  {
    name: "Laura Lee",
    type: "avg_sub_change",
    value: 0,
    type_code: 1
  },
  {
    name: "Olivia Jade",
    type: "avg_sub_change",
    value: 0.1242,
    type_code: 1
  },
  {
    name: "Zoella",
    type: "avg_sub_change",
    value: 0.1098,
    type_code: 1
  }
];

///////////////////////////////////////////////////////////////

const $section = d3.select('[data-js="beeswarm"');
const $graphic = $section.select('[data-js="beeswarm__graphic"');
const $bees = $graphic.select('[data-js="bees"');

const radius = 30,
  margin = 50,
  height = 300;
let width, scale, sim;

function resize() {
  width = $graphic.node().offsetWidth;

  scale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([margin, width - margin]);

  sim.force("x-pos", d3.forceX(node => scale(node.value)));
  sim.alpha(0.3);
  sim.restart();

}

function init() {
  const colorScale = d3
    .scaleSequential()
    .domain([0, swarmData.length])
    .interpolator(d3.interpolateRainbow);

  sim = d3
    .forceSimulation(swarmData)
    .force("collide", d3.forceCollide([15]))
    .force("y-pos", d3.forceY(node => ((node.type_code - 1) * height) / 2));

  let beeDivs = $bees
    .selectAll(`div .bee`)
    .data(swarmData)
    .enter()
    .append("div")
    .attr("class", "bee")
    .attr("id", d => `${d.name.replace(/\s/g, "")}_${d.type}`)
    .style("background-color", (d, i) => colorScale(i))
    .style("opacity", 0.7)
    .html(d => d.name.slice(0, 2));

  resize();

  sim.on("tick", () => {
    beeDivs.style("left", d => `${d.x}px`).style("top", d => `${d.y}px`);
  });
}

export default { init, resize };
