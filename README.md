# KKY Tool 배포 폴더 운영 기준

이 폴더는 GitHub Pages 기반 업데이트 파일과 설치 파일을 관리한다.

## 설치 파일 폴더

- `official/`: 정식 배포 설치 EXE를 보관한다.
- `test/`: 내부 확인용 테스트 설치 EXE와 테스트 패키지를 보관한다.

`Sever/Release` 루트에는 설치 EXE를 직접 두지 않는다. 정식 배포 스크립트는 `official/`로, 테스트 빌드 스크립트는 `test/`로 설치 파일을 생성한다.

## 업데이트 파일

아래 파일은 기존처럼 `Sever/Release` 루트에서 관리한다.

- `latest.json`
- `release-history.json`
- `index.html`
- `KKY_Tool_Revit(2019,21,23,25)_v{version}.zip`

정식 설치 URL은 다음 형식을 사용한다.

```text
https://update.zerokky.com/official/KKY_Tool_Revit(2019,21,23,25)_v{version}.exe
```

업데이트 ZIP URL은 기존 형식을 유지한다.

```text
https://update.zerokky.com/KKY_Tool_Revit(2019,21,23,25)_v{version}.zip
```

마지막 정리: 2026-05-12.
