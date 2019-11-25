/* global d3 */
import Swiper from 'tiny-swiper';
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import footer from './footer';
import Category from './graphic-category';
import Impact from './graphic-impact';
import Beeswarm from './graphic-beeswarm';

const $body = d3.select('body');
const $slide = d3.selectAll('[data-js="slide"]');
const $section = d3.selectAll('section');

const SLIDE_COUNT = $slide.size();

let swiper = null;

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  Category.resize();
  Impact.resize();
  Beeswarm.resize();
  swiper.update();
}

function setupStickyHeader() {
  const $header = $body.select('header');
  if ($header.classed('is-sticky')) {
    const $menu = $body.select('.header__menu');
    const $toggle = $body.select('.header__toggle');
    $toggle.on('click', () => {
      const visible = $menu.classed('is-visible');
      $menu.classed('is-visible', !visible);
      $toggle.classed('is-visible', !visible);
    });
  }
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

  swiper.on('before-slide', currentIndex => {
    // console.log('current', currentIndex);
  });

  swiper.on('after-slide', newIndex => {
    // console.log('new', newIndex);
    index = newIndex;
    const $s = $slide.filter((d, i) => i === index);
    const slide = $s.attr('data-slide');
    const trigger = $s.attr('data-trigger');
    $section.classed('is-visible', false);
    if (trigger) {
      d3.select(`[data-js="${trigger}"]`).classed('is-visible', true);
      if (trigger === 'category') Category.slide(slide);
    }
  });

  // arrow keys
  $body.on('keydown', () => {
    const key = d3.event.keyCode;
    let newIndex = index;
    if (key === 37) newIndex -= 1;
    else if (key === 39) newIndex += 1;

    // TODO remove
    if (key === 73) swiper.scroll(4);
    if (key === 66) swiper.scroll(SLIDE_COUNT - 1);

    newIndex = Math.max(0, Math.min(newIndex, SLIDE_COUNT - 1));

    if (newIndex !== index) {
      index = newIndex;
      swiper.scroll(index);
    }
  });
}

function init() {
  // add mobile class to body tag
  $body.classed('is-mobile', isMobile.any());
  // setup resize event
  window.addEventListener('resize', debounce(resize, 150));
  // setup sticky header menu
  // setupStickyHeader();
  // kick off graphic code
  Category.init();
  Impact.init();
  Beeswarm.init();
  // setup swiper
  setupSwiper();
  // load footer stories
  footer.init();
}

init();
