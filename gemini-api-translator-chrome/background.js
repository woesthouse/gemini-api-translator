// 확장프로그램 설치 또는 업데이트 시 실행
chrome.runtime.onInstalled.addListener(() => {
    // 번역 컨텍스트 메뉴 생성
    chrome.contextMenus.create({
        id: "translate-selection",
        title: "선택한 텍스트 번역하기",
        contexts: ["selection"]
    });
    
    // 설정 페이지 컨텍스트 메뉴 생성
    chrome.contextMenus.create({
        id: "open-settings",
        title: "Gemini 번역기 설정",
        contexts: ["action"]
    });

    // 기본 모델 설정 (새로 설치한 경우)
    chrome.storage.local.get('geminiModel', result => {
        if (!result.geminiModel) {
            chrome.storage.local.set({
                geminiModel: "gemini-2.0-pro-exp-02-05"
            });
        }
    });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate-selection") {
        // 선택된 텍스트가 있는 경우
        if (info.selectionText) {
            // 선택된 텍스트를 번역하기 위해 content script에 메시지 전송
            chrome.tabs.sendMessage(tab.id, {
                action: "translateSelection",
                text: info.selectionText
            });
        }
    } else if (info.menuItemId === "open-settings") {
        // 설정 페이지 열기
        chrome.runtime.openOptionsPage();
    }
});

// 팝업에서 컨텐츠 스크립트로 메시지를 전달하는 통신 채널
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // API 번역 요청 처리
    if (message.action === "translateText") {
        const modelName = message.modelName || null;
        
        // 모델 이름이 없는 경우 저장된 모델 확인
        if (!modelName) {
            chrome.storage.local.get('geminiModel', result => {
                const model = result.geminiModel || "gemini-2.0-pro-exp-02-05";
                handleTranslateRequest(message)
                    .then(result => {
                        sendResponse(result);
                    })
                    .catch(error => {
                        sendResponse({ success: false, error: error.message });
                    });
            });
        } else {
            // 모델 이름이 있는 경우 해당 모델 사용
            handleTranslateRequest(message)
                .then(result => {
                    sendResponse(result);
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
        }
        return true; // 비동기 응답을 위해 true 반환
    }
    
    // 옵션 페이지로부터 기본 프롬프트 요청 처리
    if (message.action === "requestDefaultSystemPrompt") {
        chrome.runtime.sendMessage({ action: "getDefaultSystemPrompt" })
            .then(response => {
                if (response && response.defaultSystemPrompt) {
                    sendResponse({ success: true, defaultSystemPrompt: response.defaultSystemPrompt });
                } else {
                    sendResponse({ success: false, error: "기본 프롬프트를 가져올 수 없습니다." });
                }
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

// 번역 요청 처리
async function handleTranslateRequest(message) {
  try {
    const { text, sourceLanguage, targetLanguage, apiKey, modelName } = message;
    
    // 저장된 매개변수 불러오기
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['systemPrompt', 'parameters'], resolve);
    });
    const parameters = result.parameters || { temperature: 0.7, topK: 40, topP: 0.95 };
    
    // 시스템 프롬프트 설정
    // result.systemPrompt가 undefined인 경우만 오류로 판단
    // "" 빈 문자열은 사용자가 의도적으로 빈칸으로 설정한 것으로 간주
    let systemPrompt = result.systemPrompt;
    if (systemPrompt === undefined) {
      return { 
        success: false, 
        error: "시스템 프롬프트 설정에 문제가 있습니다. 확장 프로그램 설정을 확인해주세요." 
      };
    }
    
    // 언어 정보 추가
    const sourceLangName = getLanguageName(sourceLanguage);
    const targetLangName = getLanguageName(targetLanguage);
    
    let fullPrompt = systemPrompt || "";
    
    // 언어 지정이 자동이 아닌 경우 언어 정보 추가
    if (sourceLanguage !== 'auto') {
      fullPrompt += `\n\n다음 ${sourceLangName} 텍스트를 ${targetLangName}로 번역해 주세요:`;
    } else {
      fullPrompt += `\n\n다음 텍스트를 ${targetLangName}로 번역해 주세요:`;
    }
    
    const translatedText = await translateWithGemini(
      apiKey, 
      modelName, 
      fullPrompt, 
      text,
      parameters.temperature, 
      parameters.topK, 
      parameters.topP
    );
    
    return { success: true, translatedText };
  } catch (error) {
    console.error('번역 오류:', error);
    return { success: false, error: error.message };
  }
}

// Gemini API를 사용하여 번역
async function translateWithGemini(apiKey, modelName, systemPrompt, text, temperature, topK, topP) {
  // API URL을 v1beta로 변경 (v2가 아닌)
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const requestData = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\n${text}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      topK: topK,
      topP: topP,
      candidateCount: 1,
      maxOutputTokens: 1024,
    }
  };
  
  try {
    console.log(`API 요청 URL: ${apiUrl}`);
    console.log('요청 데이터:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const responseText = await response.text();
    console.log('API 응답 텍스트:', responseText);
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        
        // API 키 오류인 경우 사용자 친화적인 메시지 반환
        if (errorData.error && errorData.error.code === 400 && 
            errorData.error.message && errorData.error.message.includes("API key not valid")) {
          throw new Error("API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.");
        }
        
        // 다른 API 오류의 경우에도 사용자 친화적인 메시지로 변환
        if (errorData.error && errorData.error.message) {
          throw new Error(`API 오류: ${errorData.error.message}`);
        }
        
        throw new Error(`API 오류가 발생했습니다 (${response.status})`);
      } catch (parseErr) {
        if (parseErr.message.includes("API 키가 유효하지 않습니다") || 
            parseErr.message.includes("API 오류:")) {
          throw parseErr;
        }
        throw new Error(`API 응답을 처리하는 중 오류가 발생했습니다: ${parseErr.message}`);
      }
    }
    
    try {
      const responseData = JSON.parse(responseText);
      
      // 응답 구조 확인
      if (responseData && 
          responseData.candidates && 
          responseData.candidates[0] && 
          responseData.candidates[0].content && 
          responseData.candidates[0].content.parts && 
          responseData.candidates[0].content.parts[0] && 
          responseData.candidates[0].content.parts[0].text) {
        
        // 번역된 텍스트 반환
        return responseData.candidates[0].content.parts[0].text;
      } else {
        throw new Error("API 응답 형식이 예상과 다릅니다.");
      }
    } catch (error) {
      console.error("API 응답 파싱 오류:", error);
      throw new Error(`응답을 처리하는 중 오류가 발생했습니다: ${error.message}`);
    }
  } catch (error) {
    console.error("API 요청 오류:", error);
    throw error;
  }
}

// 언어 코드에 해당하는 언어 이름 반환 함수
function getLanguageName(langCode) {
  const languages = {
    'auto': '자동 감지',
    'ko': '한국어',
    'en': '영어',
    'ja': '일본어',
    'zh': '중국어'
  };
  return languages[langCode] || langCode;
}