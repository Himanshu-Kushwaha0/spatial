
export type ElementType = 'text' | 'image' | 'doodle' | 'voice' | 'video' | 'file' | 'ai-chat' | 'poll';

export interface SpatialElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  content: string; 
  timestamp: number;
  author: string;
  authorId: string; 
  recipientId?: string; 
  color?: string; 
  isEphemeral?: boolean; 
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    totalChunks?: number;
    aspectRatio?: string;
    imageSize?: string;
    isAiGenerated?: boolean;
    prompt?: string;
    groundingUrls?: Array<{ title: string; uri: string }>;
    isRainbow?: boolean;
    isGhost?: boolean;
    isNeon?: boolean;
    width?: number;
    height?: number;
    pollOptions?: string[];
    votes?: Record<string, number>; // clientId -> optionIndex
  };
}

export interface CursorState {
  x: number;
  y: number;
  name: string;
  color: string;
}

export interface RoomInfo {
  roomId: string;
  key: string;
}

export interface OnlineUser {
  clientId: string;
  name: string;
  color: string;
}
