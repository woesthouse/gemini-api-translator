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
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    
    browser.storage.local.set({ parameters }).then(() => {
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
  browser.storage.local.get([
    'geminiApiKey', 
    'systemPrompt', 
    'currentPromptNumber', 
    'userPrompt1', 
    'userPrompt2', 
    'userPrompt3', 
    'userPrompt4', 
    'userPrompt5',
    'parameters'
  ]).then(result => {
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
      // 기본값 설정 및 저장
      browser.storage.local.set({ parameters: defaultParameters });
    }
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
  
  // 프롬프트 초기화 버튼
  resetPromptsBtn.addEventListener('click', function() {
    if (confirm('모든 프롬프트 설정을 초기화하시겠습니까?')) {
      // 시스템 프롬프트를 기본값으로 설정
      systemPromptInput.value = defaultSystemPrompt;
      
      // 현재 사용자 프롬프트 비우기
      userPromptInput.value = '';
      
      // 모든 사용자 프롬프트와 시스템 프롬프트 초기화 (API 키는 유지)
      browser.storage.local.get(['geminiApiKey', 'parameters']).then(result => {
        const apiKey = result.geminiApiKey;
        const parameters = result.parameters;
        
        // 스토리지 초기화
        browser.storage.local.clear().then(() => {
          // API 키 다시 저장
          if (apiKey) {
            browser.storage.local.set({ geminiApiKey: apiKey });
          }
          
          // 매개변수 다시 저장
          if (parameters) {
            browser.storage.local.set({ parameters: parameters });
          }
          
          // 기본 시스템 프롬프트 저장
          browser.storage.local.set({ 
            systemPrompt: defaultSystemPrompt,
            currentPromptNumber: 1
          });
          
          // 현재 프롬프트 번호 초기화
          currentPromptNumber = 1;
          
          // 버튼 스타일 업데이트
          updatePromptButtonStyles();
          
          // 성공 메시지
          promptStatus.textContent = '프롬프트 설정이 초기화되었습니다.';
          promptStatus.className = 'status success';
          setTimeout(() => {
            promptStatus.textContent = '';
            promptStatus.className = 'status';
          }, 3000);
        });
      });
    }
  });
  
  // 매개변수 초기화 버튼
  resetParametersBtn.addEventListener('click', function() {
    if (confirm('번역 매개변수를 기본값으로 초기화하시겠습니까?')) {
      // 슬라이더를 기본값으로 설정
      temperatureSlider.value = defaultParameters.temperature;
      temperatureValue.textContent = defaultParameters.temperature;
      
      topKSlider.value = defaultParameters.topK;
      topKValue.textContent = defaultParameters.topK;
      
      topPSlider.value = defaultParameters.topP;
      topPValue.textContent = defaultParameters.topP;
      
      // 기본 매개변수 저장
      browser.storage.local.set({ parameters: defaultParameters }).then(() => {
        parametersStatus.textContent = '매개변수가 기본값으로 초기화되었습니다.';
        parametersStatus.className = 'status success';
        setTimeout(() => {
          parametersStatus.textContent = '';
          parametersStatus.className = 'status';
        }, 3000);
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
  
  // 설정 내보내기 버튼
  exportSettingsBtn.addEventListener('click', function() {
    // 모든 관련 설정 가져오기
    browser.storage.local.get([
      'geminiApiKey', 
      'systemPrompt', 
      'currentPromptNumber', 
      'userPrompt1', 
      'userPrompt2', 
      'userPrompt3', 
      'userPrompt4', 
      'userPrompt5',
      'parameters'
    ]).then(result => {
      // 설정을 JSON으로 변환
      const settingsJson = JSON.stringify(result, null, 2);
      
      // 다운로드 링크 생성
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 현재 날짜를 파일명에 추가
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const filename = `gemini_translator_settings_${dateStr}.json`;
      
      // 다운로드 링크 생성 및 클릭
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 정리
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 성공 메시지
        backupStatus.textContent = '설정이 성공적으로 내보내졌습니다.';
        backupStatus.className = 'status success';
        setTimeout(() => {
          backupStatus.textContent = '';
          backupStatus.className = 'status';
        }, 3000);
      }, 100);
    }).catch(error => {
      backupStatus.textContent = `오류: ${error.message}`;
      backupStatus.className = 'status error';
    });
  });
  
  // 가져오기 버튼 -> 파일 선택 다이얼로그
  importSettingsBtn.addEventListener('click', function() {
    importFileInput.click();
  });
  
  // 파일 선택 후 처리
  importFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const settings = JSON.parse(e.target.result);
        
        // 확인 메시지
        if (confirm('설정을 가져오시겠습니까? 기존 설정이 덮어씌워집니다.')) {
          // 설정 적용
          browser.storage.local.set(settings).then(() => {
            // UI 업데이트
            if (settings.geminiApiKey) {
              apiKeyInput.value = settings.geminiApiKey;
            }
            
            if (settings.systemPrompt !== undefined) {
              systemPromptInput.value = settings.systemPrompt;
            }
            
            if (settings.currentPromptNumber) {
              currentPromptNumber = settings.currentPromptNumber;
            }
            
            // 프롬프트 불러오기
            loadSelectedPrompt();
            
            // 버튼 스타일 업데이트
            updatePromptButtonStyles();
            
            // 매개변수 설정 불러오기
            if (settings.parameters) {
              // 온도 설정
              if (settings.parameters.temperature !== undefined) {
                temperatureSlider.value = settings.parameters.temperature;
                temperatureValue.textContent = settings.parameters.temperature;
              }
              
              // Top K 설정
              if (settings.parameters.topK !== undefined) {
                topKSlider.value = settings.parameters.topK;
                topKValue.textContent = settings.parameters.topK;
              }
              
              // Top P 설정
              if (settings.parameters.topP !== undefined) {
                topPSlider.value = settings.parameters.topP;
                topPValue.textContent = settings.parameters.topP;
              }
            }
            
            // 성공 메시지
            backupStatus.textContent = '설정이 성공적으로 가져와졌습니다.';
            backupStatus.className = 'status success';
            setTimeout(() => {
              backupStatus.textContent = '';
              backupStatus.className = 'status';
            }, 3000);
          });
        }
      } catch (error) {
        backupStatus.textContent = `오류: 잘못된 설정 파일입니다. ${error.message}`;
        backupStatus.className = 'status error';
      }
      
      // 파일 입력 초기화
      importFileInput.value = '';
    };
    
    reader.onerror = function() {
      backupStatus.textContent = '오류: 파일을 읽을 수 없습니다.';
      backupStatus.className = 'status error';
      importFileInput.value = '';
    };
    
    reader.readAsText(file);
  });
}); 