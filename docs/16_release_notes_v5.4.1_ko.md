# 🚀 Release Notes v5.4.1 — 전 모듈 정밀 코드 리뷰 및 재검수 무결성·안정성 패치

**출시일**: 2026-11-27  
**버전**: `v5.4.1`

---

## 📋 릴리즈 핵심 요약

`v5.4.1` 업데이트는 `v5.4.0` 대규모 모듈화 이후 전체 소스코드(`server.py`, `index.html`, 프론트엔드 JS 6개 모듈, 문서)를 라인 단위로 정밀 코드 리뷰 및 재검수하여 발견된 **게임 승패 판정 오류, 비동기 타이머 누수, 포켓몬 배틀 공식 룰 누락, UI·세션 정합성, 백엔드 캐싱/보안 및 웹 배포 호환성** 이슈 총 18건을 일괄 해결한 안정화 패치 릴리즈입니다.

---

## ❓ 1. 포켓몬 퀴즈 쇼 판정 및 도감 마스킹 무결성 패치 (`pokequiz.js`)

- **스피드 모드 타임스탬프 타입 불일치 해결 (`[Critical]`)**: 스트리머 정답 제출 시각(`Date.now()` 숫자 밀리초)과 시청자 최초 정답 시각(`toLocaleTimeString` 문자열 `"오전 HH:MM:SS"`)을 직접 비교(`sTime <= vTime`)해 항상 `false`(`NaN`)가 되던 치명적 버그를 수정했습니다. `firstCorrectUser`에 숫자 필드 `timestamp: Date.now()`를 별도 기록해 공정하게 선착순 채점이 이루어집니다.
- **시청자 상태 배지 오타 수정**: `renderQuizStageUI()`에서 `vTag.innerText` 대신 `sTag.innerText`에 값을 대입해 스트리머 배지가 `'채팅 수신 중'`/`'투표 수집 중'`으로 덮어써지던 오타를 바로잡았습니다.
- **리전폼·폼체인지 도감 마스킹 & XSS 방어 (`formatQuizFlavorTextHtml`)**: 괄호가 포함된 포켓몬 이름(`나인테일 (알로라의 모습)`, `로토무 (워시로토무)` 등)을 정규식 특수문자 이스케이프(`escapeQuizRegExp`) 없이 매칭해 마스킹이 깨지고 본문 속 기본 종명이 그대로 노출되던 스포일러 버그를 해결했습니다. 도감 본문 및 버전, 인스펙터 카드/타입 뱃지 HTML 이스케이프를 보강했고, 인스펙터 선택 동기화를 `data-poke-key` 속성 기반 조회로 개선했습니다.

---

## ⚔️ 2. 포켓몬 배틀 타이머 누수 차단 및 공식 배틀 룰 완결 (`pokebattle.js`, `core.js`)

- **배틀 중도 종료(`quitPokeBattle`) & `Esc` 진영 모집 취소 가드**:
  - `quitPokeBattle()`에서 동시 턴 타이머(`turnTimerInterval`) 해제, `phase = 'idle'` 초기화, 스트리머 제어 팝아웃 동기화를 추가했습니다.
  - `startSimultaneousPokeTurn`, `finishSimultaneousPokeTurn`, `executeBattleTurnSequence`, `handleRoundEndEffects`, `handleFaintPhase`, 기절 교체 비동기 핸들러 전 구간에 `if (!pokeBattleState.active) return;` 가드를 적용해 배틀 종료 후 백그라운드 턴·모달이 재실행되지 않도록 차단했습니다.
  - 전역 `Esc` 키로 `factionRecruitModal`을 닫을 때도 `cancelFactionRecruitment()`가 호출되어 모집 타이머와 위기 BGM이 정상 중단됩니다.
- **돌격조끼(`assault-vest`) ID 정규화 4곳 누락 보완**: 진영전 투표 바, 진영전 턴 해결, 스트리머 메인 기술 덱, 시청자 무투표/시간초과 랜덤 선택부에서 하이픈 ID `'assault-vest'`가 `normalizePokeItemId()` 없이 비교되던 문제를 수정했습니다.
- **기절 후 후속 포켓몬 투입 시 스텔스록(Stealth Rock) 판정 공통 적용 (`applySwitchInEntryHazards`)**: 일반 수동 교체에만 존재하던 스텔스록 데미지 로직을 공통 비동기 헬퍼로 분리해 **3개 모드(스트리머 / 시청자 연합 / 시청자 진영전)** 의 기절 후 교체 투입에도 동일하게 적용했습니다. 진입 시 스텔스록으로 즉시 기절할 경우 다음 기절 교체·승패 판정으로 안전하게 연쇄됩니다.
- **탈출버튼(`eject_button`) / 레드카드(`red_card`) 턴 상호작용 보강**: 약점보험·자뭉열매·부가효과가 피격 포켓몬에 먼저 적용된 뒤 교체되도록 발동 순서를 교정하고, 선공 피격 중 탈출버튼으로 강제 교체된 후공 측이 이전 포켓몬의 예약 공격을 실행하지 않도록(`forcedSwitchedThisTurn`) 막았으며, 강제 교체 진입 중 스텔스록 기절도 정상 감지합니다.
- **진영명 HTML 이스케이프 & `CSS.escape` 적용**: 사용자 커스텀 진영명(`factionTeamNames.red`/`blue`)의 `innerHTML`/배틀 다이얼로그 삽입부 전수에 `escapeHtml()`을 적용하고, 전광판 칩 `data-uid` 쿼리에 `CSS.escape()`를 추가했습니다.

---

## 🎰 3. 룰렛 · 실시간 투표 · 추첨 · 세션 백업 UX 정합성 (`core.js`, `roulette.js`, `poll.js`)

- **치즈 룰렛 2중 삭제 및 제외 항목 오삭제 방지**: `당첨 항목 자동 제거` ON 상태에서 당첨 시 이미 1건이 자동 차감되었음에도 모달의 `[이 항목 원판에서 제거]` 버튼이 노출되어 한 번 더 삭제되던 문제를 해결(`_alreadyAutoRemoved` 가드 + 버튼 숨김)했고, `removeWinningItem()`이 원판 제외(`excluded: true`) 항목을 건드리지 않고 활성 항목만 제거하도록 수정했습니다.
- **세션 백업/복구 & 이탈 방지 가드 보강**:
  - `hasActiveSessionData()`에 포켓몬 퀴즈(`quizMatchState.active` / `phase`)와 찌리리공 뒤집기(`gamePhase`) 진행 상태를 포함해 실수 새로고침 경고(`beforeunload`) 사각지대를 없앴습니다.
  - 세션 백업/복구 시 룰렛 회차(`rouletteRound`) 및 필터/제외/요약 배지 UI를 함께 복원하며, 명시적으로 데이터를 초기화하고 복구 배너가 닫혀 있을 때는 잔류 `localStorage` 백업도 정리해 다음 방문 시 빈 데이터가 재표시되지 않도록 개선했습니다.
- **실시간 투표(`poll.js`) 배지 색상 & CSV 순번 일치**: `stopPoll()`에서 설정한 노란색 인라인 스타일을 `startPoll()`/`togglePausePoll()`/`resetPoll()`에서 초기화하도록 수정했고, 중간 선택지 삭제 후 CSV 내보내기 시 내부 ID(`opt.id`) 대신 화면 표시 순번(`idx + 1`)이 출력되도록 교정했습니다.
- **추첨 초기화(`resetBtn`) UI 동기화 & 종료 버튼 중복 이벤트 제거**: 명단 초기화 시 파일 제외 상태 텍스트·체크박스·수동 제외 테이블·채팅 카운트 배지를 함께 리셋했고, `#disconnectBtn`의 중복 HTML `onclick="disconnectBroadcast()"` 속성을 제거했습니다.

---

## 🛡️ 4. 백엔드(`server.py`) 캐싱 · 쿠키 정제 · 배포/문서 개선

- **쿠키 헤더 정제(`_sanitize_cookie_value`)**: 사용자가 붙여넣은 `NID_AUT`/`NID_SES` 값에 개행(`\r\n`), 제어문자, 세미콜론(`; Path=/`), `NID_AUT=` 접두사, 비-Latin-1 문자가 섞여 들어와도 자동 정제하여 `http.client.InvalidHeader` 500 오류를 원천 방지합니다.
- **스레드 안전 정적 Gzip 메모리 캐시 · `ETag`/`304 Not Modified` · `do_HEAD()`**: 대용량 JSON(`pokemon_data.json`, `pokemon_quiz_data.json`)과 텍스트 정적 자산의 Gzip 압축 결과를 `(mtime_ns, size)` 키 기준으로 메모리 캐싱(`_GZIP_CACHE`)하고 조건부 요청 `If-None-Match` (`304`) 및 `HEAD` 메서드(CORS `Access-Control-Allow-Methods: GET, HEAD, POST, OPTIONS` 포함)를 지원합니다.
- **서브경로 웹 배포 호환성 & 문서 최신화**: `pokemon_data.json` 및 `pokemon_quiz_data.json` `fetch()` 경로를 루트 절대경로(`/...`)에서 상대경로(`pokemon_...json?v=5.4.1`)로 전환해 GitHub Pages 등 서브경로 환경과도 호환되도록 했으며, 문서 내 구버전 기본 포트(`18934`) 표기를 현재 포트(`8000`)로 일괄 통일했습니다.

---

## 📦 5. Windows 단일 실행 파일 (EXE) & 검증 결과

- **빌드 파일**: `dist/치지직추첨기.exe` (`ChzzkInteractiveHub-v5.4.1.exe` / 표시 라벨: `치지직추첨기_v5.4.1.exe`, `20,020,232` bytes / 약 19.1 MB, PyInstaller 6.21.0 · Python 3.13.9)
- **백엔드·프로토콜 검증(`verify_v541_fixes.py --with-exe`)**: 쿠키 정제 단위 테스트, 동결 EXE 기동 후 `v5.4.1` HTML 서빙, `Access-Control-Allow-Methods` `HEAD` 포함, `HEAD /pokemon_data.json` Gzip+`ETag`, 조건부 `GET` `304 Not Modified`, `/api/` `HEAD` `405` 응답 전 항목 통과.
- **헤드리스 Chromium(Edge CDP) 런타임 검증(`test_edge_cdp_v541.py`)**: 페이지 로드 JS 예외 0건, 포켓몬 배틀/퀴즈 데이터셋 정상 로드, 스피드 모드 타임스탬프 비교, 리전폼 마스킹, 돌격조끼 ID 정규화, 스텔스록 기절교체 피해, 룰렛 2중 삭제 방지, 투표 배지 초기화, 종료 버튼 중복 핸들러 제거, 중도 종료 비동기 가드, 세션 백업 정리, 인스펙터 `data-poke-key` 선택 전 항목 통과.
