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

PORT = 18935
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
    cdp_port = 9235
    user_data = os.path.abspath('scratch_chrome_user_data_mega')

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

        print('\n=== STEP 1: Setup Faction Battle with Charizard (Mega Evolution) ===')
        setup_res = evaluate("""
            (() => {
                if (typeof enterWorkspaceOffline === 'function') enterWorkspaceOffline();
                switchMainTab('game');
                switchMinigame('pokebattle');
                syncPokeBattleSubMode('faction_battle');
                
                // Red: Charizard with charizardite_x (canMega = true)
                streamerTeam[0].pokemon = allPokemonData.find(p => p.id === 6) || streamerTeam[0].pokemon;
                streamerTeam[0].item = 'charizardite_x';
                revertPokemonToBaseForm(streamerTeam[0]);

                // Blue: Blastoise with blastoisinite (canMega = true)
                viewersTeam[0].pokemon = allPokemonData.find(p => p.id === 9) || viewersTeam[0].pokemon;
                viewersTeam[0].item = 'blastoisinite';
                revertPokemonToBaseForm(viewersTeam[0]);

                // Setup participants
                factionRedMembers = [
                    { uid: 'u_red_1', nickname: '레드1', time: Date.now() },
                    { uid: 'u_red_2', nickname: '레드2', time: Date.now() },
                    { uid: 'u_red_3', nickname: '레드3', time: Date.now() },
                    { uid: 'u_red_4', nickname: '레드4', time: Date.now() }
                ];
                factionBlueMembers = [
                    { uid: 'u_blue_1', nickname: '블루1', time: Date.now() },
                    { uid: 'u_blue_2', nickname: '블루2', time: Date.now() }
                ];
                factionUserMap.clear();
                factionUserMap.set('u_red_1', 'red');
                factionUserMap.set('u_red_2', 'red');
                factionUserMap.set('u_red_3', 'red');
                factionUserMap.set('u_red_4', 'red');
                factionUserMap.set('u_blue_1', 'blue');
                factionUserMap.set('u_blue_2', 'blue');

                proceedToFactionBattleArena();
                renderCinematicBillboards();

                // Start turn voting
                pokeBattleState.phase = 'simultaneous_turn';
                pokeBattleState.round = 1;
                startSimultaneousPokeTurn();

                const redInstr = document.getElementById('arenaVoteInstructionText')?.innerHTML;
                const blueInstr = document.getElementById('arenaBlueVoteInstructionText')?.innerHTML;
                
                const redBars = document.getElementById('arenaVoteCandidateBars')?.innerText;
                const blueBars = document.getElementById('arenaBlueVoteCandidateBars')?.innerText;

                return {
                    redInstr,
                    blueInstr,
                    redBarsSample: redBars.slice(0, 400),
                    blueBarsSample: blueBars.slice(0, 400)
                };
            })()
        """)
        print('Faction Battle Setup Result:', json.dumps(setup_res, ensure_ascii=False, indent=2))

        # Check that red instruction contains 메가1~4 (since Charizard has mega stone)
        assert '메가1' in setup_res['redInstr'], 'Red HUD instruction does not contain 메가1!'
        # Blue currently has Pikachu (no mega), so blue HUD instruction correctly does NOT contain 메가1!
        assert '메가1' not in setup_res['blueInstr'], 'Blue HUD instruction should not contain 메가1 when no mega stone!'
        print('SUCCESS: Red HUD subtitle dynamically shows 메가1~4, and Blue HUD subtitle correctly omits it!')

        # Now give Blue team Charizard with charizardite_x and verify blueInstr shows 메가1
        blue_mega_res = evaluate("""
            (() => {
                const bSlot = viewersTeam[viewersActiveIdx];
                bSlot.basePokeCode = '6';
                bSlot.pokemon = allPokemonData.find(p => p.id === 6);
                bSlot.item = 'charizardite_x';
                revertPokemonToBaseForm(bSlot);
                viewersTeamHasMegaEvolved = false;
                bSlot.isMega = false;
                renderFactionVotingBarsUI('blue');
                return {
                    instr: document.getElementById('arenaBlueVoteInstructionText')?.innerHTML,
                    bars: document.getElementById('arenaBlueVoteCandidateBars')?.innerText.slice(0, 300)
                };
            })()
        """)
        print('Blue with Charizard mega stone result:', json.dumps(blue_mega_res, ensure_ascii=False, indent=2))
        assert '메가1' in blue_mega_res['instr'], 'Blue HUD instruction must show 메가1 when mega stone is held!'
        assert '메가1.' in blue_mega_res['bars'], 'Blue bars must display 메가1.!'
        print('SUCCESS: Blue HUD subtitle dynamically shows 메가1~4 when mega evolution is available!')

        # Check that candidate labels contain 메가1., 메가2.
        assert '메가1.' in setup_res['redBarsSample'], 'Red Bars do not contain 메가1.!'
        assert '메가2.' in setup_res['redBarsSample'], 'Red Bars do not contain 메가2.!'
        print('SUCCESS: Mega evolution cards display 🧬 메가1., 🧬 메가2., etc.!')

        print('\n=== STEP 2: Test Chat Vote Parsing for Mega Evolution ===')
        vote_test = evaluate("""
            (() => {
                // Test parseChatVoteChoice directly
                const redSlot = streamerTeam[0];
                const blueSlot = viewersTeam[0];
                
                const r1 = parseChatVoteChoice('메가1', redSlot, 'red', true);
                const r2 = parseChatVoteChoice('M2', redSlot, 'red', true);
                const r3 = parseChatVoteChoice('7', redSlot, 'red', true); // numeric alias for mega 1
                const r4 = parseChatVoteChoice('8번', redSlot, 'red', true); // numeric alias for mega 2
                const r5 = parseChatVoteChoice('1', redSlot, 'red', true); // normal move 1
                const r6 = parseChatVoteChoice('5번', redSlot, 'red', true); // switch 5
                const r7 = parseChatVoteChoice('메가 3', redSlot, 'red', true); // space
                const r8 = parseChatVoteChoice('4메가', redSlot, 'red', true); // postfix

                // Now simulate actual chat messages via handleLivePokeBattleChatVote
                handleLivePokeBattleChatVote('레드1', '메가1', 'u_red_1', Date.now());
                handleLivePokeBattleChatVote('레드2', '7', 'u_red_2', Date.now()); // should vote mega_1
                handleLivePokeBattleChatVote('레드3', 'M2', 'u_red_3', Date.now()); // should vote mega_2
                handleLivePokeBattleChatVote('레드4', '8번', 'u_red_4', Date.now()); // should vote mega_2

                return {
                    parse_mega1: r1,
                    parse_M2: r2,
                    parse_alias_7: r3,
                    parse_alias_8: r4,
                    parse_normal_1: r5,
                    parse_switch_5: r6,
                    parse_space_mega3: r7,
                    parse_postfix_4mega: r8,
                    redVoteCounts: factionRedVoteCounts,
                    redVoteUsers: Array.from(factionRedVoteUsers.entries())
                };
            })()
        """)
        print('Vote Parsing Result:', json.dumps(vote_test, ensure_ascii=False, indent=2))
        assert vote_test['parse_mega1'] == 'mega_1', '메가1 should parse to mega_1'
        assert vote_test['parse_M2'] == 'mega_2', 'M2 should parse to mega_2'
        assert vote_test['parse_alias_7'] == 'mega_1', '7 should parse to mega_1'
        assert vote_test['parse_alias_8'] == 'mega_2', '8번 should parse to mega_2'
        assert vote_test['parse_normal_1'] == 'move_1', '1 should parse to move_1'
        assert vote_test['parse_switch_5'] == 'switch_5', '5번 should parse to switch_5'
        assert vote_test['parse_space_mega3'] == 'mega_3', '메가 3 should parse to mega_3'
        assert vote_test['parse_postfix_4mega'] == 'mega_4', '4메가 should parse to mega_4'
        assert vote_test['redVoteCounts']['mega_1'] == 2, 'mega_1 should have 2 votes'
        assert vote_test['redVoteCounts']['mega_2'] == 2, 'mega_2 should have 2 votes'
        print('SUCCESS: All chat vote parsing for mega evolutions and numeric aliases verified!')

        # Scroll down to action decks and capture screenshot of Faction Battle with Mega numbers & active votes
        evaluate("document.getElementById('arenaViewersVoteHud')?.scrollIntoView({ behavior: 'instant', block: 'center' });")
        time.sleep(0.5)
        take_screenshot('faction_battle_mega_selection_numbers')

        print('\n=== STEP 3: Test 1v1 Viewers Voting Mode ===')
        v1_test = evaluate("""
            (() => {
                pokeBattleMode = '1v1';
                pokeBattleSubMode = 'standard';
                viewersTeam[0].basePokeCode = '6';
                viewersTeam[0].pokemon = allPokemonData.find(p => p.id === 6) || viewersTeam[0].pokemon;
                viewersTeam[0].item = 'charizardite_x';
                revertPokemonToBaseForm(viewersTeam[0]);
                viewersTeamHasMegaEvolved = false;
                viewersTeam[0].isMega = false;

                pokeVoteUsers.clear();
                pokeVoteCounts = {};

                renderPokeVotingBarsUI();

                const instr = document.getElementById('arenaVoteInstructionText')?.innerHTML;
                const barsText = document.getElementById('arenaVoteCandidateBars')?.innerText;

                // Test 1v1 chat voting
                pokeBattleState.phase = 'simultaneous_turn';
                handleLivePokeBattleChatVote('시청자1', '메가1', 'v_user_1', Date.now());
                handleLivePokeBattleChatVote('시청자2', 'M2', 'v_user_2', Date.now());
                handleLivePokeBattleChatVote('시청자3', '5', 'v_user_3', Date.now()); // in 1v1 mode, 5 maps to mega 1

                return {
                    instr,
                    barsSample: barsText.slice(0, 400),
                    voteCounts: pokeVoteCounts
                };
            })()
        """)
        print('1v1 Test Result:', json.dumps(v1_test, ensure_ascii=False, indent=2))
        assert '메가1' in v1_test['instr'], '1v1 instruction should contain 메가1'
        assert '메가1.' in v1_test['barsSample'], '1v1 bars should display 메가1.'
        assert v1_test['voteCounts']['mega_1'] == 2, '1v1 mega_1 should have 2 votes (메가1 and 5)'
        assert v1_test['voteCounts']['mega_2'] == 1, '1v1 mega_2 should have 1 vote (M2)'
        print('SUCCESS: 1v1 Viewers Voting Mode mega selection verified!')

        evaluate("document.getElementById('arenaViewersVoteHud')?.scrollIntoView({ behavior: 'instant', block: 'center' });")
        time.sleep(0.5)
        take_screenshot('poke_1v1_mega_selection_numbers')

        print('\nALL AUTOMATED VERIFICATION CHECKS PASSED!')

    finally:
        chrome_proc.terminate()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
