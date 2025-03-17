// 페이지에 번역 결과를 표시할 팝업 요소 생성
let currentPopup = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;
let translateButton = null;

function createTranslationPopup() {
  // 이미 존재하는 팝업이 있으면 재사용
  if (currentPopup && document.body.contains(currentPopup)) {
    return currentPopup;
  }
  
  // 새 팝업 생성
  const popup = document.createElement('div');
  popup.id = 'gemini-translation-popup';
  popup.style.cssText = `
    position: fixed;
    max-width: 400px;
    min-width: 200px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    padding: 0;
    z-index: 99999;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    color: #333;
    display: none;
  `;
  
  // 내부 HTML 설정
  popup.innerHTML = `
    <div id="gemini-translation-header" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding: 10px;
      background-color: #f8f8f8;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      cursor: move;
    ">
      <div style="
        font-weight: bold;
        color: #4285f4;
      ">Gemini 번역</div>
      <button id="gemini-close-btn" style="
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0 5px;
      ">×</button>
    </div>
    <div id="gemini-translation-content" style="
      white-space: pre-wrap;
      word-break: break-word;
      color: #333;
      padding: 10px;
      max-height: 300px;
      overflow-y: auto;
    "></div>
  `;
  
  document.body.appendChild(popup);
  currentPopup = popup;
  
  // 닫기 버튼 기능
  const closeBtn = popup.querySelector('#gemini-close-btn');
  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    popup.style.display = 'none';
  });
  
  // 드래그 기능 구현
  const header = popup.querySelector('#gemini-translation-header');
  
  header.addEventListener('mousedown', function(e) {
    // 닫기 버튼 클릭 시에는 드래그 시작하지 않음
    if (e.target === closeBtn) {
      return;
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialLeft = popup.offsetLeft;
    initialTop = popup.offsetTop;
    
    // 팝업 위치가 정의되지 않았으면 현재 위치로 설정
    if (!initialLeft && !initialTop) {
      const rect = popup.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      popup.style.left = initialLeft + 'px';
      popup.style.top = initialTop + 'px';
    }
    
    // 드래그 중 텍스트 선택 방지
    e.preventDefault();
    
    // 팝업에 드래그 중임을 표시하는 클래스 추가
    popup.classList.add('dragging');
  });
  
  // 전역 마우스 이벤트 리스너
  function handleMouseMove(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    const newLeft = initialLeft + deltaX;
    const newTop = initialTop + deltaY;
    
    // 화면 밖으로 나가지 않도록 제한
    const maxLeft = window.innerWidth - popup.offsetWidth;
    const maxTop = window.innerHeight - popup.offsetHeight;
    
    popup.style.left = Math.max(0, Math.min(maxLeft, newLeft)) + 'px';
    popup.style.top = Math.max(0, Math.min(maxTop, newTop)) + 'px';
  }
  
  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      // 팝업에서 드래그 중임을 표시하는 클래스 제거
      popup.classList.remove('dragging');
      
      // 현재 위치 저장
      initialLeft = popup.offsetLeft;
      initialTop = popup.offsetTop;
    }
  }
  
  // 전역 이벤트 리스너 등록
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  return popup;
}

// 번역하기 버튼 생성
function createTranslateButton() {
  if (translateButton) {
    document.body.removeChild(translateButton);
  }
  
  translateButton = document.createElement('div');
  translateButton.id = 'gemini-translate-button';
  translateButton.style.cssText = `
    position: fixed;
    background-color: #4285f4;
    color: white;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    cursor: pointer;
    z-index: 99998;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    user-select: none;
  `;
  translateButton.textContent = '번역하기';
  
  document.body.appendChild(translateButton);
  
  // 버튼 효과
  translateButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = '#3367d6';
  });
  
  translateButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = '#4285f4';
  });
  
  return translateButton;
}

// 번역 버튼 표시
function showTranslateButton(x, y) {
  if (!translateButton) {
    translateButton = createTranslateButton();
  }
  
  translateButton.style.left = `${x}px`;
  translateButton.style.top = `${y}px`;
  translateButton.style.opacity = '1';
  
  // 화면 밖으로 나가지 않도록 위치 조정
  const rect = translateButton.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    translateButton.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
}

// 번역 버튼 숨기기
function hideTranslateButton() {
  if (translateButton) {
    translateButton.style.opacity = '0';
  }
}

// 텍스트 선택 시 번역 팝업 표시
function showTranslationPopup(text, translatedText, x, y) {
  const popup = createTranslationPopup();
  const content = popup.querySelector('#gemini-translation-content');
  
  if (content) {
    content.textContent = translatedText;
  }
  
  // 번역 버튼 숨기기
  hideTranslateButton();
  
  // 팝업 위치 설정
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.display = 'block';
  
  // 화면 밖으로 팝업이 넘어가지 않도록 위치 조정
  const rect = popup.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    popup.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    popup.style.top = `${window.innerHeight - rect.height - 10}px`;
  }
}

// 선택한 텍스트 번역 함수
function translateSelectedText() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  
  const selectedText = selection.toString().trim();
  if (!selectedText) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // 번역 중 표시
  showTranslationPopup(selectedText, "번역 중...", rect.left, rect.bottom + 10);
  
  // API 키 확인
  browser.storage.local.get('geminiApiKey').then(result => {
    if (!result.geminiApiKey) {
      showTranslationPopup(selectedText, "Gemini API 키가 설정되지 않았습니다. 확장 프로그램 팝업에서 API 키를 설정해주세요.", rect.left, rect.bottom + 10);
      return;
    }
    
    // 기본 대상 언어
    const targetLanguage = 'ko'; // 항상 한국어로 번역
    
    // 번역 요청
    browser.runtime.sendMessage({
      action: "translateText",
      text: selectedText,
      sourceLanguage: "auto",
      targetLanguage: targetLanguage,
      apiKey: result.geminiApiKey
    }).then(response => {
      if (response.success) {
        showTranslationPopup(selectedText, response.translatedText, rect.left, rect.bottom + 10);
      } else {
        showTranslationPopup(selectedText, `오류 발생: ${response.error}`, rect.left, rect.bottom + 10);
      }
    });
  });
}

// 텍스트 선택 이벤트 감지
document.addEventListener('mouseup', function(e) {
  // 이미 드래그 작업 중이면 무시
  if (isDragging) return;
  
  // 번역 버튼이나 팝업 내부 클릭은 무시
  if (translateButton && translateButton.contains(e.target)) return;
  if (currentPopup && currentPopup.contains(e.target)) return;
  
  // 선택된 텍스트 확인
  const selection = window.getSelection();
  if (selection.isCollapsed) {
    // 선택된 텍스트가 없으면 번역 버튼 숨기기
    hideTranslateButton();
    return;
  }
  
  const selectedText = selection.toString().trim();
  if (!selectedText) {
    hideTranslateButton();
    return;
  }
  
  // 선택 범위 정보 가져오기
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // 번역 버튼 표시
  showTranslateButton(rect.left, rect.bottom + 5);
});

// 클릭하면 번역 버튼 숨기기 (선택 영역 외부 클릭 시)
document.addEventListener('click', function(e) {
  if (translateButton && !translateButton.contains(e.target) && currentPopup && !currentPopup.contains(e.target)) {
    hideTranslateButton();
  }
});

// 번역 버튼 클릭 이벤트
document.addEventListener('click', function(e) {
  if (translateButton && translateButton.contains(e.target)) {
    translateSelectedText();
  }
});

// 배경 스크립트로부터 메시지 수신 (컨텍스트 메뉴 통합용)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "translateSelection") {
    const selectedText = message.text;
    
    // 현재 선택된 텍스트의 위치 가져오기
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // 팝업에 로딩 표시
    showTranslationPopup(selectedText, "번역 중...", rect.left, rect.bottom + 10);
    
    // API 키 확인
    browser.storage.local.get('geminiApiKey').then(result => {
      if (!result.geminiApiKey) {
        showTranslationPopup(selectedText, "Gemini API 키가 설정되지 않았습니다. 확장 프로그램 팝업에서 API 키를 설정해주세요.", rect.left, rect.bottom + 10);
        return;
      }
      
      // 기본 대상 언어
      const targetLanguage = 'ko'; // 항상 한국어로 번역
      
      // 번역 요청
      browser.runtime.sendMessage({
        action: "translateText",
        text: selectedText,
        sourceLanguage: "auto",
        targetLanguage: targetLanguage,
        apiKey: result.geminiApiKey
      }).then(response => {
        if (response.success) {
          showTranslationPopup(selectedText, response.translatedText, rect.left, rect.bottom + 10);
        } else {
          showTranslationPopup(selectedText, `오류 발생: ${response.error}`, rect.left, rect.bottom + 10);
        }
      });
    });
  }
});

// CSS 스타일 추가
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #gemini-translation-popup {
      transition: opacity 0.2s ease-in-out;
    }
    
    #gemini-translation-popup.dragging {
      user-select: none;
      opacity: 0.9;
    }
    
    #gemini-translation-header:hover {
      background-color: #f0f0f0 !important;
    }
    
    #gemini-close-btn:hover {
      color: #4285f4 !important;
    }
    
    #gemini-translation-content {
      line-height: 1.5;
    }
    
    #gemini-translate-button {
      pointer-events: auto;
      transform: scale(1);
      transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
    }
    
    #gemini-translate-button:hover {
      transform: scale(1.05);
    }
    
    #gemini-translate-button:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);
}

addStyles(); 