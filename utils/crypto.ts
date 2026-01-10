import { RoomInfo } from '../types';

const GLOBAL_ROOM_ID = 'nexus-global-grid';

export function getRoomInfoFromHash(): RoomInfo | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return { roomId: GLOBAL_ROOM_ID, key: '' };

  const pairs = hash.split('&');
  let roomId = GLOBAL_ROOM_ID;

  for (const pair of pairs) {
    const [k, v] = pair.split('=');
    if (k === 'room') roomId = v;
  }

  return { roomId, key: '' };
}

export function generateRoomInfo(): RoomInfo {
  // We keep the option for custom room names in URL, but default is standard
  return { roomId: GLOBAL_ROOM_ID, key: '' };
}

export function updateHash(info: RoomInfo) {
  // Only update if it's not the default room to keep URL clean
  if (info.roomId === GLOBAL_ROOM_ID) {
    window.location.hash = '';
  } else {
    window.location.hash = `room=${info.roomId}`;
  }
}
