document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const deleteApiKeyBtn = document.getElementById('deleteApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  
  const systemPromptInput = document.getElementById('systemPrompt');
  const userPromptInput = document.getElementById('userPrompt');
  const savePromptsBtn = document.getElementById('savePrompts');
  const resetPromptsBtn = document.getElementById('resetPrompts');
  const promptStatus = document.getElementById('promptStatus');
  
  // 매개변수 슬라이더 요소
  const temperatureSlider = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperatureValue');
  const topKSlider = document.getElementById('topK');
  const topKValue = document.getElementById('topKValue');
  const topPSlider = document.getElementById('topP');
  const topPValue = document.getElementById('topPValue');
  const saveParametersBtn = document.getElementById('saveParameters');
  const resetParametersBtn = document.getElementById('resetParameters');
  const parametersStatus = document.getElementById('parametersStatus');
  
  // 설정 백업 및 복원 요소
  const exportSettingsBtn = document.getElementById('exportSettings');
  const importSettingsBtn = document.getElementById('importSettings');
  const importFileInput = document.getElementById('importFile');
  const backupStatus = document.getElementById('backupStatus');
  
  // 기본 매개변수 값
  const defaultParameters = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95
  };
  
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
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getDefaultSystemPrompt") {
      sendResponse({ defaultSystemPrompt: defaultSystemPrompt });
      return true;
    }
  });
  
  // 슬라이더 값 변경 시 표시 업데이트 및 이벤트 처리
  temperatureSlider.addEventListener('input', function() {
    temperatureValue.textContent = this.value;
  });
  
  topKSlider.addEventListener('input', function() {
    topKValue.textContent = this.value;
  });
  
  topPSlider.addEventListener('input', function() {
    topPValue.textContent = this.value;
  });
  
  // 매개변수 설정 저장
  saveParametersBtn.addEventListener('click', function() {
    const parameters = {
      temperature: parseFloat(temperatureSlider.value),
      topK: parseInt(topKSlider.value),
      topP: parseFloat(topPSlider.value)
    };
    
    chrome.storage.local.set({ parameters }, () => {
      parametersStatus.textContent = '매개변수 설정이 저장되었습니다.';
      parametersStatus.className = 'status success';
      setTimeout(() => {
        parametersStatus.textContent = '';
        parametersStatus.className = 'status';
      }, 3000);
    });
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
    
    chrome.storage.local.set(data);
  }
  
  // 선택된 프롬프트 불러오기
  function loadSelectedPrompt() {
    const promptKey = `userPrompt${currentPromptNumber}`;
    
    chrome.storage.local.get([promptKey], result => {
      if (result[promptKey] !== undefined) {
        userPromptInput.value = result[promptKey];
      } else {
        userPromptInput.value = '';
      }
    });
  }
  
  // 저장된 설정 불러오기
  chrome.storage.local.get([
    'geminiApiKey', 
    'systemPrompt', 
    'currentPromptNumber', 
    'userPrompt1', 
    'userPrompt2', 
    'userPrompt3', 
    'userPrompt4', 
    'userPrompt5',
    'parameters'
  ], result => {
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
      chrome.storage.local.set({ systemPrompt: defaultSystemPrompt });
    }
    
    // 현재 선택된 프롬프트 번호 설정
    if (result.currentPromptNumber) {
      currentPromptNumber = result.currentPromptNumber;
    }
    
    // 선택된 프롬프트 불러오기
    loadSelectedPrompt();
    
    // 버튼 스타일 업데이트
    updatePromptButtonStyles();
    
    // 매개변수 설정 불러오기
    if (result.parameters) {
      // 온도 설정
      if (result.parameters.temperature !== undefined) {
        temperatureSlider.value = result.parameters.temperature;
        temperatureValue.textContent = result.parameters.temperature;
      }
      
      // Top K 설정
      if (result.parameters.topK !== undefined) {
        topKSlider.value = result.parameters.topK;
        topKValue.textContent = result.parameters.topK;
      }
      
      // Top P 설정
      if (result.parameters.topP !== undefined) {
        topPSlider.value = result.parameters.topP;
        topPValue.textContent = result.parameters.topP;
      }
    } else {
      // 기본값 설정
      temperatureSlider.value = defaultParameters.temperature;
      temperatureValue.textContent = defaultParameters.temperature;
      
      topKSlider.value = defaultParameters.topK;
      topKValue.textContent = defaultParameters.topK;
      
      topPSlider.value = defaultParameters.topP;
      topPValue.textContent = defaultParameters.topP;
    }
  });
  
  // API 키 저장
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      apiKeyStatus.textContent = 'API 키를 입력해주세요.';
      apiKeyStatus.className = 'status error';
      return;
    }
    
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
      apiKeyStatus.textContent = 'API 키가 저장되었습니다.';
      apiKeyStatus.className = 'status success';
      setTimeout(() => {
        apiKeyStatus.textContent = '';
        apiKeyStatus.className = 'status';
      }, 3000);
    });
  });
  
  // API 키 삭제
  deleteApiKeyBtn.addEventListener('click', function() {
    if (confirm('API 키를 삭제하시겠습니까?')) {
      chrome.storage.local.remove('geminiApiKey', () => {
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'API 키가 삭제되었습니다.';
        apiKeyStatus.className = 'status success';
        setTimeout(() => {
          apiKeyStatus.textContent = '';
          apiKeyStatus.className = 'status';
        }, 3000);
      });
    }
  });
  
  // 프롬프트 저장
  savePromptsBtn.addEventListener('click', function() {
    const systemPrompt = systemPromptInput.value.trim();
    const userPrompt = userPromptInput.value.trim();
    
    if (!systemPrompt) {
      promptStatus.textContent = '시스템 프롬프트를 입력해주세요.';
      promptStatus.className = 'status error';
      return;
    }
    
    // 현재 프롬프트 저장
    saveCurrentPrompt();
    
    // 시스템 프롬프트 저장
    chrome.storage.local.set({ 
      systemPrompt,
      currentPromptNumber 
    }, () => {
      promptStatus.textContent = '프롬프트 설정이 저장되었습니다.';
      promptStatus.className = 'status success';
      setTimeout(() => {
        promptStatus.textContent = '';
        promptStatus.className = 'status';
      }, 3000);
    });
  });
  
  // 프롬프트 초기화
  resetPromptsBtn.addEventListener('click', function() {
    if (confirm('프롬프트 설정을 기본값으로 초기화하시겠습니까?')) {
      // 시스템 프롬프트 초기화
      systemPromptInput.value = defaultSystemPrompt;
      
      // 저장
      chrome.storage.local.set({ 
        systemPrompt: defaultSystemPrompt 
      }, () => {
        promptStatus.textContent = '프롬프트 설정이 초기화되었습니다.';
        promptStatus.className = 'status success';
        setTimeout(() => {
          promptStatus.textContent = '';
          promptStatus.className = 'status';
        }, 3000);
      });
    }
  });
  
  // 매개변수 초기화
  resetParametersBtn.addEventListener('click', function() {
    if (confirm('매개변수 설정을 기본값으로 초기화하시겠습니까?')) {
      // 슬라이더 값 초기화
      temperatureSlider.value = defaultParameters.temperature;
      temperatureValue.textContent = defaultParameters.temperature;
      
      topKSlider.value = defaultParameters.topK;
      topKValue.textContent = defaultParameters.topK;
      
      topPSlider.value = defaultParameters.topP;
      topPValue.textContent = defaultParameters.topP;
      
      // 저장
      chrome.storage.local.set({ parameters: defaultParameters }, () => {
        parametersStatus.textContent = '매개변수 설정이 초기화되었습니다.';
        parametersStatus.className = 'status success';
        setTimeout(() => {
          parametersStatus.textContent = '';
          parametersStatus.className = 'status';
        }, 3000);
      });
    }
  });
  
  // 모든 설정 내보내기
  exportSettingsBtn.addEventListener('click', function() {
    chrome.storage.local.get(null, settings => {
      // API 키 삭제 (보안을 위해)
      delete settings.geminiApiKey;
      
      // 설정을 JSON으로 변환
      const settingsJson = JSON.stringify(settings, null, 2);
      
      // 다운로드 링크 생성
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 현재 날짜와 시간으로 파일명 생성
      const now = new Date();
      const fileName = `gemini_translator_settings_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.json`;
      
      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // 링크 제거
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      // 상태 업데이트
      backupStatus.textContent = '설정이 내보내기되었습니다.';
      backupStatus.className = 'status success';
      setTimeout(() => {
        backupStatus.textContent = '';
        backupStatus.className = 'status';
      }, 3000);
    });
  });
  
  // 모든 설정 가져오기
  importSettingsBtn.addEventListener('click', function() {
    importFileInput.click();
  });
  
  // 파일 선택 이벤트
  importFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const settings = JSON.parse(e.target.result);
        
        // API 키는 가져오지 않음
        delete settings.geminiApiKey;
        
        // 설정 저장
        chrome.storage.local.set(settings, () => {
          // 설정 다시 로드
          location.reload();
          
          // 상태 업데이트
          backupStatus.textContent = '설정이 가져오기되었습니다.';
          backupStatus.className = 'status success';
        });
      } catch (err) {
        backupStatus.textContent = '설정 파일 형식이 올바르지 않습니다.';
        backupStatus.className = 'status error';
        setTimeout(() => {
          backupStatus.textContent = '';
          backupStatus.className = 'status';
        }, 3000);
      }
    };
    reader.readAsText(file);
  });
}); 