import os
import sys
import json
import urllib.request
import urllib.error
import http.server
import socketserver
import webbrowser
import threading
from urllib.parse import urlparse, parse_qs

PORT = 8000

# Base directory for static files (supports PyInstaller onefile bundle)
if getattr(sys, 'frozen', False):
    BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WEB_DIR = os.path.join(BASE_DIR, 'public')

class ChzzkProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        
        # Proxy Chzzk API requests to avoid browser CORS issues
        if parsed.path.startswith('/api/chzzk/'):
            qs = parse_qs(parsed.query)
            channel_id = qs.get('channelId', [''])[0]
            
            if not channel_id:
                self.send_json({'error': 'Missing channelId'}, status=400)
                return

            try:
                # 1. Fetch live detail
                detail_url = f"https://api.chzzk.naver.com/service/v2/channels/{channel_id}/live-detail"
                req = urllib.request.Request(detail_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req) as resp:
                    detail_data = json.loads(resp.read().decode('utf-8'))

                chat_cid = detail_data.get('content', {}).get('chatChannelId')
                status = detail_data.get('content', {}).get('status')
                live_title = detail_data.get('content', {}).get('liveTitle', '')
                channel_name = detail_data.get('content', {}).get('channel', {}).get('channelName', '')
                concurrent_user_count = detail_data.get('content', {}).get('concurrentUserCount', 0)

                if not chat_cid:
                    self.send_json({'error': '채팅 채널 ID를 찾을 수 없습니다. 방송 중인지 확인해 주세요.'}, status=404)
                    return

                # 2. Fetch chat access token
                token_url = f"https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chat_cid}&chatType=STREAMING"
                t_req = urllib.request.Request(token_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(t_req) as t_resp:
                    token_data = json.loads(t_resp.read().decode('utf-8'))

                access_token = token_data.get('content', {}).get('accessToken')
                extra_token = token_data.get('content', {}).get('extraToken')

                res_payload = {
                    'channelId': channel_id,
                    'chatChannelId': chat_cid,
                    'channelName': channel_name,
                    'liveTitle': live_title,
                    'status': status,
                    'concurrentUserCount': concurrent_user_count,
                    'accessToken': access_token,
                    'extraToken': extra_token
                }
                self.send_json(res_payload)
            except Exception as e:
                self.send_json({'error': str(e)}, status=500)
            return

        return super().do_GET()

    def send_json(self, data, status=200):
        content = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

if __name__ == '__main__':
    server_address = ('', PORT)
    print(f"==================================================")
    print(f" 🚀 치지직 대규모 시청자 추첨 앱 서버가 실행되었습니다!")
    print(f" 👉 브라우저 주소: http://localhost:{PORT}")
    print(f"==================================================")
    
    # Automatically open browser window
    threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()

    with socketserver.TCPServer(server_address, ChzzkProxyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.")
            sys.exit(0)
