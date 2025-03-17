document.addEventListener('DOMContentLoaded', function() {
  const sourceLanguageSelect = document.getElementById('sourceLanguage');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const sourceTextArea = document.getElementById('sourceText');
  const translatedTextArea = document.getElementById('translatedText');
  const translateBtn = document.getElementById('translateBtn');
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');

  // API 키 불러오기
  browser.storage.local.get('geminiApiKey').then(result => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      apiKeyStatus.textContent = 'API 키가 저장되어 있습니다.';
      apiKeyStatus.className = 'success';
    }
  });

  // API 키 저장하기
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      browser.storage.local.set({ geminiApiKey: apiKey }).then(() => {
        apiKeyStatus.textContent = 'API 키가 저장되었습니다.';
        apiKeyStatus.className = 'success';
      });
    } else {
      apiKeyStatus.textContent = 'API 키를 입력해주세요.';
      apiKeyStatus.className = 'error';
    }
  });

  // 번역 함수
  translateBtn.addEventListener('click', async function() {
    const sourceText = sourceTextArea.value.trim();
    if (!sourceText) {
      translatedTextArea.value = '번역할 텍스트를 입력해주세요.';
      return;
    }

    // API 키 확인
    const apiKeyResult = await browser.storage.local.get('geminiApiKey');
    if (!apiKeyResult.geminiApiKey) {
      translatedTextArea.value = 'Gemini API 키를 입력하고 저장해주세요.';
      return;
    }

    const apiKey = apiKeyResult.geminiApiKey;
    const sourceLanguage = sourceLanguageSelect.value;
    const targetLanguage = targetLanguageSelect.value;

    // 번역 중 표시
    translatedTextArea.value = '번역 중...';
    translateBtn.disabled = true;

    try {
      const response = await translateText(sourceText, sourceLanguage, targetLanguage, apiKey);
      translatedTextArea.value = response;
    } catch (error) {
      translatedTextArea.value = `오류 발생: ${error.message}`;
    } finally {
      translateBtn.disabled = false;
    }
  });

  // Gemini API를 사용한 번역 함수
  async function translateText(text, sourceLanguage, targetLanguage, apiKey) {
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
}); 