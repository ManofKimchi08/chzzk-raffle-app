import os
import sys
import json
import re
import urllib.request
import urllib.error
import http.server
import webbrowser
import threading
from urllib.parse import urlparse, parse_qs

# Prevent Windows noconsole stdout/stderr NoneType crashes
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w')

DEFAULT_PORT = int(os.environ.get('PORT', 8000))

# Base directory for static files (supports PyInstaller onefile bundle)
if getattr(sys, 'frozen', False):
    BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

candidate_web_dir = os.path.join(BASE_DIR, 'public')
if os.path.exists(candidate_web_dir):
    WEB_DIR = candidate_web_dir
else:
    WEB_DIR = BASE_DIR

def extract_channel_id(raw_input):
    if not raw_input:
        return ''
    raw_input = raw_input.strip()
    # 32-character hex ID (standard Chzzk channel ID)
    hex_match = re.search(r'[a-fA-F0-9]{32}', raw_input)
    if hex_match:
        return hex_match.group(0)
    # URL path match
    url_match = re.search(r'chzzk\.naver\.com/(?:live/)?([a-zA-Z0-9]+)', raw_input)
    if url_match:
        return url_match.group(1)
    return re.sub(r'[^a-zA-Z0-9]', '', raw_input)

class ChzzkProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, format, *args):
        # Safe logging that never throws if stderr is redirected/closed
        try:
            if sys.stderr:
                sys.stderr.write("%s - - [%s] %s\n" %
                                 (self.address_string(),
                                  self.log_date_time_string(),
                                  format % args))
        except Exception:
            pass

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
            raw_channel_id = qs.get('channelId', [''])[0]
            channel_id = extract_channel_id(raw_channel_id)
            
            if not channel_id:
                self.send_json({'error': '유효한 채널 ID 또는 방송 URL을 입력해주세요.'}, status=400)
                return

            try:
                # 1. Fetch live detail
                detail_url = f"https://api.chzzk.naver.com/service/v2/channels/{channel_id}/live-detail"
                req = urllib.request.Request(detail_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    detail_data = json.loads(resp.read().decode('utf-8'))

                content_obj = detail_data.get('content', {})
                chat_cid = content_obj.get('chatChannelId')
                status = content_obj.get('status', 'CLOSE')
                is_live = (status == 'OPEN')
                live_title = content_obj.get('liveTitle', '')
                channel_name = content_obj.get('channel', {}).get('channelName', '')
                concurrent_user_count = content_obj.get('concurrentUserCount', 0)
                category = content_obj.get('liveCategoryValue', '')
                open_date = content_obj.get('openDate', '')
                channel_image = content_obj.get('channel', {}).get('channelImageUrl', '')

                # Fallback if chatChannelId is missing from live-detail
                if not chat_cid:
                    try:
                        chan_url = f"https://api.chzzk.naver.com/service/v1/channels/{channel_id}"
                        c_req = urllib.request.Request(chan_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                        with urllib.request.urlopen(c_req, timeout=10) as c_resp:
                            chan_data = json.loads(c_resp.read().decode('utf-8'))
                            channel_name = chan_data.get('content', {}).get('channelName', channel_name)
                            channel_image = chan_data.get('content', {}).get('channelImageUrl', channel_image)
                    except Exception:
                        pass

                if not chat_cid:
                    self.send_json({'error': '채팅 채널 ID를 찾을 수 없습니다. 올바른 치지직 채널인지 확인해 주세요.'}, status=404)
                    return

                # 2. Fetch chat access token
                token_url = f"https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chat_cid}&chatType=STREAMING"
                t_req = urllib.request.Request(token_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(t_req, timeout=10) as t_resp:
                    token_data = json.loads(t_resp.read().decode('utf-8'))

                access_token = token_data.get('content', {}).get('accessToken')
                extra_token = token_data.get('content', {}).get('extraToken')

                res_payload = {
                    'channelId': channel_id,
                    'chatChannelId': chat_cid,
                    'channelName': channel_name or '치지직 방송',
                    'liveTitle': live_title,
                    'status': status,
                    'isLive': is_live,
                    'concurrentUserCount': concurrent_user_count,
                    'category': category,
                    'openDate': open_date,
                    'channelImageUrl': channel_image,
                    'accessToken': access_token,
                    'extraToken': extra_token
                }
                self.send_json(res_payload)
            except urllib.error.HTTPError as he:
                self.send_json({'error': f'치지직 API 호출 오류 ({he.code})'}, status=he.code)
            except Exception as e:
                self.send_json({'error': f'서버 통신 오류: {str(e)}'}, status=500)
            return

        return super().do_GET()

    def send_json(self, data, status=200):
        content = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

def find_available_port(start_port=8000, max_attempts=50):
    import socket
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', p))
                return p
            except OSError:
                continue
    return start_port

class ReusableThreadingServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    is_cloud = bool(os.environ.get('PORT'))
    port = DEFAULT_PORT if is_cloud else find_available_port(DEFAULT_PORT)
    server_address = ('', port)
    
    print(f"==================================================")
    print(f" 🚀 치지직 대규모 시청자 추첨 & 룰렛 & 배틀 플랫폼이 시작되었습니다!")
    print(f" 👉 포트(Port): {port}")
    print(f"==================================================")
    
    # Automatically open browser window in local environment
    if not is_cloud:
        threading.Timer(0.8, lambda: webbrowser.open(f'http://localhost:{port}')).start()

    with ReusableThreadingServer(server_address, ChzzkProxyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.")
            sys.exit(0)
