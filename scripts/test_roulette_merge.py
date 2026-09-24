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

PORT = 18942
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
    cdp_port = 9242
    user_data = os.path.abspath('scratch_chrome_user_data_roulette')

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

        # Dismiss welcome screen
        eval_js("enterWorkspaceOffline()")
        time.sleep(0.5)

        # 1. Check toggle existence
        has_toggle = eval_js("!!document.getElementById('donationMergeDuplicateToggle')")
        print('Toggle exists:', has_toggle)
        assert has_toggle, "donationMergeDuplicateToggle not found in DOM"

        # 2. Switch to Roulette tab & donation mode
        eval_js("switchMainTab('roulette')")
        eval_js("switchRouletteMode('donation')")
        eval_js("isRouletteDonationCollecting = true") # allow live donations collection

        # 3. Simulate donations: 2x '치킨', 1x '피자'
        eval_js("""
            handleLiveDonation('시청자1', '치킨', 'u1', 1000, '12:00:01');
            handleLiveDonation('시청자2', '치킨', 'u2', 3000, '12:00:02');
            handleLiveDonation('시청자3', '피자', 'u3', 2000, '12:00:03');
        """)

        # 4. Test with merge toggle ON
        items_merged = eval_js("getActiveRouletteItems()")
        print("Merged items count:", len(items_merged))
        print("Merged items:", [(it['text'], it['weight'], it.get('count')) for it in items_merged])
        assert len(items_merged) == 2, f"Expected 2 merged items, got {len(items_merged)}"
        chicken = next(it for it in items_merged if '치킨' in it['text'])
        pizza = next(it for it in items_merged if '피자' in it['text'])
        assert chicken['count'] == 2, f"Expected chicken count 2, got {chicken['count']}"
        assert chicken['weight'] == 4, f"Expected chicken weight 4 (1+3), got {chicken['weight']}"
        assert pizza['count'] == 1, f"Expected pizza count 1, got {pizza['count']}"
        assert pizza['weight'] == 2, f"Expected pizza weight 2, got {pizza['weight']}"

        # 5. Test with merge toggle OFF
        eval_js("document.getElementById('donationMergeDuplicateToggle').checked = false; drawRouletteWheel();")
        items_unmerged = eval_js("getActiveRouletteItems()")
        print("Unmerged items count:", len(items_unmerged))
        assert len(items_unmerged) == 3, f"Expected 3 unmerged items, got {len(items_unmerged)}"

        # 6. Turn merge toggle back ON
        eval_js("document.getElementById('donationMergeDuplicateToggle').checked = true; drawRouletteWheel();")
        items_merged_again = eval_js("getActiveRouletteItems()")
        assert len(items_merged_again) == 2, "Expected 2 items after re-enabling merge"

        # 7. Test removing winning item (simulate chicken winning)
        winning_chicken = next(it for it in items_merged_again if '치킨' in it['text'])
        eval_js(f"removeWinningItem(getActiveRouletteItems().find(it => it.text === '{winning_chicken['text']}'))")
        
        items_after_remove = eval_js("getActiveRouletteItems()")
        print("Items after removing 1 chicken:", [(it['text'], it['weight'], it.get('count')) for it in items_after_remove])
        assert len(items_after_remove) == 2, "Both chicken and pizza should still exist (1 chicken remaining)"
        chicken_left = next(it for it in items_after_remove if '치킨' in it['text'])
        assert chicken_left['count'] == 1, f"Expected 1 chicken left, got {chicken_left['count']}"

        # 7.5. Capture Wheel View
        eval_js("drawRouletteWheel()")
        time.sleep(0.5)
        shot_wheel = send_cmd('Page.captureScreenshot', {'format': 'png'})
        img_wheel_bytes = base64.b64decode(shot_wheel['data'])
        with open(os.path.join(ARTIFACT_DIR, 'roulette_wheel_merged_view.png'), 'wb') as f:
            f.write(img_wheel_bytes)
        with open(r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\docs\images\roulette_wheel_merged_view.png', 'wb') as f:
            f.write(img_wheel_bytes)

        # 8. Open Settings Drawer to inspect UI visually
        eval_js("openSettingsDrawer('roulette')")
        eval_js("switchRouletteMode('donation')")
        time.sleep(1)

        # 9. Take screenshot
        shot_res = send_cmd('Page.captureScreenshot', {'format': 'png'})
        img_bytes = base64.b64decode(shot_res['data'])
        out_path = os.path.join(ARTIFACT_DIR, 'roulette_cheese_merge_verified.png')
        with open(out_path, 'wb') as f:
            f.write(img_bytes)
        print('Screenshot saved to:', out_path)

        # Also save to docs/images for release notes
        docs_img_path = r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\docs\images\roulette_cheese_merge_verified.png'
        with open(docs_img_path, 'wb') as f:
            f.write(img_bytes)
        print('Screenshot copied to docs/images:', docs_img_path)

        print('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n')

    finally:
        chrome_proc.terminate()
        httpd.shutdown()

if __name__ == '__main__':
    run_test()
