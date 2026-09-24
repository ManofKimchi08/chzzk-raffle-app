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

PORT = 18944
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
    cdp_port = 9244
    user_data = os.path.abspath('scratch_chrome_user_data_collapse')

    chrome_proc = subprocess.Popen([
        chrome_bin,
        '--headless=new',
        '--window-size=1440,1050',
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
            ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params}))
            while True:
                resp = json.loads(ws.recv())
                if resp.get('id') == msg_id:
                    return resp.get('result', {})

        def eval_js(expr):
            res = send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
            if 'exceptionDetails' in res:
                print('JS EXCEPTION:', res['exceptionDetails'])
            return res.get('result', {}).get('value')

        send_cmd('Page.enable')
        send_cmd('Runtime.enable')

        time.sleep(1)

        # 1. Dismiss welcome screen and open drawer to roulette tab
        eval_js("enterWorkspaceOffline()")
        time.sleep(0.5)
        eval_js("openSettingsDrawer('roulette')")
        eval_js("switchRouletteMode('donation')")
        time.sleep(0.5)

        # 2. Check existence of all collapsible cards
        config_card = eval_js("!!document.getElementById('rouletteDonationConfigCard')")
        feed_card = eval_js("!!document.getElementById('rouletteDonationFeedCard')")
        spin_card = eval_js("!!document.getElementById('rouletteSpinOptionsCard')")
        history_card = eval_js("!!document.getElementById('rouletteHistoryCard')")
        print("Cards exist:", {
            "config_card": config_card,
            "feed_card": feed_card,
            "spin_card": spin_card,
            "history_card": history_card
        })
        assert all([config_card, feed_card, spin_card, history_card]), "All collapsible cards must exist"

        # 3. Simulate winning history with long viewer messages (similar to user's screenshot)
        eval_js("""
            rouletteHistory = [
                {
                    round: 3,
                    text: 'ㄴㄴ 여자들 여자인거 안들키려고 ㅈ같은 닉 지음 탐켄치프렌치키스 이딴거',
                    time: '오후 7:34:20'
                },
                {
                    round: 2,
                    text: '치킨 1마리 기프티콘 🍗 (x2 후원 합산)',
                    time: '오후 7:32:15'
                },
                {
                    round: 1,
                    text: '윤진석꺼 <- 이런 식으로 남친이 지어주는 경우 있음',
                    time: '오후 7:30:40'
                }
            ];
            renderRouletteHistory();
        """)
        time.sleep(0.5)

        # 4. Take Screenshot 1: All sections open
        shot1 = send_cmd('Page.captureScreenshot', {'format': 'png'})
        img1 = base64.b64decode(shot1['data'])
        out1 = os.path.join(ARTIFACT_DIR, 'roulette_drawer_all_expanded.png')
        with open(out1, 'wb') as f:
            f.write(img1)
        with open(r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\docs\images\roulette_drawer_all_expanded.png', 'wb') as f:
            f.write(img1)
        print("Screenshot 1 saved (all expanded)")

        # 5. Test toggling collapse on config card and spin options card
        eval_js("toggleDrawerCardSection('rouletteDonationConfigCard')")
        is_config_collapsed = eval_js("document.getElementById('rouletteDonationConfigCard').classList.contains('collapsed')")
        print("Config card collapsed:", is_config_collapsed)
        assert is_config_collapsed, "Config card should be collapsed"

        eval_js("toggleDrawerCardSection('rouletteSpinOptionsCard')")
        is_spin_collapsed = eval_js("document.getElementById('rouletteSpinOptionsCard').classList.contains('collapsed')")
        print("Spin options card collapsed:", is_spin_collapsed)
        assert is_spin_collapsed, "Spin options card should be collapsed"

        time.sleep(0.5)

        # 6. Take Screenshot 2: Options collapsed, history taking center stage
        shot2 = send_cmd('Page.captureScreenshot', {'format': 'png'})
        img2 = base64.b64decode(shot2['data'])
        out2 = os.path.join(ARTIFACT_DIR, 'roulette_drawer_collapsed_history_prominent.png')
        with open(out2, 'wb') as f:
            f.write(img2)
        with open(r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\docs\images\roulette_drawer_collapsed_history_prominent.png', 'wb') as f:
            f.write(img2)
        print("Screenshot 2 saved (options collapsed, history prominent)")

        # 7. Test re-expanding
        eval_js("toggleDrawerCardSection('rouletteDonationConfigCard')")
        is_config_collapsed_now = eval_js("document.getElementById('rouletteDonationConfigCard').classList.contains('collapsed')")
        assert not is_config_collapsed_now, "Config card should re-expand"

        print('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n')

    finally:
        chrome_proc.terminate()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
