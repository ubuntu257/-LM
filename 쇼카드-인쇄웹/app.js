/**
 * 쇼카드 가격표 인쇄 웹앱 - app.js v2
 */

/* ── 상태 ── */
const state = {
  items: [],
  theme: 'beige',
  bgImageUrl: null,
  cols: 4,
  currency: '₩',
  nameColor: '#111111',
  brandColor: '#cc0000',
  priceColor: '#111111',
  perPage: 8,
  cardWidthMm: 95,   // mm
  cardHeightMm: 35,  // mm
  nameSize: 12,      // px
  brandSize: 11,     // px
  brandNameGap: 0,   // px
  priceSize: 20,     // px
  promoBadgeSize: 10,  // px
  origPriceSize: 11,   // px
  salePriceSize: 20,   // px
};

/* ── DOM 참조 ── */
const $ = (id) => document.getElementById(id);

const excelInput       = $('excelInput');
const excelDropZone    = $('excelDropZone');
const uploadStatus     = $('uploadStatus');
const bgImageInput     = $('bgImageInput');
const bgFilename       = $('bgFilename');
const clearBgBtn       = $('clearBgBtn');
const customBgZone     = $('customBgZone');
const bgCustomThumb    = $('bgCustomThumb');
const colsSelect       = $('colsSelect');
const currencySelect   = $('currencySelect');
const brandColorPicker = $('brandColorPicker');
const perPageSelect    = $('perPageSelect');
const cardWidthInput   = $('cardWidthInput');
const cardHeightInput  = $('cardHeightInput');
const cardsGrid        = $('cardsGrid');
const cardsPreviewWrap = $('cardsPreviewWrap');
const emptyState       = $('emptyState');
const tagCount         = $('tagCount');
const printBtn         = $('printBtn');
const clearAllBtn      = $('clearAllBtn');
const printArea        = $('printArea');
const addSingleBtn     = $('addSingleBtn');
const downloadBtn      = $('downloadTemplateBtn');
const nameColorPicker  = $('nameColorPicker');
const priceColorPicker = $('priceColorPicker');
const nameSizeInput    = $('nameSizeInput');
const brandSizeInput   = $('brandSizeInput');
const brandNameGapInput = $('brandNameGapInput');
const priceSizeInput   = $('priceSizeInput');
const promoBadgeSizeInput = $('promoBadgeSizeInput');
const origPriceSizeInput = $('origPriceSizeInput');
const salePriceSizeInput = $('salePriceSizeInput');

/* ── 엑셀 파싱 (A=상품명 B=브랜드명 C=가격 D=할인문구 E=행사가격) ── */
function parseExcel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 1) {
        showUploadStatus('데이터가 없습니다.', 'err');
        return;
      }

      // 첫 행 헤더 여부 판단
      const firstRow = rows[0];
      const hasHeader = firstRow && isNaN(Number(String(firstRow[2] || '').replace(/[^0-9]/g, '') || 'NaN'));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const items = [];
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.every(v => v == null || String(v).trim() === '')) continue;

        const name      = row[0] != null ? String(row[0]).trim() : '';
        const brand     = row[1] != null ? String(row[1]).trim() : '';
        const priceRaw  = row[2] != null ? String(row[2]).trim() : '';
        const price     = priceRaw.replace(/[^0-9]/g, '');
        const promo     = row[3] != null ? String(row[3]).trim() : '';
        const saleRaw   = row[4] != null ? String(row[4]).trim() : '';
        const salePrice = saleRaw.replace(/[^0-9]/g, '');

        if (!price) continue;

        items.push({
          id: Date.now() + i + Math.random(),
          name: name || '상품명',
          brand,
          price,
          promo,
          salePrice,
        });
      }

      if (items.length === 0) {
        showUploadStatus('인식된 상품이 없습니다. C열(가격)을 확인하세요.', 'err');
        return;
      }

      state.items = [...state.items, ...items];
      showUploadStatus(`✅ ${items.length}개 상품 로드 완료!`, 'ok');
      excelDropZone.classList.add('success');
      renderAll();
    } catch (err) {
      console.error(err);
      showUploadStatus('파일을 읽을 수 없습니다.', 'err');
    }
  };
  reader.readAsArrayBuffer(file);
}

function showUploadStatus(msg, type) {
  uploadStatus.textContent = msg;
  uploadStatus.className = `upload-status ${type}`;
}

/* ── 유틸 ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(price) {
  return Number(price).toLocaleString('ko-KR');
}

/* ── Z자 화살표 SVG ── */
function zArrowSvg() {
  return `<svg class="z-arrow-svg" viewBox="0 0 30 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3 H24 L6 23 H28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 18 L28 23 L23 28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ── 가격 영역 HTML 생성 ── */
function buildPriceSection(item) {
  const currency = escHtml(state.currency);
  const priceColorStyle = `style="color:${escHtml(state.priceColor)}"`;

  if (item.salePrice) {
    // 행사가격: 위(원가 취소선 + 행사제품 박스), 아래(행사가격) 세로 배치
    return `
      <div class="card-price-section has-sale">
        <div class="sale-top-row">
          <div class="price-original-row" style="color: #e53935; text-decoration: line-through;">
            <span class="price-orig-sym">${currency}</span>
            <span class="price-orig-num">${formatPrice(item.price)}</span>
            <span class="price-orig-won">원</span>
          </div>
          <span class="sale-badge">행사제품</span>
        </div>
        <div class="price-sale-row" ${priceColorStyle}>
          <span class="card-currency">${currency}</span>
          <span class="card-price">${formatPrice(item.salePrice)}</span>
          <span class="card-won">원</span>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="card-price-section" ${priceColorStyle}>
        <span class="card-currency">${currency}</span>
        <span class="card-price">${formatPrice(item.price)}</span>
        <span class="card-won">원</span>
      </div>
    `;
  }
}

/* ── 가격표 HTML 생성 ── */
function buildCardHTML(item, isPrint = false) {
  const theme = state.theme;
  const cls   = isPrint ? 'price-card print-card' : 'price-card';

  let bgStyle = '';
  if (theme === 'custom' && state.bgImageUrl) {
    bgStyle = `style="background-image: url('${state.bgImageUrl}'); background-size: cover; background-position: center;"`;
  }

  // 인쇄 시 정확한 mm 크기 적용
  const sizeStyle = isPrint
    ? `style="width:${state.cardWidthMm}mm; height:${state.cardHeightMm}mm; ${theme === 'custom' && state.bgImageUrl ? `background-image:url('${state.bgImageUrl}');background-size:cover;background-position:center;` : ''}"`
    : bgStyle;

  const promoBadge = item.promo
    ? `<div class="card-promo">${escHtml(item.promo)}</div>`
    : '';

  const brandHtml = item.brand
    ? `<div class="card-brand" style="color:${escHtml(state.brandColor)}">${escHtml(item.brand)}</div>`
    : '';

  const deleteBtn = isPrint
    ? ''
    : `<button class="card-delete" data-id="${item.id}" title="삭제">✕</button>`;

  const priceSection = buildPriceSection(item);

  return `
    <div class="${cls} theme-${escHtml(theme)}" data-id="${item.id}" ${sizeStyle}>
      ${deleteBtn}
      <div class="card-inner">
        ${brandHtml}
        <div class="card-top">
          ${promoBadge}
          <div class="card-name" style="color:${escHtml(state.nameColor)}">${escHtml(item.name)}</div>
        </div>
        ${priceSection}
      </div>
    </div>
  `;
}

/* ── CSS 변수 업데이트 (카드 크기 및 폰트) ── */
function updateCardSizeCss() {
  document.documentElement.style.setProperty('--card-width', state.cardWidthMm + 'mm');
  document.documentElement.style.setProperty('--card-height', state.cardHeightMm + 'mm');
  document.documentElement.style.setProperty('--name-size', state.nameSize + 'px');
  document.documentElement.style.setProperty('--brand-size', state.brandSize + 'px');
  document.documentElement.style.setProperty('--brand-name-gap', state.brandNameGap + 'px');
  document.documentElement.style.setProperty('--price-size', state.priceSize + 'px');
  document.documentElement.style.setProperty('--promo-badge-size', state.promoBadgeSize + 'px');
  document.documentElement.style.setProperty('--orig-price-size', state.origPriceSize + 'px');
  document.documentElement.style.setProperty('--sale-price-size', state.salePriceSize + 'px');
}

/* ── 전체 렌더링 ── */
function renderAll() {
  updateCardSizeCss();

  if (state.items.length === 0) {
    emptyState.style.display       = 'flex';
    cardsPreviewWrap.style.display = 'none';
    printBtn.disabled = true;
    tagCount.textContent = '0개';
    return;
  }

  emptyState.style.display       = 'none';
  cardsPreviewWrap.style.display = 'block';
  printBtn.disabled = false;
  tagCount.textContent = `${state.items.length}개`;

  cardsGrid.innerHTML = state.items.map(item => buildCardHTML(item, false)).join('');

  // 삭제 버튼 이벤트
  cardsGrid.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      state.items = state.items.filter(i => String(i.id) !== id);
      if (state.items.length === 0) {
        uploadStatus.textContent = '';
        uploadStatus.className = 'upload-status';
        excelDropZone.classList.remove('success');
      }
      renderAll();
    });
  });
}

/* ── 인쇄 ── */
function buildPrintPages() {
  const pages = [];
  const perPage = state.perPage;
  for (let i = 0; i < state.items.length; i += perPage) {
    const chunk = state.items.slice(i, i + perPage);
    const tagsHtml = chunk.map(item => buildCardHTML(item, true)).join('');
    pages.push(`
      <div class="print-page">
        <div class="print-grid">
          ${tagsHtml}
        </div>
      </div>
    `);
  }
  return pages.join('');
}

function doPrint() {
  printArea.innerHTML = buildPrintPages();
  setTimeout(() => window.print(), 100);
}

/* ── 엑셀 템플릿 다운로드 ── */
function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['상품명', '브랜드명', '가격', '할인문구', '행사가격'],
    ['반달이 가방걸이', '골든베어상사', '10000', '이번주 특가', ''],
    ['해태 허니버터칩', '해태제과', '1500', '', '1200'],
    ['오징어 스낵', '농심', '1000', '2개 1500원', ''],
    ['초코파이', '오리온', '3500', '행사상품', '2500'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '가격표 데이터');
  XLSX.writeFile(wb, '쇼카드_템플릿.xlsx');
}

/* ── 단일 입력 추가 ── */
function addSingleItem() {
  const name      = $('singleName').value.trim();
  const brand     = $('singleBrand').value.trim();
  const price     = $('singlePrice').value.trim().replace(/[^0-9]/g, '');
  const promo     = $('singlePromo').value.trim();
  const salePrice = $('singleSalePrice').value.trim().replace(/[^0-9]/g, '');

  if (!name || !price) {
    if (!name) { const el = $('singleName'); el.style.borderColor = '#ff6b6b'; el.focus(); setTimeout(() => { el.style.borderColor = ''; }, 2000); }
    if (!price) { const el = $('singlePrice'); el.style.borderColor = '#ff6b6b'; el.focus(); setTimeout(() => { el.style.borderColor = ''; }, 2000); }
    return;
  }

  state.items.push({
    id: Date.now() + Math.random(),
    name, brand, price, promo, salePrice,
  });

  ['singleName', 'singleBrand', 'singlePrice', 'singlePromo', 'singleSalePrice']
    .forEach(id => { $(id).value = ''; });
  $('singleName').focus();

  renderAll();
}

/* ═══════════════════════════════════════
   이벤트 바인딩
═══════════════════════════════════════ */

// 엑셀 업로드
excelInput.addEventListener('change', (e) => {
  if (e.target.files[0]) parseExcel(e.target.files[0]);
});

// 드래그 앤 드롭
excelDropZone.addEventListener('dragover', (e) => { e.preventDefault(); excelDropZone.classList.add('drag-over'); });
excelDropZone.addEventListener('dragleave', () => excelDropZone.classList.remove('drag-over'));
excelDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  excelDropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) parseExcel(file);
});
excelDropZone.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') excelInput.click();
});

// 테마 선택
document.querySelectorAll('input[name="theme"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    state.theme = e.target.value;
    customBgZone.style.display = state.theme === 'custom' ? 'flex' : 'none';
    renderAll();
  });
});

// 배경 이미지 업로드
bgImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  state.bgImageUrl = url;
  bgFilename.textContent = file.name;
  bgCustomThumb.style.backgroundImage = `url('${url}')`;
  bgCustomThumb.style.backgroundSize  = 'cover';
  bgCustomThumb.style.backgroundPosition = 'center';
  bgCustomThumb.innerHTML = '<span class="prev-emoji" style="text-shadow:0 1px 3px rgba(0,0,0,.8)">🖼️</span><span class="theme-label">내 이미지</span>';
  renderAll();
});

clearBgBtn.addEventListener('click', () => {
  state.bgImageUrl = null;
  bgFilename.textContent = '선택된 파일 없음';
  bgImageInput.value = '';
  bgCustomThumb.style.backgroundImage = '';
  bgCustomThumb.innerHTML = '<span class="prev-emoji">🖼️</span><span class="theme-label">내 이미지</span>';
  renderAll();
});

// 설정 변경
colsSelect.addEventListener('change', (e) => { state.cols = Number(e.target.value); renderAll(); });
currencySelect.addEventListener('change', (e) => { state.currency = e.target.value; renderAll(); });
brandColorPicker.addEventListener('input', (e) => { state.brandColor = e.target.value; renderAll(); });
perPageSelect.addEventListener('change', (e) => { state.perPage = Number(e.target.value); });

// 카드 크기 변경
cardWidthInput.addEventListener('change', (e) => {
  state.cardWidthMm = Math.max(50, Math.min(200, Number(e.target.value) || 95));
  e.target.value = state.cardWidthMm;
  renderAll();
});
cardHeightInput.addEventListener('change', (e) => {
  state.cardHeightMm = Math.max(15, Math.min(150, Number(e.target.value) || 35));
  e.target.value = state.cardHeightMm;
  renderAll();
});

// 인쇄
printBtn.addEventListener('click', doPrint);

// 전체 삭제
clearAllBtn.addEventListener('click', () => {
  if (state.items.length === 0) return;
  if (confirm(`가격표 ${state.items.length}개를 모두 삭제할까요?`)) {
    state.items = [];
    uploadStatus.textContent = '';
    uploadStatus.className = 'upload-status';
    excelDropZone.classList.remove('success');
    renderAll();
  }
});

// 단일 추가
addSingleBtn.addEventListener('click', addSingleItem);
$('singlePrice').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSingleItem(); });
$('singleSalePrice').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSingleItem(); });

// 폰트 및 간격 크기 변경 (값 표시 업데이트 포함)
nameSizeInput.addEventListener('input', (e) => { 
  state.nameSize = Number(e.target.value); 
  $('nameSizeVal').textContent = state.nameSize;
  updateCardSizeCss(); 
});
brandSizeInput.addEventListener('input', (e) => { 
  state.brandSize = Number(e.target.value); 
  $('brandSizeVal').textContent = state.brandSize;
  updateCardSizeCss(); 
});
brandNameGapInput.addEventListener('input', (e) => { 
  state.brandNameGap = Number(e.target.value); 
  $('brandNameGapVal').textContent = state.brandNameGap;
  updateCardSizeCss(); 
});
priceSizeInput.addEventListener('input', (e) => { 
  state.priceSize = Number(e.target.value); 
  $('priceSizeVal').textContent = state.priceSize;
  updateCardSizeCss(); 
});
promoBadgeSizeInput.addEventListener('input', (e) => { 
  state.promoBadgeSize = Number(e.target.value); 
  $('promoBadgeSizeVal').textContent = state.promoBadgeSize;
  updateCardSizeCss(); 
});
origPriceSizeInput.addEventListener('input', (e) => { 
  state.origPriceSize = Number(e.target.value); 
  $('origPriceSizeVal').textContent = state.origPriceSize;
  updateCardSizeCss(); 
});
salePriceSizeInput.addEventListener('input', (e) => { 
  state.salePriceSize = Number(e.target.value); 
  $('salePriceSizeVal').textContent = state.salePriceSize;
  updateCardSizeCss(); 
});

// 초기 렌더링
nameColorPicker.addEventListener('input', (e) => { state.nameColor = e.target.value; renderAll(); });
priceColorPicker.addEventListener('input', (e) => { state.priceColor = e.target.value; renderAll(); });
renderAll();
