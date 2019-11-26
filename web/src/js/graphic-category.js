/* global d3 */
import loadData from './load-data';

const $section = d3.select('[data-js="category"');
const $graphic = $section.select('[data-js="category__graphic"');
const $figure = $graphic.select('[data-js="graphic__figure"');

const other = [
  'Copywriting',
  'Incorrect Statement',
  'Low-quality Product',
  'Inappropriate Animal Care',
];

function resize() {}

function setup(people) {
  const data = people
    .filter(d => d.remove_flag === 'FALSE')
    .map(d => ({
      ...d,
      cat: other.includes(d.controversy_type)
        ? 'Miscellaneous'
        : d.controversy_type,
    }));

  const nested = d3
    .nest()
    .key(d => d.cat)
    .entries(data)
    .map(d => ({
      ...d,
      values: d.values.concat([{ name: d.key, label: true }]),
    }));

  nested.sort((a, b) => d3.descending(a.values.length, b.values.length));

  const $c = $figure
    .selectAll('.controversy')
    .data(nested)
    .join('div')
    .attr('class', 'controversy');
  const $p = $c
    .selectAll('.person')
    .data(d => d.values)
    .join('div')
    .attr(
      'class',
      d => `person ${d.label ? 'is-label' : ''} ${d.beauty ? 'is-beauty' : ''}`
    );

  $p.append('p').text(d => d.name);
}

function slide(value) {
  $figure.selectAll('.is-beauty').classed('is-active', value === 'tldr');
}

function init() {
  loadData('people.csv').then(setup);
}

export default { init, resize, slide };
