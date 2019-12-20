/* global d3 */
import loadData from './load-data';

const $section = d3.select('[data-js="category"');
const $graphic = $section.select('[data-js="category__graphic"');
const $figure = $graphic.select('[data-js="graphic__figure"');

const BP = 960;

const other = [
  'Copywriting',
  'Incorrect Statement',
  'Low-quality Product',
  'Inappropriate Animal Care',
  'Plagiarism',
];

function adjustSummary() {
  const $s = d3.select(this);
  const { x, width } = $s.node().getBoundingClientRect();
  // TODO adjust position here
}

function resize() {
  $figure.selectAll('.person').each(adjustSummary);
}

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
      values: d.values.concat([
        { name: d.key, label: true, cat: d.values[0].cat },
      ]),
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

  $p.append('p')
    .attr('class', 'person__name')
    .text(d => d.name);

  $p.append('p')
    .attr('class', 'person__summary')
    .classed('is-flip', d =>
      ['Miscellaneous', 'Exploiting Audience'].includes(d.cat)
    )
    .text(d => d.controversy_summary);

  resize();
}

function slide(value) {
  $figure.selectAll('.is-beauty').classed('is-active', value === 'beauty');
  if (value === 'insensitive') {
    $figure
      .selectAll('.person')
      .classed('is-visible', d => d.cat === 'Insensitive Video')
      .classed('is-mark', d => d.name === 'Logan Paul');
  } else if (value === 'racist') {
    $figure
      .selectAll('.person')
      .classed('is-visible', d => d.cat === 'Racist Comments')
      .classed('is-mark', d => d.name === 'Laura Lee');
  } else if (value === 'misc') {
    $figure
      .selectAll('.person')
      .classed('is-visible', d => d.cat === 'Miscellaneous')
      .classed('is-mark', d => d.name === 'Jenna Marbles');
  } else
    $figure
      .selectAll('.person')
      .classed('is-visible', true)
      .classed('is-mark', false);
}

function init() {
  loadData('people.csv').then(setup);
}

export default { init, resize, slide };
