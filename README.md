# 🎮 치지직 대규모 시청자 추첨 & 룰렛 & 실시간 투표 & 포켓몬 배틀/퀴즈 쇼 플랫폼 (Chzzk Interactive Hub) v4.8.0

![Chzzk WebSocket Live](https://img.shields.io/badge/Chzzk-WebSocket%20Live-00ffa3?style=for-the-badge&logo=naver)
![Version](https://img.shields.io/badge/Release-v4.8.0-purple?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%20%26%20Audio-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

네이버 **치지직(CHZZK)** 라이브 방송 채팅창과 웹소켓(WebSocket)으로 직접 연결하여, **단독 시작 화면(스트리머 이름 검색 & 팔로워 순 정렬)**, **수천 명 단위 시청자 공정 추첨**, **비주얼 룰렛**, **실시간 채팅/치즈 투표**, 시청자들과 실시간 채팅으로 대결하는 **포켓몬 3v3/1v1 턴제 배틀 & 메가진화**, **포켓몬 퀴즈 쇼(실루엣/도감/울음소리/초성)**, **찌리리공 뒤집기**, 그리고 **도킹 실시간 채팅창**까지 완벽 지원하는 올인원 방송 인터랙션 플랫폼입니다.

---

## 📚 프로젝트 기술 및 설계 문서 (Project Documentation)

본 프로젝트의 상세 사양, 시스템 아키텍처, 프로토콜 및 게임 엔진 명세는 [`docs/`](docs/) 디렉터리에서 체계적으로 관리되고 있습니다.

| 문서명 (Document) | 대상 및 범위 (Description) | 바로가기 링크 (Link) |
| :--- | :--- | :--- |
| **01. 제품 요구사항 정의서 (PRD)** | 프로젝트 개요, 타겟 사용자, 7대 핵심 기능 요구사항, 비목표 및 품질 목표 | [📄 PRD 바로가기](docs/01_chzzk_interactive_hub_prd_ko.md) |
| **02. 아키텍처 및 실시간 프로토콜 명세서** | Python 로컬 프록시, 치지직 REST API, 웹소켓 패킷(CMD 100/10000/93101), 상태 머신 | [🏗️ 아키텍처 바로가기](docs/02_architecture_and_protocol_design_ko.md) |
| **03. 온보딩 시작 화면 및 검색 엔진 설계서** | Welcome 화면 UI, 실시간 타이핑 디바운스(250ms), 팔로워 순 정렬 알고리즘, 뷰 전환 흐름 | [🔍 검색 설계서 바로가기](docs/03_welcome_onboarding_and_search_design_ko.md) |
| **04. 도킹 실시간 채팅 사이드바 및 미러링 명세서** | 2열 분할 레이아웃, 구독자/치즈 필터, 피드 내 실시간 검색, 스마트 스크롤 락, 팝아웃 창 연동 | [💬 채팅창 명세 바로가기](docs/04_realtime_chat_sidebar_and_mirror_ko.md) |
| **05. 포켓몬 배틀 & 퀴즈 쇼 엔진 명세서** | 235마리 포켓몬 데이터, 데미지/상성 공식, 메가진화, 4대 퀴즈, 3단계 수동 힌트, 블라인드 투표 | [🎮 게임 엔진 바로가기](docs/05_pokemon_battle_and_quiz_engine_ko.md) |
| **06. 빌드, 패키징 및 배포 가이드** | Windows 단일 실행 파일(`치지직추첨기.exe`) PyInstaller 빌드, 프로세스 락 해제, 소스 실행 | [📦 빌드 가이드 바로가기](docs/06_build_and_packaging_guide_ko.md) |
| **07. v4.8.0 릴리즈 노트** | v4.8.0 신규 기능, UI/UX 개선 내역, 버그 수정 및 안정화 패치 요약 | [🚀 릴리즈 노트 바로가기](docs/07_release_notes_v4.8.0_ko.md) |

---

## 🌟 v4.8.0 주요 신규 및 개선 사항 (What's New in v4.8.0)

### 1. 🎨 몰입형 단독 시작 화면 (Welcome Landing Screen)
- **온보딩 화면 도입**: 앱 실행 시 복잡한 추첨 설정 창 대신 세련된 단독 시작 화면이 먼저 노출되어 첫 사용자도 1초 만에 방송을 탐색할 수 있습니다.
- **오프라인 둘러보기 지원**: 방송에 연결하지 않고 룰렛, 배틀, 퀴즈 쇼를 먼저 테스트해볼 수 있는 `[ ➡️ 방송 연결 없이 오프라인 둘러보기 ]` 모드를 제공합니다.

### 2. 🔍 채널 이름 실시간 검색 & 팔로워 많은 순 자동 정렬
- **스트리머 닉네임 검색**: 복잡한 32자리 ID나 URL 없이 `침착맨`, `초승달`, `풍월량`, `우왁굳` 등 스트리머 이름만 입력하면 즉시 검색됩니다.
- **팔로워 수 내림차순 정렬**: 검색 결과 중 팬 채널이나 동명이인 계정 대신 **팔로워 수가 가장 많은 공식 채널이 최상단 1순위로 자동 정렬**됩니다.
- **풍부한 채널 카드 정보**: 아바타, 닉네임, 치지직 인증 마크(`✓`), 실시간 생방송 여부(`🔴 LIVE` / `⚪ OFFLINE`), 팔로워 수(`32.4만명`) 제공.

### 3. ⚡ 검색 버튼 없는 타이핑 즉시 자동 검색 (250ms Debounced Live Search)
- 시작 화면에서 스트리머 이름을 타이핑하면, 250ms 디바운스 후 자동으로 실시간 검색 결과가 아래에 스르륵 나타납니다.
- 엔터키나 마우스 클릭 없이도 빠르고 부드러운 검색 경험을 완성했습니다.

### 4. 🗑️ 상단 중복 바 제거 및 작업대 공간 극대화
- 헤더 아래 자리를 차지하던 중복 방송 연결 바를 완전히 제거하여, **메인 추첨/룰렛/배틀 영역과 우측 실시간 채팅 사이드바의 세로 시야를 최대로 확보**했습니다.
- 방송 상태, 시청자 수, `[ 📡 방송 변경 ]`, `[ 🛑 종료 ]` 기능은 상단 헤더 HUD에 일원화되었습니다.

### 5. 💬 상시 도킹 실시간 채팅 사이드바 & 팝아웃 미러링
- 대시보드 우측에 치지직 채팅창이 고정되어 실시간 시청자 반응과 응모 내역을 상시 모니터링할 수 있습니다.
- ⭐구독자, 🧀치즈 후원 필터링 및 닉네임/메시지 검색, 스마트 스크롤 락, 독립 팝아웃 새 창 분리를 완벽 지원합니다.

---

## 🎮 주요 모드별 기능 안내

### 🎟️ 1. 시청자 대규모 추첨기 (Mega Raffle)
- **실시간 웹소켓 채팅 수집**: 초당 수백 건의 채팅을 유실 없이 초고속 수집
- **정밀 조건별 필터링**:
  - `👥 전체 참여자` / `💬 참여 키워드` (단독/부분 일치)
  - `🧀 치즈 후원자 필터` (LV1+ ~ LV5+ 1억 치즈 등급)
  - `⭐ 구독자 필터` (최소 구독 개월 수 / 1티어, 2티어 지정)
  - `🚫 중복 방지 및 제외 관리` (다회차 이전 당첨자 자동 차단, 엑셀/CSV 파일 제외, 수동 닉네임/UID 제외)
- **엑셀(CSV) 커스텀 추출**: 원하는 컬럼만 골라 UTF-8 BOM CSV 내보내기

### 🎰 2. 비주얼 룰렛 (Visual Roulette Engine)
- **인터랙티브 항목 관리**: 칸(Row)별 항목명, 가중치, 확률 실시간 계산, 엑셀/CSV 불러오기/저장, 빠른 프리셋 제공
- **치즈 도네이션 실시간 연동**: 후원 발생 시 룰렛에 자동 등록 (후원자 닉네임 / 메시지 미션 모드)
- **물리 감속 회전 & 무설치 Web Audio 사운드**: 리얼한 틱틱 회전 효과음, 당첨 팡파레, Confetti 폭죽 파티클

### 📊 3. 실시간 투표 (Real-time Live Poll)
- **실시간 게이지 차트 & 투표자 피드**: 시청자들의 실시간 참여율 및 득표수 애니메이션
- **투표 방식**: 일반 채팅 번호/키워드 투표, 치즈 후원 비례 투표, 1인 1표 / 중복 투표 허용
- **원클릭 룰렛 변환 & 명단 엑셀 추출**: 투표 결과를 즉시 룰렛 항목으로 전환하거나 참여자 명단 다운로드

### ⚔️ 4. 포켓몬 배틀 (Pokemon Battle Hub)
- **235마리 챔피언스 풀 & Regulation M-B 152종 도구 & 46종 메가진화 & 기술별 PP 시스템**: 구애시리즈, 기합의띠, 돌격조끼, 생명의구슬, 자뭉열매, 먹밥, 메가스톤, 기술별 PP 차감 및 발버둥 완벽 구현
- **🔥 3v3 팀 엔트리 교체 배틀 & 👑 1v1 단판 에이스 배틀**:
  - 엔트리 구성, 선발/후발 교체, 포켓몬/지닌도구 양팀 전체 랜덤
- **동시 턴 선택 & 시청자 실시간 집단지성 투표**:
  - 채팅창에 `1`~`4` (기술), `메가1`~`메가4` (메가진화+공격), `5`, `6` (포켓몬 교체) 입력 시 최다 득표 행동 자동 발동
  - 18개 상성 타입 차트, 자속 보정(STAB 1.5배), 급소, 명중률, 랭크업/다운 및 상태이상 반영

### ❓ 5. 포켓몬 퀴즈 쇼 (Pokemon Quiz Show)
- **4가지 퀴즈 모드**: 🖼️ 실루엣 / 📖 도감 설명 / 🔊 울음소리 / 🧩 3단 단서
- **대결 방식**: ⚡ 스피드 최초 정답자 모드 vs 🗳️ 시청자 집단지성 다수결 투표 모드
- **3단계 수동 힌트 덱**: 1단계 속성 타입 ➡️ 2단계 포켓몬 분류/세대 ➡️ 3단계 한글 초성
- **스트리머 답안 지연 채점 & [수정 ✏️]**: 타이머 종료 시 시청자 결과와 동시 판정

### ⚡ 6. 찌리리공 뒤집기 (Voltorb Flip)
- **5×5 지뢰찾기 + 스도쿠 두뇌 배틀**: 스트리머 vs 시청자 턴제 대결
- **대결 옵션**: 단판 승부, 3판 2선승제(BO3), 5판 3선승제(BO5), 7판 4선승제(BO7)
- **메모 모드 & 실시간 투표**: 타일별 코인/폭탄 메모, 시청자 실시간 좌표(`A1`~`E5`) 투표 집계

---

## 🚀 빠른 시작 (Quick Start)

### 1. 무설치 실행 파일로 바로 실행 (Windows)
1. **[Releases](https://github.com/ManofKimchi08/chzzk-raffle-app/releases)**에서 최신 `치지직추첨기.exe` 파일을 다운로드합니다.
2. 다운로드한 `.exe` 파일을 더블 클릭하여 실행하면 브라우저 대시보드가 자동으로 열립니다.

### 2. Python 소스 코드로 실행 (Windows / macOS / Linux)
Python 3.9 이상이 설치되어 있다면 별도의 외장 패키지 설치 없이 바로 구동됩니다:
```bash
git clone https://github.com/ManofKimchi08/chzzk-raffle-app.git
cd chzzk-raffle-app
python server.py
```
브라우저에서 `http://127.0.0.1:18934`에 접속합니다.

---

## 💻 실행 파일(.exe) 로컬 빌드

```powershell
Stop-Process -Name "치지직추첨기*" -Force -ErrorAction SilentlyContinue
pyinstaller 치지직추첨기.spec --noconfirm
```
빌드 완료 후 `dist/치지직추첨기.exe`에 생성됩니다.

---

## 📚 참고 외부 자료 및 오픈소스 출처 (References & Credits)

| 구분 (Category) | 리소스 및 출처 (Resource & Link) | 사용 용도 및 설명 (Description) |
| :--- | :--- | :--- |
| **치지직 방송 API** | **[NAVER CHZZK](https://chzzk.naver.com/)** | 치지직 공식 Search API, Live Detail REST API 및 실시간 채팅 웹소켓 연동 |
| **포켓몬 데이터** | **[PokéAPI](https://pokeapi.co/)** | 포켓몬 235마리 공식 도감 번호, 기본 종족치, 타입, 도감 설명, 울음소리(Cries) 및 기술 메타데이터 |
| **포켓몬 스프라이트** | **[Pokémon Showdown](https://play.pokemonshowdown.com/)** | 포켓몬 배틀 전면 애니메이션 스프라이트 및 스트리머 진영 전용 메가진화 46종 후방(Back) 스프라이트 에셋 |
| **포켓몬 위키** | **[Bulbapedia](https://bulbapedia.bulbagarden.net/)** / **[포켓몬 위키](https://pokemon.fandom.com/ko/)** | 포켓몬 및 기술/지닌도구 한국어 공식 번역명, 8~9세대 공식 도감 설명, 18개 상성 타입 차트 및 메가진화 레퍼런스 |
| **미니게임 규칙** | **Pokémon HeartGold / SoulSilver** | 5×5 찌리리공 뒤집기 (Voltorb Flip) 미니게임 규칙 및 코인/지뢰 계산 알고리즘 |
| **오디오 엔진** | **[Web Audio API (MDN)](https://developer.mozilla.org/ko/docs/Web/API/Web_Audio_API)** | 외부 음원 파일 의존성 없는 브라우저 내장 오디오 신디사이저 (룰렛 틱틱 사운드, 당첨 팡파레 효과음 실시간 합성) |
| **렌더링 엔진** | **HTML5 Canvas 2D Context** | 비주얼 룰렛 원판 물리 감속 렌더링, 찌리리공 보드, Confetti 파티클 폭죽 애니메이션 |
| **타이포그래피** | **[Google Fonts](https://fonts.google.com/)** | `Outfit`, `Pretendard`, `Noto Sans KR` 웹 폰트 |
| **패키징 도구** | **[PyInstaller](https://pyinstaller.org/)** | Windows 무설치 단일 독립 실행 파일(`.exe`) 빌드 |

---

## 📜 라이선스 (License)
MIT License. 자유롭게 수정 및 배포하실 수 있습니다.
