import os
import sys
import time
import json
import subprocess
import urllib.request
import base64
import http.server
import socketserver
import threading

PORT = 18930
DIRECTORY = r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\public'
ARTIFACT_DIR = r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def run_test():
    httpd = start_server()
    print(f'Static server started at http://127.0.0.1:{PORT}')

    chrome_bin = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
    cdp_port = 9230
    user_data = os.path.abspath('scratch_chrome_user_data_glory')

    chrome_proc = subprocess.Popen([
        chrome_bin,
        '--headless=new',
        '--window-size=1400,1000',
        '--remote-debugging-port=' + str(cdp_port),
        '--remote-allow-origins=*',
        '--disable-gpu',
        '--no-sandbox',
        f'--user-data-dir={user_data}',
        f'http://127.0.0.1:{PORT}/index.html'
    ])

    time.sleep(2)

    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{cdp_port}/json')
        tabs = json.loads(req.read().decode('utf-8'))
        target_tab = next((t for t in tabs if 'index.html' in t.get('url', '') or t.get('type') == 'page'), tabs[0])
        target_ws_url = target_tab['webSocketDebuggerUrl']

        import websocket
        ws = websocket.create_connection(target_ws_url)

        msg_id = 0
        def send_cmd(method, params={}):
            nonlocal msg_id
            msg_id += 1
            req_data = {'id': msg_id, 'method': method, 'params': params}
            ws.send(json.dumps(req_data))
            while True:
                res = json.loads(ws.recv())
                if res.get('id') == msg_id:
                    return res

        def evaluate(expr):
            r = send_cmd('Runtime.evaluate', {
                'expression': expr,
                'returnByValue': True,
                'awaitPromise': True
            })
            if 'exceptionDetails' in r.get('result', {}):
                print('[EVAL ERROR]', r['result']['exceptionDetails'])
            return r.get('result', {}).get('result', {}).get('value')

        def take_screenshot(name):
            r = send_cmd('Page.captureScreenshot', {'format': 'png'})
            data = r['result']['data']
            path = os.path.join(ARTIFACT_DIR, f'{name}.png')
            with open(path, 'wb') as f:
                f.write(base64.b64decode(data))
            print(f'[SCREENSHOT SAVED] {path}')
            return path

        send_cmd('Runtime.enable')
        send_cmd('Page.enable')

        print('\n=== STEP 1: Setup Faction Battle with Sample Viewers and End Match with Red Victory ===')
        evaluate("""
            if (typeof enterWorkspaceOffline === 'function') enterWorkspaceOffline();
            switchMainTab('game');
            switchMinigame('pokebattle');
            syncPokeBattleSubMode('faction_battle');

            // Setup Red team & Blue team members
            factionRedMembers = [
                { uid: 'uid_cool_123', nickname: '쿨럭쿨럭', time: Date.now() },
                { uid: 'uid_kunmo_456', nickname: '쿤모춘장예송이버섯', time: Date.now() }
            ];
            factionBlueMembers = [
                { uid: 'uid_blue_789', nickname: '블루대표시청자', time: Date.now() },
                { uid: 'uid_blue_888', nickname: '파란하늘', time: Date.now() }
            ];

            participants.set('uid_cool_123', { uid: 'uid_cool_123', nickname: '쿨럭쿨럭', isSubscriber: true, subMonth: 6, isDonator: true, donatorLevel: 3 });
            participants.set('uid_kunmo_456', { uid: 'uid_kunmo_456', nickname: '쿤모춘장예송이버섯', isDonator: true, donatorLevel: 2 });
            participants.set('uid_blue_789', { uid: 'uid_blue_789', nickname: '블루대표시청자', isSubscriber: true, subMonth: 12 });

            factionUserMap.set('uid_cool_123', 'red');
            factionUserMap.set('uid_kunmo_456', 'red');
            factionUserMap.set('uid_blue_789', 'blue');
            factionUserMap.set('uid_blue_888', 'blue');

            pokeBattleState.active = true;
            pokeBattleState.round = 2;
            pokeBattleState.stats = { totalRounds: 2, streamerDamage: 78, viewersDamage: 113, crits: 0, superEffective: 1 };

            // Trigger Red Victory!
            finishPokeBattle('streamer');
        """)
        time.sleep(0.5)

        is_modal_active = evaluate("document.getElementById('pokeBattleResultModal').classList.contains('active')")
        title_text = evaluate("document.getElementById('pokeResultTitle').innerText")
        chip_count = evaluate("document.querySelectorAll('#pokeResultGloryChipsContainer .glory-user-chip').length")
        chip_texts = evaluate("Array.from(document.querySelectorAll('#pokeResultGloryChipsContainer .glory-user-chip')).map(c => c.innerText)")

        print(f"Result modal active: {is_modal_active}")
        print(f"Title: {title_text}")
        print(f"Glory chip count: {chip_count}")
        print(f"Glory chip texts: {chip_texts}")

        assert is_modal_active == True, "Result modal failed to show"
        assert '레드' in title_text and '대승리' in title_text
        assert chip_count == 2, f"Expected 2 glory chips, got {chip_count}"
        assert any('쿨럭쿨럭' in t for t in chip_texts), "Expected 쿨럭쿨럭 chip"
        assert any('쿤모춘장예송이버섯' in t for t in chip_texts), "Expected 쿤모춘장예송이버섯 chip"

        take_screenshot('glory_participants_result_modal')

        print('\n=== STEP 2: Click "쿨럭쿨럭" Chip & Verify UID Inspector Modal ===')
        evaluate("""
            const chips = document.querySelectorAll('#pokeResultGloryChipsContainer .glory-user-chip');
            if (chips.length > 0) chips[0].click();
        """)
        time.sleep(0.5)

        is_user_modal_active = evaluate("document.getElementById('userChatModal').classList.contains('active')")
        inspected_nick = evaluate("document.getElementById('userChatModalNick').innerText")
        inspected_uid = evaluate("document.getElementById('userChatModalUid').innerText")
        user_modal_zindex = evaluate("getComputedStyle(document.getElementById('userChatModal')).zIndex")

        print(f"User modal active: {is_user_modal_active}")
        print(f"Inspected Nick: {inspected_nick} | UID: {inspected_uid}")
        print(f"User modal z-index: {user_modal_zindex}")

        assert is_user_modal_active == True, "User inspector modal failed to open from glory chip"
        assert inspected_nick == '쿨럭쿨럭', f"Expected 쿨럭쿨럭, got {inspected_nick}"
        assert inspected_uid == 'uid_cool_123', f"Expected uid_cool_123, got {inspected_uid}"
        assert user_modal_zindex == '1250', f"Expected z-index 1250, got {user_modal_zindex}"

        take_screenshot('glory_participant_uid_inspect')

        print('\n=== STEP 3: Close User Modal and Click "전체 명단 & 검색" ===')
        evaluate("closeUserChatModal();")
        time.sleep(0.3)
        evaluate("openFactionRosterModal();")
        time.sleep(0.5)

        is_roster_active = evaluate("document.getElementById('factionRosterModal').classList.contains('active')")
        roster_zindex = evaluate("getComputedStyle(document.getElementById('factionRosterModal')).zIndex")
        print(f"Roster modal active over result modal: {is_roster_active}")
        print(f"Roster modal z-index: {roster_zindex}")

        assert is_roster_active == True, "Roster modal failed to open over result modal"
        assert int(roster_zindex) > 1100, f"Roster modal z-index must be > 1100 to float over result modal, got {roster_zindex}"

        take_screenshot('glory_roster_modal_over_result')

        print('\n=== STEP 4: Click User Inside Roster Modal & Verify Triple-Layer Stacking ===')
        evaluate("""
            const rows = document.querySelectorAll('#rosterRedMembersList > div');
            if (rows.length > 1) rows[1].click(); // 쿤모춘장예송이버섯
        """)
        time.sleep(0.5)

        is_user_modal_active_again = evaluate("document.getElementById('userChatModal').classList.contains('active')")
        inspected_nick2 = evaluate("document.getElementById('userChatModalNick').innerText")
        inspected_uid2 = evaluate("document.getElementById('userChatModalUid').innerText")
        print(f"User modal active over roster: {is_user_modal_active_again}")
        print(f"Inspected Nick 2: {inspected_nick2} | UID: {inspected_uid2}")

        assert is_user_modal_active_again == True, "User modal failed to open over roster modal"
        assert inspected_nick2 == '쿤모춘장예송이버섯', f"Expected 쿤모춘장예송이버섯, got {inspected_nick2}"
        assert inspected_uid2 == 'uid_kunmo_456', f"Expected uid_kunmo_456, got {inspected_uid2}"

        take_screenshot('glory_user_inspect_over_roster')

        print('\n>>> ALL GLORY PARTICIPANTS UID INSPECTOR TESTS PASSED PERFECTLY! <<<')

    finally:
        chrome_proc.kill()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
