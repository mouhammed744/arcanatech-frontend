export type RfidReaderStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface RfidReader {
  id: string;
  serialNumber: string;
  status: RfidReaderStatus;
  lastPing: string;
  ipAddress: string;
  macAddress?: string;
  firmwareVersion: string;
  supportsNfc: boolean;
  supportsQr: boolean;
}

export type RoomType = 'lecture' | 'lab' | 'seminar' | 'amphitheater' | 'conference';

export interface Room {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  rfidReader?: RfidReader;
  isActive: boolean;
  equipment?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomDto {
  name: string;
  code: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  rfidReaderId?: string;
  equipment?: string[];
}

export interface UpdateRoomDto extends Partial<CreateRoomDto> {
  isActive?: boolean;
}
