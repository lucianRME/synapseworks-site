(() => {
  'use strict';

  const search = document.getElementById('faq-search');
  const categories = [...document.querySelectorAll('.faq-category')];
  const links = [...document.querySelectorAll('[data-category-link]')];
  const items = [...document.querySelectorAll('.faq-item')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('no-results');
  const expand = document.getElementById('expand-all');
  const collapse = document.getElementById('collapse-all');
  const normalize = (text) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchable = new Map(items.map((item) => [item, normalize(item.querySelector('summary').textContent + ' ' + item.querySelector('.answer p').textContent)]));
  let activeCategory = 'all';

  function visibleItems() {
    return items.filter((item) => !item.hidden && !item.closest('.faq-category').hidden);
  }

  function updateButtons() {
    const visible = visibleItems();
    expand.disabled = !visible.some((item) => !item.open);
    collapse.disabled = !visible.some((item) => item.open);
  }

  function render() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let total = 0;
    categories.forEach((category) => {
      const inCategory = activeCategory === 'all' || category.dataset.category === activeCategory;
      let matches = 0;
      category.querySelectorAll('.faq-item').forEach((item) => {
        const matchesSearch = terms.every((term) => searchable.get(item).includes(term));
        item.hidden = !matchesSearch;
        if (matchesSearch) matches += 1;
      });
      category.hidden = !inCategory || matches === 0;
      if (!category.hidden) total += matches;
    });
    links.forEach((link) => {
      if (link.dataset.categoryLink === activeCategory) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    const selectedLink = links.find((link) => link.dataset.categoryLink === activeCategory);
    const categoryList = selectedLink.parentElement;
    if (categoryList.scrollWidth > categoryList.clientWidth) {
      const selectedRect = selectedLink.getBoundingClientRect();
      const listRect = categoryList.getBoundingClientRect();
      if (selectedRect.left < listRect.left) categoryList.scrollLeft += selectedRect.left - listRect.left - 4;
      else if (selectedRect.right > listRect.right) categoryList.scrollLeft += selectedRect.right - listRect.right + 4;
    }
    const topic = activeCategory === 'all' ? '' : ' in ' + categories.find((category) => category.dataset.category === activeCategory).querySelector('h2').textContent;
    count.textContent = total + (total === 1 ? ' question' : ' questions') + (terms.length ? ' found' : '') + topic;
    empty.hidden = total !== 0;
    updateButtons();
  }

  function writeLocation(category, hash = '', push = false) {
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    url.hash = hash;
    try {
      if (push) history.pushState(null, '', url);
      else history.replaceState(null, '', url);
    } catch (_) {
      // Filtering and disclosure controls still work if history access is unavailable.
    }
  }

  function revealLocation() {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get('category');
    activeCategory = links.some((link) => link.dataset.categoryLink === requested) ? requested : 'getting-started';
    search.value = '';
    let target = null;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) { /* Ignore a malformed fragment. */ }
    if (target && target.classList.contains('faq-item')) {
      activeCategory = target.closest('.faq-category').dataset.category;
      target.open = true;
    }
    render();
    if (target && target.classList.contains('faq-item')) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }

  links.forEach((link) => link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activeCategory = link.dataset.categoryLink;
    search.value = '';
    writeLocation(activeCategory, '', true);
    render();
    const browser = document.getElementById('faq-browser');
    if (browser.getBoundingClientRect().top < -24) browser.scrollIntoView({ block: 'start' });
  }));

  search.addEventListener('input', () => {
    activeCategory = 'all';
    writeLocation('all');
    render();
  });

  items.forEach((item) => item.addEventListener('toggle', updateButtons));
  expand.addEventListener('click', () => { visibleItems().forEach((item) => { item.open = true; }); updateButtons(); });
  collapse.addEventListener('click', () => { visibleItems().forEach((item) => { item.open = false; }); updateButtons(); });
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    activeCategory = 'all';
    writeLocation('all');
    render();
    search.focus();
  });
  document.querySelectorAll('.question-link').forEach((link) => link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = link.closest('.faq-item');
    activeCategory = target.closest('.faq-category').dataset.category;
    search.value = '';
    writeLocation(activeCategory, target.id, true);
    render();
    target.open = true;
    target.scrollIntoView({ block: 'start' });
  }));
  window.addEventListener('popstate', revealLocation);
  window.addEventListener('hashchange', revealLocation);
  document.querySelector('.search-panel').hidden = false;
  document.querySelector('.results-toolbar').hidden = false;
  revealLocation();
})();
