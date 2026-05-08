# 기능 요청 저장소 연결 방법

이 문서는 홈페이지의 `기능 요청` 페이지를 Google Sheets와 Apps Script에 연결하기 위한 관리자용 안내입니다.
사용자 화면에는 스프레드시트 주소나 스크립트 설정값이 노출되지 않도록 운영합니다.

확인 대상 페이지:

- `https://update.zerokky.com/requests.html`

## 1. 시트 만들기
1. Google Sheets에서 새 스프레드시트를 만듭니다.
2. 시트 이름은 알아보기 쉬운 이름으로 정하면 됩니다.

## 2. Apps Script 붙이기
1. 시트에서 `확장 프로그램 -> Apps Script`를 엽니다.
2. 기본으로 들어 있는 코드를 모두 지웁니다.
3. [google-apps-script.gs](google-apps-script.gs) 내용을 그대로 붙여 넣습니다.
4. 저장합니다.

## 3. 웹앱 배포
1. `배포 -> 새 배포`
2. 유형은 `웹 앱`
3. 실행 계정은 본인 계정
4. 접근 권한은 `Anyone` 또는 `Anyone with the link`
5. 배포 후 웹앱 URL을 복사합니다.

접근 권한은 기능 요청 페이지에서 요청을 등록할 수 있게 하기 위한 설정입니다. 시트에는 프로젝트 원본 데이터, 개인 연락처, 보안 정보를 적지 않도록 안내합니다.

참고 문서:
- [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [Content Service](https://developers.google.com/apps-script/guides/content)

## 4. 사이트에 URL 넣기
1. [site-config.js](assets/site-config.js)를 엽니다.
2. 아래처럼 웹앱 URL을 넣습니다.

```js
window.KKY_REQUESTS_CONFIG = {
  requestApiUrl: "https://script.google.com/macros/s/배포웹앱ID/exec",
  maxVisibleRequests: 10
};
```

## 5. 동작 확인
1. `requests.html`에서 내용을 입력하고 `요청 등록`을 누릅니다.
2. 아래 `최근 요청` 목록에 바로 보이는지 확인합니다.
3. 다른 PC나 브라우저에서도 같은 요청 목록이 보이는지 확인합니다.
4. 같은 기기에서 등록한 요청은 `요청 삭제` 버튼이 보이는지 확인합니다.
5. 목록이 갱신되지 않으면 `목록 새로고침`을 누르고, 그래도 보이지 않으면 `site-config.js`의 `requestApiUrl` 값을 다시 확인합니다.

## 참고
- 현재 구조는 요청 입력, 목록 조회, 작성 기기 기준 삭제를 기준으로 합니다.
- 민감한 프로젝트 원본 데이터와 보안 정보는 적지 않는 것을 권장합니다.
- 삭제 기능은 같은 브라우저와 같은 기기에서 등록한 요청에만 보이도록 구성되어 있습니다.
- 요청 목록이 계속 비어 있으면 `assets/site-config.js`의 `requestApiUrl`과 웹앱 배포 권한을 먼저 확인합니다.
