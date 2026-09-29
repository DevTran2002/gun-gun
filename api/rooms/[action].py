"""Vercel serverless adapter for the multiplayer room service.

The local game uses ``server.py``; this adapter exposes the same room API when
the static game is deployed to Vercel. Vercel may create more than one worker,
so this in-memory relay is intended for small play sessions rather than
durable matchmaking.
"""

import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

from rooms import RoomError, RoomService


ROOMS = RoomService()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 524288:
                raise RoomError('Yêu cầu quá lớn hoặc rỗng.', 413)
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise RoomError('Cần JSON.', 415)
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise RoomError('Dữ liệu không hợp lệ.', 400)
            action = urlparse(self.path).path.rstrip('/').split('/')[-1]
            response = ROOMS.handle(action, payload)
            self.send_json(200, response)
        except RoomError as exc:
            self.send_json(exc.status, {'error': str(exc)})
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {'error': 'Dữ liệu không hợp lệ.'})
        except Exception:
            self.send_json(500, {'error': 'Máy chủ phòng gặp lỗi tạm thời.'})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, status, value):
        body = json.dumps(value, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        return
