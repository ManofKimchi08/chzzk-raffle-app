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

PORT = 18928
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
    cdp_port = 9228
    user_data = os.path.abspath('scratch_chrome_user_data_symm')

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

        print('\n=== STEP 1: Enter Workspace and Setup Pokemon Faction Battle ===')
        evaluate("""
            if (typeof enterWorkspaceOffline === 'function') enterWorkspaceOffline();
            switchMainTab('game');
            switchMinigame('pokebattle');
            syncPokeBattleSubMode('faction_battle');
            
            // Set Red: Charizard with mega stone
            streamerTeam[0].pokemon = allPokemonData.find(p => p.id === 6) || streamerTeam[0].pokemon;
            streamerTeam[0].item = 'charizardite_x';
            revertPokemonToBaseForm(streamerTeam[0]);

            // Set Blue: Pikachu
            viewersTeam[0].pokemon = allPokemonData.find(p => p.id === 25) || viewersTeam[0].pokemon;
            viewersTeam[0].item = 'light_ball';
            revertPokemonToBaseForm(viewersTeam[0]);

            // Add sample participants
            factionRedMembers = [
                { uid: 'vip_red_1', nickname: '레드열혈후원자', time: Date.now() },
                { uid: 'sub_red_2', nickname: '레드열혈구독자', time: Date.now() },
                { uid: 'viewer_red_3', nickname: '레드시청자', time: Date.now() }
            ];
            factionBlueMembers = [
                { uid: 'vip_blue_1', nickname: '블루열혈후원자', time: Date.now() },
                { uid: 'sub_blue_2', nickname: '블루열혈구독자', time: Date.now() },
                { uid: 'viewer_blue_3', nickname: '블루시청자', time: Date.now() }
            ];
            participants.set('vip_red_1', { uid: 'vip_red_1', nickname: '레드열혈후원자', isDonator: true, donatorLevel: 2 });
            participants.set('sub_red_2', { uid: 'sub_red_2', nickname: '레드열혈구독자', isSubscriber: true });
            participants.set('vip_blue_1', { uid: 'vip_blue_1', nickname: '블루열혈후원자', isDonator: true, donatorLevel: 3 });
            participants.set('sub_blue_2', { uid: 'sub_blue_2', nickname: '블루열혈구독자', isSubscriber: true });

            factionUserMap.set('vip_red_1', 'red');
            factionUserMap.set('sub_red_2', 'red');
            factionUserMap.set('viewer_red_3', 'red');
            factionUserMap.set('vip_blue_1', 'blue');
            factionUserMap.set('sub_blue_2', 'blue');
            factionUserMap.set('viewer_blue_3', 'blue');

            proceedToFactionBattleArena();
            renderCinematicBillboards();
            renderFactionVotingBarsUI('red');
            renderFactionVotingBarsUI('blue');
        """)
        time.sleep(0.5)

        grid_style = evaluate("getComputedStyle(document.getElementById('arenaActionDecksGrid')).gridTemplateColumns")
        dialogue_width = evaluate("document.getElementById('arenaDialogueText').offsetWidth")
        timer_width = evaluate("document.getElementById('arenaSharedTimerWrap').offsetWidth")
        user_chat_zindex = evaluate("getComputedStyle(document.getElementById('userChatModal')).zIndex")

        print(f"arenaActionDecksGrid columns: {grid_style}")
        print(f"arenaDialogueText offsetWidth: {dialogue_width}px")
        print(f"arenaSharedTimerWrap offsetWidth: {timer_width}px")
        print(f"userChatModal zIndex: {user_chat_zindex}")

        assert user_chat_zindex == '1250', f"Expected userChatModal zIndex 1250, got {user_chat_zindex}"
        assert dialogue_width > 500, f"Dialogue width too narrow: {dialogue_width}"
        assert timer_width > 500, f"Timer width too narrow: {timer_width}"

        print('\n=== STEP 2: Verify Symmetrical Card Row Counts & Heights ===')

        red_child_count = evaluate("document.getElementById('arenaVoteCandidateBars').children.length")
        blue_child_count = evaluate("document.getElementById('arenaBlueVoteCandidateBars').children.length")
        red_box_height = evaluate("document.getElementById('arenaViewersVoteHud').offsetHeight")
        blue_box_height = evaluate("document.getElementById('arenaBlueTeamVoteHud').offsetHeight")

        print(f"Red action bar rows: {red_child_count} | Blue action bar rows: {blue_child_count}")
        print(f"Red HUD box height: {red_box_height}px | Blue HUD box height: {blue_box_height}px")
        
        assert red_child_count in [4, 5], f"Expected 4 or 5 rows for Red, got {red_child_count}"
        assert blue_child_count in [4, 5], f"Expected 4 or 5 rows for Blue, got {blue_child_count}"
        assert red_child_count == blue_child_count, f"Row count mismatch: Red={red_child_count} vs Blue={blue_child_count}"
        diff_h = abs(red_box_height - blue_box_height)
        print(f"Height difference: {diff_h}px (Tolerance <= 5px)")
        assert diff_h <= 5, f"Decks not symmetrical! Diff: {diff_h}px"

        take_screenshot('symmetrical_faction_action_decks')

        print('\n=== STEP 3: Click VIP Billboard Chip & Inspect UID Modal ===')
        evaluate("""
            const chip = document.querySelector('.billboard-user-chip[data-uid="vip_red_1"]');
            if (chip) chip.click();
        """)
        time.sleep(0.5)

        is_user_modal_active = evaluate("document.getElementById('userChatModal').classList.contains('active')")
        user_nick = evaluate("document.getElementById('userChatModalNick').innerText")
        user_uid = evaluate("document.getElementById('userChatModalUid').innerText")
        print(f"User modal active: {is_user_modal_active}")
        print(f"Inspected Nick: {user_nick} | UID: {user_uid}")

        assert is_user_modal_active == True, "User modal failed to open upon clicking VIP billboard chip"
        assert '레드열혈후원자' in user_nick, f"Unexpected nick: {user_nick}"
        assert 'vip_red_1' in user_uid, f"Unexpected UID: {user_uid}"

        take_screenshot('vip_billboard_uid_inspector')

        print('\n=== STEP 4: Close Inspector and Check Faction Roster Modal VIP Inspection ===')
        evaluate("closeUserChatModal()")
        evaluate("openFactionRosterModal()")
        time.sleep(0.5)

        is_roster_active = evaluate("document.getElementById('factionRosterModal').classList.contains('active')")
        print(f"Faction Roster modal active: {is_roster_active}")

        take_screenshot('faction_roster_uid_ready')

        # Click blue VIP row inside roster modal
        evaluate("""
            const blueRows = document.querySelectorAll('#rosterBlueMembersList > div');
            if (blueRows.length > 0) {
                blueRows[0].click(); // vip_blue_1
            }
        """)
        time.sleep(0.5)

        is_user_modal_active_again = evaluate("document.getElementById('userChatModal').classList.contains('active')")
        inspected_nick_blue = evaluate("document.getElementById('userChatModalNick').innerText")
        inspected_uid_blue = evaluate("document.getElementById('userChatModalUid').innerText")
        print(f"User modal active over roster: {is_user_modal_active_again}")
        print(f"Inspected Blue VIP Nick: {inspected_nick_blue} | UID: {inspected_uid_blue}")

        assert is_user_modal_active_again == True, "User modal failed to open over roster modal"
        assert '블루열혈후원자' in inspected_nick_blue, f"Unexpected nick: {inspected_nick_blue}"
        assert 'vip_blue_1' in inspected_uid_blue, f"Unexpected UID: {inspected_uid_blue}"

        take_screenshot('vip_roster_uid_inspector_layered')

        print('\n>>> ALL SYMMETRICAL MOVE DECK & VIP UID INSPECTOR TESTS PASSED PERFECTLY! <<<')

    finally:
        chrome_proc.kill()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
