// PROTOTYPE - NOT FOR PRODUCTION
// Question: 지원서만 보고 고른 기업을 조달 카드로 키워 순위전에서 살아남게 하는 판단이 12턴 동안 재미있는가?
// Date: 2026-11-13
// 게임 데이터: 스탯, 특성, 지원 기업, 조달 지원 카드. 숫자 튜닝 값은 config.js에 있다.
'use strict';

// 육각형 6스탯. 순서가 육각형의 꼭짓점 순서다.
// desc: 마우스를 올리면 보이는 짧은 설명. up: 이 능력치를 올려 주는 카드 분야(도움말에 쓴다).
const STATS = [
  { key: 'tech', name: '기술력', desc: '제품에 담긴 기술 수준', up: '기술 개발, 품질 보증' },
  { key: 'pub', name: '공공성', desc: '공공기관과 국민에게 쓸모 있는 정도', up: '먼저 써보기, 판매처 넓히기' },
  { key: 'qual', name: '품질신뢰', desc: '고장 없이 믿고 쓸 수 있는 정도', up: '품질 보증, 전문가 상담' },
  { key: 'prod', name: '생산능력', desc: '주문이 몰려도 제때 만들어 내는 힘', up: '기술 개발, 원자재 지원' },
  { key: 'fin', name: '재무안정', desc: '자금이 넉넉해 오래 버티는 힘', up: '전문가 상담, 원자재 지원' },
  { key: 'mkt', name: '시장성', desc: '민간·해외에서도 팔릴 가능성', up: '판매처 넓히기, 함께 키우기' },
];
const STAT_DESC = Object.fromEntries(STATS.map(s => [s.key, s.desc]));
const CORE_TIP = '핵심 역량: 이 기업의 성장 속도를 가장 크게 좌우하는 능력치 2개 (다른 능력치보다 2배로 반영)';
const STAT_NAME = Object.fromEntries(STATS.map(s => [s.key, s.name]));

// 특성: good(장점) / bad(단점). 효과는 index.html의 성장 엔진과 카드 적용에서 읽는다.
// kindMul: 카드 종류별 효과 배율 ('good' = tune.goodFactor, 'bad' = tune.mismatchFactor, 숫자 = 그대로)
const TRAITS = {
  field:    { name: '현장에 강한 팀', good: true,  desc: "'먼저 써보기' 카드 효과 2배", kindMul: { trial: 'good' } },
  star:     { name: '유명한 창업자', good: true, desc: "'홍보' 카드 효과 2배 · 매달 기업가치 +1%", kindMul: { pr: 'good' }, monthly: 0.01 },
  cashpoor: { name: '부족한 자금', good: false, desc: "재무안정 40 미만이면 매달 기업가치 −2%" },
  steady:   { name: '꾸준한 성장', good: true,  desc: "매달 성장률 흔들림 절반" },
  exec:     { name: '노련한 경영진', good: true, desc: "매달 기업가치 +0.8% · 혁신제품 지정에 기술력 55 필요", monthly: 0.008 },
  material: { name: '높은 원자재 의존', good: false, desc: "'원자재 지원' 카드 효과 2배 · 원자재 지원 없는 달 −1%", kindMul: { stock: 'good' } },
  civic:    { name: '깊은 공공 이해', good: true,  desc: "공공성 오르는 폭 1.5배" },
  qa:       { name: '꼼꼼한 품질팀', good: true, desc: "품질신뢰 매달 +1 자동 상승" },
  clumsy:   { name: '서투른 소통', good: false, desc: "'판매처 넓히기' 카드 효과 −30%", kindMul: { sales: 0.7 } },
  patent:   { name: '풍부한 특허', good: true,  desc: "'품질 보증' 카드 비용 −30%" },
  cto:      { name: '고집 센 기술 대표', good: false, desc: "'기술 개발' 카드 효과 1.5배 · '전문가 상담' 카드 효과 절반", kindMul: { rnd: 1.5, consult: 'bad' } },
  volatile: { name: '큰 실적 기복', good: false, desc: "매달 성장률 흔들림 2배" },
  late:     { name: '늦은 성장 시동', good: true, desc: "1·2분기 매달 −1% · 3분기부터 매달 +3%" },
  export:   { name: '강한 수출 역량', good: true,  desc: "시장성 오르는 폭 1.5배 · G-PASS 지정 조건 시장성 45로 완화" },
  solo:     { name: '1인 개발팀', good: false, desc: "한 달에 카드 1장만 · 대신 모든 카드 효과 1.3배" },
  lab:      { name: '약한 생산 기반', good: false, desc: "생산능력 오르는 폭 절반 · '원자재 지원' 카드 효과 절반", kindMul: { stock: 'bad' } },
};

// 지원 기업 14곳. quarter: 지원서가 들어오는 분기. core: 핵심 역량 2개(성장 점수에서 가중치 0.25씩).
// art: art.js의 제품 그림. energy: 리튬 비축 카드와 연계되는 배터리·에너지 업종.
const COMPANIES = [
  { id: 'c01', quarter: 1, name: '하늘눈드론', product: 'AI 화재감지 드론', sector: '안전·드론', art: 'drone',
    stats: { tech: 72, pub: 66, qual: 46, prod: 40, fin: 36, mkt: 55 }, core: ['tech', 'pub'], traits: ['field', 'star', 'cashpoor'] },
  { id: 'c02', quarter: 1, name: '볼트셀에너지', product: '공공건물용 소형 ESS', sector: '에너지', art: 'ess', energy: true,
    stats: { tech: 58, pub: 50, qual: 62, prod: 70, fin: 60, mkt: 50 }, core: ['prod', 'qual'], traits: ['steady', 'exec', 'material'] },
  { id: 'c03', quarter: 1, name: '숨결센서랩', product: '교실 공기질 IoT 센서', sector: '환경·IoT', art: 'sensor',
    stats: { tech: 64, pub: 74, qual: 55, prod: 45, fin: 50, mkt: 40 }, core: ['pub', 'qual'], traits: ['civic', 'qa', 'clumsy'] },
  { id: 'c04', quarter: 1, name: '뉴로매틱스', product: '민원 상담 AI', sector: 'AI 소프트웨어', art: 'aibot',
    stats: { tech: 86, pub: 45, qual: 50, prod: 32, fin: 42, mkt: 60 }, core: ['tech', 'mkt'], traits: ['patent', 'export', 'cto'] },
  { id: 'c05', quarter: 1, name: '그린필터텍', product: '재난 대비 이동식 정수기', sector: '환경', art: 'filter',
    stats: { tech: 48, pub: 62, qual: 58, prod: 55, fin: 62, mkt: 44 }, core: ['pub', 'fin'], traits: ['late', 'steady', 'clumsy'] },
  { id: 'c06', quarter: 1, name: '로보핸즈', product: '재난 구조 로봇팔', sector: '로봇', art: 'robotarm',
    stats: { tech: 74, pub: 58, qual: 40, prod: 36, fin: 34, mkt: 52 }, core: ['tech', 'pub'], traits: ['field', 'export', 'solo'] },

  { id: 'c07', quarter: 2, name: '메디웨이브', product: '휴대용 심전도 패치', sector: '의료기기', art: 'ecg',
    stats: { tech: 74, pub: 60, qual: 70, prod: 44, fin: 54, mkt: 48 }, core: ['qual', 'tech'], traits: ['qa', 'patent', 'lab'] },
  { id: 'c08', quarter: 2, name: '차지온', product: '공공주차장 EV 충전기', sector: '에너지·모빌리티', art: 'charger', energy: true,
    stats: { tech: 55, pub: 62, qual: 52, prod: 68, fin: 62, mkt: 66 }, core: ['mkt', 'prod'], traits: ['export', 'exec', 'material'] },
  { id: 'c09', quarter: 2, name: '세이프캡', product: '건설현장 스마트 안전모', sector: '안전', art: 'helmet',
    stats: { tech: 50, pub: 72, qual: 60, prod: 58, fin: 42, mkt: 50 }, core: ['pub', 'qual'], traits: ['civic', 'field', 'cashpoor'] },
  { id: 'c10', quarter: 2, name: '카본루프', product: '경량 탄소복합 소재', sector: '소재', art: 'carbon',
    stats: { tech: 68, pub: 40, qual: 64, prod: 72, fin: 58, mkt: 55 }, core: ['prod', 'mkt'], traits: ['late', 'export', 'clumsy'] },

  { id: 'c11', quarter: 3, name: '픽셀가드', product: 'CCTV 영상분석 AI', sector: 'AI 보안', art: 'cctv',
    stats: { tech: 78, pub: 66, qual: 60, prod: 40, fin: 52, mkt: 58 }, core: ['tech', 'pub'], traits: ['star', 'patent', 'volatile'] },
  { id: 'c12', quarter: 3, name: '하이드로젠웍스', product: '수소 연료전지 발전기', sector: '에너지', art: 'h2tank', energy: true,
    stats: { tech: 70, pub: 55, qual: 58, prod: 62, fin: 48, mkt: 54 }, core: ['tech', 'prod'], traits: ['export', 'material', 'volatile'] },
  { id: 'c13', quarter: 3, name: '루미스트리트', product: '스마트 가로등', sector: '도시 인프라', art: 'streetlight',
    stats: { tech: 56, pub: 70, qual: 62, prod: 60, fin: 60, mkt: 52 }, core: ['pub', 'mkt'], traits: ['steady', 'civic', 'cto'] },
  { id: 'c14', quarter: 3, name: '프린트온', product: '건설용 3D 프린터', sector: '건설기술', art: 'printer',
    stats: { tech: 76, pub: 48, qual: 50, prod: 66, fin: 44, mkt: 62 }, core: ['tech', 'prod'], traits: ['late', 'exec', 'solo'] },
];

const RARITY = {
  common: { name: '일반', order: 0 },
  rare:   { name: '희귀', order: 1 },
  epic:   { name: '영웅', order: 2 },
  legend: { name: '전설', order: 3 },
};
// name: 카드 위에 쓰는 쉬운 이름. term: 조달청이 실제로 쓰는 말. desc: 한 줄 풀이(도움말).
const KIND = {
  cert:    { name: '품질 보증', term: '지정·인증', desc: '나라가 이 제품의 혁신성·품질을 공식으로 인정해 줍니다. 배지를 받으면 매달 기업가치가 더 오릅니다.' },
  trial:   { name: '먼저 써보기', term: '시범구매', desc: '공공기관이 신제품을 먼저 사서 현장에서 써 봅니다. 공공성과 기업가치가 바로 오릅니다.' },
  sales:   { name: '판매처 넓히기', term: '판로 지원', desc: '공공기관이 제품을 살 수 있는 장터·계약·박람회를 열어 줍니다. 몇 달에 걸쳐 꾸준히 오릅니다.' },
  rnd:     { name: '기술 개발', term: 'R&D', desc: '연구개발과 설비를 지원해 기술력·생산능력을 크게 올립니다.' },
  consult: { name: '전문가 상담', term: '컨설팅', desc: '전문가가 약점을 진단해 품질신뢰·재무안정 같은 기초 체력을 올립니다. 비용이 쌉니다.' },
  stock:   { name: '원자재 지원', term: '공공비축', desc: '나라가 비축해 둔 원자재를 싸게 공급해 생산능력과 원가를 개선합니다.' },
  pr:      { name: '홍보', term: '홍보', desc: '정부 매체로 기업을 알려 기업가치를 바로 올립니다.' },
  all:     { name: '함께 키우기', term: '상생협력', desc: '내가 뽑은 모든 기업에 한꺼번에 적용됩니다.' },
};

// 조달 지원 카드 25종. 스탯 +N과 % 값은 카드 문구 그대로이며, 실제 적용 때 기업 특성 배율이 곱해진다.
// fx: 효과 목록. {stat,key,amt} 스탯 상승 · {bump,pct} 즉시 기업가치 상승 · {pct,months} 지속 성장 ·
//     {grant} 배지 지정 · {lowest,amt} 가장 낮은 스탯 상승 · {allStats,amt} · {allMine:true} 내 모든 기업에 적용
// link: 연계 조건(배지나 업종)이 맞으면 linkFx가 대신 또는 추가로 적용된다.
// cond: 카드를 받을 수 있는 조건 (index.html의 cardCond가 해석).
const CARDS = [
  // 품질 보증 (지정·인증)
  { id: 'innov', name: '혁신제품 지정', kind: 'cert', rarity: 'rare', cost: 20, art: 'seal', about: '조달청이 혁신 기술 제품으로 공식 인정',
    cond: { stat: 'tech', min: 50, notBadge: 'innov' }, fx: [{ grant: 'innov' }, { stat: 'tech', amt: 5 }],
    text: ['<b>조건</b> 기술력 50 이상', '<b>지정</b> [혁신제품] 배지: 매달 +2%', '<b>즉시</b> 기술력 +5'] },
  { id: 'excel', name: '우수조달물품 지정', kind: 'cert', rarity: 'epic', cost: 30, art: 'medal', about: '품질이 검증된 제품을 우수 물품으로 지정',
    cond: { badge: 'innov', stat: 'qual', min: 60, notBadge: 'excel' }, fx: [{ grant: 'excel' }, { stat: 'qual', amt: 5 }],
    text: ['<b>조건</b> [혁신제품] + 품질신뢰 60 이상', '<b>지정</b> [우수조달] 배지: 매달 +3%', '<b>즉시</b> 품질신뢰 +5'] },
  { id: 'gpass', name: 'G-PASS 기업 지정', kind: 'cert', rarity: 'legend', cost: 38, art: 'globe', about: '해외 조달시장 진출 유망 기업으로 지정',
    cond: { stat: 'mkt', min: 60, notBadge: 'gpass' }, fx: [{ grant: 'gpass' }, { stat: 'mkt', amt: 8 }],
    text: ['<b>조건</b> 시장성 60 이상', '<b>지정</b> [G-PASS] 배지: 매달 +4%', '<b>즉시</b> 시장성 +8'] },
  { id: 'epc', name: '성능인증 지원', kind: 'cert', rarity: 'common', cost: 10, art: 'gauge', about: '공인 기관이 제품 성능을 시험해 인증',
    fx: [{ stat: 'qual', amt: 7 }], text: ['<b>즉시</b> 품질신뢰 +7'] },
  { id: 'proto', name: '혁신시제품 지정', kind: 'cert', rarity: 'rare', cost: 16, art: 'bulb', about: '개발 막바지 시제품을 혁신 제품으로 지정',
    fx: [{ stat: 'tech', amt: 4 }, { stat: 'pub', amt: 4 }, { pct: 0.02, months: 3 }],
    text: ['<b>즉시</b> 기술력 +4, 공공성 +4', '<b>지속 3개월</b> 매달 +2%'] },

  // 먼저 써보기 (시범구매)
  { id: 'fire', name: '소방청 시범구매', kind: 'trial', rarity: 'common', cost: 14, art: 'firetruck', about: '소방청이 먼저 사서 화재 현장에서 사용',
    fx: [{ stat: 'pub', amt: 6 }, { bump: 0.04 }], link: { badge: 'innov' }, linkFx: [{ bump: 0.04 }],
    text: ['<b>즉시</b> 공공성 +6, 기업가치 +4%', '<b>연계</b> [혁신제품]이면 기업가치 +4% 추가'] },
  { id: 'school', name: '교육청 시범구매', kind: 'trial', rarity: 'common', cost: 12, art: 'school', about: '교육청이 먼저 사서 학교에서 사용',
    fx: [{ stat: 'pub', amt: 5 }, { stat: 'qual', amt: 2 }, { bump: 0.03 }],
    text: ['<b>즉시</b> 공공성 +5, 품질신뢰 +2', '<b>즉시</b> 기업가치 +3%'] },
  { id: 'city', name: '지자체 시범구매', kind: 'trial', rarity: 'common', cost: 12, art: 'cityhall', about: '지자체가 먼저 사서 동네에서 사용',
    fx: [{ stat: 'pub', amt: 4 }, { stat: 'mkt', amt: 3 }, { bump: 0.03 }],
    text: ['<b>즉시</b> 공공성 +4, 시장성 +3', '<b>즉시</b> 기업가치 +3%'] },
  { id: 'data', name: '실증 데이터 리포트', kind: 'trial', rarity: 'rare', cost: 10, art: 'clipboard', about: '시범 사용 결과를 보고서로 정리해 신뢰 확보',
    cond: { trialThisQuarter: true }, fx: [{ stat: 'pub', amt: 4 }, { stat: 'tech', amt: 4 }, { pct: 0.02, months: 2 }],
    text: ['<b>조건</b> 이번 분기에 먼저 써보기를 받은 기업', '<b>즉시</b> 공공성 +4, 기술력 +4', '<b>지속 2개월</b> 매달 +2%'] },

  // 판매처 넓히기 (판로 지원)
  { id: 'market', name: '혁신장터 등록', kind: 'sales', rarity: 'common', cost: 8, art: 'stall', about: '공공기관 전용 혁신 제품 장터에 등록',
    fx: [{ pct: 0.01, months: 3 }], link: { badge: 'innov' }, linkFx: [{ pct: 0.02, months: 3 }],
    text: ['<b>지속 3개월</b> 매달 +1%', '<b>연계</b> [혁신제품]이면 매달 +2% 추가'] },
  { id: 'venture', name: '벤처나라 입점', kind: 'sales', rarity: 'common', cost: 6, art: 'shop', about: '공공 쇼핑몰 벤처나라에 상품 등록',
    cond: { notBadge: 'venture' }, fx: [{ grant: 'venture' }, { stat: 'mkt', amt: 4 }],
    text: ['<b>지정</b> [벤처나라] 배지: 매달 +1.5%', '<b>즉시</b> 시장성 +4'] },
  { id: 'mas', name: '다수공급자계약', kind: 'sales', rarity: 'rare', cost: 18, art: 'contract', about: '여러 기관이 바로 주문하는 단가 계약 체결',
    cond: { stat: 'prod', min: 50 }, fx: [{ stat: 'fin', amt: 3 }, { pct: 0.03, months: 3 }],
    text: ['<b>조건</b> 생산능력 50 이상', '<b>즉시</b> 재무안정 +3', '<b>지속 3개월</b> 매달 +3%'] },
  { id: 'match', name: '수요기관 매칭 데이', kind: 'sales', rarity: 'rare', cost: 14, art: 'handshake', about: '제품이 필요한 공공기관과 1:1 상담',
    fx: [{ stat: 'pub', amt: 4 }, { stat: 'mkt', amt: 4 }, { bump: 0.03 }],
    text: ['<b>즉시</b> 공공성 +4, 시장성 +4', '<b>즉시</b> 기업가치 +3%'] },
  { id: 'expo', name: '해외조달 박람회', kind: 'sales', rarity: 'epic', cost: 24, art: 'plane', about: '해외 정부 조달 박람회에 참가',
    fx: [{ stat: 'mkt', amt: 10 }], link: { badge: 'gpass' }, linkFx: [{ bump: 0.12 }],
    text: ['<b>즉시</b> 시장성 +10', '<b>연계</b> [G-PASS]면 기업가치 +12%'] },

  // R&D
  { id: 'rnd', name: 'R&D 연계 지원', kind: 'rnd', rarity: 'common', cost: 12, art: 'flask', about: '공공 연구개발 과제와 연결',
    fx: [{ stat: 'tech', amt: 8 }], text: ['<b>즉시</b> 기술력 +8'] },
  { id: 'facility', name: '생산설비 고도화', kind: 'rnd', rarity: 'rare', cost: 16, art: 'factory', about: '생산 설비 개선 비용 지원',
    fx: [{ stat: 'prod', amt: 10 }], text: ['<b>즉시</b> 생산능력 +10'] },
  { id: 'boost', name: '집중 육성 프로그램', kind: 'rnd', rarity: 'epic', cost: 28, art: 'rocket', about: '전문가 팀이 두 달간 집중 지원',
    fx: [{ allStats: true, amt: 4 }, { pct: 0.02, months: 2 }],
    text: ['<b>즉시</b> 모든 스탯 +4', '<b>지속 2개월</b> 매달 +2%'] },

  // 컨설팅
  { id: 'qcon', name: '품질관리 컨설팅', kind: 'consult', rarity: 'common', cost: 8, art: 'magnifier', about: '품질 관리 전문가가 공정 점검',
    fx: [{ stat: 'qual', amt: 6 }, { stat: 'fin', amt: 2 }], text: ['<b>즉시</b> 품질신뢰 +6, 재무안정 +2'] },
  { id: 'fcon', name: '재무 진단 컨설팅', kind: 'consult', rarity: 'common', cost: 8, art: 'coins', about: '재무 전문가가 자금 흐름 진단',
    fx: [{ stat: 'fin', amt: 8 }], text: ['<b>즉시</b> 재무안정 +8'] },
  { id: 'mentor', name: '조달 멘토링', kind: 'consult', rarity: 'common', cost: 5, art: 'mentor', about: '조달 전문가가 가장 약한 부분을 보완',
    fx: [{ lowest: true, amt: 6 }], text: ['<b>즉시</b> 가장 낮은 스탯 +6'] },

  // 공공비축
  { id: 'alu', name: '비축 원자재 공급: 알루미늄', kind: 'stock', rarity: 'common', cost: 10, art: 'ingot', about: '나라가 비축한 알루미늄을 싸게 공급',
    fx: [{ stat: 'prod', amt: 5 }, { pct: 0.02, months: 2 }],
    text: ['<b>즉시</b> 생산능력 +5', '<b>지속 2개월</b> 원가 절감 매달 +2%'] },
  { id: 'lith', name: '비축 원자재 공급: 리튬', kind: 'stock', rarity: 'rare', cost: 14, art: 'cells', about: '나라가 비축한 리튬을 싸게 공급',
    fx: [{ stat: 'prod', amt: 4 }, { pct: 0.025, months: 2 }], link: { energy: true }, linkFx: [{ stat: 'prod', amt: 4 }, { pct: 0.025, months: 2 }],
    text: ['<b>즉시</b> 생산능력 +4', '<b>지속 2개월</b> 매달 +2.5%', '<b>연계</b> 에너지 업종이면 효과 2배'] },
  { id: 'lease', name: '비축 원자재 장기 대여', kind: 'stock', rarity: 'rare', cost: 12, art: 'crate', about: '비축 원자재를 오래 빌려 줘 자금 부담 완화',
    fx: [{ stat: 'fin', amt: 6 }, { stat: 'prod', amt: 4 }], text: ['<b>즉시</b> 재무안정 +6, 생산능력 +4'] },

  // 홍보 · 협력
  { id: 'pr', name: '공공 혁신 홍보', kind: 'pr', rarity: 'common', cost: 6, art: 'megaphone', about: '정부 매체로 기업과 제품을 소개',
    fx: [{ bump: 0.05 }], text: ['<b>즉시</b> 기업가치 +5%'] },
  { id: 'coop', name: '상생협력 매칭', kind: 'all', rarity: 'epic', cost: 22, art: 'nodes', about: '대기업·공공기관과 협력 사업 연결',
    fx: [{ allMine: true }, { stat: 'mkt', amt: 4 }, { bump: 0.02 }],
    text: ['<b>전체</b> 내 모든 기업에 적용', '<b>즉시</b> 시장성 +4, 기업가치 +2%'] },
];

const BADGES = {
  innov:   { name: '혁신제품', tune: 'statusInnov' },
  excel:   { name: '우수조달', tune: 'statusExcel' },
  gpass:   { name: 'G-PASS', tune: 'statusGpass' },
  venture: { name: '벤처나라', tune: 'statusVenture' },
};

// 분기별 카드 등급 출현 가중치
const RARITY_WEIGHTS = [
  { common: 70, rare: 30, epic: 0, legend: 0 },
  { common: 55, rare: 33, epic: 12, legend: 0 },
  { common: 45, rare: 33, epic: 16, legend: 6 },
  { common: 40, rare: 32, epic: 18, legend: 10 },
];

const GRADES = [
  { g: 'S', title: '유니콘 메이커', text: '당신이 키운 국가대표가 공공 납품 실적을 발판 삼아 글로벌 수출 기업으로 도약했습니다.' },
  { g: 'A', title: '탄탄한 조달 생태계', text: '뽑은 기업들이 안정적인 공공 판로를 확보했고, 예산도 효율적으로 쓰였습니다.' },
  { g: 'B', title: '성실한 심사위원', text: '무난한 성과입니다. 포기한 기업들 중에도 아까운 곳이 있었습니다.' },
  { g: 'C', title: '예산 낭비', text: '지원한 만큼 기업이 자라지 못했습니다. 카드와 기업의 궁합을 다시 살펴보세요.' },
  { g: 'D', title: '아쉬운 안목', text: '포기한 기업들이 더 크게 성장했습니다. 지원서의 특성을 더 꼼꼼히 읽어 보세요.' },
  { g: 'F', title: '감사원 감사 대상', text: '선택한 기업들이 시장 평균에도 못 미쳐 국고 손실 지적을 받았습니다.' },
];
