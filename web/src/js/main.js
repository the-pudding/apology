/* global d3 */
import Swiper from 'tiny-swiper';
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import footer from './footer';
import Impact from './graphic-impact';

const $body = d3.select('body');
let previousWidth = 0;

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  const width = $body.node().offsetWidth;
  if (previousWidth !== width) {
    previousWidth = width;
    Impact.resize();
  }
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
  const swiper = new Swiper(containerEl, {
    wrapperClass: 'swiper__wrapper',
    slideClass: 'slide',
    slideNextClass: 'slide--next',
    slidePrevClass: 'slide--prev',
    slideActiveClass: 'slide--active',
  });

  swiper.on('before-slide', currentIndex => {
    console.log('current', currentIndex);
  });

  swiper.on('after-slide', newIndex => {
    console.log('new', newIndex);
    index = newIndex;
  });

  $body.on('keydown', () => {
    const key = d3.event.keyCode;
    if (key === 37) index -= 1;
    else if (key === 39) index += 1;
  });
}

function init() {
  // add mobile class to body tag
  $body.classed('is-mobile', isMobile.any());
  // setup resize event
  window.addEventListener('resize', debounce(resize, 150));
  // setup sticky header menu
  setupStickyHeader();
  // kick off graphic code
  // Impact.init();
  // setup swiper
  setupSwiper();
  // load footer stories
  footer.init();
}

init();
