
import { RoomInfo } from '../types';

/**
 * GLOBAL_WORLD_ID: The immutable coordinate for the spatial nexus.
 * All nodes globally target this exact string to achieve 100% mesh convergence.
 * Changing this string creates a parallel universe.
 */
const GLOBAL_WORLD_ID = 'nexus-prime-universal-v4-2025-mesh';

export const getRoomInfoFromHash = (): RoomInfo => ({
  roomId: GLOBAL_WORLD_ID,
  key: 'nexus-secure-auth'
});

export const generateRoomInfo = (): RoomInfo => ({
  roomId: GLOBAL_WORLD_ID,
  key: 'nexus-secure-auth'
});

export const updateHash = (info: RoomInfo): void => {
  // We keep the URL clean to prevent browser tracking/leaks
  if (window.location.hash !== '') {
    window.history.replaceState(null, '', ' ');
  }
};
