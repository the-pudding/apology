/* global d3 */
const $section = d3.select('[data-js="people"');
const $figure = $section.select('[data-js="people__figure"');

function resize() {}

function slide() {
  $figure
    .selectAll('img')
    .transition()
    .duration(0)
    .delay((d, i) => i * 1000)
    .on('end', (d, i, n) => {
      const $n = d3.select(n[i]);
      const top = $n.attr('data-top');
      const left = $n.attr('data-left');
      $n.style('top', top).style('left', left);
      // $n.classed('is-visible', true);
    });
}

function init() {
  $figure.selectAll('img').each((d, i, n) => {
    const top = d3.format('%')(0.4 + Math.random() * 0.2);
    const left = d3.format('%')(0.2 + Math.random() * 0.6);
    d3.select(n[i])
      .attr('data-top', top)
      .attr('data-left', left);
  });
}

export default { init, resize, slide };
