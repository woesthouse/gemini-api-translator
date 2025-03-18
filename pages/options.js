document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const deleteApiKeyBtn = document.getElementById('deleteApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  
  const systemPromptInput = document.getElementById('systemPrompt');
  const userPromptInput = document.getElementById('userPrompt');
  const savePromptsBtn = document.getElementById('savePrompts');
  const promptStatus = document.getElementById('promptStatus');
  
  // 프롬프트 버튼 요소들
  const promptButtons = {
    prompt1: document.getElementById('prompt1'),
    prompt2: document.getElementById('prompt2'),
    prompt3: document.getElementById('prompt3'),
    prompt4: document.getElementById('prompt4'),
    prompt5: document.getElementById('prompt5')
  };
  
  // 현재 선택된 프롬프트 번호 (기본값: 1)
  let currentPromptNumber = 1;
  
  // 기본 시스템 프롬프트
  const defaultSystemPrompt = `다음 텍스트를 번역해주세요. 
오직 입력된 텍스트만 번역하고, 번역된 텍스트만 출력해주세요.
여러 번역 결과를 제시하지 말고 하나의 최적 번역만 제공해주세요.
마크다운 형식이나 추가 설명 없이 일반 텍스트로만 응답해주세요.
따옴표나 괄호 등 원본에 없는 기호를 추가하지 마세요.
입력된 텍스트에 단어와 문장이 함께 있을 경우에도 메타 정보를 추가하지 말고 순수하게 번역만 해주세요.
텍스트의 모든 부분을 동일한 방식으로 처리하고, 특정 부분에 특별한 표시나 주석을 추가하지 마세요.
번역 외의 다른 말을 하지 마세요. 번역만 해주세요.`;
  
  // 다른 부분에서 기본 프롬프트 요청 시 응답하는 메시지 리스너
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getDefaultSystemPrompt") {
      sendResponse({ defaultSystemPrompt: defaultSystemPrompt });
      return true;
    }
  });
  
  // 활성화된 프롬프트 버튼 스타일 적용
  function updatePromptButtonStyles() {
    // 모든 버튼 스타일 초기화
    Object.values(promptButtons).forEach(button => {
      if (button) button.style.backgroundColor = '';
    });
    
    // 현재 선택된 버튼 강조
    const selectedButton = promptButtons[`prompt${currentPromptNumber}`];
    if (selectedButton) selectedButton.style.backgroundColor = '#34a853';
  }
  
  // 프롬프트 버튼 클릭 이벤트 설정
  for (let i = 1; i <= 5; i++) {
    const button = promptButtons[`prompt${i}`];
    if (button) {
      button.addEventListener('click', function() {
        // 현재 프롬프트 저장
        saveCurrentPrompt();
        
        // 새 프롬프트 로드
        currentPromptNumber = i;
        loadSelectedPrompt();
        
        // 버튼 스타일 업데이트
        updatePromptButtonStyles();
      });
    }
  }
  
  // 현재 프롬프트 저장 함수
  function saveCurrentPrompt() {
    const promptKey = `userPrompt${currentPromptNumber}`;
    const promptValue = userPromptInput.value.trim();
    
    // 현재 프롬프트 저장
    const data = {};
    data[promptKey] = promptValue;
    
    browser.storage.local.set(data);
  }
  
  // 선택된 프롬프트 불러오기
  function loadSelectedPrompt() {
    const promptKey = `userPrompt${currentPromptNumber}`;
    
    browser.storage.local.get([promptKey]).then(result => {
      if (result[promptKey] !== undefined) {
        userPromptInput.value = result[promptKey];
      } else {
        userPromptInput.value = '';
      }
    });
  }
  
  // 저장된 설정 불러오기
  browser.storage.local.get(['geminiApiKey', 'systemPrompt', 'currentPromptNumber', 'userPrompt1', 'userPrompt2', 'userPrompt3', 'userPrompt4', 'userPrompt5']).then(result => {
    // API 키 설정
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    
    // 시스템 프롬프트 설정
    if (result.systemPrompt !== undefined) {
      systemPromptInput.value = result.systemPrompt;
    } else {
      // 기본값 설정 및 저장
      systemPromptInput.value = defaultSystemPrompt;
      browser.storage.local.set({ systemPrompt: defaultSystemPrompt });
    }
    
    // 현재 선택된 프롬프트 번호 설정
    if (result.currentPromptNumber) {
      currentPromptNumber = result.currentPromptNumber;
    }
    
    // 선택된 프롬프트 불러오기
    loadSelectedPrompt();
    
    // 버튼 스타일 업데이트
    updatePromptButtonStyles();
  });
  
  // API 키 저장
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      browser.storage.local.set({ geminiApiKey: apiKey }).then(() => {
        apiKeyStatus.textContent = 'API 키가 저장되었습니다.';
        apiKeyStatus.className = 'status success';
        setTimeout(() => {
          apiKeyStatus.textContent = '';
          apiKeyStatus.className = 'status';
        }, 3000);
      });
    } else {
      apiKeyStatus.textContent = 'API 키를 입력해주세요.';
      apiKeyStatus.className = 'status error';
    }
  });
  
  // API 키 삭제
  deleteApiKeyBtn.addEventListener('click', function() {
    // 사용자에게 확인 요청
    if (confirm('정말 API 키를 삭제하시겠습니까?')) {
      browser.storage.local.remove('geminiApiKey').then(() => {
        apiKeyInput.value = ''; // 입력 필드 비우기
        apiKeyStatus.textContent = 'API 키가 삭제되었습니다.';
        apiKeyStatus.className = 'status success';
        setTimeout(() => {
          apiKeyStatus.textContent = '';
          apiKeyStatus.className = 'status';
        }, 3000);
      }).catch(error => {
        apiKeyStatus.textContent = `오류: ${error.message}`;
        apiKeyStatus.className = 'status error';
      });
    }
  });
  
  // 프롬프트 설정 저장
  savePromptsBtn.addEventListener('click', function() {
    const systemPrompt = systemPromptInput.value.trim();
    
    // 현재 프롬프트 저장
    saveCurrentPrompt();
    
    // 시스템 프롬프트와 현재 프롬프트 번호 저장
    const data = {
      systemPrompt: systemPrompt,
      currentPromptNumber: currentPromptNumber
    };
    
    browser.storage.local.set(data).then(() => {
      promptStatus.textContent = '프롬프트 설정이 저장되었습니다.';
      promptStatus.className = 'status success';
      setTimeout(() => {
        promptStatus.textContent = '';
        promptStatus.className = 'status';
      }, 3000);
    });
  });
}); 