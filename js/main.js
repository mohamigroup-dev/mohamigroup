document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('catalogue-grid');
  var pagNav = document.getElementById('catalogue-pagination');
  var PER_PAGE = 12;
  var currentPage = 1;

  function getCatalogueCards() {
    return grid ? grid.querySelectorAll('[data-cat]') : [];
  }

  function getActiveFilter() {
    var active = document.querySelector('[data-filter].bg-orange-brand');
    return active ? active.getAttribute('data-filter') : 'tous';
  }

  function buildPageList(totalPages, cur) {
    if (totalPages <= 9) {
      var a = [];
      for (var i = 1; i <= totalPages; i++) a.push(i);
      return a;
    }
    var set = {};
    [1, totalPages, cur, cur - 1, cur + 1, cur - 2, cur + 2].forEach(function (n) {
      if (n >= 1 && n <= totalPages) set[n] = true;
    });
    var arr = Object.keys(set)
      .map(function (k) {
        return parseInt(k, 10);
      })
      .sort(function (x, y) {
        return x - y;
      });
    var out = [];
    for (var k = 0; k < arr.length; k++) {
      if (k > 0 && arr[k] - arr[k - 1] > 1) out.push(null);
      out.push(arr[k]);
    }
    return out;
  }

  function renderPaginationUI(totalPages, totalMatching) {
    if (!pagNav) return;
    if (totalMatching === 0) {
      pagNav.innerHTML = '';
      pagNav.hidden = true;
      return;
    }
    pagNav.hidden = false;
    pagNav.innerHTML = '';

    var baseInactive =
      'min-w-[2.25rem] px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border-2 border-[#002d62] text-navy bg-white hover:bg-gray-50 transition';
    var baseActive =
      'min-w-[2.25rem] px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border-2 border-[#ff8c00] bg-[#ff8c00] text-white';
    var baseDisabled =
      'min-w-[2.25rem] px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border-2 border-[#002d62] text-navy bg-white opacity-40 cursor-not-allowed';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.setAttribute('data-page-action', 'prev');
    prev.textContent = 'Précédent';
    prev.className = currentPage <= 1 ? baseDisabled : baseInactive;
    prev.disabled = currentPage <= 1;
    pagNav.appendChild(prev);

    var items = buildPageList(totalPages, currentPage);
    for (var i = 0; i < items.length; i++) {
      if (items[i] === null) {
        var ell = document.createElement('span');
        ell.className = 'px-2 text-navy font-bold text-xs';
        ell.textContent = '…';
        ell.setAttribute('aria-hidden', 'true');
        pagNav.appendChild(ell);
        continue;
      }
      var pn = items[i];
      var pb = document.createElement('button');
      pb.type = 'button';
      pb.setAttribute('data-page-action', 'goto');
      pb.setAttribute('data-page-num', String(pn));
      pb.textContent = String(pn);
      pb.className = pn === currentPage ? baseActive : baseInactive;
      if (pn === currentPage) {
        pb.setAttribute('aria-current', 'page');
      }
      pagNav.appendChild(pb);
    }

    var next = document.createElement('button');
    next.type = 'button';
    next.setAttribute('data-page-action', 'next');
    next.textContent = 'Suivant';
    next.className = currentPage >= totalPages ? baseDisabled : baseInactive;
    next.disabled = currentPage >= totalPages;
    pagNav.appendChild(next);
  }

  function syncCatalogueView() {
    if (!grid || !pagNav) return;
    var cards = getCatalogueCards();
    if (!cards.length) return;

    var filter = getActiveFilter();
    var totalMatching = 0;
    for (var i = 0; i < cards.length; i++) {
      var cat = cards[i].getAttribute('data-cat');
      if (filter === 'tous' || cat === filter) totalMatching++;
    }

    var totalPages = Math.max(1, Math.ceil(totalMatching / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PER_PAGE;
    var end = start + PER_PAGE;
    var idx = 0;
    for (var j = 0; j < cards.length; j++) {
      var card = cards[j];
      var c = card.getAttribute('data-cat');
      var inFilter = filter === 'tous' || c === filter;
      if (!inFilter) {
        card.style.display = 'none';
        continue;
      }
      if (idx >= start && idx < end) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
      idx++;
    }

    renderPaginationUI(totalPages, totalMatching);
  }

  if (pagNav && grid) {
    pagNav.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-page-action]');
      if (!btn || btn.disabled) return;
      var action = btn.getAttribute('data-page-action');
      var filter = getActiveFilter();
      var cards = getCatalogueCards();
      var totalMatching = 0;
      for (var i = 0; i < cards.length; i++) {
        var cat = cards[i].getAttribute('data-cat');
        if (filter === 'tous' || cat === filter) totalMatching++;
      }
      var totalPages = Math.max(1, Math.ceil(totalMatching / PER_PAGE));

      if (action === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (action === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else if (action === 'goto') {
        var n = parseInt(btn.getAttribute('data-page-num'), 10);
        if (!isNaN(n)) currentPage = n;
      }
      syncCatalogueView();
    });
  }

  var filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length && grid) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentPage = 1;
        filterBtns.forEach(function (b) {
          b.classList.remove('bg-orange-brand', 'text-white', 'border-transparent');
          b.classList.add('border-navy', 'text-navy');
        });
        btn.classList.add('bg-orange-brand', 'text-white', 'border-transparent');
        btn.classList.remove('border-navy', 'text-navy');
        syncCatalogueView();
      });
    });
    syncCatalogueView();
  }

  var burger = document.querySelector('[data-nav-burger]');
  var panel = document.querySelector('[data-nav-panel]');

  if (burger && panel) {
    function closeMobileNav() {
      panel.classList.add('hidden');
      burger.setAttribute('aria-expanded', 'false');
    }

    function toggleMobileNav() {
      panel.classList.toggle('hidden');
      burger.setAttribute(
        'aria-expanded',
        panel.classList.contains('hidden') ? 'false' : 'true'
      );
    }

    burger.addEventListener('click', function () {
      toggleMobileNav();
    });

    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileNav();
      });
    });

    window
      .matchMedia('(min-width: 1024px)')
      .addEventListener('change', function (e) {
        if (e.matches) {
          closeMobileNav();
        }
      });
  }
});
