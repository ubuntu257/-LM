/* =============================================
   국립공원 굿즈 바코드북 - 앱 로직
   ============================================= */

(() => {
  'use strict';

  const DATA = window.BARCODE_DATA || { items: [], updated: '' };
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const $ = (id) => document.getElementById(id);
  const el = {
    q: $('q'), clear: $('clearBtn'), grid: $('grid'), count: $('count'),
    empty: $('empty'), chips: $('groupChips'), dis: $('showDiscontinued'),
    sort: $('sort'), print: $('printBtn'), info: $('dataInfo'), footer: $('footerInfo'),
    sheet: $('sheet'), sheetClose: $('sheetClose'), toast: $('toast'),
    dGroup: $('dGroup'), dName: $('dName'), dPrice: $('dPrice'),
    dBarcode: $('dBarcode'), dBc: $('dBc'), dCode: $('dCode'),
  };

  /* ── 검색 인덱스 ── */

  // 한글 문자열의 초성만 뽑아낸다. 한글이 아닌 글자는 그대로 둔다.
  function toCho(str) {
    let out = '';
    for (const ch of str) {
      const c = ch.charCodeAt(0);
      if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
      else out += ch;
    }
    return out;
  }

  const isChoOnly = (s) => /^[ㄱ-ㅎ]+$/.test(s);
  const squash = (s) => s.toLowerCase().replace(/\s+/g, '');

  const items = DATA.items.map((it, idx) => {
    // 표시용 이름: "(골)", "사용불가-" 같은 접두어를 뗀 실제 상품명
    const clean = it.name.replace(/^사용(불가|중지)\s*-\s*/, '').replace(/^\(.\)\s*/, '');
    return {
      ...it,
      _i: idx,
      clean,
      _name: squash(it.name),
      _cho: squash(toCho(it.name)),
      _bc: (it.bc || '').toLowerCase(),
      _code: (it.code || '').toLowerCase(),
    };
  });

  /* ── 상태 ── */
  const state = { q: '', group: '', dis: false, sort: 'name' };

  const groups = [...new Set(items.map((i) => i.grp).filter(Boolean))]
    .map((g) => ({ g, n: items.filter((i) => i.grp === g && !i.dis).length }))
    .sort((a, b) => b.n - a.n);

  /* ── 필터링 ── */
  function filtered() {
    const raw = state.q.trim();
    const q = squash(raw);
    const cho = isChoOnly(q);

    let list = items.filter((it) => {
      if (!state.dis && it.dis) return false;
      if (state.group && it.grp !== state.group) return false;
      if (!q) return true;
      if (cho) return it._cho.includes(q);
      return it._name.includes(q) || it._bc.includes(q) || it._code.includes(q);
    });

    const by = {
      name: (a, b) => a.clean.localeCompare(b.clean, 'ko'),
      no: (a, b) => a.n - b.n,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
    }[state.sort];
    return list.sort(by);
  }

  /* ── 바코드 렌더 ── */
  function drawBarcode(node, it, big) {
    if (!it.fmt) {
      node.innerHTML = '<p class="card-nobarcode">바코드 없음</p>';
      return;
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.innerHTML = '';
    node.appendChild(svg);
    try {
      JsBarcode(svg, it.bc, {
        format: it.fmt,
        width: big ? 2.4 : 1.6,
        height: big ? 80 : 42,
        fontSize: big ? 18 : 13,
        margin: 4,
        displayValue: true,
      });
    } catch (e) {
      node.innerHTML = '<p class="card-nobarcode">' + it.bc + '</p>';
    }
  }

  /* ── 목록 렌더 ── */
  const won = (v) => v.toLocaleString('ko-KR') + '원';

  function highlight(text, raw) {
    const q = raw.trim();
    if (!q || isChoOnly(squash(q))) return escapeHtml(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) +
      '</mark>' + escapeHtml(text.slice(i + q.length));
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function render() {
    const list = filtered();
    updateChipCounts();
    el.count.innerHTML = '<b>' + list.length + '</b>개 / 전체 ' + items.length + '개';
    el.empty.hidden = list.length > 0;

    const frag = document.createDocumentFragment();
    for (const it of list) {
      const card = document.createElement('button');
      card.className = 'card' + (it.dis ? ' dis' : '');
      card.type = 'button';
      card.dataset.bc = it.bc;
      card.dataset.code = it.code;
      card.innerHTML =
        '<div class="card-top">' +
          '<span class="card-name">' + highlight(it.clean, state.q) + '</span>' +
          '<span class="card-price">' + won(it.price) + '</span>' +
        '</div>' +
        '<div class="card-barcode" data-idx="' + it._i + '"></div>' +
        '<div class="card-meta">' +
          (it.grp ? '<span class="badge">' + it.grp + '</span>' : '') +
          (it.dis ? '<span class="badge badge-dis">단종</span>' : '') +
          '<span>' + it.code + '</span>' +
        '</div>';
      card.addEventListener('click', () => openSheet(it));
      frag.appendChild(card);
    }
    el.grid.replaceChildren(frag);
    // 전체(262개)를 다 그려도 100ms 남짓이라 한 번에 렌더한다.
    el.grid.querySelectorAll('.card-barcode').forEach((n) => drawBarcode(n, items[+n.dataset.idx], false));
  }

  /* ── 상세 ── */
  let current = null;

  function openSheet(it) {
    current = it;
    el.dGroup.textContent = (it.grp ? '(' + it.grp + ') ' : '') + (it.dis ? '· 단종 상품' : '');
    el.dName.textContent = it.clean;
    el.dPrice.textContent = won(it.price);
    el.dBc.textContent = it.bc || '없음';
    el.dCode.textContent = it.code;
    drawBarcode(el.dBarcode, it, true);
    el.sheet.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    el.sheet.hidden = true;
    current = null;
    document.body.style.overflow = '';
  }

  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 1600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('복사했습니다: ' + text);
  }

  /* ── 이벤트 ── */
  let debounce;
  el.q.addEventListener('input', () => {
    state.q = el.q.value;
    el.clear.hidden = !state.q;
    clearTimeout(debounce);
    debounce = setTimeout(render, 120);
  });

  // 바코드 스캐너(USB 건)는 스캔 후 Enter를 보낸다. 결과가 하나면 바로 상세를 연다.
  el.q.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    clearTimeout(debounce);
    render();
    const list = filtered();
    if (list.length === 1) openSheet(list[0]);
  });

  el.clear.addEventListener('click', () => {
    el.q.value = '';
    state.q = '';
    el.clear.hidden = true;
    render();
    el.q.focus();
  });

  el.dis.addEventListener('change', () => { state.dis = el.dis.checked; render(); });
  el.sort.addEventListener('change', () => { state.sort = el.sort.value; render(); });
  el.sheetClose.addEventListener('click', closeSheet);
  el.sheet.addEventListener('click', (e) => { if (e.target === el.sheet) closeSheet(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el.sheet.hidden) closeSheet();
  });

  el.sheet.querySelectorAll('.copy-btn').forEach((b) => {
    b.addEventListener('click', () => {
      if (!current) return;
      const v = b.dataset.copy === 'bc' ? current.bc : current.code;
      if (v) copy(v);
    });
  });

  // 현재 검색 결과 그대로 A4 3열 바코드북으로 인쇄된다.
  el.print.addEventListener('click', () => window.print());

  /* ── 초기화 ── */
  const chipRefs = [];

  function initChips() {
    const mk = (label, value) => {
      const b = document.createElement('button');
      b.className = 'chip' + (value === state.group ? ' on' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        state.group = value;
        el.chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        render();
      });
      chipRefs.push({ btn: b, grp: value });
      return b;
    };
    el.chips.appendChild(mk('전체', ''));
    groups.forEach((g) => el.chips.appendChild(mk(g.g, g.g)));
  }

  // 칩에 표시하는 개수는 "단종 포함" 설정에 따라 달라진다.
  function updateChipCounts() {
    const pool = state.dis ? items : items.filter((i) => !i.dis);
    for (const { btn, grp } of chipRefs) {
      const n = grp ? pool.filter((i) => i.grp === grp).length : pool.length;
      btn.textContent = (grp || '전체') + ' ' + n;
    }
  }

  initChips();
  render();

  const info = '상품 ' + items.length + '개 · ' + DATA.updated + ' 기준';
  el.info.textContent = info;
  el.footer.textContent = info + ' (원본: ' + (DATA.source || '바코드북.xls') + ')';

  // 데스크톱에서는 바로 입력할 수 있도록 검색창에 포커스 (모바일 키보드는 띄우지 않음)
  if (window.matchMedia('(min-width: 641px)').matches) el.q.focus();
})();
