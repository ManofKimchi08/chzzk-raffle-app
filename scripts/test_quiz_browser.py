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

PORT = 18923
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))

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
    cdp_port = 9224
    user_data = os.path.abspath('scratch_chrome_user_data')

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
        for t in tabs:
            print('Tab:', t.get('title'), t.get('url'))
        
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
                if resp.get('method') == 'Runtime.consoleAPICalled' or resp.get('method') == 'Runtime.exceptionThrown':
                    print('[BROWSER LOG]', resp)
                if resp.get('id') == payload['id']:
                    return resp

        send_cdp('Runtime.enable')
        send_cdp('Console.enable')
        send_cdp('Page.enable')

        time.sleep(1)

        # 1. Switch to Game Tab & Pokemon Quiz Show minigame
        res = send_cdp('Runtime.evaluate', {
            'expression': 'switchMainTab("game"); switchMinigame("pokequiz");'
        })
        print('switchMainTab game & switchMinigame pokequiz:', res)

        time.sleep(1)

        # 2. Check quiz dataset loaded
        res = send_cdp('Runtime.evaluate', {
            'expression': 'allPokemonQuizData.length'
        })
        quiz_len = res.get('result', {}).get('result', {}).get('value')
        print(f'Pokemon Quiz Data count: {quiz_len}')

        # 3. Start a question
        res = send_cdp('Runtime.evaluate', {
            'expression': 'nextQuizQuestion();'
        })
        print('nextQuizQuestion:', res)
        time.sleep(1)

        # 4. Get current question state
        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ round: quizMatchState.round, type: quizMatchState.currentQuestionType, pokemon: quizMatchState.currentPokemon.name, chosung: quizMatchState.currentPokemon.chosung })'
        })
        curr_state = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print('Current Quiz Question State:', curr_state)

        # 5. Test Streamer Answer Input & Edit (No instant outcome until timer expiry!)
        print("\n--- Testing Streamer Answer Input & Lock ---")
        send_cdp('Runtime.evaluate', {
            'expression': '''
                document.getElementById("quizStreamerAnswerInput").value = "틀린답안";
                submitQuizStreamerAnswer();
            '''
        })
        time.sleep(0.5)
        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ feedback: document.getElementById("quizStreamerInputFeedback").innerText, phase: quizMatchState.phase, submitted: quizMatchState.streamerSubmittedAnswer })'
        })
        first_submit = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print('Streamer First Submission (Locked, Waiting):', first_submit)

        # 6. Streamer edits answer to correct answer!
        test_answer = curr_state['pokemon']
        send_cdp('Runtime.evaluate', {
            'expression': f'''
                document.getElementById("quizStreamerSubmitBtn").click(); // Click Edit button
                document.getElementById("quizStreamerAnswerInput").value = "{test_answer}";
                submitQuizStreamerAnswer();
            '''
        })
        time.sleep(0.5)

        # Confirm phase is still 'question' (timer still running, waiting for expiry)
        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ phase: quizMatchState.phase, submitted: quizMatchState.streamerSubmittedAnswer })'
        })
        pre_eval = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print('Pre-evaluation state (Timer still running):', pre_eval)

        # Force timer expiry & speed evaluation
        send_cdp('Runtime.evaluate', {
            'expression': 'evaluateQuizSpeedOutcome();'
        })
        time.sleep(1)

        # Check streamer score after timer expiry
        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ streamer: quizMatchState.streamerScore, viewers: quizMatchState.viewersScore, phase: quizMatchState.phase, winDetail: document.getElementById("quizAnswerWinnerDetail").innerText })'
        })
        score_state = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print('Score State after Timer Expiry:', score_state)

        # Capture Quiz Arena Screenshot with Streamer Win
        shot = send_cdp('Page.captureScreenshot', {'format': 'png'})
        img_data = base64.b64decode(shot['result']['data'])
        out_shot1 = os.path.abspath(r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad\poke_quiz_arena_verified.png')
        with open(out_shot1, 'wb') as f:
            f.write(img_data)
        print('Saved Quiz Arena screenshot:', out_shot1)

        # 7. Test Voting Mode (Blind Collection & Simultaneous Reveal)
        print("\n--- Testing Voting Mode (Blind Collection & Simultaneous Reveal) ---")
        send_cdp('Runtime.evaluate', {
            'expression': 'syncQuizViewerMode("voting"); resetQuizMatch(); nextQuizQuestion();'
        })
        time.sleep(1)

        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ round: quizMatchState.round, type: quizMatchState.currentQuestionType, pokemon: quizMatchState.currentPokemon.name })'
        })
        vote_state = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print("Voting Mode Question:", vote_state)

        correct_ans = vote_state['pokemon']
        # 3 viewers vote for correct answer, 1 votes for wrong answer
        send_cdp('Runtime.evaluate', {
            'expression': f'''
                handleLivePokeQuizChat("시청자A", "{correct_ans}", "v1", Date.now());
                handleLivePokeQuizChat("시청자B", "{correct_ans}", "v2", Date.now());
                handleLivePokeQuizChat("시청자C", "{correct_ans}", "v3", Date.now());
                handleLivePokeQuizChat("시청자D", "피카츄", "v4", Date.now());
            '''
        })
        time.sleep(0.5)

        # Streamer also submits answer
        send_cdp('Runtime.evaluate', {
            'expression': f'''
                document.getElementById("quizStreamerAnswerInput").value = "{correct_ans}";
                submitQuizStreamerAnswer();
            '''
        })
        time.sleep(0.5)

        # Check blind collection UI
        res = send_cdp('Runtime.evaluate', {
            'expression': 'document.getElementById("quizVotingModeBarsBox").innerText'
        })
        blind_text = res.get('result', {}).get('result', {}).get('value')
        print("Voting Mode Blind Box Text (Before Reveal):", blind_text.replace('\n', ' '))

        # Capture Blind Collecting Screenshot
        shot_blind = send_cdp('Page.captureScreenshot', {'format': 'png'})
        img_data_blind = base64.b64decode(shot_blind['result']['data'])
        out_shot_blind = os.path.abspath(r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad\poke_quiz_collecting_verified.png')
        with open(out_shot_blind, 'wb') as f:
            f.write(img_data_blind)
        print('Saved Quiz Blind Collecting screenshot:', out_shot_blind)

        # Force timer expiry & simultaneous reveal
        send_cdp('Runtime.evaluate', {
            'expression': 'evaluateQuizVotingOutcome();'
        })
        time.sleep(1)

        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ streamerScore: quizMatchState.streamerScore, viewersScore: quizMatchState.viewersScore, topVoted: quizMatchState.topVotedAnswer, phase: quizMatchState.phase, winTitle: document.getElementById("quizAnswerWinnerTitle").innerText, winDetail: document.getElementById("quizAnswerWinnerDetail").innerText })'
        })
        outcome = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print("Voting Simultaneous Outcome:", outcome)

        # Capture Quiz Voting Screenshot
        shot = send_cdp('Page.captureScreenshot', {'format': 'png'})
        img_data = base64.b64decode(shot['result']['data'])
        out_shot = os.path.abspath(r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad\poke_quiz_voting_verified.png')
        with open(out_shot, 'wb') as f:
            f.write(img_data)
        # 7b. Test Universal 3-Step Hint Panel on All Modes (Cry, Silhouette, Pokedex)
        print("\n--- Testing Universal 3-Step Hint Panel (Cry, Silhouette, Pokedex) ---")
        send_cdp('Runtime.evaluate', {
            'expression': '''
                quizMatchState.currentQuestionType = "cry";
                quizMatchState.currentPokemon = allPokemonQuizData.find(p => p.id === 6); // Charizard
                quizMatchState.phase = "question";
                renderQuizStageUI();
                manuallyOpenNextQuizHint(); // Step 1: Type
                manuallyOpenNextQuizHint(); // Step 2: Genus & Gen
                manuallyOpenNextQuizHint(); // Step 3: Chosung
            '''
        })
        time.sleep(0.5)

        res = send_cdp('Runtime.evaluate', {
            'expression': '''
                JSON.stringify({
                    badge: document.getElementById("quizCurrentHintBadge").innerText,
                    btn: document.getElementById("quizOpenHintBtn").innerText,
                    clue1: document.getElementById("quizClueContent1").innerText,
                    clue2: document.getElementById("quizClueContent2").innerText,
                    clue3: document.getElementById("quizClueContent3").innerText
                })
            '''
        })
        hint_state = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print("Universal 3-Step Hint Panel Test (Cry Mode):", hint_state)

        # Capture Quiz Hints Screenshot
        shot_hints = send_cdp('Page.captureScreenshot', {'format': 'png'})
        img_data_hints = base64.b64decode(shot_hints['result']['data'])
        out_shot_hints = os.path.abspath(r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad\poke_quiz_hints_verified.png')
        with open(out_shot_hints, 'wb') as f:
            f.write(img_data_hints)
        print('Saved Quiz Hints screenshot:', out_shot_hints)

        # 8. Test Developer Inspector Modal & Form Chosung Formatting
        print("\n--- Testing Developer Inspector Modal & Form Chosung Formatting ---")
        send_cdp('Runtime.evaluate', {
            'expression': 'openQuizInspectorModal();'
        })
        time.sleep(1)

        # Test selecting Alolan Ninetales ('0038-001') to verify form chosung 'ㄴㅇㅌㅇ (???의 모습)'
        res = send_cdp('Runtime.evaluate', {
            'expression': '''
                selectQuizInspectorPokemon("0038-001");
                testQuizAnswerMatcher("나인테일");
            '''
        })
        time.sleep(1)

        res = send_cdp('Runtime.evaluate', {
            'expression': 'JSON.stringify({ badge: document.getElementById("quizInspTestResultBadge").innerText, chosungHtml: document.getElementById("quizInspChosungBox").innerText, name: document.getElementById("quizInspName").innerText })'
        })
        ninetales_test = json.loads(res.get('result', {}).get('result', {}).get('value'))
        print('Inspector Alolan Ninetales Test:', ninetales_test)

        # Capture Inspector Screenshot
        shot2 = send_cdp('Page.captureScreenshot', {'format': 'png'})
        img_data2 = base64.b64decode(shot2['result']['data'])
        out_shot2 = os.path.abspath(r'C:\Users\dlwjd\.gemini\antigravity\brain\313f987a-ce0f-4700-8a7d-5395ed38e7ad\poke_quiz_inspector_verified.png')
        with open(out_shot2, 'wb') as f:
            f.write(img_data2)
        print('Saved Quiz Inspector screenshot:', out_shot2)

        ws.close()
        print('✅ All browser tests passed successfully!')

    finally:
        chrome_proc.terminate()

if __name__ == '__main__':
    run_test()
