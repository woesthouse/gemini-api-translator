// 확장프로그램 설치 또는 업데이트 시 실행
browser.runtime.onInstalled.addListener(() => {
  // 컨텍스트 메뉴 생성
  browser.contextMenus.create({
    id: "translate-selection",
    title: "선택한 텍스트 번역하기",
    contexts: ["selection"]
  });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-selection") {
    // 선택된 텍스트가 있는 경우
    if (info.selectionText) {
      // 선택된 텍스트를 번역하기 위해 content script에 메시지 전송
      browser.tabs.sendMessage(tab.id, {
        action: "translateSelection",
        text: info.selectionText
      });
    }
  }
});

// 팝업에서 컨텐츠 스크립트로 메시지를 전달하는 통신 채널
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // API 번역 요청 처리
  if (message.action === "translateText") {
    translateWithGemini(message.text, message.sourceLanguage, message.targetLanguage, message.apiKey)
      .then(result => {
        sendResponse({ success: true, translatedText: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true 반환
  }
});

// Gemini API를 사용한 번역 함수
async function translateWithGemini(text, sourceLanguage, targetLanguage, apiKey) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent?key=${apiKey}`;
  
  // 번역 프롬프트 구성
  let prompt = `다음 텍스트를 ${getLanguageName(targetLanguage)}로 번역해주세요:\n\n${text}`;
  
  if (sourceLanguage !== 'auto') {
    prompt = `다음 ${getLanguageName(sourceLanguage)} 텍스트를 ${getLanguageName(targetLanguage)}로 번역해주세요:\n\n${text}`;
  }
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message || '번역 요청 중 오류가 발생했습니다.');
  }

  const data = await response.json();
  
  // Gemini 응답에서 번역된 텍스트 추출
  if (data.candidates && data.candidates.length > 0 && 
      data.candidates[0].content && data.candidates[0].content.parts && 
      data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('번역 결과를 찾을 수 없습니다.');
  }
}

// 언어 코드에 해당하는 언어 이름 반환 함수
function getLanguageName(langCode) {
  const languages = {
    'auto': '자동 감지',
    'ko': '한국어',
    'en': '영어',
    'ja': '일본어',
    'zh': '중국어',
    'es': '스페인어',
    'fr': '프랑스어',
    'de': '독일어'
  };
  return languages[langCode] || langCode;
} 