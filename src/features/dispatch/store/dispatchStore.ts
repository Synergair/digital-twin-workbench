import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DispatchPriority = 'urgent' | 'high' | 'medium' | 'low';
export type DispatchStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type DispatchCategory = 'maintenance' | 'repair' | 'inspection' | 'cleaning' | 'security' | 'other';

export interface DispatchItem {
  id: string;
  propertyId: string;
  unitId: string | null;
  pinId: string | null;
  title: string;
  description: string;
  category: DispatchCategory;
  priority: DispatchPriority;
  status: DispatchStatus;
  assignedTo: string | null;
  assignedAt: string | null;
  scheduledFor: string | null;
  estimatedDuration: string | null;
  actualDuration: string | null;
  coordinates: { x: number; y: number; z: number } | null;
  photoUrls: string[];
  notes: DispatchNote[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface DispatchNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  type: 'comment' | 'status_change' | 'assignment' | 'system';
}

export interface DispatchFilter {
  status: DispatchStatus[];
  priority: DispatchPriority[];
  category: DispatchCategory[];
  propertyId: string | null;
  unitId: string | null;
  assignedTo: string | null;
  dateRange: { start: string | null; end: string | null };
}

interface DispatchState {
  dispatches: DispatchItem[];
  activeDispatchId: string | null;
  isCreating: boolean;
  filter: DispatchFilter;

  // Draft state for new dispatch creation
  draft: Partial<DispatchItem> | null;

  // Actions
  createDispatch: (dispatch: Omit<DispatchItem, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => string;
  updateDispatch: (id: string, updates: Partial<DispatchItem>) => void;
  deleteDispatch: (id: string) => void;
  setActiveDispatch: (id: string | null) => void;

  // Status workflow
  assignDispatch: (id: string, assignee: string) => void;
  startDispatch: (id: string) => void;
  completeDispatch: (id: string, actualDuration?: string) => void;
  cancelDispatch: (id: string, reason?: string) => void;

  // Notes and history
  addNote: (dispatchId: string, content: string, author: string, type?: DispatchNote['type']) => void;

  // Draft management
  setDraft: (draft: Partial<DispatchItem> | null) => void;
  clearDraft: () => void;

  // Filtering
  setFilter: (filter: Partial<DispatchFilter>) => void;
  resetFilter: () => void;

  // Queries
  getDispatchesByProperty: (propertyId: string) => DispatchItem[];
  getDispatchesByUnit: (unitId: string) => DispatchItem[];
  getDispatchHistory: (id: string) => DispatchNote[];
  getActiveDispatches: () => DispatchItem[];
}

const defaultFilter: DispatchFilter = {
  status: [],
  priority: [],
  category: [],
  propertyId: null,
  unitId: null,
  assignedTo: null,
  dateRange: { start: null, end: null },
};

const generateId = () => `dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateNoteId = () => `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useDispatchStore = create<DispatchState>()(
  persist(
    (set, get) => ({
      dispatches: [],
      activeDispatchId: null,
      isCreating: false,
      filter: defaultFilter,
      draft: null,

      createDispatch: (dispatchData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newDispatch: DispatchItem = {
          ...dispatchData,
          id,
          createdAt: now,
          updatedAt: now,
          notes: [
            {
              id: generateNoteId(),
              content: 'Dispatch created',
              author: dispatchData.createdBy,
              createdAt: now,
              type: 'system',
            },
          ],
        };

        set((state) => ({
          dispatches: [newDispatch, ...state.dispatches],
          draft: null,
        }));

        return id;
      },

      updateDispatch: (id, updates) => {
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      deleteDispatch: (id) => {
        set((state) => ({
          dispatches: state.dispatches.filter((d) => d.id !== id),
          activeDispatchId: state.activeDispatchId === id ? null : state.activeDispatchId,
        }));
      },

      setActiveDispatch: (id) => {
        set({ activeDispatchId: id });
      },

      assignDispatch: (id, assignee) => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === id
              ? {
                  ...d,
                  assignedTo: assignee,
                  assignedAt: now,
                  status: 'assigned' as DispatchStatus,
                  updatedAt: now,
                  notes: [
                    ...d.notes,
                    {
                      id: generateNoteId(),
                      content: `Assigned to ${assignee}`,
                      author: 'System',
                      createdAt: now,
                      type: 'assignment' as const,
                    },
                  ],
                }
              : d
          ),
        }));
      },

      startDispatch: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'in_progress' as DispatchStatus,
                  updatedAt: now,
                  notes: [
                    ...d.notes,
                    {
                      id: generateNoteId(),
                      content: 'Work started',
                      author: d.assignedTo ?? 'System',
                      createdAt: now,
                      type: 'status_change' as const,
                    },
                  ],
                }
              : d
          ),
        }));
      },

      completeDispatch: (id, actualDuration) => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'completed' as DispatchStatus,
                  completedAt: now,
                  actualDuration: actualDuration ?? d.actualDuration,
                  updatedAt: now,
                  notes: [
                    ...d.notes,
                    {
                      id: generateNoteId(),
                      content: `Completed${actualDuration ? ` (${actualDuration})` : ''}`,
                      author: d.assignedTo ?? 'System',
                      createdAt: now,
                      type: 'status_change' as const,
                    },
                  ],
                }
              : d
          ),
        }));
      },

      cancelDispatch: (id, reason) => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'cancelled' as DispatchStatus,
                  updatedAt: now,
                  notes: [
                    ...d.notes,
                    {
                      id: generateNoteId(),
                      content: `Cancelled${reason ? `: ${reason}` : ''}`,
                      author: 'System',
                      createdAt: now,
                      type: 'status_change' as const,
                    },
                  ],
                }
              : d
          ),
        }));
      },

      addNote: (dispatchId, content, author, type = 'comment') => {
        const now = new Date().toISOString();
        set((state) => ({
          dispatches: state.dispatches.map((d) =>
            d.id === dispatchId
              ? {
                  ...d,
                  updatedAt: now,
                  notes: [
                    ...d.notes,
                    {
                      id: generateNoteId(),
                      content,
                      author,
                      createdAt: now,
                      type,
                    },
                  ],
                }
              : d
          ),
        }));
      },

      setDraft: (draft) => {
        set({ draft });
      },

      clearDraft: () => {
        set({ draft: null });
      },

      setFilter: (filterUpdates) => {
        set((state) => ({
          filter: { ...state.filter, ...filterUpdates },
        }));
      },

      resetFilter: () => {
        set({ filter: defaultFilter });
      },

      getDispatchesByProperty: (propertyId) => {
        return get().dispatches.filter((d) => d.propertyId === propertyId);
      },

      getDispatchesByUnit: (unitId) => {
        return get().dispatches.filter((d) => d.unitId === unitId);
      },

      getDispatchHistory: (id) => {
        const dispatch = get().dispatches.find((d) => d.id === id);
        return dispatch?.notes ?? [];
      },

      getActiveDispatches: () => {
        return get().dispatches.filter(
          (d) => d.status === 'open' || d.status === 'assigned' || d.status === 'in_progress'
        );
      },
    }),
    {
      name: 'dispatch-storage-v1',
      partialize: (state) => ({
        dispatches: state.dispatches,
      }),
    }
  )
);
