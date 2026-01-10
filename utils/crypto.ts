import { RoomInfo } from '../types';

// The Single Source of Truth for the Open World Mesh
const GLOBAL_WORLD_ID = 'spatial-hub-central-nexus-core-v2';

export function getRoomInfoFromHash(): RoomInfo {
  // We ignore the URL hash entirely to ensure NO sub-groups can be created.
  // Everyone is forced into the same global grid.
  return { roomId: GLOBAL_WORLD_ID, key: '' };
}

export function generateRoomInfo(): RoomInfo {
  return { roomId: GLOBAL_WORLD_ID, key: '' };
}

export function updateHash(info: RoomInfo) {
  // We keep the hash empty to maintain the "Open World" aesthetic.
  window.location.hash = '';
}
