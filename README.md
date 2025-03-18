# Gemini 번역기 - 파이어폭스 확장 프로그램

Google Gemini API를 사용한 텍스트 번역 파이어폭스 확장 프로그램입니다. 이 확장 프로그램은 gemini-2.0-pro-exp-02-05, gemini-2.0-flash-thinking-exp-01-21 모델을 사용하여 웹 페이지의 텍스트를 번역합니다.

## 기능

- 팝업 창에서 직접 텍스트 입력하여 번역
- 웹 페이지 내 선택한 텍스트 우클릭으로 빠른 번역
- 웹 페이지에서 텍스트 드래그 시 나타나는 번역 버튼
- 한국어, 영어, 일본어, 중국어 간 번역 지원
- 번역 매개변수(온도, Top K, Top P) 커스터마이징
- 다양한 사용자 프롬프트 프리셋(최대 5개) 저장 및 전환
- 설정 내보내기/가져오기로 쉬운 백업 및 동기화
- 깔끔한 사용자 인터페이스

## 설치 방법

1. 이 저장소를 컴퓨터에 다운로드 또는 클론합니다.
2. 파이어폭스 브라우저에서 `about:debugging` 페이지로 이동합니다.
3. "이 파이어폭스" 탭을 클릭합니다.
4. "임시 확장 기능 로드" 버튼을 클릭합니다.
5. 다운로드한 폴더의 `manifest.json` 파일을 선택합니다.

## 사용 방법

1. 설치 후 파이어폭스 툴바에 있는 확장 프로그램 아이콘을 클릭합니다.
2. Google Gemini API 키를 입력하고 저장합니다.
   - API 키를 얻으려면 [Google AI Studio](https://ai.google.dev/)에 가입하고 API 키를 생성해야 합니다.
3. 번역하려는 텍스트를 입력하고 원본 언어와 대상 언어를 선택한 다음 "번역하기" 버튼을 클릭합니다.
4. 웹 페이지에서 텍스트를 선택하고 다음 방법 중 하나로 번역:
   - 마우스 오른쪽 버튼을 클릭한 다음 "선택한 텍스트 번역하기" 선택
   - 텍스트 드래그 후 나타나는 "번역하기" 버튼 클릭

## 고급 설정

1. 고급 설정을 열려면 확장 프로그램 팝업에서 "고급 설정" 버튼을 클릭합니다.
2. 다음과 같은 고급 설정을 사용할 수 있습니다:
   - **번역 매개변수**: 온도, Top K, Top P 값을 조절하여 번역 결과의 창의성과 일관성 조정
   - **사용자 프롬프트 프리셋**: 5개의 다른 프롬프트 설정을 저장하고 전환
   - **설정 백업/복원**: 모든 설정을 JSON 파일로 내보내고 가져오기

## 비고

- 이 확장 프로그램은 Google Gemini API를 사용하므로 API 키가 필요합니다.
- 개인정보 보호를 위해 API 키는 로컬 스토리지에만 저장됩니다.
- 번역 매개변수의 기본값: 온도 0.7, Top K 40, Top P 0.95

## 라이선스

MIT License 
