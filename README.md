# KKY Tool 배포 페이지

이 폴더는 KKY Tool Revit의 GitHub Pages 기반 정적 사이트로 배포된다.

현재 역할은 다음과 같다.

- 애드인 업데이트 피드 제공
- KKY Tool 다운로드와 기능 요청 안내 페이지 제공
- `Manual/` 아래의 주요 기능 매뉴얼 제공

## 주요 파일

- `index.html`
- `assets/site.css`
- `assets/site.js`
- `Manual/index.html`
- `Manual/manual.css`
- `Manual/manual.js`
- `.nojekyll`
- `CNAME`
- `latest.json`

## 현재 업데이트 피드 주소

```text
https://update.zerokky.com/latest.json
```

## 배포 패키지 파일명 기준

```text
KKY_Tool_Revit(2019,21,23,25)_v{version}.exe
KKY_Tool_Revit(2019,21,23,25)_v{version}.zip
```

홈페이지는 `latest.json`을 읽어 화면에 보이는 최신 버전, 배포일, 다운로드 링크를 갱신한다.

## 배포 메모

새 버전을 올릴 때는 다음 순서로 확인한다.

1. 최신 `.exe`와 `.zip` 파일을 이 폴더에 추가한다.
2. `latest.json`의 버전, 날짜, 다운로드 주소, 변경 내용을 갱신한다.
3. `release-history.json`의 최신 버전 기록을 확인한다.
4. 이 폴더를 Pages 저장소에 푸시한다.
5. `https://update.zerokky.com/latest.json`과 홈페이지 다운로드 링크가 새 파일을 가리키는지 확인한다.

마지막 정리: 2026-05-06.
