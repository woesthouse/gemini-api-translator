// 확장프로그램 설치 또는 업데이트 시 실행
browser.runtime.onInstalled.addListener(() => {
    // 컨텍스트 메뉴 생성
    browser.contextMenus.create({
        id: "translate-selection",
        title: "선택한 텍스트 번역하기",
        contexts: ["selection"]
    });

    // 기본 모델 설정 (새로 설치한 경우)
    browser.storage.local.get('geminiModel').then(result => {
        if (!result.geminiModel) {
            browser.storage.local.set({
                geminiModel: "gemini-2.0-pro-exp-02-05"
            });
        }
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
        const modelName = message.modelName || null;

        // 모델 이름이 없는 경우 저장된 모델 확인
        if (!modelName) {
            browser.storage.local.get('geminiModel').then(result => {
                const model = result.geminiModel || "gemini-2.0-pro-exp-02-05";
                translateWithGemini(message.text, message.sourceLanguage, message.targetLanguage, message.apiKey, model)
                    .then(result => {
                        sendResponse({ success: true, translatedText: result });
                    })
                    .catch(error => {
                        sendResponse({ success: false, error: error.message });
                    });
            });
        } else {
            // 모델 이름이 있는 경우 해당 모델 사용
            translateWithGemini(message.text, message.sourceLanguage, message.targetLanguage, message.apiKey, modelName)
                .then(result => {
                    sendResponse({ success: true, translatedText: result });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
        }
        return true; // 비동기 응답을 위해 true 반환
    }
});

// Gemini API를 사용한 번역 함수
async function translateWithGemini(text, sourceLanguage, targetLanguage, apiKey, modelName) {
    // 모델 이름이 없는 경우 기본값 사용
    const model = modelName || "gemini-2.0-pro-exp-02-05";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 설정 가져오기
    const settings = await browser.storage.local.get([
        'useDetailedPrompt',
        'currentPreset',
        'customPrompt1',
        'customPrompt2',
        'customPrompt3'
    ]);

    // 시스템 프롬프트 설정 확인
    const useDetailedPrompt = settings.useDetailedPrompt !== undefined ? settings.useDetailedPrompt : true; // 기본값은 true

    // 현재 선택된 프리셋 확인
    const currentPreset = settings.currentPreset || 1;
    const customPromptKey = `customPrompt${currentPreset}`;
    const customPrompt = settings[customPromptKey];

    // 기본 프롬프트
    let prompt = `다음 ${sourceLanguage !== 'auto' ? getLanguageName(sourceLanguage) + ' ' : ''}텍스트를 ${getLanguageName(targetLanguage)}로 번역해주세요.`;

    // 시스템 프롬프트 추가 여부 확인
    if (useDetailedPrompt) {
        prompt += `
오직 입력된 텍스트만 번역하고, 번역된 텍스트만 출력해주세요.
여러 번역 결과를 제시하지 말고 하나의 최적 번역만 제공해주세요.
마크다운 형식이나 추가 설명 없이 일반 텍스트로만 응답해주세요.
따옴표나 괄호 등 원본에 없는 기호를 추가하지 마세요.
입력된 텍스트에 단어와 문장이 함께 있을 경우에 메타 정보를 추가하지 마세요.
텍스트의 모든 부분을 동일한 방식으로 처리하고, 특정 부분에 특별한 표시나 주석을 추가하지 마세요.
번역 외의 다른 말을 하지 마세요. 번역만 해주세요.`;
    }

    // 사용자 설정 프롬프트 추가
    if (customPrompt && customPrompt.trim() !== '') {
        prompt += `\n${customPrompt}`;
    }

    // 텍스트 추가
    prompt += `\n\n${text}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.1,
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