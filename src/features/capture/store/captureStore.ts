import { create } from 'zustand';

export type CaptureMethod = 'video' | 'photos' | 'lidar' | 'floorplan' | 'ifc';
export type CaptureStatus = 'idle' | 'setup' | 'capturing' | 'reviewing' | 'uploading' | 'processing' | 'complete' | 'failed';
export type RoomStatus = 'pending' | 'capturing' | 'complete' | 'skipped';
export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'hallway' | 'office' | 'other';

export interface CaptureRoom {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  coverage: number;
  photoCount: number;
  videoSegmentUrl?: string;
  estimatedArea?: number;
}

export interface CapturePhoto {
  id: string;
  roomId: string;
  timestamp: string;
  blob: Blob;
  thumbnailUrl: string;
  qualityScore: number;
  metadata: {
    deviceOrientation: { alpha: number; beta: number; gamma: number };
    lightLevel: number;
    isBlurry: boolean;
  };
}

export interface QualityIssue {
  type: 'blur' | 'darkness' | 'motion' | 'incomplete' | 'obstruction';
  severity: 'warning' | 'error';
  message: string;
  roomId?: string;
  timestamp: string;
}

export interface ProcessingStage {
  stage: 'queued' | 'validating' | 'extracting_frames' | 'reconstructing_3d' | 'detecting_rooms' | 'extracting_floorplan' | 'merging_model' | 'scoring_quality' | 'complete' | 'failed' | 'manual_review';
  progress: number;
  message: string;
}

export interface CaptureSession {
  id: string;
  propertyId: string;
  unitId: string | null;
  captureMethod: CaptureMethod;
  status: CaptureStatus;
  rooms: CaptureRoom[];
  currentRoomIndex: number;
  overallCoverage: number;
  qualityScore: number;
  qualityIssues: QualityIssue[];
  photos: CapturePhoto[];
  videoChunks: Blob[];
  uploadProgress: number;
  processingStage: ProcessingStage | null;
  createdAt: string;
  completedAt: string | null;
}

interface CaptureState {
  // Active session
  session: CaptureSession | null;

  // Camera state
  cameraStream: MediaStream | null;
  cameraError: string | null;
  isRecording: boolean;

  // Real-time quality
  currentQuality: {
    isBlurry: boolean;
    isDark: boolean;
    hasExcessiveMotion: boolean;
    lightLevel: number;
    overallScore: number;
  };

  // Device sensors
  deviceOrientation: { alpha: number; beta: number; gamma: number } | null;

  // Coverage tracking
  coverageAngles: number[]; // 360 bins for angular coverage

  // WebSocket connection
  wsConnected: boolean;

  // Actions - Session management
  startSession: (propertyId: string, unitId: string | null, method: CaptureMethod) => void;
  addRoom: (name: string, type: RoomType) => void;
  removeRoom: (roomId: string) => void;
  setCurrentRoom: (index: number) => void;
  skipCurrentRoom: () => void;
  completeCurrentRoom: () => void;
  cancelSession: () => void;

  // Actions - Capture
  startCapture: () => void;
  stopCapture: () => void;
  capturePhoto: () => void;
  addVideoChunk: (chunk: Blob) => void;

  // Actions - Camera
  setCameraStream: (stream: MediaStream | null) => void;
  setCameraError: (error: string | null) => void;

  // Actions - Quality
  updateQuality: (quality: Partial<CaptureState['currentQuality']>) => void;
  addQualityIssue: (issue: Omit<QualityIssue, 'timestamp'>) => void;

  // Actions - Coverage
  updateCoverage: (angle: number) => void;
  resetCoverage: () => void;

  // Actions - Device sensors
  updateDeviceOrientation: (orientation: CaptureState['deviceOrientation']) => void;

  // Actions - Upload & Processing
  setStatus: (status: CaptureStatus) => void;
  setUploadProgress: (progress: number) => void;
  setProcessingStage: (stage: ProcessingStage | null) => void;
  setWsConnected: (connected: boolean) => void;

  // Actions - Photo management
  addPhoto: (photo: Omit<CapturePhoto, 'id' | 'timestamp'>) => void;
  removePhoto: (photoId: string) => void;

  // Computed
  getCurrentRoom: () => CaptureRoom | null;
  getCompletedRoomsCount: () => number;
  getOverallCoverage: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useCaptureStore = create<CaptureState>((set, get) => ({
  // Initial state
  session: null,
  cameraStream: null,
  cameraError: null,
  isRecording: false,
  currentQuality: {
    isBlurry: false,
    isDark: false,
    hasExcessiveMotion: false,
    lightLevel: 1.0,
    overallScore: 100,
  },
  deviceOrientation: null,
  coverageAngles: new Array(360).fill(0),
  wsConnected: false,

  // Session management
  startSession: (propertyId, unitId, method) => {
    set({
      session: {
        id: generateId(),
        propertyId,
        unitId,
        captureMethod: method,
        status: 'setup',
        rooms: [],
        currentRoomIndex: 0,
        overallCoverage: 0,
        qualityScore: 0,
        qualityIssues: [],
        photos: [],
        videoChunks: [],
        uploadProgress: 0,
        processingStage: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      coverageAngles: new Array(360).fill(0),
    });
  },

  addRoom: (name, type) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          rooms: [
            ...state.session.rooms,
            {
              id: generateId(),
              name,
              type,
              status: 'pending',
              coverage: 0,
              photoCount: 0,
            },
          ],
        },
      };
    });
  },

  removeRoom: (roomId) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          rooms: state.session.rooms.filter((r) => r.id !== roomId),
        },
      };
    });
  },

  setCurrentRoom: (index) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: { ...state.session, currentRoomIndex: index },
        coverageAngles: new Array(360).fill(0), // Reset coverage for new room
      };
    });
  },

  skipCurrentRoom: () => {
    set((state) => {
      if (!state.session) return state;
      const rooms = [...state.session.rooms];
      const currentIndex = state.session.currentRoomIndex;
      if (rooms[currentIndex]) {
        rooms[currentIndex] = { ...rooms[currentIndex], status: 'skipped' };
      }
      return {
        session: {
          ...state.session,
          rooms,
          currentRoomIndex: Math.min(currentIndex + 1, rooms.length - 1),
        },
        coverageAngles: new Array(360).fill(0),
      };
    });
  },

  completeCurrentRoom: () => {
    set((state) => {
      if (!state.session) return state;
      const rooms = [...state.session.rooms];
      const currentIndex = state.session.currentRoomIndex;
      if (rooms[currentIndex]) {
        rooms[currentIndex] = {
          ...rooms[currentIndex],
          status: 'complete',
          coverage: get().getOverallCoverage(),
        };
      }
      const nextIndex = currentIndex + 1;
      const allComplete = rooms.every((r) => r.status === 'complete' || r.status === 'skipped');

      return {
        session: {
          ...state.session,
          rooms,
          currentRoomIndex: Math.min(nextIndex, rooms.length - 1),
          status: allComplete ? 'reviewing' : state.session.status,
        },
        coverageAngles: new Array(360).fill(0),
      };
    });
  },

  cancelSession: () => {
    const stream = get().cameraStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    set({
      session: null,
      cameraStream: null,
      isRecording: false,
      coverageAngles: new Array(360).fill(0),
    });
  },

  // Capture actions
  startCapture: () => {
    set((state) => {
      if (!state.session) return state;
      const rooms = [...state.session.rooms];
      const currentIndex = state.session.currentRoomIndex;
      if (rooms[currentIndex]) {
        rooms[currentIndex] = { ...rooms[currentIndex], status: 'capturing' };
      }
      return {
        isRecording: true,
        session: { ...state.session, rooms, status: 'capturing' },
      };
    });
  },

  stopCapture: () => {
    set({ isRecording: false });
  },

  capturePhoto: () => {
    // This would be called with actual photo data from the camera hook
    // Implementation handled by useCameraStream hook
  },

  addVideoChunk: (chunk) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          videoChunks: [...state.session.videoChunks, chunk],
        },
      };
    });
  },

  // Camera actions
  setCameraStream: (stream) => set({ cameraStream: stream, cameraError: null }),
  setCameraError: (error) => set({ cameraError: error, cameraStream: null }),

  // Quality actions
  updateQuality: (quality) => {
    set((state) => ({
      currentQuality: { ...state.currentQuality, ...quality },
    }));
  },

  addQualityIssue: (issue) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          qualityIssues: [
            ...state.session.qualityIssues,
            { ...issue, timestamp: new Date().toISOString() },
          ],
        },
      };
    });
  },

  // Coverage actions
  updateCoverage: (angle) => {
    set((state) => {
      const newAngles = [...state.coverageAngles];
      const normalizedAngle = Math.floor(((angle % 360) + 360) % 360);
      // Mark this angle and adjacent angles as covered
      for (let i = -5; i <= 5; i++) {
        const idx = (normalizedAngle + i + 360) % 360;
        newAngles[idx] = Math.min(newAngles[idx] + 1, 10);
      }
      return { coverageAngles: newAngles };
    });
  },

  resetCoverage: () => {
    set({ coverageAngles: new Array(360).fill(0) });
  },

  // Device sensor actions
  updateDeviceOrientation: (orientation) => {
    set({ deviceOrientation: orientation });
    if (orientation?.alpha !== undefined) {
      get().updateCoverage(orientation.alpha);
    }
  },

  // Upload & Processing actions
  setStatus: (status) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          status,
          completedAt: status === 'complete' ? new Date().toISOString() : state.session.completedAt,
        },
      };
    });
  },

  setUploadProgress: (progress) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: { ...state.session, uploadProgress: progress },
      };
    });
  },

  setProcessingStage: (stage) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: { ...state.session, processingStage: stage },
      };
    });
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),

  // Photo management
  addPhoto: (photoData) => {
    set((state) => {
      if (!state.session) return state;
      const photo: CapturePhoto = {
        ...photoData,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };

      // Update room photo count
      const rooms = [...state.session.rooms];
      const roomIndex = rooms.findIndex((r) => r.id === photoData.roomId);
      if (roomIndex >= 0) {
        rooms[roomIndex] = {
          ...rooms[roomIndex],
          photoCount: rooms[roomIndex].photoCount + 1,
        };
      }

      return {
        session: {
          ...state.session,
          photos: [...state.session.photos, photo],
          rooms,
        },
      };
    });
  },

  removePhoto: (photoId) => {
    set((state) => {
      if (!state.session) return state;
      const photo = state.session.photos.find((p) => p.id === photoId);
      if (!photo) return state;

      // Update room photo count
      const rooms = [...state.session.rooms];
      const roomIndex = rooms.findIndex((r) => r.id === photo.roomId);
      if (roomIndex >= 0) {
        rooms[roomIndex] = {
          ...rooms[roomIndex],
          photoCount: Math.max(0, rooms[roomIndex].photoCount - 1),
        };
      }

      return {
        session: {
          ...state.session,
          photos: state.session.photos.filter((p) => p.id !== photoId),
          rooms,
        },
      };
    });
  },

  // Computed values
  getCurrentRoom: () => {
    const state = get();
    if (!state.session) return null;
    return state.session.rooms[state.session.currentRoomIndex] || null;
  },

  getCompletedRoomsCount: () => {
    const state = get();
    if (!state.session) return 0;
    return state.session.rooms.filter((r) => r.status === 'complete').length;
  },

  getOverallCoverage: () => {
    const state = get();
    const coveredAngles = state.coverageAngles.filter((v) => v > 0).length;
    return Math.round((coveredAngles / 360) * 100);
  },
}));

export default useCaptureStore;
