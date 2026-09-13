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

PORT = 18926
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))
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
    cdp_port = 9226
    user_data = os.path.abspath('scratch_chrome_user_data_choice')

    chrome_proc = subprocess.Popen([
        chrome_bin,
        '--headless=new',
        '--window-size=1360,950',
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
        print('Tabs available:', len(tabs))
        target_tab = next((t for t in tabs if 'index.html' in t.get('url', '') or t.get('type') == 'page'), tabs[0])
        target_ws_url = target_tab['webSocketDebuggerUrl']
        print('Selected target tab:', target_tab.get('url'))

        try:
            import websocket
        except ImportError:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'websocket-client'])
            import websocket

        ws = websocket.create_connection(target_ws_url)
        msg_id = 1

        def send_cdp(method, params=None):
            nonlocal msg_id
            payload = {'id': msg_id, 'method': method}
            if params:
                payload['params'] = params
            msg_id += 1
            ws.send(json.dumps(payload))
            while True:
                resp = json.loads(ws.recv())
                if resp.get('method') == 'Runtime.consoleAPICalled':
                    msg = resp.get('params', {}).get('args', [{}])[0].get('value', '')
                    print('[BROWSER LOG]', msg)
                if resp.get('method') == 'Runtime.exceptionThrown':
                    print('[BROWSER ERROR]', resp)
                if resp.get('id') == payload['id']:
                    return resp

        def eval_js(js_code):
            resp = send_cdp('Runtime.evaluate', {
                'expression': js_code,
                'returnByValue': True
            })
            return resp.get('result', {}).get('result', {}).get('value')

        def capture_screenshot(filename):
            resp = send_cdp('Page.captureScreenshot', {'format': 'png'})
            data = resp.get('result', {}).get('data')
            if data:
                save_path = os.path.join(ARTIFACT_DIR, filename)
                with open(save_path, 'wb') as f:
                    f.write(base64.b64decode(data))
                print(f'[SCREENSHOT SAVED] {save_path}')

        send_cdp('Runtime.enable')
        send_cdp('Console.enable')
        send_cdp('Page.enable')

        time.sleep(1)

        print('\n=== STEP 1: Navigate to Pokemon Battle & Select Faction Battle + Viewer Choice Mode ===')
        eval_js("""
            if (typeof enterWorkspaceOffline === 'function') enterWorkspaceOffline();
            switchMainTab('game');
            switchMinigame('pokebattle');
            syncPokeBattleSubMode('faction_battle');
            syncFactionAssignMethod('viewer_choice');
        """)
        time.sleep(0.5)

        assign_method = eval_js("factionAssignMethod")
        method_desc = eval_js("document.getElementById('factionSetupMethodDesc') ? document.getElementById('factionSetupMethodDesc').innerText : ''")
        print(f'Current factionAssignMethod: {assign_method}')
        print(f'Method Desc: {method_desc}')
        assert assign_method == 'viewer_choice', f"Expected 'viewer_choice', got {assign_method}"

        print('\n=== STEP 2: Start Faction Recruitment in Viewer Choice Mode ===')
        eval_js("startFactionRecruitment();")
        time.sleep(0.5)

        is_modal_active = eval_js("document.getElementById('factionRecruitModal').classList.contains('active')")
        choice_sec_display = eval_js("document.getElementById('factionRecruitChoiceSection').style.display")
        random_sec_display = eval_js("document.getElementById('factionRecruitRandomSection').style.display")
        modal_title = eval_js("document.getElementById('factionRecruitModalTitle').innerText")
        print(f'Recruit modal active: {is_modal_active}')
        print(f'Modal Title: {modal_title}')
        print(f'Choice section display: {choice_sec_display}')
        print(f'Random section display: {random_sec_display}')
        assert is_modal_active is True
        assert choice_sec_display != 'none', "Choice section must be displayed"
        assert random_sec_display == 'none', "Random section must be hidden"

        print('\n=== STEP 3: Simulate Viewer Chat Joins and Team Transfers ===')
        # Viewers join Red
        eval_js("handleFactionOmniChat('피카츄팬', '1', 'uid_pika');")
        eval_js("handleFactionOmniChat('레드용사', '레드', 'uid_red_hero');")
        eval_js("handleFactionOmniChat('불꽃숭이', 'red', 'uid_fire');")

        # Viewers join Blue
        eval_js("handleFactionOmniChat('꼬부기팬', '2', 'uid_squirtle');")
        eval_js("handleFactionOmniChat('블루마스터', '블루', 'uid_blue_master');")

        # Viewer joins Red first, then switches to Blue
        eval_js("handleFactionOmniChat('마음바뀜', '1', 'uid_switcher');") # Joined Red
        red_cnt_before = eval_js("factionChoiceRecruits.red.size")
        blue_cnt_before = eval_js("factionChoiceRecruits.blue.size")
        print(f'Before switch: Red={red_cnt_before}, Blue={blue_cnt_before}')
        assert red_cnt_before == 4 and blue_cnt_before == 2

        # Switch to Blue!
        eval_js("handleFactionOmniChat('마음바뀜', '2', 'uid_switcher');") # Switched to Blue!
        red_cnt_after = eval_js("factionChoiceRecruits.red.size")
        blue_cnt_after = eval_js("factionChoiceRecruits.blue.size")
        print(f'After switch: Red={red_cnt_after}, Blue={blue_cnt_after}')
        assert red_cnt_after == 3 and blue_cnt_after == 3
        has_in_red = eval_js("factionChoiceRecruits.red.has('uid_switcher')")
        has_in_blue = eval_js("factionChoiceRecruits.blue.has('uid_switcher')")
        assert has_in_red is False and has_in_blue is True, "Switcher must only exist in Blue"

        # Check UI badges
        red_badge = eval_js("document.getElementById('recruitChoiceRedBadge').innerText")
        blue_badge = eval_js("document.getElementById('recruitChoiceBlueBadge').innerText")
        print(f'UI Badges: Red={red_badge}, Blue={blue_badge}')
        assert red_badge == '3명' and blue_badge == '3명'

        capture_screenshot('faction_choice_recruitment_modal.png')

        print('\n=== STEP 4: Finish Recruitment and Inspect Reveal Modal ===')
        eval_js("finishFactionRecruitmentAndDraft();")
        time.sleep(0.5)

        reveal_active = eval_js("document.getElementById('factionRevealModal').classList.contains('active')")
        reveal_title = eval_js("document.getElementById('factionRevealTitle').innerText")
        reveal_icon = eval_js("document.getElementById('factionRevealIcon').innerText")
        red_members_len = eval_js("factionRedMembers.length")
        blue_members_len = eval_js("factionBlueMembers.length")
        print(f'Reveal modal active: {reveal_active}')
        print(f'Reveal Title: {reveal_title}, Icon: {reveal_icon}')
        print(f'Faction rosters: Red={red_members_len}, Blue={blue_members_len}')
        assert reveal_active is True
        assert reveal_icon == '🚩'
        assert red_members_len == 3 and blue_members_len == 3

        capture_screenshot('faction_choice_reveal_modal.png')

        print('\n=== STEP 5: Proceed to Faction Battle Arena ===')
        eval_js('proceedToFactionBattleArena();')
        time.sleep(0.5)

        arena_display = eval_js("document.getElementById('pokeBattleArenaStage').style.display")
        red_board_cnt = eval_js("document.getElementById('billboardRedCountBadge').innerText")
        blue_board_cnt = eval_js("document.getElementById('billboardBlueCountBadge').innerText")
        red_chips = eval_js("document.querySelectorAll('#billboardRedScrollTrack .billboard-user-chip').length")
        blue_chips = eval_js("document.querySelectorAll('#billboardBlueScrollTrack .billboard-user-chip').length")
        print(f'Arena display: {arena_display}')
        print(f'Billboard badge counts: Red={red_board_cnt}, Blue={blue_board_cnt}')
        print(f'Billboard chips: Red={red_chips}, Blue={blue_chips}')
        assert arena_display == 'flex'
        assert red_board_cnt == '3명' and blue_board_cnt == '3명'
        assert red_chips > 0 and blue_chips > 0

        capture_screenshot('faction_choice_arena_billboards.png')

        print('\n=== STEP 6: In-Battle Live Chat Voting ===')
        # Red vote: move 1 (slot 0)
        eval_js("handleLivePokeBattleChatVote('피카츄팬', '1', 'uid_pika', Date.now());")
        # Blue vote: move 2 (slot 1)
        eval_js("handleLivePokeBattleChatVote('꼬부기팬', '2', 'uid_squirtle', Date.now());")

        red_vote = eval_js("factionRedVoteUsers.get('uid_pika')")
        blue_vote = eval_js("factionBlueVoteUsers.get('uid_squirtle')")
        print(f'Votes registered: Red={red_vote}, Blue={blue_vote}')
        assert red_vote == 'move_1'
        assert blue_vote == 'move_2'

        print('\n=== STEP 7: Latecomer Viewers Joining Mid-Battle ===')
        # Latecomer 1 specifies '블루'
        eval_js("handleLivePokeBattleChatVote('늦은블루', '블루', 'uid_late_blue', Date.now());")
        late_blue_team = eval_js("factionUserMap.get('uid_late_blue')")
        print(f'Latecomer with "블루" assigned team: {late_blue_team}')
        assert late_blue_team == 'blue'

        # Now Blue has 4 members, Red has 3 members.
        # Latecomer 2 types '1' (move 1, no team specified) -> Should auto-balance to Red!
        eval_js("handleLivePokeBattleChatVote('늦은중립', '1', 'uid_late_neutral', Date.now());")
        late_neutral_team = eval_js("factionUserMap.get('uid_late_neutral')")
        print(f'Latecomer without team keyword assigned team: {late_neutral_team}')
        assert late_neutral_team == 'red', f"Expected auto-balance to red, got {late_neutral_team}"

        print('\n=== STEP 8: Turn Resolution ===')
        eval_js("finishSimultaneousPokeTurn();")
        time.sleep(2.5)

        turn_phase = eval_js("pokeBattleState.phase")
        dialogue_text = eval_js("document.getElementById('pokeBattleDialogueText') ? document.getElementById('pokeBattleDialogueText').innerText : ''")
        print(f'Turn phase after resolution: {turn_phase}')
        print(f'Dialogue: {dialogue_text}')
        capture_screenshot('faction_choice_battle_turn_resolve.png')

        print('\n>>> ALL FACTION CHOICE MODE TESTS PASSED PERFECTLY! <<<')

    finally:
        try:
            chrome_proc.terminate()
            chrome_proc.wait(timeout=3)
        except Exception:
            chrome_proc.kill()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
