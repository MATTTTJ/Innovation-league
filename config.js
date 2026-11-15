// PROTOTYPE - NOT FOR PRODUCTION
// Question: 지원서만 보고 고른 기업을 조달 카드로 키워 순위전에서 살아남게 하는 판단이 12턴 동안 재미있는가?
// Date: 2026-11-13
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // ---- 예산 (단위: 억 원) ----
  budgetQ1: { value: 100, min: 40, max: 200, step: 5 },        // 1분기 첫 배정 예산
  budgetBase: { value: 85, min: 40, max: 200, step: 5 },       // 2분기부터의 기본 배정
  budgetPerPoint: { value: 4, min: 0, max: 15, step: 0.5 },    // 내 기업 대 포기 기업 분기 성장률 차이 1%p당 가감
  budgetTopBonus: { value: 10, min: 0, max: 40, step: 1 },     // 전체 1위 기업이 내 기업일 때 보너스
  budgetCarry: { value: 0.5, min: 0, max: 1, step: 0.05 },     // 쓰지 않은 예산 중 다음 분기로 넘어가는 비율
  budgetMin: { value: 50, min: 0, max: 150, step: 5 },
  budgetMax: { value: 170, min: 80, max: 300, step: 5 },

  // ---- 카드 ----
  handSize: { value: 5, min: 3, max: 7, step: 1 },             // 매달 제시되는 카드 수
  rerollCost: { value: 3, min: 0, max: 15, step: 1 },          // 카드 새로 받기 비용 (억), 한 달에 한 번
  mismatchFactor: { value: 0.5, min: 0.1, max: 1, step: 0.05 },// 특성과 맞지 않는 카드의 효과 배율
  goodFactor: { value: 2, min: 1, max: 3, step: 0.1 },         // 특성과 잘 맞는 카드의 효과 배율(현장 덕후 등)

  // ---- 성장 엔진 (월 단위 비율) ----
  startValue: { value: 100, min: 40, max: 300, step: 5 },      // 기업가치 기준 (억): 시작가 = 기준 x (0.5 + 핵심역량 점수)
  growthBase: { value: 0.008, min: 0, max: 0.05, step: 0.001 },// 모든 기업의 기본 월 성장률
  growthPerStat: { value: 0.07, min: 0, max: 0.2, step: 0.005 },// 핵심역량 점수(0~1)가 0.5에서 벗어난 만큼의 성장률 가중
  growthNoise: { value: 0.018, min: 0, max: 0.06, step: 0.002 },// 월 성장률 변동폭(±)
  selfGrowth: { value: 0.007, min: 0, max: 0.03, step: 0.001 },// 포기한 기업이 시장에서 스스로 얻는 추가 성장률
  selfStatDrift: { value: 1.5, min: 0, max: 5, step: 0.5 },    // 포기한 기업의 강점 스탯 월 자연 성장
  statusInnov: { value: 0.02, min: 0, max: 0.06, step: 0.005 },  // [혁신제품] 배지의 월 성장 보너스
  statusExcel: { value: 0.03, min: 0, max: 0.08, step: 0.005 },  // [우수조달]
  statusGpass: { value: 0.04, min: 0, max: 0.1, step: 0.005 },   // [G-PASS]
  statusVenture: { value: 0.015, min: 0, max: 0.05, step: 0.005 },// [벤처나라]
  nomineeFactor: { value: 1.2, min: 1, max: 2, step: 0.05 },     // 국가대표 후보에게 쓰는 카드 효과 배율

  // ---- 진행 ----
  pickQ1: { value: 3, min: 1, max: 5, step: 1 },               // 1분기 선발 수
  pickLater: { value: 1, min: 0, max: 3, step: 1 },            // 2·3분기 추가 선발 수
  applicantsQ1: { value: 6, min: 3, max: 6, step: 1 },
  applicantsLater: { value: 4, min: 2, max: 4, step: 1 },

  // ---- 연출 (초) ----
  monthAnim: { value: 1.8, min: 0, max: 4, step: 0.1 },        // 다음 달로 넘어갈 때 차트가 오르내리는 결산 연출 길이
  lobbyEnterGap: { value: 0.22, min: 0.05, max: 1, step: 0.01 },// 심사장에 기업이 한 곳씩 입장하는 간격
  lobbyPitchGap: { value: 1.0, min: 0.5, max: 4, step: 0.1 }, // 동물 대표가 차례로 회사를 소개하는 간격 (말풍선은 이 간격의 1.6배 동안 보인다)

  // ---- 엔딩 등급 경계 (100점 만점) ----
  gradeS: { value: 80, min: 50, max: 100, step: 1 },
  gradeA: { value: 65, min: 40, max: 100, step: 1 },
  gradeB: { value: 50, min: 30, max: 100, step: 1 },
  gradeC: { value: 35, min: 20, max: 100, step: 1 },
  gradeD: { value: 20, min: 0, max: 100, step: 1 },
  effPoints: { value: 30, min: 1, max: 80, step: 1 },          // 예산 효율 점수: (포기한 기업보다 더 키운 가치 ÷ 지출) 1당 점수, 20점 만점
  effMinSpend: { value: 150, min: 0, max: 400, step: 10 },     // 예산 효율을 잴 때 지출이 이보다 적으면 이 값으로 나눈다 (거의 안 쓰고 만점 받기 방지)
};
