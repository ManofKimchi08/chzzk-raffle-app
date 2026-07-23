# 🎮 치지직 대규모 시청자 추첨 시스템 (Chzzk Mega Raffle System)

![Chzzk Mega Raffle](https://img.shields.io/badge/Chzzk-WebSocket%20Live-00ffa3?style=for-the-badge&logo=naver)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-SinglePage-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

네이버 **치지직(Chzzk)** 라이브 방송 채팅창과 웹소켓(WebSocket)으로 직접 연결하여 **팔로우 여부/기간, 구독 여부/기간/티어** 등 다양한 조건으로 시청자를 실시간 분류하고 **수백~수천 명 이상을 중복 없이 공정하게 일괄 추첨**하는 고급 웹 애플리케이션입니다.

---

## 🌟 핵심 기능 (Key Features)

- **⚡ 실시간 웹소켓(WebSocket) 채팅 수집**: 방송 URL 또는 채널 ID만 입력하면 실시간 채팅 메시지를 초고속 수집합니다.
- **🛡️ 자동 중복 및 도배 방지 (Deduplication)**: 시청자가 채팅을 여러 번 쳐도 유저 고유 식별자(`userIdHash`)를 기준으로 1회만 응모 처리됩니다.
- **❤️ 팔로우 상세 필터링**:
  - **팔로워 전용 추첨** 옵션
  - **최소 팔로우 기간 지정** (예: 30일 이상 팔로우한 팬만 추첨)
- **⭐ 구독 상세 필터링**:
  - **구독자 전용 추첨** 옵션
  - **최소 구독 개월 수 지정** (예: 3개월 이상 연속 구독자만 추첨)
  - **구독 티어 지정** (1티어 이상 또는 2티어 전용 추첨)
- **🎯 키워드 필터링**: `!추첨`, `!참여` 등 원하는 키워드를 지정하거나, 빈칸으로 두어 전 시청자를 대상으로 수집할 수 있습니다.
- **🎁 대규모 일괄 무작위 추첨**: 1명부터 5,000명+ 이상까지 **Fisher-Yates 셔플 알고리즘**을 통해 편향 없는 무작위 추첨을 수행합니다.
- **📊 엑셀(CSV) 다운로드**: 당첨자 명단 및 **구독 상태, 구독 개월, 팔로우 기간** 정보를 UTF-8 BOM 엑셀 CSV 파일로 원클릭 저장합니다.

---

## 🏗️ 시스템 아키텍처 (Architecture)

```mermaid
sequenceDiagram
    autonumber
    actor Streamer as 스트리머/운영자
    participant WebApp as Web Client (index.html)
    participant Server as Python Proxy Server (server.py)
    participant ChzzkAPI as Naver Chzzk API
    participant ChzzkWS as Chzzk WebSocket Server

    Streamer->>WebApp: 방송 URL & 팔로우/구독 필터 설정
    WebApp->>Server: /api/chzzk/?channelId={ID}
    Server->>ChzzkAPI: GET /service/v2/channels/{ID}/live-detail
    ChzzkAPI-->>Server: chatChannelId 반환
    Server->>ChzzkAPI: GET /chats/access-token?channelId={chatCid}
    ChzzkAPI-->>Server: accessToken 반환
    Server-->>WebApp: chatChannelId & accessToken 전달
    WebApp->>ChzzkWS: wss://kr-ss1.chat.naver.com/chat 접속
    WebApp->>ChzzkWS: Handshake 패킷 송신 (cmd: 100)
    ChzzkWS-->>WebApp: Connect Response (cmd: 10100)
    loop 실시간 채팅 수집 & 프로필 분석
        ChzzkWS-->>WebApp: Chat Message (profile.streamingProperty)
        WebApp->>WebApp: 팔로우/구독 상태 실시간 파싱 & 필터링
    end
    Streamer->>WebApp: [조건별 추첨하기] 클릭
    WebApp->>WebApp: Fisher-Yates 셔플 기반 N명 추첨
    WebApp->>Streamer: 배지 표기 당첨자 출력 & 엑셀 CSV 다운로드
```

---

## 🚀 로컬 실행 방법 (Local Run)

### Requirements
- Python 3.9 이상 (Standard Library 사용)

### Execution
```bash
# 1. 저장소 클론
git clone https://github.com/dlwjdxor/chzzk-raffle-app.git
cd chzzk-raffle-app

# 2. 서버 실행
python server.py
```
서버가 실행되면 자동으로 브라우저에서 `http://localhost:8000` 이 열립니다.

---

## 💻 실행 파일(.exe) 다시 빌드하기

```bash
pip install pyinstaller
python -m PyInstaller --noconfirm --onefile --name "치지직추첨기" --add-data "public;public" server.py
```
생성된 `dist/치지직추첨기.exe` 파일을 더블 클릭만 하면 파이썬 없이 바로 실행할 수 있습니다.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
