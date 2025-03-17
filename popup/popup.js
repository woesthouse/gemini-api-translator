document.addEventListener('DOMContentLoaded', function() {
    const geminiModelSelect = document.getElementById('geminiModel');
    const sourceLanguageSelect = document.getElementById('sourceLanguage');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const sourceTextArea = document.getElementById('sourceText');
    const translatedTextArea = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const deleteApiKeyBtn = document.getElementById('deleteApiKey');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const useDetailedPromptCheckbox = document.getElementById('useDetailedPrompt');

    // 사용자 설정 프롬프트 관련 요소
    const customPromptTextarea = document.getElementById('customPrompt');
    const saveCustomPromptBtn = document.getElementById('saveCustomPrompt');
    const deleteCustomPromptBtn = document.getElementById('deleteCustomPrompt');
    const customPromptStatus = document.getElementById('customPromptStatus');
    const preset1Btn = document.getElementById('preset1');
    const preset2Btn = document.getElementById('preset2');
    const preset3Btn = document.getElementById('preset3');

    let currentPreset = 1; // 현재 선택된 프리셋
    let customPrompts = {
        1: "",
        2: "",
        3: ""
    };

    // 프리셋 버튼에 활성화 클래스 추가
    function updatePresetButtons() {
        preset1Btn.classList.remove('active');
        preset2Btn.classList.remove('active');
        preset3Btn.classList.remove('active');

        switch (currentPreset) {
            case 1:
                preset1Btn.classList.add('active');
                break;
            case 2:
                preset2Btn.classList.add('active');
                break;
            case 3:
                preset3Btn.classList.add('active');
                break;
        }
    }

    // API 키, 모델, 언어, 프롬프트 설정 불러오기
    browser.storage.local.get([
        'geminiApiKey',
        'geminiModel',
        'sourceLanguage',
        'targetLanguage',
        'useDetailedPrompt',
        'customPrompt1',
        'customPrompt2',
        'customPrompt3',
        'currentPreset'
    ]).then(result => {
        // API 키 설정
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            apiKeyStatus.textContent = 'API 키가 저장되어 있습니다.';
            apiKeyStatus.className = 'success';
        }

        // 모델 설정
        if (result.geminiModel) {
            geminiModelSelect.value = result.geminiModel;
        } else {
            // 기본값으로 첫 번째 모델 저장
            browser.storage.local.set({ geminiModel: geminiModelSelect.value });
        }

        // 언어 설정
        if (result.sourceLanguage) {
            sourceLanguageSelect.value = result.sourceLanguage;
        }

        if (result.targetLanguage) {
            targetLanguageSelect.value = result.targetLanguage;
        }

        // 체크박스 상태 설정
        if (result.useDetailedPrompt !== undefined) {
            useDetailedPromptCheckbox.checked = result.useDetailedPrompt;

            // 초기 상태에서는 상태 메시지를 표시하지 않음
            const promptStatus = document.getElementById('promptStatus');
            promptStatus.textContent = '';
            promptStatus.className = '';
        } else {
            // 기본값으로 체크박스 상태 저장
            browser.storage.local.set({ useDetailedPrompt: useDetailedPromptCheckbox.checked });
        }

        // 사용자 프롬프트 불러오기
        if (result.currentPreset) {
            currentPreset = result.currentPreset;
        }

        // 저장된 프롬프트 값 불러오기
        if (result.customPrompt1) customPrompts[1] = result.customPrompt1;
        if (result.customPrompt2) customPrompts[2] = result.customPrompt2;
        if (result.customPrompt3) customPrompts[3] = result.customPrompt3;

        // 프리셋 버튼 활성화 상태 업데이트
        updatePresetButtons();

        // 현재 선택된 프리셋의 프롬프트 값 표시
        customPromptTextarea.value = customPrompts[currentPreset] || "";
    });

    // 모델 변경 시 저장
    geminiModelSelect.addEventListener('change', function() {
        browser.storage.local.set({ geminiModel: geminiModelSelect.value }).then(() => {
            console.log('모델이 변경되었습니다:', geminiModelSelect.value);
        });
    });

    // 소스 언어 변경 시 저장
    sourceLanguageSelect.addEventListener('change', function() {
        browser.storage.local.set({ sourceLanguage: sourceLanguageSelect.value }).then(() => {
            console.log('소스 언어가 변경되었습니다:', sourceLanguageSelect.value);
        });
    });

    // 대상 언어 변경 시 저장
    targetLanguageSelect.addEventListener('change', function() {
        browser.storage.local.set({ targetLanguage: targetLanguageSelect.value }).then(() => {
            console.log('대상 언어가 변경되었습니다:', targetLanguageSelect.value);
        });
    });

    // 체크박스 상태 변경 시 저장
    useDetailedPromptCheckbox.addEventListener('change', function() {
        browser.storage.local.set({ useDetailedPrompt: useDetailedPromptCheckbox.checked }).then(() => {
            console.log('시스템 프롬프트 설정이 변경되었습니다:', useDetailedPromptCheckbox.checked);

            // 상태 메시지 표시
            const promptStatus = document.getElementById('promptStatus');
            if (useDetailedPromptCheckbox.checked) {
                promptStatus.textContent = '시스템 프롬프트가 적용되었습니다.';
                promptStatus.className = 'success';
            } else {
                promptStatus.textContent = '시스템 프롬프트가 적용 해제되었습니다.';
                promptStatus.className = 'error';
            }

            // 3초 후 메시지 삭제
            setTimeout(() => {
                promptStatus.textContent = '';
            }, 3000);
        });
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

    // API 키 삭제하기
    deleteApiKeyBtn.addEventListener('click', function() {
        browser.storage.local.remove('geminiApiKey').then(() => {
            apiKeyInput.value = ''; // 입력 필드 비우기
            apiKeyStatus.textContent = 'API 키가 삭제되었습니다.';
            apiKeyStatus.className = 'success';
            setTimeout(() => {
                apiKeyStatus.textContent = '';
            }, 3000); // 3초 후 메시지 삭제
        }).catch(error => {
            apiKeyStatus.textContent = `오류: ${error.message}`;
            apiKeyStatus.className = 'error';
        });
    });

    // 사용자 프롬프트 저장 버튼
    saveCustomPromptBtn.addEventListener('click', function() {
        const promptKey = `customPrompt${currentPreset}`;
        const promptValue = customPromptTextarea.value.trim();

        // 값을 내부 변수와 저장소에 저장
        if (promptValue) {
            customPrompts[currentPreset] = promptValue;

            // 프롬프트 저장
            browser.storage.local.set({
                [promptKey]: promptValue
            }).then(() => {
                // 저장 성공 메시지 표시
                customPromptStatus.textContent = '프롬프트가 저장되었습니다.';
                customPromptStatus.className = 'success';

                // 입력 필드 값 유지 (기존 비우기 코드 제거)

                // 3초 후 메시지 삭제
                setTimeout(() => {
                    customPromptStatus.textContent = '';
                }, 3000);
            }).catch(error => {
                customPromptStatus.textContent = `오류: ${error.message}`;
                customPromptStatus.className = 'error';
            });
        } else {
            customPromptStatus.textContent = '프롬프트를 입력해주세요.';
            customPromptStatus.className = 'error';
            setTimeout(() => {
                customPromptStatus.textContent = '';
            }, 3000);
        }
    });

    // 사용자 프롬프트 삭제 버튼
    deleteCustomPromptBtn.addEventListener('click', function() {
        const promptKey = `customPrompt${currentPreset}`;

        // 프롬프트 삭제
        browser.storage.local.remove(promptKey).then(() => {
            // 내부 변수에서도 삭제
            customPrompts[currentPreset] = "";
            // 입력 필드 비우기
            customPromptTextarea.value = "";

            // 삭제 성공 메시지 표시
            customPromptStatus.textContent = '프롬프트가 삭제되었습니다.';
            customPromptStatus.className = 'success';

            // 3초 후 메시지 삭제
            setTimeout(() => {
                customPromptStatus.textContent = '';
            }, 3000);
        }).catch(error => {
            customPromptStatus.textContent = `오류: ${error.message}`;
            customPromptStatus.className = 'error';
        });
    });

    // 프리셋 1 버튼 클릭 이벤트
    preset1Btn.addEventListener('click', function() {
        currentPreset = 1;
        browser.storage.local.set({ currentPreset: 1 });
        // 해당 프리셋에 저장된 값 표시
        customPromptTextarea.value = customPrompts[1] || "";
        updatePresetButtons();
    });

    // 프리셋 2 버튼 클릭 이벤트
    preset2Btn.addEventListener('click', function() {
        currentPreset = 2;
        browser.storage.local.set({ currentPreset: 2 });
        // 해당 프리셋에 저장된 값 표시
        customPromptTextarea.value = customPrompts[2] || "";
        updatePresetButtons();
    });

    // 프리셋 3 버튼 클릭 이벤트
    preset3Btn.addEventListener('click', function() {
        currentPreset = 3;
        browser.storage.local.set({ currentPreset: 3 });
        // 해당 프리셋에 저장된 값 표시
        customPromptTextarea.value = customPrompts[3] || "";
        updatePresetButtons();
    });

    // 번역 함수
    translateBtn.addEventListener('click', async function() {
        const sourceText = sourceTextArea.value.trim();
        if (!sourceText) {
            translatedTextArea.value = '번역할 텍스트를 입력해주세요.';
            return;
        }

        // API 키 확인
        const result = await browser.storage.local.get(['geminiApiKey', 'geminiModel']);
        if (!result.geminiApiKey) {
            translatedTextArea.value = 'Gemini API 키를 입력하고 저장해주세요.';
            return;
        }

        const apiKey = result.geminiApiKey;
        const modelName = result.geminiModel || geminiModelSelect.value;
        const sourceLanguage = sourceLanguageSelect.value;
        const targetLanguage = targetLanguageSelect.value;

        // 번역 중 표시
        translatedTextArea.value = '번역 중...';
        translateBtn.disabled = true;

        try {
            const response = await translateText(sourceText, sourceLanguage, targetLanguage, apiKey, modelName);
            translatedTextArea.value = response;
        } catch (error) {
            translatedTextArea.value = `오류 발생: ${error.message}`;
        } finally {
            translateBtn.disabled = false;
        }
    });

    // 텍스트 번역 함수
    async function translateText(text, sourceLanguage, targetLanguage, apiKey, modelName) {
        if (!text) {
            return '번역할 텍스트를 입력해주세요.';
        }

        if (!apiKey) {
            return 'API 키를 입력해주세요.';
        }

        // 기본 프롬프트
        let prompt = `다음 ${sourceLanguage !== 'auto' ? getLanguageName(sourceLanguage) + ' ' : ''}텍스트를 ${getLanguageName(targetLanguage)}로 번역해주세요.`;

        // 체크박스가 체크되어 있으면 시스템 프롬프트 추가
        if (useDetailedPromptCheckbox.checked) {
            prompt += `
오직 입력된 텍스트만 번역하고, 번역된 텍스트만 출력해주세요.
여러 번역 결과를 제시하지 말고 하나의 최적 번역만 제공해주세요.
마크다운 형식이나 추가 설명 없이 일반 텍스트로만 응답해주세요.
따옴표나 괄호 등 원본에 없는 기호를 추가하지 마세요.
입력된 텍스트에 단어와 문장이 함께 있을 경우에 메타 정보를 추가하지 마세요.
텍스트의 모든 부분을 동일한 방식으로 처리하고, 특정 부분에 특별한 표시나 주석을 추가하지 마세요.
번역 외의 다른 말을 하지 마세요. 번역만 해주세요.`;
        }

        // 사용자 설정 프롬프트 추가 - 내부 변수에서 가져오기
        if (customPrompts[currentPreset] && customPrompts[currentPreset].trim() !== '') {
            prompt += `\n${customPrompts[currentPreset]}`;
        }

        // 텍스트 추가
        prompt += `\n\n${text}`;

        // 모델 이름이 없는 경우 기본값 사용
        const model = modelName || "gemini-2.0-pro-exp-02-05";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    function showError(message) {
        translatedTextArea.value = message;
        apiKeyStatus.textContent = message;
        apiKeyStatus.className = 'error';
    }
});