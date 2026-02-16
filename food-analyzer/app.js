// 메인 애플리케이션 로직

class FoodAnalyzerApp {
    constructor() {
        this.currentResult = null;
        this.initElements();
        this.attachEventListeners();
    }

    // DOM 요소 초기화
    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewSection = document.getElementById('previewSection');
        this.previewImage = document.getElementById('previewImage');
        this.analyzingBadge = document.getElementById('analyzingBadge');
        this.resultsSection = document.getElementById('resultsSection');
    }

    // 이벤트 리스너 연결
    attachEventListeners() {
        // 클릭하여 파일 선택
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // 파일 선택 시
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // 드래그 앤 드롭
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            } else {
                alert('이미지 파일만 업로드 가능합니다.');
            }
        });
    }

    // 파일 처리
    async handleFile(file) {
        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 이미지 미리보기 표시
        this.showPreview(file);

        // 업로드 영역 숨기기
        this.uploadArea.style.display = 'none';

        // 분석 시작
        try {
            const result = await analyzer.analyzeImage(file);
            this.currentResult = result;
            this.displayResults(result);
        } catch (error) {
            console.error('분석 중 오류 발생:', error);
            alert('이미지 분석 중 오류가 발생했습니다.');
            this.resetApp();
        }
    }

    // 이미지 미리보기 표시
    showPreview(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.analyzingBadge.style.display = 'inline-block';
        };

        reader.readAsDataURL(file);
    }

    // 결과 표시
    displayResults(result) {
        // 분석 중 배지 숨기기
        this.analyzingBadge.style.display = 'none';

        const food = result.food;

        // 칼로리 정보
        document.getElementById('calorieNumber').textContent = food.calories;
        document.getElementById('foodServing').textContent = food.servingSize;

        // 다량 영양소
        document.getElementById('carbsValue').textContent = food.nutrients.carbs;
        document.getElementById('proteinValue').textContent = food.nutrients.protein;
        document.getElementById('fatValue').textContent = food.nutrients.fat;

        // 성분표
        const nutrientsList = document.getElementById('nutrientsList');
        nutrientsList.innerHTML = `
      <div class="nutrient-item">
        <span class="nutrient-name">식이섬유</span>
        <span class="nutrient-value">${food.nutrients.fiber}g</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">당류</span>
        <span class="nutrient-value">${food.nutrients.sugar}g</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">나트륨</span>
        <span class="nutrient-value">${food.nutrients.sodium}mg</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">비타민 A</span>
        <span class="nutrient-value">${food.nutrients.vitaminA}%</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">비타민 C</span>
        <span class="nutrient-value">${food.nutrients.vitaminC}%</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">칼슘</span>
        <span class="nutrient-value">${food.nutrients.calcium}%</span>
      </div>
      <div class="nutrient-item">
        <span class="nutrient-name">철분</span>
        <span class="nutrient-value">${food.nutrients.iron}%</span>
      </div>
    `;

        // 원가 분석
        document.getElementById('totalCost').textContent = food.totalCost.toLocaleString();

        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = food.ingredients.map(ing => `
      <div class="ingredient-item">
        <div class="ingredient-info">
          <div class="ingredient-name">${ing.name}</div>
          <div class="ingredient-amount">${ing.amount}</div>
        </div>
        <div class="ingredient-price">₩${ing.price.toLocaleString()}</div>
      </div>
    `).join('');

        // 영양 점수 계산 및 표시
        const nutritionScore = analyzer.calculateNutritionScore(food.nutrients);
        this.displayNutritionScore(nutritionScore);

        // 결과 섹션 표시 (애니메이션)
        setTimeout(() => {
            this.resultsSection.style.display = 'block';
            this.animateNumbers();
        }, 300);
    }

    // 영양 점수 표시
    displayNutritionScore(score) {
        let grade = 'C';
        let color = '#ffa94d';

        if (score >= 80) {
            grade = 'A';
            color = '#43e97b';
        } else if (score >= 65) {
            grade = 'B';
            color = '#4facfe';
        }

        // 점수 배지 추가 (칼로리 카드 하단)
        const caloriesCard = document.querySelector('.calories-card');
        const scoreDiv = document.createElement('div');
        scoreDiv.style.cssText = `
      text-align: center;
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
    `;
        scoreDiv.innerHTML = `
      <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">영양 점수</div>
      <div style="font-size: 2.5rem; font-weight: 800; color: ${color};">${grade}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">${score}점</div>
    `;

        // 기존 점수 제거 후 추가
        const existingScore = caloriesCard.querySelector('[data-score]');
        if (existingScore) {
            existingScore.remove();
        }
        scoreDiv.setAttribute('data-score', 'true');
        caloriesCard.appendChild(scoreDiv);
    }

    // 숫자 애니메이션
    animateNumbers() {
        const animateValue = (element, start, end, duration) => {
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    current = end;
                    clearInterval(timer);
                }
                element.textContent = Math.round(current);
            }, 16);
        };

        // 칼로리 애니메이션
        const calorieNumber = document.getElementById('calorieNumber');
        animateValue(calorieNumber, 0, this.currentResult.food.calories, 1000);

        // 원가 애니메이션
        const totalCost = document.getElementById('totalCost');
        const costValue = this.currentResult.food.totalCost;
        const timer = setInterval(() => {
            const current = parseInt(totalCost.textContent.replace(/,/g, '') || '0');
            if (current >= costValue) {
                totalCost.textContent = costValue.toLocaleString();
                clearInterval(timer);
            } else {
                const increment = Math.ceil((costValue - current) / 10);
                totalCost.textContent = (current + increment).toLocaleString();
            }
        }, 30);
    }

    // 앱 초기화
    resetApp() {
        this.uploadArea.style.display = 'block';
        this.previewSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.fileInput.value = '';
        this.currentResult = null;
    }
}

// 페이지 로드 시 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FoodAnalyzerApp();

    // 데모 모드 안내 표시
    console.log('%c🍕 음식 칼로리 & 원가 분석 웹사이트', 'font-size: 20px; font-weight: bold; color: #ff6b6b;');
    console.log('%c현재 데모 모드로 실행 중입니다.', 'font-size: 14px; color: #4facfe;');
    console.log('%c파일명에 음식 이름을 포함하면 해당 음식으로 인식됩니다.', 'font-size: 12px; color: #9ca3af;');
    console.log('지원 음식: pizza, burger, ramen, sushi, salad, chicken, pasta, bibimbap');
});
