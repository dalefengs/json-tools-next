import React, { useEffect, useRef, useState } from "react";
import { Button, cn, Select, SelectItem, Slider } from "@heroui/react";
import { Icon } from "@iconify/react";

import { useTabStore } from "@/store/useTabStore";

// 定义菜单位置类型
interface MenuPosition {
  x: number;
  y: number;
}

// 定义停靠位置类型
type DockPosition = "left" | "right" | "top" | "bottom" | null;

// 定义支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { id: "json", name: "JSON", icon: "vscode-icons:file-type-json" },
  { id: "json5", name: "JSON5", icon: "vscode-icons:file-type-json" },
  { id: "yaml", name: "YAML", icon: "vscode-icons:file-type-yaml" },
  { id: "xml", name: "XML", icon: "vscode-icons:file-type-xml" },
  { id: "toml", name: "TOML", icon: "vscode-icons:file-type-toml" },
  { id: "go", name: "Go", icon: "vscode-icons:file-type-go" },
  { id: "javascript", name: "JavaScript", icon: "vscode-icons:file-type-js-official" },
  { id: "typescript", name: "TypeScript", icon: "vscode-icons:file-type-typescript-official" },
  { id: "html", name: "HTML", icon: "vscode-icons:file-type-html" },
  { id: "css", name: "CSS", icon: "vscode-icons:file-type-css" },
  { id: "python", name: "Python", icon: "vscode-icons:file-type-python" },
  { id: "java", name: "Java", icon: "vscode-icons:file-type-java" },
  { id: "csharp", name: "C#", icon: "vscode-icons:file-type-csharp" },
  { id: "cpp", name: "C++", icon: "vscode-icons:file-type-cpp" },
  { id: "markdown", name: "Markdown", icon: "vscode-icons:file-type-markdown" },
  { id: "sql", name: "SQL", icon: "vscode-icons:file-type-sql" },
  { id: "shell", name: "Shell", icon: "vscode-icons:file-type-shell" },
];

interface DraggableMenuProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onLanguageChange: (language: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onReset: () => void;
  currentLanguage: string;
  currentFontSize: number;
  tabKey: string;
}

const DraggableMenu: React.FC<DraggableMenuProps> = ({
  containerRef,
  onLanguageChange,
  onFontSizeChange,
  onReset,
  currentLanguage,
  currentFontSize,
  tabKey,
}) => {
  const { updateEditorSettings } = useTabStore();
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dockedPosition, setDockedPosition] = useState<DockPosition>("right"); // 默认右侧停靠
  const [isHide, setIsHide] = useState(true);
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 保存拖动状态，避免状态更新引起的重渲染
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    dx: 0,
    dy: 0,
    animationFrameId: 0,
  });

  // 初始化位置到右下角，半隐藏
  useEffect(() => {
    if (containerRef.current && menuRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;

      // 计算位置：右下角，右侧隐藏一半
      const x = containerRect.width - menuWidth / 2;
      const y = containerRect.height - menuHeight - 80;

      setMenuPosition({ x, y });
      setDockedPosition("right");

      // 标记位置已计算完成，可以显示悬浮球
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsPositionCalculated(true);
        }, 300); // 添加较短的延迟，确保DOM更新完成
      });
    }
  }, [containerRef]);

  useEffect(() => {
    updateEditorSettings(tabKey, {
      fontSize: currentFontSize,
      language: currentLanguage,
    });
  }, [currentLanguage, currentFontSize]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && menuRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const menuWidth = menuRef.current.offsetWidth;
        const menuHeight = menuRef.current.offsetHeight;

        let x = menuPosition.x;
        let y = menuPosition.y;

        // 根据停靠位置调整
        if (dockedPosition === "right") {
          x = containerRect.width - menuWidth / 2;
        } else if (dockedPosition === "left") {
          x = -menuWidth / 2;
        } else if (dockedPosition === "bottom") {
          y = containerRect.height - menuHeight / 2;
        } else if (dockedPosition === "top") {
          y = -menuHeight / 2;
        } else {
          // 确保菜单不会完全移出容器
          x = Math.min(
            containerRect.width - menuWidth / 4,
            Math.max(0, menuPosition.x),
          );
          y = Math.min(
            containerRect.height - menuHeight / 2,
            Math.max(0, menuPosition.y),
          );
        }

        setMenuPosition({ x, y });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [menuPosition, containerRef, dockedPosition]);

  // 开始拖动
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setIsHide(false);

    // 记录初始位置
    dragStateRef.current.startX = clientX;
    dragStateRef.current.startY = clientY;
    dragStateRef.current.initialX = menuPosition.x;
    dragStateRef.current.initialY = menuPosition.y;

    // 使用DOM直接操作，避免状态更新
    if (menuRef.current) {
      menuRef.current.style.transition = "none";
    }
  };

  // 处理拖动中的移动
  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !menuRef.current || !containerRef.current) return;

    const { startX, startY } = dragStateRef.current;

    // 计算移动距离
    const dx = clientX - startX;
    const dy = clientY - startY;

    // 保存当前偏移量
    dragStateRef.current.dx = dx;
    dragStateRef.current.dy = dy;

    // 直接应用变换，不更新状态
    menuRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  // 使用requestAnimationFrame优化拖动性能
  const updateDragAnimation = () => {
    if (isDragging) {
      dragStateRef.current.animationFrameId =
        requestAnimationFrame(updateDragAnimation);
    }
  };

  // 确定最近的边缘
  const determineClosestEdge = (x: number, y: number): DockPosition => {
    if (!containerRef.current || !menuRef.current) return "right";

    const containerRect = containerRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;

    // 计算到各边的距离
    const distToLeft = x;
    const distToRight = containerRect.width - (x + menuWidth);
    const distToTop = y;
    const distToBottom = containerRect.height - (y + menuHeight);

    // 找出最小距离对应的边
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) return "left";
    if (minDist === distToRight) return "right";
    if (minDist === distToTop) return "top";

    return "bottom";
  };

  // 结束拖动 - 贴边并半隐藏
  const finishDrag = () => {
    if (!isDragging || !menuRef.current || !containerRef.current) return;

    cancelAnimationFrame(dragStateRef.current.animationFrameId);

    const { initialX, initialY, dx, dy } = dragStateRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;

    // 计算中间位置
    let newX = initialX + dx;
    let newY = initialY + dy;

    // 确定最近的边缘
    const closestEdge = determineClosestEdge(newX, newY);

    // 根据最近的边缘调整位置（半隐藏）
    if (closestEdge === "left") {
      newX = -menuWidth / 2;
      newY = Math.min(containerRect.height - menuHeight, Math.max(0, newY));
    } else if (closestEdge === "right") {
      newX = containerRect.width - menuWidth / 2;
      newY = Math.min(containerRect.height - menuHeight, Math.max(0, newY));
    } else if (closestEdge === "top") {
      newX = Math.min(containerRect.width - menuWidth, Math.max(0, newX));
      newY = -menuHeight / 2;
    } else if (closestEdge === "bottom") {
      newX = Math.min(containerRect.width - menuWidth, Math.max(0, newX));
      newY = containerRect.height - menuHeight / 2;
    }

    // 使用FLIP技术避免弹跳
    // 1. 记录当前视觉位置
    const firstRect = menuRef.current.getBoundingClientRect();

    // 2. 立即更新实际位置（不带动画）
    menuRef.current.style.transition = "none";
    menuRef.current.style.transform = "";
    menuRef.current.style.left = `${newX}px`;
    menuRef.current.style.top = `${newY}px`;

    // 强制浏览器重新计算布局
    void menuRef.current.offsetWidth;

    // 3. 计算调整后的位置与之前视觉位置的差异
    const lastRect = menuRef.current.getBoundingClientRect();
    const diffX = firstRect.left - lastRect.left;
    const diffY = firstRect.top - lastRect.top;

    // 4. 应用反向变换，使元素保持在原来的视觉位置
    menuRef.current.style.transform = `translate(${diffX}px, ${diffY}px)`;

    // 强制浏览器重新计算布局
    void menuRef.current.offsetWidth;

    // 5. 平滑过渡到最终位置（包括贴边的变换）
    const dockTransform = getDockTransform(closestEdge);

    menuRef.current.style.transition = "transform 0.3s ease";
    menuRef.current.style.transform = dockTransform;

    // 保存位置到 store
    updateEditorSettings(tabKey, {
      fontSize: currentFontSize,
      language: currentLanguage,
    });

    // 更新状态
    setMenuPosition({ x: newX, y: newY });
    setDockedPosition(closestEdge);
    setIsDragging(false);

    // 动画结束后移除过渡效果但保持变换
    const onTransitionEnd = () => {
      if (menuRef.current) {
        menuRef.current.style.transition = "";
      }
    };

    menuRef.current.addEventListener("transitionend", onTransitionEnd, {
      once: true,
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 监听全局鼠标事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      finishDrag();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp);

      // 启动动画帧
      dragStateRef.current.animationFrameId =
        requestAnimationFrame(updateDragAnimation);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        cancelAnimationFrame(dragStateRef.current.animationFrameId);
      };
    }

    return undefined;
  }, [isDragging]);

  // 点击菜单外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // 计算当悬浮球停靠时的变换
  const getDockTransform = (position: DockPosition = dockedPosition) => {
    if (!position || isDragging) return "";

    // 鼠标悬停时不应用变换
    if (isHide) return "";

    if (position === "left") return "translateX(50%)";
    if (position === "right") return "translateX(-50%)";
    if (position === "top") return "translateY(50%)";
    if (position === "bottom") return "translateY(-50%)";

    return "";
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50",
        "transition-all duration-500 ease-in-out",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        transition: isDragging
          ? "none"
          : "left 0.3s ease, top 0.3s ease, transform 0.3s ease, opacity 0.5s ease-in-out",
        transform: getDockTransform(),
        opacity: isPositionCalculated ? 1 : 0,
        visibility: isPositionCalculated ? "visible" : "hidden",
      }}
      onMouseEnter={() => {
        if (dockedPosition) {
          setIsHide(false);
        }
      }}
      onMouseLeave={() => {
        setIsHide(true);
        setIsMenuOpen(false);
      }}
    >
      {/* 拖动手柄区域 */}
      <div
        aria-label="拖动设置菜单"
        className={cn("absolute -top-3 -left-3 -right-3 -bottom-3 cursor-grab")}
        role="button"
        style={{
          touchAction: "none",
          zIndex: -1,
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
      />

      {/* 菜单按钮 */}
      <div
        ref={buttonRef}
        aria-expanded={isMenuOpen}
        aria-label="打开设置菜单"
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-full shadow-lg cursor-pointer",
          "bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 border-none",
          "transform transition-all duration-300 hover:scale-110",
          "ring-2 ring-white/50 hover:ring-white/80 dark:ring-blue-400/50 dark:hover:ring-blue-400/80",
          isMenuOpen ? "rotate-180" : "",
        )}
        role="button"
        tabIndex={0}
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMenu();
          }
        }}
      >
        <Icon
          aria-hidden="true"
          className="text-white w-5 h-5"
          icon="heroicons:cog-6-tooth"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        />
      </div>

      {/* 菜单面板 */}
      <div
        aria-label="编辑器设置菜单"
        className={cn(
          "absolute bg-white dark:bg-default-100/80 rounded-lg shadow-xl p-6 w-72 transition-all duration-300",
          isMenuOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        )}
        role="dialog"
        style={{
          bottom: "calc(100% + 8px)",
          right: 0,
          transformOrigin: "bottom right",
        }}
      >
        <div className="flex flex-col space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="language-select"
            >
              编辑器语言
            </label>
            <Select
              aria-label="选择编程语言"
              id="language-select"
              selectedKeys={[currentLanguage]}
              size="sm"
              className="w-full"
              color="primary"
              variant="faded"
              startContent={
                <Icon
                  className="mr-1 text-primary"
                  icon={SUPPORTED_LANGUAGES.find((lang) => lang.id === currentLanguage)?.icon || ""}
                  width={18}
                />
              }
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  aria-label={lang.name}
                  startContent={<Icon className="mr-2" icon={lang.icon} width={18} />}
                >
                  {lang.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="font-size-slider"
            >
              字体大小: {currentFontSize}px
            </label>
            <Slider
              aria-label="调整字体大小"
              className="w-full"
              id="font-size-slider"
              maxValue={24}
              minValue={12}
              size="sm"
              step={1}
              value={currentFontSize}
              onChange={(value) => onFontSizeChange(value as number)}
            />
          </div>

          <Button
            aria-label="重置设置"
            color="primary"
            size="sm"
            startContent={
              <Icon aria-hidden="true" icon="heroicons:arrow-path" width={16} />
            }
            onPress={onReset}
          >
            重置设置
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraggableMenu;
