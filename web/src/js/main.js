/* global d3 */
import Swiper from 'tiny-swiper';
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import footer from './footer';
import Images from './graphic-images';
import People from './graphic-people';
import Category from './graphic-category';
import Impact from './graphic-impact';
import Beeswarm from './graphic-beeswarm';

const $body = d3.select('body');
const $graphics = $body.select('.graphics');
const $slide = $body.selectAll('[data-js="slide"]');
const $slideText = $body.selectAll('[data-type="text"]');
const $section = $body.selectAll('section');
const $nerdButton = $body.select('[data-js="nerd-mode__button"]');
const $nerdSlide = $body.selectAll('[data-js="slide__nerd"]');
const $arrowLeft = $body.select('[data-js="arrow--left"]');
const $arrowRight = $body.select('[data-js="arrow--right"]');
const $progress = $body.select('[data-js="progress__inner"]');

const SLIDE_COUNT = $slide.size();

let swiper = null;

function toggleNerd() {
  const $s = d3.select('.slide--active');
  const $n = $s.select('[data-js="slide__nerd"]');
  if ($n.size()) {
    const v = $n.classed('is-visible');
    $n.classed('is-visible', !v);
  }
}

function getSlideTextHeight() {
  const h = [];
  $slideText.each((d, i, n) => {
    const $t = d3.select(n[i]).select('.slide__text');
    if ($t.size()) h.push($t.node().offsetHeight);
  });
  return Math.max(...h);
}

function updateSwiper() {
  swiper.update();
}

function updateText() {
  const h = getSlideTextHeight();
  $graphics.style('height', `${window.innerHeight - h}px`);
  $slideText.select('.slide__text').style('height', `${h}px`);
}

function resize() {
  updateText();
  Images.resize();
  People.resize();
  Category.resize();
  Impact.resize();
  Beeswarm.resize();
  updateSwiper();
}

function setupSwiper() {
  let index = 0;
  const containerEl = d3.select('[data-js="swiper"]').node();
  swiper = new Swiper(containerEl, {
    wrapperClass: 'swiper__wrapper',
    slideClass: 'slide',
    slideNextClass: 'slide--next',
    slidePrevClass: 'slide--prev',
    slideActiveClass: 'slide--active',
  });

  swiper.on('after-slide', newIndex => {
    $nerdSlide.classed('is-visible', false);
    index = newIndex;
    const $s = $slide.filter((d, i) => i === index);
    const slide = $s.attr('data-slide');
    const trigger = $s.attr('data-trigger');
    const nerd = !!$s.attr('data-nerd');

    $nerdButton.classed('is-visible', nerd);
    $section.classed('is-visible', false);
    $progress.style('width', d3.format('%')(index / (SLIDE_COUNT - 1)));

    if (trigger) {
      d3.select(`[data-js="${trigger}"]`).classed('is-visible', true);
      if (trigger === 'category') Category.slide(slide);
      if (trigger === 'impact') Impact.slide(slide);
      if (trigger === 'images') Images.slide(slide);
      if (trigger === 'people') People.slide(slide);
      if (trigger === 'beeswarm') Beeswarm.slide(slide);
    }
  });

  const advance = i => {
    if (i !== index) {
      index = i;
      swiper.scroll(index);
    }
    $arrowLeft.classed('is-visible', index > 0);
    $arrowRight.classed('is-visible', index < SLIDE_COUNT - 1);
  };

  // arrow keys
  $body.on('keydown', () => {
    const key = d3.event.keyCode;
    let newIndex = index;
    if (key === 37) newIndex -= 1;
    else if (key === 39) newIndex += 1;

    // // TODO remove
    // if (key === 73) swiper.scroll(12);
    // if (key === 66) swiper.scroll(SLIDE_COUNT - 1);

    newIndex = Math.max(0, Math.min(newIndex, SLIDE_COUNT - 1));
    advance(newIndex);
  });

  $nerdSlide.classed('is-loaded', true);

  $arrowLeft.on('click', () => {
    let newIndex = index - 1;
    newIndex = Math.max(0, newIndex);

    advance(newIndex);
  });

  $arrowRight.on('click', () => {
    let newIndex = index + 1;
    newIndex = Math.min(newIndex, SLIDE_COUNT - 1);

    advance(newIndex);
  });
}

function setupNerd() {
  $nerdButton.on('click', toggleNerd);
}

function init() {
  $body.style('height', window.innerHeight - 100);
  // add mobile class to body tag
  $body.classed('is-mobile', isMobile.any());
  // setup resize event
  window.addEventListener('resize', debounce(resize, 150));

  // kick off graphic code
  updateText();

  Images.init();
  People.init();
  Category.init();
  Impact.init();
  Beeswarm.init();
  // setup swiper
  setupSwiper();
  updateSwiper();
  setupNerd();
  // load footer stories
  footer.init();
}

init();
