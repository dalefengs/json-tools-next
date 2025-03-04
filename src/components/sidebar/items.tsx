import { type SidebarItem } from "./sidebar";

/**
 * Please check the https://nextui.org/docs/guide/routing to have a seamless router integration
 */

export enum SidebarKeys {
  textView = "textView",
  treeView = "treeView",
  diffView = "diffView",
  toolbox = "toolbox",
}

export const items: SidebarItem[] = [
  {
    key: SidebarKeys.textView,
    icon: "solar:home-2-linear",
    title: "文本视图",
  },
  {
    key: SidebarKeys.treeView,
    icon: "solar:widget-2-outline",
    title: "树形视图",
  },
  {
    key: SidebarKeys.diffView,
    icon: "solar:checklist-minimalistic-outline",
    title: "DIFF视图",
  },
  {
    key: SidebarKeys.toolbox,
    href: "./toolbox",
    icon: "solar:box-outline",
    title: "工具箱",
  },
];
