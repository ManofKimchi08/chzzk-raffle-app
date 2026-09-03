# 📦 빌드, 패키징 및 배포 가이드 (Build & Packaging Guide)

- **문서 버전**: v4.8.0
- **작성일자**: 2026-09-03
- **대상**: 릴리즈 엔지니어, 빌드 관리자

---

## 1. 빌드 전제 조건

- **운영체제**: Windows 10/11 x64
- **Python 버전**: Python 3.9 이상 (Python 3.13 권장)
- **빌드 도구**: PyInstaller 6.x 이상
```bash
pip install pyinstaller
```

---

## 2. PyInstaller 단일 실행 파일 (`.exe`) 빌드

프로젝트 루트에 위치한 `치지직추첨기.spec` 파일을 사용하여 정적 에셋(웹 페이지, 포켓몬 데이터, 오디오, 이미지, 아이콘)이 일체 내장된 단일 포터블 실행 파일을 생성합니다.

### 2.1 빌드 전 프로세스 락 해제 (중요)
기존에 실행 중인 `치지직추첨기.exe`가 있을 경우 파일 잠금(`WinError 5 PermissionError`)이 발생하므로 반드시 프로세스를 종료한 후 빌드합니다:

```powershell
Stop-Process -Name "치지직추첨기*" -Force -ErrorAction SilentlyContinue
```

### 2.2 빌드 명령어 실행
```powershell
pyinstaller 치지직추첨기.spec --noconfirm
```

### 2.3 `치지직추첨기.spec` 주요 설정 항목
- `datas`: `public/` 폴더 내의 `index.html`, `pokemon_data.json`, 이미지, 오디오 파일들을 가상 경로로 포함.
- `icon`: `public/icon.ico`를 윈도우 실행 파일 아이콘으로 지정.
- `console=False`: 백그라운드에서 조용히 실행되며 검은색 콘솔 창이 뜨지 않음.
- 실행 파일 생성 위치: `dist/치지직추첨기.exe` (약 11.47 MB).

---

## 3. 로컬 소스 코드 직접 실행

개발 및 디버깅 시에는 컴파일 없이 파이썬 서버를 직접 구동할 수 있습니다:

```bash
python server.py
```
- 기본 포트: `18934` (사용 중일 경우 18935, 18936 등으로 자동 순차 증가).
- 서버 구동과 동시에 기본 웹 브라우저에서 `http://127.0.0.1:18934`가 자동으로 열립니다.

---

## 4. 릴리즈 체크리스트 (Release Checklist)

- [ ] `public/index.html` 내 최신 스크립트 및 디자인 반영 여부 확인
- [ ] `server.py` 내 엔드포인트 정상 응답 확인 (`/api/chzzk/search`, `/api/chzzk/`)
- [ ] 브라우저 자동화(CDP) 테스트 스크립트 전체 통과 확인
- [ ] `Stop-Process` 후 `pyinstaller` 정상 컴파일 완료 확인
- [ ] `git status` 및 `git diff`를 통한 변경 내역 검토
- [ ] Git 태그 생성 및 GitHub 원격 저장소 푸시
