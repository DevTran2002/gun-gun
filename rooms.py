"""Small LAN room relay. The room host runs the shared combat simulation."""
import math
import secrets
import string
import threading
import time


class RoomError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class RoomService:
    def __init__(self, clock=time.monotonic):
        self.rooms = {}
        self.lock = threading.RLock()
        self.clock = clock

    def member(self, name):
        name = str(name).strip()[:24] or 'Đồng đội'
        return dict(id=secrets.token_hex(6), token=secrets.token_urlsafe(24), name=name,
                    seen=self.clock(), input={}, seq=0)

    def clean(self):
        now = self.clock()
        for code, room in list(self.rooms.items()):
            for pid, player in list(room['players'].items()):
                if now - player['seen'] > 15:
                    del room['players'][pid]
            if room['host'] not in room['players']:
                del self.rooms[code]

    def authorize(self, data):
        room = self.rooms.get(str(data.get('code', '')).upper())
        if not room:
            raise RoomError('Phòng đã đóng hoặc mã phòng không đúng.', 404)
        player = next((p for p in room['players'].values() if secrets.compare_digest(p['token'], str(data.get('token', '')))), None)
        if not player:
            raise RoomError('Không có quyền vào phòng này.', 403)
        player['seen'] = self.clock()
        return room, player

    def public(self, room, player):
        return dict(code=room['code'], host=room['host'], you=player['id'], started=room['started'],
                    epoch=room['epoch'], players=[dict(id=p['id'], name=p['name']) for p in room['players'].values()],
                    snapshot=room['snapshot'],
                    inputs={p['id']: p['input'] for p in room['players'].values()} if player['id'] == room['host'] else {},
                    commands=list(room['commands']) if player['id'] == room['host'] else [])

    def handle(self, action, data):
        with self.lock:
            self.clean()
            if action == 'create':
                if len(self.rooms) >= 50:
                    raise RoomError('Máy chủ đã đủ phòng.', 429)
                alphabet = string.ascii_uppercase + string.digits
                code = ''.join(secrets.choice(alphabet) for _ in range(6))
                while code in self.rooms:
                    code = ''.join(secrets.choice(alphabet) for _ in range(6))
                player = self.member(data.get('name', ''))
                room = dict(code=code, host=player['id'], players={player['id']: player}, started=False,
                            snapshot=None, epoch=0, commands=[], next_command=1)
                self.rooms[code] = room
                return {**self.public(room, player), 'token': player['token']}
            if action == 'join':
                room = self.rooms.get(str(data.get('code', '')).strip().upper())
                if not room:
                    raise RoomError('Không tìm thấy phòng. Kiểm tra mã 6 ký tự.', 404)
                if room['started']:
                    raise RoomError('Trận đã bắt đầu. Hãy chờ chủ phòng tạo trận mới.', 409)
                if len(room['players']) >= 4:
                    raise RoomError('Phòng đã đủ 4 người.', 409)
                player = self.member(data.get('name', ''))
                room['players'][player['id']] = player
                return {**self.public(room, player), 'token': player['token']}
            room, player = self.authorize(data)
            is_host = room['host'] == player['id']
            if action == 'leave':
                if is_host:
                    del self.rooms[room['code']]
                else:
                    del room['players'][player['id']]
                return {'left': True}
            if action == 'start':
                if not is_host:
                    raise RoomError('Chỉ chủ phòng được bắt đầu trận.', 403)
                if len(room['players']) < 2:
                    raise RoomError('Cần ít nhất 2 người để bắt đầu.', 409)
                if room['started'] and (room['snapshot'] or {}).get('state') != 'GAMEOVER':
                    raise RoomError('Trận đang diễn ra.', 409)
                room.update(started=True, epoch=room['epoch'] + 1, snapshot=None, commands=[])
                for member in room['players'].values():
                    member['input'] = {}
                return self.public(room, player)
            if action != 'sync':
                raise RoomError('Yêu cầu không hợp lệ.', 404)
            incoming = data.get('input')
            if isinstance(incoming, dict):
                pos = incoming.get('position')
                aim = incoming.get('aim')
                valid = (isinstance(pos, list) and len(pos) == 3 and
                         all(isinstance(n, (int, float)) and math.isfinite(n) for n in pos) and
                         abs(pos[0]) <= 109 and abs(pos[2]) <= 109 and 0 <= pos[1] <= 5 and
                         isinstance(aim, (int, float)) and math.isfinite(aim))
                if valid:
                    player['input'] = dict(position=pos, aim=aim, revive=bool(incoming.get('revive')), moving=bool(incoming.get('moving')))
            if is_host:
                ack = data.get('ack', 0)
                if isinstance(ack, int):
                    room['commands'] = [c for c in room['commands'] if c['id'] > ack]
                snapshot = data.get('snapshot')
                if isinstance(snapshot, dict) and data.get('epoch') == room['epoch']:
                    room['snapshot'] = snapshot
            else:
                commands = data.get('commands', [])
                if not isinstance(commands, list) or len(commands) > 30:
                    raise RoomError('Quá nhiều thao tác.', 429)
                for command in commands:
                    if not isinstance(command, dict):
                        continue
                    seq = command.get('seq', 0)
                    if not isinstance(seq, int) or seq <= player['seq']:
                        continue
                    if command.get('type') not in ('shoot', 'reload', 'switch'):
                        continue
                    if len(room['commands']) >= 300:
                        raise RoomError('Chủ phòng phản hồi chậm.', 429)
                    player['seq'] = seq
                    room['commands'].append(dict(id=room['next_command'], player=player['id'], command=command))
                    room['next_command'] += 1
            return self.public(room, player)
