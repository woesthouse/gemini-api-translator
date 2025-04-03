document.addEventListener('DOMContentLoaded', function() {
    const geminiModelSelect = document.getElementById('geminiModel');
    const sourceLanguageSelect = document.getElementById('sourceLanguage');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const sourceTextArea = document.getElementById('sourceText');
    const translatedTextArea = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    const openSettingsBtn = document.getElementById('openSettings');
    const copyBtn = document.getElementById('copyBtn');

    // API 키, 모델, 언어 설정 불러오기
    chrome.storage.local.get(['geminiApiKey', 'geminiModel', 'sourceLanguage', 'targetLanguage'], result => {
        // 모델 설정
        if (result.geminiModel) {
            geminiModelSelect.value = result.geminiModel;
        } else {
            // 기본값으로 첫 번째 모델 저장
            chrome.storage.local.set({ geminiModel: geminiModelSelect.value });
        }
        
        // 언어 설정
        if (result.sourceLanguage) {
            sourceLanguageSelect.value = result.sourceLanguage;
        }
        
        if (result.targetLanguage) {
            targetLanguageSelect.value = result.targetLanguage;
        }
    });

    // 모델 변경 시 저장
    geminiModelSelect.addEventListener('change', function() {
        chrome.storage.local.set({ geminiModel: geminiModelSelect.value }, () => {
            console.log('모델이 변경되었습니다:', geminiModelSelect.value);
        });
    });
    
    // 소스 언어 변경 시 저장
    sourceLanguageSelect.addEventListener('change', function() {
        chrome.storage.local.set({ sourceLanguage: sourceLanguageSelect.value }, () => {
            console.log('소스 언어가 변경되었습니다:', sourceLanguageSelect.value);
        });
    });
    
    // 대상 언어 변경 시 저장
    targetLanguageSelect.addEventListener('change', function() {
        chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value }, () => {
            console.log('대상 언어가 변경되었습니다:', targetLanguageSelect.value);
        });
    });

    // 설정 페이지 열기
    openSettingsBtn.addEventListener('click', function() {
        console.log('설정 페이지 열기 버튼 클릭됨');
        chrome.runtime.openOptionsPage();
    });

    // 번역 함수
    translateBtn.addEventListener('click', async function() {
        const sourceText = sourceTextArea.value.trim();
        if (!sourceText) {
            translatedTextArea.value = '번역할 텍스트를 입력해주세요.';
            return;
        }

        // API 키 확인
        chrome.storage.local.get(['geminiApiKey', 'geminiModel'], result => {
            if (!result.geminiApiKey) {
                translatedTextArea.value = 'Gemini API 키가 설정되지 않았습니다. 고급 설정에서 API 키를 설정해주세요.';
                return;
            }

            const apiKey = result.geminiApiKey;
            const modelName = result.geminiModel || geminiModelSelect.value;
            const sourceLanguage = sourceLanguageSelect.value;
            const targetLanguage = targetLanguageSelect.value;

            // 번역 중 표시
            translatedTextArea.value = '번역 중...';
            translateBtn.disabled = true;

            // 번역 요청
            translateText(sourceText, sourceLanguage, targetLanguage, apiKey, modelName)
                .then(translatedText => {
                    translatedTextArea.value = translatedText;
                })
                .catch(error => {
                    translatedTextArea.value = `오류 발생: ${error.message}`;
                })
                .finally(() => {
                    translateBtn.disabled = false;
                });
        });
    });

    // 복사 버튼 클릭 이벤트
    copyBtn.addEventListener('click', function() {
        const translatedText = translatedTextArea.value.trim();
        if (!translatedText) {
            showToast('복사할 내용이 없습니다.');
            return;
        }

        // 번역된 텍스트를 클립보드에 복사
        navigator.clipboard.writeText(translatedText)
            .then(() => {
                showToast('번역 결과가 클립보드에 복사되었습니다.');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                showToast('복사에 실패했습니다.');
            });
    });

    // 토스트 메시지 표시 함수
    function showToast(message) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 1.5초 후 자동 제거
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 1500);
    }

    // 텍스트 번역 함수
    async function translateText(text, sourceLanguage, targetLanguage, apiKey, modelName) {
        if (!text) {
            return '번역할 텍스트를 입력해주세요.';
        }
        
        if (!apiKey) {
            return 'API 키를 입력해주세요.';
        }
        
        // 모델 이름이 없는 경우 기본값 사용
        const model = modelName || "gemini-2.5-pro-exp-03-25";
        
        // 번역 요청을 background로 보내기
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "translateText",
                text: text,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                apiKey: apiKey,
                modelName: model
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                if (response && response.success) {
                    resolve(response.translatedText);
                } else if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    reject(new Error('알 수 없는 오류가 발생했습니다.'));
                }
            });
        });
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

    function showError(message) {
        translatedTextArea.value = message;
    }
});