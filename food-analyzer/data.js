// 음식 데이터베이스 - 칼로리, 영양소, 식재료 가격 정보

// 샘플 음식 데이터베이스
const foodDatabase = {
  pizza: {
    name: "피자",
    calories: 266,
    servingSize: "100g",
    nutrients: {
      carbs: 33,
      protein: 11,
      fat: 10,
      fiber: 2.3,
      sugar: 3.6,
      sodium: 598,
      vitaminA: 8,
      vitaminC: 2,
      calcium: 18,
      iron: 10
    },
    ingredients: [
      { name: "밀가루", amount: "30g", price: 150 },
      { name: "토마토 소스", amount: "20g", price: 200 },
      { name: "모짜렐라 치즈", amount: "25g", price: 800 },
      { name: "페퍼로니", amount: "15g", price: 600 },
      { name: "올리브유", amount: "5g", price: 100 }
    ],
    totalCost: 1850
  },
  burger: {
    name: "햄버거",
    calories: 295,
    servingSize: "100g",
    nutrients: {
      carbs: 28,
      protein: 17,
      fat: 13,
      fiber: 2.1,
      sugar: 5.2,
      sodium: 523,
      vitaminA: 4,
      vitaminC: 3,
      calcium: 8,
      iron: 15
    },
    ingredients: [
      { name: "햄버거 번", amount: "40g", price: 300 },
      { name: "소고기 패티", amount: "50g", price: 1500 },
      { name: "양상추", amount: "10g", price: 50 },
      { name: "토마토", amount: "15g", price: 100 },
      { name: "체다 치즈", amount: "15g", price: 500 },
      { name: "소스", amount: "10g", price: 150 }
    ],
    totalCost: 2600
  },
  ramen: {
    name: "라면",
    calories: 436,
    servingSize: "100g",
    nutrients: {
      carbs: 62,
      protein: 10,
      fat: 16,
      fiber: 2.8,
      sugar: 3.1,
      sodium: 1820,
      vitaminA: 2,
      vitaminC: 1,
      calcium: 4,
      iron: 18
    },
    ingredients: [
      { name: "라면 면", amount: "70g", price: 400 },
      { name: "스프", amount: "15g", price: 300 },
      { name: "대파", amount: "10g", price: 50 },
      { name: "계란", amount: "50g", price: 200 }
    ],
    totalCost: 950
  },
  sushi: {
    name: "초밥",
    calories: 143,
    servingSize: "100g",
    nutrients: {
      carbs: 24,
      protein: 6,
      fat: 2.5,
      fiber: 0.5,
      sugar: 2.8,
      sodium: 328,
      vitaminA: 15,
      vitaminC: 1,
      calcium: 2,
      iron: 3
    },
    ingredients: [
      { name: "밥", amount: "60g", price: 200 },
      { name: "연어", amount: "25g", price: 1200 },
      { name: "김", amount: "2g", price: 100 },
      { name: "와사비", amount: "3g", price: 150 },
      { name: "간장", amount: "5g", price: 50 }
    ],
    totalCost: 1700
  },
  salad: {
    name: "샐러드",
    calories: 56,
    servingSize: "100g",
    nutrients: {
      carbs: 8,
      protein: 2,
      fat: 2,
      fiber: 3.5,
      sugar: 3.2,
      sodium: 125,
      vitaminA: 45,
      vitaminC: 35,
      calcium: 6,
      iron: 8
    },
    ingredients: [
      { name: "양상추", amount: "40g", price: 200 },
      { name: "방울토마토", amount: "30g", price: 300 },
      { name: "오이", amount: "20g", price: 100 },
      { name: "당근", amount: "15g", price: 80 },
      { name: "드레싱", amount: "20g", price: 250 }
    ],
    totalCost: 930
  },
  friedChicken: {
    name: "프라이드 치킨",
    calories: 246,
    servingSize: "100g",
    nutrients: {
      carbs: 12,
      protein: 24,
      fat: 12,
      fiber: 0.8,
      sugar: 0.5,
      sodium: 658,
      vitaminA: 3,
      vitaminC: 2,
      calcium: 2,
      iron: 6
    },
    ingredients: [
      { name: "닭고기", amount: "70g", price: 800 },
      { name: "튀김가루", amount: "15g", price: 150 },
      { name: "식용유", amount: "10g", price: 100 },
      { name: "양념", amount: "5g", price: 200 }
    ],
    totalCost: 1250
  },
  pasta: {
    name: "파스타",
    calories: 158,
    servingSize: "100g",
    nutrients: {
      carbs: 31,
      protein: 6,
      fat: 1,
      fiber: 1.8,
      sugar: 2.3,
      sodium: 238,
      vitaminA: 6,
      vitaminC: 8,
      calcium: 4,
      iron: 7
    },
    ingredients: [
      { name: "파스타 면", amount: "50g", price: 300 },
      { name: "토마토 소스", amount: "30g", price: 250 },
      { name: "마늘", amount: "5g", price: 50 },
      { name: "올리브유", amount: "10g", price: 200 },
      { name: "파마산 치즈", amount: "10g", price: 400 }
    ],
    totalCost: 1200
  },
  bibimbap: {
    name: "비빔밥",
    calories: 121,
    servingSize: "100g",
    nutrients: {
      carbs: 22,
      protein: 4,
      fat: 2,
      fiber: 2.5,
      sugar: 3.1,
      sodium: 428,
      vitaminA: 25,
      vitaminC: 12,
      calcium: 8,
      iron: 12
    },
    ingredients: [
      { name: "밥", amount: "50g", price: 180 },
      { name: "시금치", amount: "15g", price: 100 },
      { name: "당근", amount: "10g", price: 60 },
      { name: "애호박", amount: "15g", price: 80 },
      { name: "고추장", amount: "10g", price: 120 },
      { name: "참기름", amount: "5g", price: 150 },
      { name: "계란", amount: "25g", price: 100 }
    ],
    totalCost: 790
  }
};

// 기본 음식 (이미지 분석 실패 시)
const defaultFood = {
  name: "알 수 없는 음식",
  calories: 200,
  servingSize: "100g",
  nutrients: {
    carbs: 25,
    protein: 10,
    fat: 8,
    fiber: 2,
    sugar: 3,
    sodium: 400,
    vitaminA: 5,
    vitaminC: 5,
    calcium: 5,
    iron: 5
  },
  ingredients: [
    { name: "재료 추정 중", amount: "?", price: 0 }
  ],
  totalCost: 0
};

// 랜덤 음식 선택 함수
function getRandomFood() {
  const foods = Object.values(foodDatabase);
  return foods[Math.floor(Math.random() * foods.length)];
}

// 파일명 기반 음식 추측
function guessFoodFromFilename(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('pizza') || lower.includes('피자')) return foodDatabase.pizza;
  if (lower.includes('burger') || lower.includes('버거') || lower.includes('햄버거')) return foodDatabase.burger;
  if (lower.includes('ramen') || lower.includes('라면') || lower.includes('noodle')) return foodDatabase.ramen;
  if (lower.includes('sushi') || lower.includes('초밥') || lower.includes('스시')) return foodDatabase.sushi;
  if (lower.includes('salad') || lower.includes('샐러드')) return foodDatabase.salad;
  if (lower.includes('chicken') || lower.includes('치킨')) return foodDatabase.friedChicken;
  if (lower.includes('pasta') || lower.includes('파스타')) return foodDatabase.pasta;
  if (lower.includes('bibim') || lower.includes('비빔')) return foodDatabase.bibimbap;
  
  return getRandomFood();
}
