import { RoomInfo } from '../types';

/**
 * GLOBAL_WORLD_ID: The immutable coordinate for the spatial nexus.
 * All nodes globally must target this exact string to achieve mesh convergence.
 */
const GLOBAL_WORLD_ID = 'spatial-hub-v3-universal-mesh-relay-2025-core';

export const getRoomInfoFromHash = (): RoomInfo => ({
  roomId: GLOBAL_WORLD_ID,
  key: ''
});

export const generateRoomInfo = (): RoomInfo => ({
  roomId: GLOBAL_WORLD_ID,
  key: ''
});

export const updateHash = (info: RoomInfo): void => {
  if (window.location.hash !== '') {
    window.history.replaceState(null, '', ' ');
  }
};
