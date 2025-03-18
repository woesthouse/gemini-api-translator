// 확장프로그램 설치 또는 업데이트 시 실행
browser.runtime.onInstalled.addListener(() => {
    // 번역 컨텍스트 메뉴 생성
    browser.contextMenus.create({
        id: "translate-selection",
        title: "선택한 텍스트 번역하기",
        contexts: ["selection"]
    });
    
    // 설정 페이지 컨텍스트 메뉴 생성
    browser.contextMenus.create({
        id: "open-settings",
        title: "Gemini 번역기 설정",
        contexts: ["browser_action"]
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
    } else if (info.menuItemId === "open-settings") {
        // 설정 페이지 열기
        browser.runtime.openOptionsPage();
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
    
    // 옵션 페이지로부터 기본 프롬프트 요청 처리
    if (message.action === "requestDefaultSystemPrompt") {
        browser.runtime.sendMessage({ action: "getDefaultSystemPrompt" })
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

// Gemini API를 사용한 번역 함수
async function translateWithGemini(text, sourceLanguage, targetLanguage, apiKey, modelName) {
    // 모델 이름이 없는 경우 기본값 사용
    const model = modelName || "gemini-2.0-pro-exp-02-05";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 저장된 프롬프트 설정 가져오기
    const settings = await browser.storage.local.get(['systemPrompt', 'userPrompt']);
    
    // 프롬프트가 없을 경우 options.js로 기본값 저장 요청
    if (!settings.systemPrompt) {
        // 백그라운드에서 옵션 페이지의 기본값을 요청
        browser.runtime.sendMessage({ action: "getDefaultSystemPrompt" })
            .then(response => {
                if (response && response.defaultSystemPrompt) {
                    browser.storage.local.set({ systemPrompt: response.defaultSystemPrompt });
                }
            })
            .catch(error => {
                console.log("기본 프롬프트를 가져올 수 없습니다:", error);
            });
    }
    
    // 프롬프트 구성
    let promptBase = settings.systemPrompt || "다음 텍스트를 번역해주세요.";
    
    // 언어 정보 추가
    let languageInfo = "";
    if (sourceLanguage !== 'auto') {
        languageInfo = `다음 ${getLanguageName(sourceLanguage)} 텍스트를 ${getLanguageName(targetLanguage)}로 번역`;
    } else {
        languageInfo = `다음 텍스트를 ${getLanguageName(targetLanguage)}로 번역`;
    }
    
    // 프롬프트에 이미 언어 정보가 포함되어 있지 않은 경우에만 추가
    if (!promptBase.includes(getLanguageName(targetLanguage))) {
        promptBase = languageInfo + promptBase.substring(promptBase.indexOf("해주세요"));
    }
    
    // 사용자 정의 프롬프트 추가
    let finalPrompt = promptBase;
    if (settings.userPrompt) {
        finalPrompt += `\n\n${settings.userPrompt}`;
    }
    
    // 번역할 텍스트 추가
    finalPrompt += `\n\n${text}`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: finalPrompt
                    }
                ]
            }
        ],
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
        'zh': '중국어'
    };
    return languages[langCode] || langCode;
}