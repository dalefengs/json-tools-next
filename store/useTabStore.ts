// useTabStore.ts
import { create } from "zustand";

export interface TabItem {
  key: string;
  title: string;
  content: string;
  closable?: boolean;
}

interface TabStore {
  tabs: TabItem[];
  activeTabKey: string;
  nextKey: number;
  activeTab: () => TabItem;
  getTabByKey: (key: string) => TabItem | undefined;
  addTab: () => void;
  closeTab: (keyToRemove: string) => void;
  setActiveTab: (key: string) => void;
  renameTab: (key: string, newTitle: string) => void;
  closeOtherTabs: (currentKey: string) => void;
  closeLeftTabs: (currentKey: string) => void;
  closeRightTabs: (currentKey: string) => void;
  closeAllTabs: () => void;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [{ key: "1", title: "New Tab 1", content: "首页内容", closable: true }],
  activeTabKey: "1",
  nextKey: 2,
  activeTab: () => {
    const activeTab = get().tabs.find(
      (tab) => tab.key === get().activeTabKey,
      );

    return activeTab || get().tabs[0];
  },
  getTabByKey: (key: string) => get().tabs.find((tab) => tab.key === key),
  addTab: () =>
    set((state) => {
      const newTabKey = `${state.nextKey}`;
      const newTab: TabItem = {
        key: `${state.nextKey}`,
        title: `New Tab ${newTabKey}`,
        content: `New Tab ${newTabKey} 的内容`,
        closable: true,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabKey: newTabKey,
        nextKey: state.nextKey + 1,
      };
    }),
  renameTab: (key: string, newTitle: string) =>
    set((state) => {
      // 不允许重命名为空
      if (!newTitle.trim()) return state;

      const updatedTabs = state.tabs.map((tab) =>
        tab.key === key ? { ...tab, title: newTitle.trim() } : tab,
      );

      return { tabs: updatedTabs };
    }),
  closeTab: (keyToRemove) => {
    if (get().tabs.length === 1) {
      get().closeAllTabs();

      return;
    }

    set((state) => {
      const updatedTabs = state.tabs.filter((tab) => tab.key !== keyToRemove);
      const newActiveTab =
        keyToRemove === state.activeTabKey
          ? updatedTabs[updatedTabs.length - 1]?.key || "1"
          : state.activeTabKey;

      return { tabs: updatedTabs, activeTabKey: newActiveTab };
    });
  },
  setActiveTab: (key) => set({ activeTabKey: key }),
  // 关闭其他标签页
  closeOtherTabs: (currentKey) =>
    set((state) => {
      const currentTab = state.tabs.find((tab) => tab.key === currentKey);

      return {
        tabs: currentTab ? [currentTab] : [],
        activeTabKey: currentKey,
      };
    }),

  // 关闭左侧标签页
  closeLeftTabs: (currentKey) =>
    set((state) => {
      const currentIndex = state.tabs.findIndex(
        (tab) => tab.key === currentKey,
      );
      const updatedTabs = state.tabs.slice(currentIndex);

      return {
        tabs: updatedTabs,
        activeTabKey: currentKey,
      };
    }),

  // 关闭右侧标签页
  closeRightTabs: (currentKey) =>
    set((state) => {
      const currentIndex = state.tabs.findIndex(
        (tab) => tab.key === currentKey,
      );
      const updatedTabs = state.tabs.slice(0, currentIndex + 1);

      return {
        tabs: updatedTabs,
        activeTabKey: currentKey,
      };
    }),
  // 关闭所有标签页，默认保留第一个标签页
  closeAllTabs: () =>
    set((state) => {
      const defaultTab = [
        { key: "1", title: "New Tab 1", content: "首页内容", closable: true },
      ];

      return {
        tabs: defaultTab,
        activeTabKey: "1",
        nextKey: 2,
      };
    }),
}));
