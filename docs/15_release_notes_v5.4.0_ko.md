# 🚀 Release Notes v5.4.0 — 전사 아키텍처 모듈화 · 보안/공정성/웹소켓 하드닝 · 실방송 UX 대개편

**출시일**: 2026-11-19  
**버전**: `v5.4.0`

---

## 📋 릴리즈 핵심 요약

`v5.4.0` 업데이트는 기존 23,411줄 모놀리식 단일 HTML 구조(`public/index.html`)를 **기능별 CSS/JS 모듈로 완전히 분리**하고, **Phase 1(최우선 공정성·보안·웹소켓 안정성)**, **Phase 2(실방송 사고 방지 및 스트리머 편의 UX)**, **Phase 3(대규모 방송 성능·확장성·OBS 송출)** 전 항목을 일괄 구현·검증한 대규모 기술 및 UX 리팩터링 릴리즈입니다.

---

## 🛡️ 1. Phase 1 — 공정성 · 보안 · 웹소켓 & 백엔드 하드닝

### 1-1. 추첨 · 룰렛 공정성 보강
- **키워드 추첨 후속 채팅 탈락 버그 수정**: 시청자가 참여 키워드(`!참여`)를 입력한 뒤 일반 채팅(`ㅋㅋㅋ` 등)을 쳐도 마지막 메시지로 덮어써져 탈락하지 않도록 사용자별 최근 30개 메시지 이력(`p.messages`)을 유지하며, 대소문자 구분 없이(`!join` = `!JOIN`) 판정합니다.
- **치즈 룰렛 회전 중 원판 스냅샷 고정 (`lockedSpinItems`)**: 룰렛이 회전하는 도중 신규 치즈 후원이 유입되어도 회전 중인 원판 조각과 포인터 당첨 결과를 스냅샷으로 고정하여 **화살표 위치 ≠ 당첨 모달** 불일치 사고를 원천 차단했습니다. 회전 중 유입된 후원은 회전 종료 직후 원판에 자동 반영됩니다.
- **암호학적 공정 난수(CSPRNG) 적용**: 시청자 추첨 셔플(`secureRandomInt`) 및 룰렛 회전(`secureRandom`)에 `window.crypto.getRandomValues` 기반 무편향 난수를 적용했습니다.

### 1-2. 보안 및 프록시 서버(`server.py`) 강화
- **XSS 방어 완결**: 추첨 롤링 닉네임(`rollText`) 이스케이프 누락을 수정하고, 당첨자 테이블·스트리머 검색 카드·포켓몬 배틀 진영 칩 등 `onclick` 인자 전달부 전수에 `escapeJsArg()`를 적용했습니다.
- **CSV 수식 인젝션 차단 (`sanitizeCsvCell`)**: `=`, `+`, `-`, `@`, 탭, CR로 시작하는 셀에 안전 접두사(`'`)를 붙여 엑셀 수식 실행을 방지하고 `URL.revokeObjectURL()`로 임시 메모리 누수를 제거했습니다.
- **네트워크 바인딩 & CORS & POST 인증 전환**: 로컬 실행 시 `127.0.0.1` 루프백 바인딩 및 `localhost`/`127.0.0.1` 출처 제한 CORS를 적용했고, `NID_AUT`/`NID_SES` 쿠키가 URL 쿼리에 남지 않도록 `POST /api/chzzk/` 및 `POST /api/chzzk/live-status` JSON 본문 전송과 `sessionStorage` 기본 보관으로 전환했습니다.
- **백엔드 API 예외 및 `isLive` 오탐 수정**: 치지직 응답의 `content: null` `NoneType` 크래시를 방어하고, 잘못된 채널 ID의 HTTP 400/404를 19세 방송으로 오안내하던 문제를 해결했으며, 과거 `liveId` 잔존으로 인한 오프라인 LIVE 오탐 조건을 제거했습니다.

### 1-3. 웹소켓 신뢰성 & 웹폰트 복구
- **좀비 소켓 감지 및 토큰 재발급 재연결**: 소켓 교체 시 이전 핸들러·타이머를 완전히 정리(`cleanupWebSocket`)해 중복 수신을 막고, 50초 무응답 시 좀비 연결로 간주하여 재연결하며, 재접속 2회 실패마다 `/api/chzzk/` 토큰을 자동 재발급(`startConnectionFlow(true)`)합니다.
- **웹폰트 HTTP 400 수정**: Google Fonts에 존재하지 않던 `Pretendard` 요청을 공식 jsDelivr `Pretendard Variable` CDN으로 분리하고, Google Fonts에는 `Outfit`만 요청하도록 수정했으며, `xlsx.full.min.js`에 `defer`를 적용했습니다.

---

## 🎮 2. Phase 2 — 실방송 UX 및 스트리머 편의 기능

- **비동기 커스텀 다이얼로그(`#appDialogModal`) 전환**: JS 메인 스레드를 멈춰 실시간 채팅·핑퐁 수신을 가로막던 브라우저 기본 `alert()` / `confirm()` / `prompt()` 호출을 전 모듈에서 100% 제거하고, Promise 큐 기반 비동기 모달(`showAppAlert`, `showAppConfirm`, `showAppPrompt`)로 교체했습니다.
- **실수 새로고침 방지 & 세션 자동 백업/복구 (`beforeunload` + `#sessionRestoreBanner`)**: 추첨 당첨자·도네 룰렛 목록·룰렛 히스토리·투표 설정을 `localStorage`에 자동 백업하며, 작업 데이터가 있을 때 탭 닫기/새로고침 경고와 재진입 시 원클릭 복구 배너를 제공합니다.
- **최근 연결 & 즐겨찾기 채널 (`#welcomeRecentChannelsSection`)**: 시작 화면에서 최근 연결한 최대 5개 채널을 원클릭 재접속할 수 있으며 별(★) 즐겨찾기 고정을 지원합니다.
- **추첨 모집 마감 토글 & 당첨자 명단 복사**: `[🟢 모집 중 / 🛑 모집 마감됨]` 버튼으로 참여 접수 시점을 명확히 통제할 수 있고, `[📋 명단 복사]` 버튼으로 회차별 당첨자 닉네임을 채팅 공지용으로 즉시 복사할 수 있습니다.
- **전역 `Esc` 닫기 · 전역 음소거 · OBS 크로마키 모드 · 사용자 프리셋**:
  - `Esc` 키로 현재 최상단 모달/서랍을 즉시 닫을 수 있습니다.
  - 헤더 `[🔊 / 🔇 음소거중]` 전역 음소거 버튼 및 탭 전환 시 배틀 BGM/퀴즈 울음소리 자동 정리를 구현했습니다.
  - 헤더 `[🎥 OBS]` 토글로 기본 → 그린(`#00b140`) → 블루(`#0047bb`) 크로마키 배경 순환을 지원합니다.
  - 수동 룰렛(`chzzk_roulette_presets_v1`) 및 실시간 투표(`chzzk_poll_presets_v1`) 사용자 프리셋 저장/불러오기/삭제 기능을 추가했습니다.
- **접근성(A11y) 및 분할 화면 대응**: 탭(`role="tablist"`, `role="tab"`, `aria-selected`), 14개 모달(`role="dialog"`, `aria-modal="true"`), 아이콘 버튼 `aria-label`, `<=1100px` 좁은 창 헤더 래핑 CSS를 반영했습니다.

---

## ⚡ 3. Phase 3 — 대규모 방송 성능 및 아키텍처 모듈화

- **모놀리스 모듈 분리**: 23,411줄 단일 `public/index.html`을 HTML 껍데기(`3,100+`줄)와 [`public/css/styles.css`](../public/css/styles.css), 6개 JS 모듈([`core.js`](../public/js/core.js), [`roulette.js`](../public/js/roulette.js), [`poll.js`](../public/js/poll.js), [`voltorb.js`](../public/js/voltorb.js), [`pokebattle.js`](../public/js/pokebattle.js), [`pokequiz.js`](../public/js/pokequiz.js))로 분리했습니다.
- **정적 자산 Gzip 압축 및 스마트 캐싱**: `server.py`에서 JSON 및 1KB 초과 텍스트 정적 자산에 `gzip` 압축을 적용하고, `/api/*`는 `no-store`, `/battle_anims/`·`/pokemon/`·`/items/`는 24시간(`max-age=86400`), JS/CSS/JSON은 1시간(`max-age=3600` + `?v=5.4.0` 버전 쿼리) 캐싱을 적용했습니다.
- **`rAF` 배치 채팅 렌더링 & LRU 메모리 상한**: `addChatToFeed()`를 `requestAnimationFrame` + `DocumentFragment` 배치(`flushChatFeedBatch`)로 전환하고 `userChatHistory`를 최근 활성 2,000명 LRU로 제한해 대규모 시청자 유입 시 리플로우 및 메모리 누수를 방지했습니다.

---

## 📦 4. Windows 단일 실행 파일 (EXE) 최신 빌드

- **빌드 파일**: `dist/치지직추첨기.exe` (`20,019,271` bytes / 약 19.1 MB, PyInstaller 6.21.0 · Python 3.13.9 빌드 완료)
- **GitHub Release 첨부 파일**: `ChzzkInteractiveHub-v5.4.0.exe` (표시 라벨: `치지직추첨기_v5.4.0.exe`)
- **단독 번들 검증**: PyInstaller `_MEIPASS` 동결 번들 환경에서 `verify_exe_v540.py` 스모크 테스트를 수행해 `GET /`, `css/styles.css`, 6개 `js/*.js` 모듈, JSON/이미지 자산(`gzip` 응답 포함) 및 `POST /api/chzzk/live-status` 정상 동작을 검증했습니다.

---

## ✅ 자동화 검증 결과 (v5.4.0)
- **통합 감사 테스트(`test_v540_full_audit.py`)**: `[PASS Backend]`, `[PASS Phase 1]`, `[PASS Phase 2]`, `[PASS Phase 3]` 전 항목 통과 (JS 콘솔 오류 0건, 정적 자산 실패 0건).
- **미니게임/메뉴 회귀 테스트(`test_minigames_reinspection.py`)**: `PASS 0` ~ `PASS 6` 전 항목 통과.
