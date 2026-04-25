// 3PL Inventory - Sample Data Generator
const SampleData = {
  companies: [
    { id:'comp_001', name:'한국전자 주식회사', code:'KE2024', password:'1234', role:'client', contactName:'김철수', contactPhone:'010-1234-5678', contractDate:'2024-01-15', logoColor:'#6366f1' },
    { id:'comp_002', name:'프레시푸드 코리아', code:'FF2024', password:'1234', role:'client', contactName:'박미영', contactPhone:'010-2345-6789', contractDate:'2024-02-20', logoColor:'#10b981' },
    { id:'comp_003', name:'스타일웨어 패션', code:'SW2024', password:'1234', role:'client', contactName:'이정민', contactPhone:'010-3456-7890', contractDate:'2024-03-10', logoColor:'#f59e0b' },
    { id:'comp_004', name:'헬스케어플러스', code:'HC2024', password:'1234', role:'client', contactName:'최수진', contactPhone:'010-4567-8901', contractDate:'2024-04-05', logoColor:'#ef4444' },
    { id:'comp_admin', name:'스마트물류 3PL', code:'ADMIN', password:'admin', role:'admin', contactName:'관리자', contactPhone:'02-1234-5678', contractDate:'2023-01-01', logoColor:'#8b5cf6' }
  ],

  products: [
    // 한국전자
    { id:'prod_001', companyId:'comp_001', name:'무선 블루투스 이어폰 Pro', sku:'WBE-PRO-001', category:'전자제품', currentStock:1250, safetyStock:200, unit:'개', location:'A-01-01', price:89000, weight:0.15 },
    { id:'prod_002', companyId:'comp_001', name:'USB-C 고속 충전기 65W', sku:'CHG-65W-002', category:'전자제품', currentStock:85, safetyStock:100, unit:'개', location:'A-01-02', price:35000, weight:0.2 },
    { id:'prod_003', companyId:'comp_001', name:'스마트워치 밴드 (실리콘)', sku:'SWB-SIL-003', category:'액세서리', currentStock:3200, safetyStock:500, unit:'개', location:'A-02-01', price:15000, weight:0.05 },
    { id:'prod_004', companyId:'comp_001', name:'포터블 보조배터리 20000mAh', sku:'PBT-20K-004', category:'전자제품', currentStock:420, safetyStock:150, unit:'개', location:'A-02-03', price:42000, weight:0.35 },
    { id:'prod_005', companyId:'comp_001', name:'노이즈캔슬링 헤드폰', sku:'NCH-BLK-005', category:'전자제품', currentStock:30, safetyStock:50, unit:'개', location:'A-03-01', price:189000, weight:0.28 },
    // 프레시푸드
    { id:'prod_006', companyId:'comp_002', name:'프리미엄 견과류 믹스 500g', sku:'NUT-MIX-001', category:'식품', currentStock:5600, safetyStock:1000, unit:'봉', location:'B-01-01', price:12000, weight:0.5 },
    { id:'prod_007', companyId:'comp_002', name:'유기농 그래놀라 바', sku:'GRN-BAR-002', category:'식품', currentStock:180, safetyStock:300, unit:'박스', location:'B-01-02', price:28000, weight:1.2 },
    { id:'prod_008', companyId:'comp_002', name:'콤부차 오리지널 350ml', sku:'KBC-ORI-003', category:'음료', currentStock:8200, safetyStock:2000, unit:'병', location:'B-02-01', price:3500, weight:0.38 },
    { id:'prod_009', companyId:'comp_002', name:'단백질 쉐이크 파우더 1kg', sku:'PRT-PWD-004', category:'건강식품', currentStock:920, safetyStock:200, unit:'통', location:'B-02-02', price:45000, weight:1.1 },
    // 스타일웨어
    { id:'prod_010', companyId:'comp_003', name:'오버핏 코튼 티셔츠 (화이트)', sku:'TSH-WHT-001', category:'의류', currentStock:2100, safetyStock:300, unit:'장', location:'C-01-01', price:29000, weight:0.2 },
    { id:'prod_011', companyId:'comp_003', name:'슬림핏 데님 팬츠', sku:'DNM-SLM-002', category:'의류', currentStock:45, safetyStock:100, unit:'벌', location:'C-01-02', price:59000, weight:0.6 },
    { id:'prod_012', companyId:'comp_003', name:'캔버스 스니커즈 (블랙)', sku:'SNK-BLK-003', category:'신발', currentStock:780, safetyStock:150, unit:'켤레', location:'C-02-01', price:49000, weight:0.7 },
    // 헬스케어플러스
    { id:'prod_013', companyId:'comp_004', name:'비타민C 1000mg 60정', sku:'VTC-1K-001', category:'건강식품', currentStock:4500, safetyStock:500, unit:'병', location:'D-01-01', price:18000, weight:0.12 },
    { id:'prod_014', companyId:'comp_004', name:'오메가3 피쉬오일 120캡슐', sku:'OMG-FO-002', category:'건강식품', currentStock:60, safetyStock:100, unit:'병', location:'D-01-02', price:32000, weight:0.18 },
    { id:'prod_015', companyId:'comp_004', name:'프로바이오틱스 유산균', sku:'PRB-LC-003', category:'건강식품', currentStock:2800, safetyStock:400, unit:'박스', location:'D-02-01', price:25000, weight:0.08 },
  ],

  generateTransactions() {
    const txns = [];
    const types = ['inbound','outbound'];
    const today = new Date();
    let id = 1;
    this.products.forEach(p => {
      for (let d = 0; d < 30; d++) {
        if (Math.random() > 0.4) continue;
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        date.setHours(Math.floor(Math.random()*10)+8, Math.floor(Math.random()*60));
        const type = types[Math.floor(Math.random()*2)];
        const qty = type === 'inbound'
          ? Math.floor(Math.random()*300)+50
          : Math.floor(Math.random()*150)+10;
        txns.push({
          id: 'txn_' + String(id++).padStart(3,'0'),
          companyId: p.companyId,
          productId: p.id,
          type,
          quantity: qty,
          date: date.toISOString(),
          reference: (type==='inbound'?'PO':'SO') + '-' + date.getFullYear() + '-' + String(id).padStart(4,'0'),
          note: type==='inbound' ? '정기 입고' : '주문 출고',
          processedBy: '관리자'
        });
      }
    });
    return txns.sort((a,b) => new Date(b.date)-new Date(a.date));
  }
};
