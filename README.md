# 🎮 치지직 대규모 시청자 추첨 & 룰렛 & 실시간 투표 & 포켓몬 배틀 플랫폼 (Chzzk Interactive Hub) v4.6.2

![Chzzk WebSocket Live](https://img.shields.io/badge/Chzzk-WebSocket%20Live-00ffa3?style=for-the-badge&logo=naver)
![Version](https://img.shields.io/badge/Release-v4.6.2-purple?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%20%26%20Audio-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

네이버 **치지직(CHZZK)** 라이브 방송 채팅창과 웹소켓(WebSocket)으로 직접 연결하여, **수천 명 단위의 시청자 대상별 공정 추첨**, **비주얼 룰렛**, **실시간 채팅/치즈 투표**, 그리고 시청자들과 실시간 채팅으로 대결하는 **포켓몬 3v3/1v1 턴제 배틀 & 메가진화** 및 **찌리리공 뒤집기**까지 완벽 지원하는 올인원 방송 인터랙션 플랫폼입니다.

---

## 🌟 v4.6.2 주요 신규 및 개선 사항 (What's New in v4.6.2)

### 1. 🧬 포켓몬 매치 종료 후 메가진화 기본 폼 복원 & 스프라이트 잔상/투명화 버그 완벽 수정
- **메가진화 상태 초기화 (Clean Base Form Reversion)**: 이전 경기에서 메가진화를 진행한 뒤 매치를 종료하거나 다시 시작(`다시 하기`)할 때, 포켓몬이 메가진화 상태로 고정되던 문제를 수정하여 매치 시작 및 엔트리 화면에서 항상 정상적인 **기본 폼(Base Form)**으로 복원되도록 개선했습니다.
- **포켓몬 스프라이트 투명화(기절 애니메이션 잔상) 제거**: 이전 경기에서 기절했던 포켓몬의 기절 애니메이션 클래스(`poke-sprite-fainted`)가 다음 경기 시작 시 남아있어 스프라이트가 투명해지던 현상을 완벽하게 초기화하여 모든 포켓몬 그래픽이 항상 100% 정상 출력되도록 수정했습니다.
- **포켓몬 데이터 딥클론(Deep Clone) 격리**: 메가진화 시 원본 데이터셋이 변조되지 않도록 독립 슬롯 인스턴스로 격리했습니다.

### 2. 🔞 치지직 19세(연령 제한) 방송 네이버 쿠키 인증 지원
- **19세 방송 실시간 연결 지원**: 네이버 정책상 비로그인 조회가 차단되는 연령제한 방송에 대해, 성인 인증된 네이버 세션 쿠키(`NID_AUT`, `NID_SES`)를 입력하여 즉시 연결할 수 있는 **전용 19세 방송 연결 설정 UI**를 탑재했습니다.
- **브라우저 안전 저장 & 로그 제로 마스킹**: 브라우저 로컬 저장소에 안전하게 보관되며, 서버 로그에 쿠키가 절대 남지 않도록 완벽 마스킹 처리됩니다.

### 3. 🎮 포켓몬 배틀 기술별 PP (Power Points) 및 발버둥 (Struggle) 시스템
- **전 기술 공식 최대 PP 규격 탑재**: 235마리 포켓몬의 72개 고유 기술에 대해 공식 PP 규격 (`5 PP`, `10 PP`, `15 PP`, `20 PP`, `30 PP`)을 전면 구축했습니다.
- **실시간 PP 차감 및 잔여량 UI 연동**: 배틀 중 기술을 사용할 때마다 PP가 1씩 실시간 차감되며, 스트리머 덱과 시청자 투표 HUD에 실시간 잔여량(`PP 15/15`, `PP 4/5` 등)이 표시됩니다.
- **0 PP 기술 사용 불가 & 발버둥 (Struggle)**: PP가 0이 된 기술은 버튼이 비활성화되며, 4개 기술 PP가 모두 소진되면 자동으로 `💥 발버둥 (위력 50, 25% 반동 피해)`이 발동합니다.

### 4. 🏆 Regulation M-B 공식 152종 도구 & 235마리 챔피언스 공식 포켓몬 풀 동기화
- **공식 152종 도구 필터링**: 레귤레이션 M-B 규정에 허용된 152종 도구(메가스톤, 플레이트, 나무열매, 구애시리즈 등)를 완벽 수록했습니다.
- **235마리 공식 출전 포켓몬 풀 완성**: 빠져있던 22개 공식 포켓몬 종(토네로스, 볼트로스, 랜드로스, 멜메탈 등)을 공식 스탯, 타입, 스프라이트와 함께 완전 수록했습니다.

### 5. 🎨 24종 리전폼 및 폼체인지 공식 그래픽 & 스탯/타입 완벽 반영
- **공식 전/후면 스프라이트 적용**: 알로라 라이츄/나인테일, 히스이 윈디/블레이범/대검귀/조로아크/미끄래곤/크레베이스/모크나이퍼, 가라르 야도란/야도킹/메더, 팔데아 켄타로스(3종 폼), 로토무(5개 폼), 루가루암 등 24종의 폼에 대해 공식 스프라이트와 고유 타입/스탯을 완벽하게 적용했습니다.

### 6. ⏱️ 룰렛 도네이션 및 실시간 투표 수집 시간 30분까지 확장
- 치즈 도네이션 수집 제한 시간 및 실시간 투표 타이머에 **10분, 15분, 20분, 30분** 옵션을 추가하여 장시간 방송 콘텐츠 진행 시 편리함을 대폭 향상했습니다.

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
- **235마리 챔피언스 풀 & Regulation M-B 152종 도구 & 46종 메가진화 & 기술별 PP 시스템**: 구애시리즈, 기합의띠, 돌격조끼, 생명의구슬, 자뭉열매, 먹밥, 메가스톤, 기술별 PP 차감 및 발버둥 완벽 구현
- **🔥 3v3 팀 엔트리 교체 배틀 & 👑 1v1 단판 에이스 배틀**:
  - 엔트리 구성, 선발/후발 교체, 포켓몬/지닌도구 양팀 전체 랜덤
- **동시 턴 선택 & 시청자 실시간 집단지성 투표**:
  - 채팅창에 `1`~`4` (기술), `메가1`~`메가4` (메가진화+공격), `5`, `6` (포켓몬 교체) 입력 시 최다 득표 행동 자동 발동
  - 18개 상성 타입 차트, 자속 보정(STAB 1.5배), 급소, 명중률, 랭크업/다운 및 상태이상 완벽 반영

### ⚡ 5. 찌리리공 뒤집기 (Voltorb Flip)
- **5×5 지뢰찾기 + 스도쿠 두뇌 배틀**: 스트리머 vs 시청자 턴제 대결
- **대결 옵션**: 단판 승부, 3판 2선승제(BO3), 5판 3선승제(BO5), 7판 4선승제(BO7)
- **메모 모드 & 실시간 투표**: 타일별 코인/폭탄 메모, 시청자 실시간 좌표(`A1`~`E5`) 투표 집계

---

## 🚀 빠른 시작 (Quick Start)

### 1. 무설치 실행 파일로 바로 실행 (Windows)
1. **[Releases](https://github.com/ManofKimchi08/chzzk-raffle-app/releases)**에서 최신 `chzzk-raffle-app-v4.5.0.exe` (또는 `chzzk-raffle-app-windows-x64.exe`) 파일을 다운로드합니다.
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
