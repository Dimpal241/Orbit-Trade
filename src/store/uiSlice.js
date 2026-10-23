import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeTab: 'terminal', // 'terminal' | 'portfolio' | 'screener' | 'history'
    isMobileSidebarOpen: false,
    orderModal: {
      isOpen: false,
      type: 'BUY', // 'BUY' | 'SELL'
      symbol: 'NVDA',
    },
    toasts: [],
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.isMobileSidebarOpen = !state.isMobileSidebarOpen;
    },
    setMobileSidebar: (state, action) => {
      state.isMobileSidebarOpen = action.payload;
    },
    openOrderModal: (state, action) => {
      state.orderModal = {
        isOpen: true,
        type: action.payload.type || 'BUY',
        symbol: action.payload.symbol || 'NVDA',
      };
    },
    closeOrderModal: (state) => {
      state.orderModal.isOpen = false;
    },
    addToast: (state, action) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      state.toasts.push({
        id,
        type: action.payload.type || 'info', // 'success' | 'error' | 'info'
        title: action.payload.title,
        message: action.payload.message,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setActiveTab,
  toggleMobileSidebar,
  setMobileSidebar,
  openOrderModal,
  closeOrderModal,
  addToast,
  removeToast,
} = uiSlice.actions;

export const selectActiveTab = (state) => state.ui.activeTab;
export const selectIsMobileSidebarOpen = (state) => state.ui.isMobileSidebarOpen;
export const selectOrderModal = (state) => state.ui.orderModal;
export const selectToasts = (state) => state.ui.toasts;

export default uiSlice.reducer;
