import http.server
import socketserver
import os
import json
import socket
from rooms import RoomService, RoomError

PORT = int(os.environ.get('PORT', '8080'))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
ROOMS = RoomService()

class GameHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def guess_type(self, path):
        if path.endswith('.glb'):
            return 'model/gltf-binary'
        if path.endswith('.ogg'):
            return 'audio/ogg'
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/rooms/health':
            self.send_json(200, {'service': 'zombie-arena-rooms', 'post': True, 'maxPlayers': 4})
            return
        super().do_GET()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 524288:
                raise RoomError('Yêu cầu quá lớn hoặc rỗng.', 413)
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise RoomError('Cần JSON.', 415)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict) or not self.path.startswith('/api/rooms/'):
                raise RoomError('Đường dẫn không hợp lệ.', 404)
            response = ROOMS.handle(self.path.removeprefix('/api/rooms/'), data)
            self.send_json(200, response)
        except RoomError as exc:
            self.send_json(exc.status, {'error': str(exc)})
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {'error': 'Dữ liệu không hợp lệ.'})

    def send_json(self, status, value):
        body = json.dumps(value, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        if not self.path.startswith('/api/'):
            super().log_message(format, *args)

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    with ThreadedHTTPServer(('', PORT), GameHandler) as httpd:
        print(f'Server running multithreaded at http://localhost:{PORT}')
        for address in sorted(set(socket.gethostbyname_ex(socket.gethostname())[2])):
            if not address.startswith('127.'):
                print(f'LAN: http://{address}:{PORT} (same Wi-Fi, create/join a room)')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
