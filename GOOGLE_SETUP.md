# Google Sheets 연결 방법

`기능 요청하기` 페이지는 Google Sheets + Apps Script 웹앱으로 저장되게 구성되어 있습니다.

## 1. 시트 만들기

1. Google Sheets에서 새 스프레드시트를 만듭니다.
2. 이름은 아무거나 괜찮습니다.

## 2. Apps Script 붙이기

1. 시트에서 `확장 프로그램 -> Apps Script`를 엽니다.
2. 기본으로 있는 코드를 모두 지웁니다.
3. 이 폴더의 [google-apps-script.gs](C:/Users/kkyki/OneDrive/바탕%20화면/KKY_Tool_Revit/Sever/Release/google-apps-script.gs) 내용을 그대로 붙여넣습니다.
4. 저장합니다.
5. 이미 예전 버전을 붙여넣었다면, 지금 파일 내용으로 다시 덮어쓴 뒤 재배포해야 합니다.

## 3. 웹앱 배포

1. `배포 -> 새 배포`
2. 유형은 `웹 앱`
3. 실행 계정은 `나`
4. 액세스 권한은 `Anyone` 또는 `Anyone with the link`
5. 배포 후 웹앱 URL을 복사합니다.

Google 공식 문서:
- [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [Content Service](https://developers.google.com/apps-script/guides/content)

## 4. 사이트에 URL 넣기

1. [site-config.js](C:/Users/kkyki/OneDrive/바탕%20화면/KKY_Tool_Revit/Sever/Release/assets/site-config.js) 파일을 엽니다.
2. 아래처럼 웹앱 URL을 넣습니다.

```js
window.KKY_REQUESTS_CONFIG = {
  requestApiUrl: "https://script.google.com/macros/s/배포된웹앱ID/exec",
  maxVisibleRequests: 10
};
```

## 5. 푸시 후 확인

1. `requests.html`에서 내용을 입력하고 `등록하기`
2. 아래 `최근 요청`에 바로 보이는지 확인
3. 같은 기기에서 등록한 글에는 `삭제` 버튼이 보이는지 확인

## 참고

- 현재 구조는 `로그인 없는 폰 입력`을 기준으로 잡았습니다.
- 운영자는 Google 계정이 필요하지만, 요청을 남기는 사용자는 꼭 Google 계정이 없어도 되게 구성할 수 있습니다.
- 민감한 모델 정보나 원본 데이터는 올리지 않는 운영 규칙이 필요합니다.
- 삭제 기능은 `같은 기기/같은 브라우저`에서 등록한 글만 보이도록 구성되어 있습니다.
