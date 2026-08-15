# 🎮 치지직 대규모 시청자 추첨 & 룰렛 & 실시간 투표 & 포켓몬 배틀 플랫폼 (Chzzk Interactive Hub) v4.4.0

![Chzzk WebSocket Live](https://img.shields.io/badge/Chzzk-WebSocket%20Live-00ffa3?style=for-the-badge&logo=naver)
![Version](https://img.shields.io/badge/Release-v4.4.0-purple?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%20%26%20Audio-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

네이버 **치지직(CHZZK)** 라이브 방송 채팅창과 웹소켓(WebSocket)으로 직접 연결하여, **수천 명 단위의 시청자 대상별 공정 추첨**, **비주얼 룰렛**, **실시간 채팅/치즈 투표**, 그리고 시청자들과 실시간 채팅으로 대결하는 **포켓몬 3v3/1v1 턴제 배틀 & 메가진화** 및 **찌리리공 뒤집기**까지 완벽 지원하는 올인원 방송 인터랙션 플랫폼입니다.

---

## 🌟 v4.4.0 주요 신규 및 개선 사항 (What's New in v4.4.0)

### 1. ⚙️ 좌측 서랍형 상세 설정 패널 (Settings Drawer) & 극대화된 클린 UI
- **탁 트인 방송용 와이드 화면**: 추첨, 룰렛, 투표, 미니게임 화면 상단의 거대한 설정 박스들을 깔끔한 요약 바(`.view-summary-bar`)로 정리하고, 상단 좌측 `[⚙️ 설정]` 버튼을 누르면 좌측에서 부드럽게 튀어나오는 슬라이드아웃 서랍 패널(`[🎟️ 추첨]`, `[🎰 룰렛]`, `[📊 투표]`, `[🎮 미니게임]`)로 통합했습니다.
- **실시간 양방향 뱃지 동기화**: 서랍에서 키워드, 후원 조건, 룰렛 항목, 투표 주제, 게임 모드를 변경하면 메인 화면의 요약 뱃지에 즉시 실시간 반영됩니다.

### 2. 🧬 46종 메가진화(Mega Evolution) 시스템 & 전용 뒷모습(Back-Sprite) 그래픽
- **메가진화 메카닉**: 배틀 중 메가스톤을 지닌 포켓몬은 기술 선택과 동시에 메가진화(`🧬 MEGA ON` / 시청자 채팅: `메가1`~`메가4`)하여 종족값 대폭 상승, 타입/특성 변경 및 강력한 전용 메가 그래픽으로 각성합니다 (팀당 1회 한정).
- **스트리머 진영 전용 뒷모습 그래픽**: 스트리머 진영의 메가진화 폼 46종 전체(메가리자몽X/Y, 메가뮤츠X/Y, 메가팬텀, 메가루카리오, 메가번치코 등)에 대해 완벽한 후방 뒷모습 스프라이트를 지원하여 애니메이션 배틀 몰입감을 극대화했습니다.

### 3. ⏱️ 턴 제한시간 & 기절 교체 투표 타이머 완전 연동
- **10초(초고속)부터 60초까지 정밀 제어**: 시청자 턴 투표 시간 및 스트리머 턴 시간을 10초, 15초, 20초, 30초, 45초, 60초로 자유롭게 선택 가능합니다.
- **기절 교체 모달 실시간 동기화**: 포켓몬이 쓰러졌을 때 열리는 `시청자 연합: 다음 출전 포켓몬 투표` 및 스트리머 출전 선택 모달의 카운트다운 타이머 역시 설정된 시간과 100% 실시간 연동됩니다.

### 4. 👑 스트리머 채널 닉네임 & 프로필 사진 실시간 연동
- 방송 연결 시 스트리머의 실제 채널 닉네임(예: 침착맨)과 프로필 썸네일 이미지를 추출하여 상단 헤더, 배틀 아레나, 상태창, 결과 팝업 전체에 실시간 동적 표시합니다.

---

## 🎮 주요 모드별 기능 안내

### 🎟️ 1. 시청자 대규모 추첨기 (Mega Raffle)
- **실시간 웹소켓 채팅 수집**: URL 또는 채널 ID 입력으로 실시간 채팅 초고속 수집
- **정밀 조건별 필터링**:
  - `👥 전체 참여자` / `💬 참여 키워드` (단독/부분 일치)
  - `🧀 치즈 후원자 필터` (LV1+ ~ LV5+ 1억 치즈 등급)
  - `⭐ 구독자 필터` (최소 구독 개월 수 / 1티어, 2티어 지정)
  - `🚫 중복 방지 및 제외 관리` (다회차 이전 당첨자 자동 차단, 엑셀/CSV 파일 제외, 수동 닉네임/UID 제외)
- **엑셀(CSV) 커스텀 추출**: 원하는 컬럼(순위, 회차, 닉네임, 구독/후원 상태, 채팅 내용, UID 등)만 골라 UTF-8 BOM CSV 내보내기

### 🎰 2. 비주얼 룰렛 (Visual Roulette Engine)
- **인터랙티브 항목 관리**: 칸(Row)별 항목명, 가중치, 확률 실시간 계산, 엑셀/CSV 불러오기/저장, 빠른 프리셋 제공
- **치즈 도네이션 실시간 연동**: 후원 발생 시 룰렛에 자동 등록 (후원자 닉네임 모드 / 후원 메시지 미션 모드, 최소 치즈 금액 컷, 금액 비례 가중치)
- **물리 감속 회전 & 무설치 Web Audio 사운드**: 리얼한 틱틱 회전 효과음, 당첨 팡파레, 화려한 Confetti 폭죽 파티클 연출

### 📊 3. 실시간 투표 (Real-time Live Poll)
- **실시간 게이지 차트 & 투표자 피드**: 시청자들의 실시간 참여율 및 득표수 애니메이션
- **투표 방식**: 일반 채팅 번호/키워드 투표, 치즈 후원 비례 투표, 1인 1표 고정 / 중복 투표 허용
- **원클릭 룰렛 변환 & 명단 엑셀 추출**: 투표 결과를 즉시 룰렛 항목으로 전환하거나 참여자 명단 다운로드

### ⚔️ 4. 포켓몬 배틀 (Pokemon Battle Hub)
- **213마리 챔피언스 풀 & 14종 지닌 도구**: 구애시리즈, 기합의띠, 돌격조끼, 생명의구슬, 자뭉열매, 먹밥, 메가스톤 등 완벽 구현
- **🔥 3v3 팀 엔트리 교체 배틀 & 👑 1v1 단판 에이스 배틀**:
  - 엔트리 구성, 선발/후발 교체, 포켓몬/지닌도구 양팀 전체 랜덤
- **시청자 실시간 집단지성 투표**:
  - 채팅창에 `1`~`4` (기술), `메가1`~`메가4` (메가진화+공격), `5`, `6` (포켓몬 교체) 입력 시 최다 득표 행동 자동 발동
  - 18개 상성 타입 차트, 자속 보정(STAB 1.5배), 급소, 명중률, 랭크업/다운 및 상태이상 완벽 반영

### ⚡ 5. 찌리리공 뒤집기 (Voltorb Flip)
- **5×5 지뢰찾기 + 스도쿠 두뇌 배틀**: 스트리머 vs 시청자 턴제 대결
- **대결 옵션**: 단판 승부, 3판 2선승제(BO3), 5판 3선승제(BO5), 7판 4선승제(BO7)
- **메모 모드 & 실시간 투표**: 타일별 코인/폭탄 메모, 시청자 실시간 좌표(`A1`~`E5`) 투표 집계

---

## 🚀 빠른 시작 (Quick Start)

### 1. 무설치 실행 파일로 바로 실행 (Windows)
1. **[Releases](https://github.com/ManofKimchi08/chzzk-raffle-app/releases)**에서 최신 `chzzk-raffle-app-v4.4.0.exe` (또는 `chzzk-raffle-app-windows-x64.exe`) 파일을 다운로드합니다.
2. 다운로드한 `.exe` 파일을 더블 클릭하여 실행하면 브라우저 대시보드가 자동으로 열립니다.

### 2. Python 소스 코드로 실행 (Windows / macOS / Linux)
Python 3.9 이상이 설치되어 있다면 별도의 외장 패키지 설치 없이 바로 구동됩니다:
```bash
git clone https://github.com/ManofKimchi08/chzzk-raffle-app.git
cd chzzk-raffle-app
python server.py
```
브라우저에서 `http://localhost:8000`에 접속합니다.

---

## 💻 실행 파일(.exe) 로컬 빌드

```bash
pip install pyinstaller
pyinstaller --noconfirm --clean --onefile --windowed --name "치지직추첨기" --add-data "public;public" server.py
```

---

## 📚 참고 외부 자료 및 오픈소스 출처 (References & Credits)

본 프로젝트는 다음과 같은 공식 API, 오픈소스 데이터 세트, 스프라이트 리소스 및 웹 표준 기술을 활용하여 제작되었습니다.

| 구분 (Category) | 리소스 및 출처 (Resource & Link) | 사용 용도 및 설명 (Description) |
| :--- | :--- | :--- |
| **치지직 방송 API** | **[NAVER CHZZK](https://chzzk.naver.com/)** | 치지직 공식 Live Detail REST API 및 실시간 채팅 웹소켓(`wss://kr-ss1.chat.naver.com/chat`) 연동 |
| **포켓몬 데이터** | **[PokéAPI](https://pokeapi.co/)** | 포켓몬 213마리 공식 도감 번호, 기본 종족치(HP/공격/방어/특공/특방/스피드), 타입 및 기술 메타데이터 |
| **포켓몬 스프라이트** | **[Pokémon Showdown](https://play.pokemonshowdown.com/)** | 포켓몬 배틀 전면 애니메이션 스프라이트 및 스트리머 진영 전용 메가진화 46종 후방(Back) 스프라이트 에셋 |
| **포켓몬 위키** | **[Bulbapedia](https://bulbapedia.bulbagarden.net/)** / **[포켓몬 위키](https://pokemon.fandom.com/ko/)** | 포켓몬 및 기술/지닌도구 한국어 공식 번역명, 18개 상성 타입 차트 및 메가진화 메카닉 레퍼런스 |
| **미니게임 규칙** | **Pokémon HeartGold / SoulSilver** | 5×5 찌리리공 뒤집기 (Voltorb Flip) 미니게임 규칙 및 코인/지뢰 계산 알고리즘 |
| **오디오 엔진** | **[Web Audio API (MDN)](https://developer.mozilla.org/ko/docs/Web/API/Web_Audio_API)** | 외부 음원 파일 의존성 없는 브라우저 내장 오디오 신디사이저 (룰렛 틱틱 사운드, 당첨 팡파레 효과음 실시간 합성) |
| **렌더링 엔진** | **HTML5 Canvas 2D Context** | 비주얼 룰렛 원판 물리 감속 렌더링, 찌리리공 보드, Confetti 파티클 폭죽 애니메이션 |
| **타이포그래피** | **[Google Fonts](https://fonts.google.com/)** | `Outfit`, `Pretendard`, `Noto Sans KR` 웹 폰트 |
| **패키징 도구** | **[PyInstaller](https://pyinstaller.org/)** | Windows 무설치 단일 독립 실행 파일(`.exe`) 빌드 |

---

## 📜 라이선스 (License)
MIT License. 자유롭게 수정 및 배포하실 수 있습니다.
