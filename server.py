import os
import sys
import json
import re
import gzip
import mimetypes
import urllib.request
import urllib.error
import http.server
import webbrowser
import threading
from urllib.parse import urlparse, parse_qs, quote

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

COMPRESSIBLE_MIME_MAP = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml; charset=utf-8',
}

LOCAL_ORIGIN_RE = re.compile(r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$', re.IGNORECASE)
MAX_POST_BODY_BYTES = 65536


def extract_channel_id(raw_input):
    if not raw_input:
        return ''
    raw_input = str(raw_input).strip()
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
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, format, *args):
        # Safe logging that never throws and masks sensitive cookie credentials
        try:
            msg = format % args
            msg = re.sub(r'(nidAuth|nidSes|NID_AUT|NID_SES)=[^&\s;]+', r'\1=***', msg)
            if sys.stderr:
                sys.stderr.write("%s - - [%s] %s\n" %
                                 (self.address_string(),
                                  self.log_date_time_string(),
                                  msg))
        except Exception:
            pass

    def _get_allowed_origin(self):
        origin = (self.headers.get('Origin') or '').strip() if self.headers else ''
        if not origin:
            return None
        if LOCAL_ORIGIN_RE.match(origin):
            return origin
        # In cloud deployments, also allow same-host origin
        if os.environ.get('PORT'):
            try:
                host_hdr = (self.headers.get('Host') or '').strip().lower()
                if host_hdr and urlparse(origin).netloc.lower() == host_hdr:
                    return origin
            except Exception:
                pass
        return None

    def _accepts_gzip(self):
        ae = (self.headers.get('Accept-Encoding') or '') if self.headers else ''
        return 'gzip' in ae.lower()

    def end_headers(self):
        allowed_origin = self._get_allowed_origin()
        if allowed_origin:
            self.send_header('Access-Control-Allow-Origin', allowed_origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Chzzk-Auth, X-Chzzk-Ses')

        parsed_path = urlparse(getattr(self, 'path', '') or '/').path.lower()
        if parsed_path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif parsed_path in ('', '/', '/index.html'):
            self.send_header('Cache-Control', 'no-cache')
        elif parsed_path.startswith(('/battle_anims/', '/pokemon/', '/items/')):
            self.send_header('Cache-Control', 'public, max-age=86400')
        elif parsed_path.endswith(('.js', '.css', '.json', '.png', '.svg', '.ico', '.webp', '.wav', '.mp3', '.m4a')):
            self.send_header('Cache-Control', 'public, max-age=3600')

        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _extract_credentials(self, qs, body_dict=None):
        body_dict = body_dict if isinstance(body_dict, dict) else {}
        raw_channel_id = str(
            body_dict.get('channelId')
            or qs.get('channelId', [''])[0]
            or ''
        )
        nid_auth = str(
            body_dict.get('nidAuth')
            or (self.headers.get('X-Chzzk-Auth') if self.headers else '')
            or qs.get('nidAuth', [''])[0]
            or ''
        ).strip()
        nid_ses = str(
            body_dict.get('nidSes')
            or (self.headers.get('X-Chzzk-Ses') if self.headers else '')
            or qs.get('nidSes', [''])[0]
            or ''
        ).strip()
        return raw_channel_id, nid_auth, nid_ses

    def _build_api_headers(self, nid_auth='', nid_ses=''):
        api_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
        if nid_auth and nid_ses:
            api_headers['Cookie'] = f"NID_AUT={nid_auth}; NID_SES={nid_ses}"
        return api_headers

    def _handle_search(self, keyword):
        if not keyword:
            self.send_json({'channels': []})
            return

        search_url = f"https://api.chzzk.naver.com/service/v1/search/channels?keyword={quote(keyword)}&offset=0&size=30"
        api_headers = self._build_api_headers()
        try:
            req = urllib.request.Request(search_url, headers=api_headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                search_res = json.loads(resp.read().decode('utf-8')) or {}

            raw_items = (search_res.get('content') or {}).get('data') or []
            channels = []
            for item in raw_items:
                if not isinstance(item, dict):
                    continue
                ch = item.get('channel') or {}
                if ch and ch.get('channelId'):
                    channels.append({
                        'channelId': ch.get('channelId'),
                        'channelName': ch.get('channelName', ''),
                        'channelImageUrl': ch.get('channelImageUrl', ''),
                        'followerCount': int(ch.get('followerCount', 0) or 0),
                        'openLive': bool(ch.get('openLive', False)),
                        'verifiedMark': bool(ch.get('verifiedMark', False))
                    })

            channels.sort(key=lambda x: x.get('followerCount', 0), reverse=True)
            self.send_json({'channels': channels})
        except Exception as e:
            self.send_json({'error': f'채널 검색 오류: {str(e)}', 'channels': []}, status=500)

    def _handle_live_status(self, raw_channel_id, nid_auth, nid_ses):
        channel_id = extract_channel_id(raw_channel_id)
        if not channel_id:
            self.send_json({'error': '유효한 채널 ID가 필요합니다.'}, status=400)
            return

        api_headers = self._build_api_headers(nid_auth, nid_ses)
        try:
            poll_url = f"https://api.chzzk.naver.com/polling/v2/channels/{channel_id}/live-status"
            req = urllib.request.Request(poll_url, headers=api_headers)
            try:
                with urllib.request.urlopen(req, timeout=6) as resp:
                    poll_data = json.loads(resp.read().decode('utf-8')) or {}
            except Exception:
                detail_url = f"https://api.chzzk.naver.com/service/v2/channels/{channel_id}/live-detail"
                req2 = urllib.request.Request(detail_url, headers=api_headers)
                with urllib.request.urlopen(req2, timeout=6) as resp2:
                    poll_data = json.loads(resp2.read().decode('utf-8')) or {}

            content_obj = poll_data.get('content') or {}
            channel_obj = content_obj.get('channel') or {}
            status_str = str(content_obj.get('status', 'CLOSE') or 'CLOSE').upper()
            concurrent = int(content_obj.get('concurrentUserCount', 0) or 0)
            open_live = bool(content_obj.get('openLive') or channel_obj.get('openLive'))
            is_live = (
                (status_str in ['OPEN', 'LIVE', 'STARTED'])
                or (status_str != 'CLOSE' and (open_live or concurrent > 0))
            )
            self.send_json({
                'isLive': is_live,
                'status': status_str,
                'liveTitle': content_obj.get('liveTitle', ''),
                'concurrentUserCount': concurrent,
                'channelName': channel_obj.get('channelName', ''),
                'channelImageUrl': channel_obj.get('channelImageUrl', '')
            })
        except urllib.error.HTTPError as he:
            if he.code in (400, 404):
                self.send_json({'error': '올바르지 않은 채널 ID이거나 방송 정보를 찾을 수 없습니다.', 'isLive': False, 'isAdult': False}, status=he.code)
                return
            self.send_json({'error': f'상태 조회 오류 ({he.code})', 'isLive': False}, status=he.code)
        except Exception as e:
            self.send_json({'error': f'상태 조회 오류: {str(e)}', 'isLive': False}, status=500)

    def _handle_channel_detail(self, raw_channel_id, nid_auth, nid_ses):
        channel_id = extract_channel_id(raw_channel_id)
        if not channel_id:
            self.send_json({'error': '유효한 채널 ID 또는 방송 URL을 입력해주세요.', 'isAdult': False}, status=400)
            return

        api_headers = self._build_api_headers(nid_auth, nid_ses)
        try:
            detail_url = f"https://api.chzzk.naver.com/service/v2/channels/{channel_id}/live-detail"
            req = urllib.request.Request(detail_url, headers=api_headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    detail_data = json.loads(resp.read().decode('utf-8')) or {}
            except urllib.error.HTTPError as he:
                err_body = ''
                err_json = {}
                try:
                    err_body = he.read().decode('utf-8', errors='ignore')
                    err_json = json.loads(err_body) if err_body else {}
                except Exception:
                    err_json = {}
                err_code = err_json.get('code') if isinstance(err_json, dict) else None
                err_msg = str(err_json.get('message', '') or '') if isinstance(err_json, dict) else ''
                if he.code == 403 or err_code == 4001 or '연령' in err_msg or '성인' in err_msg:
                    self.send_json({
                        'error': '🔞 19세(연령 제한) 방송입니다. 방송 연결 창 하단의 [19세 방송 설정]에 NID_AUT와 NID_SES 쿠키를 입력해주세요.',
                        'isAdult': True
                    }, status=403)
                    return
                if he.code in (400, 404):
                    self.send_json({
                        'error': '올바르지 않은 채널 ID이거나 방송 정보를 찾을 수 없습니다.',
                        'isAdult': False
                    }, status=he.code)
                    return
                raise he

            res_code = detail_data.get('code')
            res_msg = str(detail_data.get('message', '') or '')
            content_obj = detail_data.get('content') or {}
            channel_obj = content_obj.get('channel') or {}

            if res_code == 4001 or '연령' in res_msg or '성인' in res_msg:
                self.send_json({
                    'error': '🔞 19세(연령 제한) 방송입니다. 방송 연결 창 하단의 [19세 방송 설정]에 NID_AUT와 NID_SES 쿠키를 입력해주세요.',
                    'isAdult': True
                }, status=403)
                return

            chat_cid = content_obj.get('chatChannelId')
            status_str = str(content_obj.get('status', 'CLOSE') or 'CLOSE').upper()
            concurrent_user_count = int(content_obj.get('concurrentUserCount', 0) or 0)
            open_live = bool(content_obj.get('openLive') or channel_obj.get('openLive'))
            is_live = (
                (status_str in ['OPEN', 'LIVE', 'STARTED'])
                or (status_str != 'CLOSE' and (open_live or concurrent_user_count > 0))
            )
            live_title = content_obj.get('liveTitle', '')
            channel_name = channel_obj.get('channelName', '')
            category = content_obj.get('liveCategoryValue', '')
            open_date = content_obj.get('openDate', '')
            channel_image = channel_obj.get('channelImageUrl', '')

            if not chat_cid:
                try:
                    chan_url = f"https://api.chzzk.naver.com/service/v1/channels/{channel_id}"
                    c_req = urllib.request.Request(chan_url, headers=api_headers)
                    with urllib.request.urlopen(c_req, timeout=10) as c_resp:
                        chan_data = json.loads(c_resp.read().decode('utf-8')) or {}
                        chan_content = chan_data.get('content') or {}
                        channel_name = chan_content.get('channelName', channel_name)
                        channel_image = chan_content.get('channelImageUrl', channel_image)
                except Exception:
                    pass

            if not chat_cid:
                self.send_json({'error': '채팅 채널 ID를 찾을 수 없습니다. 올바른 치지직 채널인지 확인해 주세요.', 'isAdult': False}, status=404)
                return

            token_url = f"https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chat_cid}&chatType=STREAMING"
            t_req = urllib.request.Request(token_url, headers=api_headers)
            with urllib.request.urlopen(t_req, timeout=10) as t_resp:
                token_data = json.loads(t_resp.read().decode('utf-8')) or {}

            token_content = token_data.get('content') or {}
            access_token = token_content.get('accessToken')
            extra_token = token_content.get('extraToken')

            res_payload = {
                'channelId': channel_id,
                'chatChannelId': chat_cid,
                'channelName': channel_name or '치지직 방송',
                'liveTitle': live_title,
                'status': status_str,
                'isLive': is_live,
                'concurrentUserCount': concurrent_user_count,
                'category': category,
                'openDate': open_date,
                'channelImageUrl': channel_image,
                'accessToken': access_token,
                'extraToken': extra_token,
                'isAdult': bool(content_obj.get('adult', False))
            }
            self.send_json(res_payload)
        except urllib.error.HTTPError as he:
            self.send_json({'error': f'치지직 API 호출 오류 ({he.code})', 'isAdult': False}, status=he.code)
        except Exception as e:
            self.send_json({'error': f'서버 통신 오류: {str(e)}', 'isAdult': False}, status=500)

    def do_POST(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith('/api/chzzk/'):
            self.send_json({'error': '지원하지 않는 POST 엔드포인트입니다.'}, status=404)
            return

        try:
            content_len = int(self.headers.get('Content-Length', '0') or 0)
        except ValueError:
            self.send_json({'error': '잘못된 Content-Length 헤더입니다.'}, status=400)
            return

        if content_len < 0 or content_len > MAX_POST_BODY_BYTES:
            self.send_json({'error': '요청 본문 크기가 허용 범위를 초과했습니다.'}, status=413)
            return

        body_dict = {}
        if content_len > 0:
            try:
                raw_body = self.rfile.read(content_len).decode('utf-8')
                parsed_json = json.loads(raw_body)
                if isinstance(parsed_json, dict):
                    body_dict = parsed_json
            except Exception:
                self.send_json({'error': '유효한 JSON 요청 본문이 필요합니다.'}, status=400)
                return

        qs = parse_qs(parsed.query)
        raw_channel_id, nid_auth, nid_ses = self._extract_credentials(qs, body_dict)

        if parsed.path.startswith('/api/chzzk/live-status'):
            self._handle_live_status(raw_channel_id, nid_auth, nid_ses)
            return
        elif parsed.path.startswith('/api/chzzk/'):
            self._handle_channel_detail(raw_channel_id, nid_auth, nid_ses)
            return

    def _try_serve_gzip_static(self, req_path):
        if not self._accepts_gzip():
            return False

        fs_path = self.translate_path(req_path)
        if os.path.isdir(fs_path):
            index_candidate = os.path.join(fs_path, 'index.html')
            if os.path.isfile(index_candidate):
                fs_path = index_candidate
            else:
                return False

        web_root_abs = os.path.abspath(WEB_DIR)
        file_abs = os.path.abspath(fs_path)
        if os.path.commonpath([web_root_abs, file_abs]) != web_root_abs:
            return False
        if not os.path.isfile(file_abs):
            return False

        _, ext = os.path.splitext(file_abs)
        ext_lower = ext.lower()
        if ext_lower not in COMPRESSIBLE_MIME_MAP:
            return False

        try:
            file_size = os.path.getsize(file_abs)
            if file_size <= 1024:
                return False
            with open(file_abs, 'rb') as f:
                raw_bytes = f.read()
            gz_bytes = gzip.compress(raw_bytes, compresslevel=6)
            ctype = COMPRESSIBLE_MIME_MAP.get(ext_lower) or mimetypes.guess_type(file_abs)[0] or 'application/octet-stream'

            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Vary', 'Accept-Encoding')
            self.send_header('Content-Length', str(len(gz_bytes)))
            self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(file_abs)))
            self.end_headers()
            self.wfile.write(gz_bytes)
            return True
        except Exception:
            return False

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        if parsed.path.startswith('/api/chzzk/search'):
            keyword = qs.get('keyword', [''])[0].strip()
            self._handle_search(keyword)
            return

        elif parsed.path.startswith('/api/chzzk/live-status'):
            raw_channel_id, nid_auth, nid_ses = self._extract_credentials(qs, None)
            self._handle_live_status(raw_channel_id, nid_auth, nid_ses)
            return

        elif parsed.path.startswith('/api/chzzk/'):
            raw_channel_id, nid_auth, nid_ses = self._extract_credentials(qs, None)
            self._handle_channel_detail(raw_channel_id, nid_auth, nid_ses)
            return

        if self._try_serve_gzip_static(parsed.path):
            return

        return super().do_GET()

    def send_json(self, data, status=200):
        raw_content = json.dumps(data, ensure_ascii=False).encode('utf-8')
        use_gzip = self._accepts_gzip() and len(raw_content) > 512
        content = gzip.compress(raw_content, compresslevel=6) if use_gzip else raw_content

        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        if use_gzip:
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Vary', 'Accept-Encoding')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def find_available_port(start_port=8000, max_attempts=50, host='127.0.0.1'):
    import socket
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, p))
                return p
            except OSError:
                continue
    return start_port


class ReusableThreadingServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    is_cloud = bool(os.environ.get('PORT'))
    bind_host = '' if is_cloud else '127.0.0.1'
    port = DEFAULT_PORT if is_cloud else find_available_port(DEFAULT_PORT, host=bind_host)
    server_address = (bind_host, port)

    print(f"==================================================")
    print(f" 🚀 치지직 대규모 시청자 추첨 & 룰렛 & 배틀 플랫폼이 시작되었습니다!")
    print(f" 👉 주소: http://{bind_host or '0.0.0.0'}:{port}")
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
