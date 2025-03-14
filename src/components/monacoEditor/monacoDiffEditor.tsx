import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { cn } from "@heroui/react";
import { editor } from "monaco-editor";

import toast from "@/utils/toast";
import { MonacoDiffEditorEditorType } from "@/components/monacoEditor/monacoEntity";
import { sortJson } from "@/utils/json";
import { useTabStore } from "@/store/useTabStore";
import DraggableMenu from "@/components/monacoEditor/draggableMenu";

import "@/styles/monaco.css";

export interface MonacoDiffEditorProps {
  tabKey: string;
  height?: number | string;
  originalValue: string;
  modifiedValue: string;
  language?: string;
  theme?: string;
  onUpdateOriginalValue: (value: string) => void;
  onUpdateModifiedValue?: (value: string) => void;
  onMount?: () => void;

  ref?: React.Ref<MonacoDiffEditorRef>;
}

export interface MonacoDiffEditorRef {
  focus: () => void;
  layout: () => void;
  copy: (type: MonacoDiffEditorEditorType) => boolean;
  format: (type: MonacoDiffEditorEditorType) => boolean;
  clear: (type: MonacoDiffEditorEditorType) => boolean;
  fieldSort: (
    type: MonacoDiffEditorEditorType,
    sort: "asc" | "desc",
  ) => boolean;
  updateOriginalValue: (value: string) => void;
  updateModifiedValue: (value: string) => void;
}

const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  originalValue,
  modifiedValue,
  language,
  theme,
  height,
  tabKey,
  onUpdateOriginalValue,
  onUpdateModifiedValue,
  onMount,
  ref,
}) => {
  const { getTabByKey } = useTabStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const originalEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const modifiedEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 从 store 获取当前 tab 的设置
  const currentTab = getTabByKey(tabKey);
  const editorSettings = currentTab?.editorSettings || {
    fontSize: 14,
    language: language || "json",
  };

  // 菜单状态
  const [currentLanguage, setCurrentLanguage] = useState(
    editorSettings.language,
  );
  const [fontSize, setFontSize] = useState(editorSettings.fontSize);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [height]);

  useEffect(() => {
    if (editorRef.current) {
      const options: editor.IStandaloneDiffEditorConstructionOptions = {
        theme: theme,
      };

      editorRef.current.updateOptions(options);
    }
  }, [theme]);


  // 监听字体大小变化
  useEffect(() => {
    updateEditorOptions({
      fontSize: fontSize,
    });
  }, [fontSize]);

  // 监听语言变化
  useEffect(() => {
    if (originalEditorRef.current && modifiedEditorRef.current) {
      const originalModel = originalEditorRef.current.getModel();
      const modifiedModel = modifiedEditorRef.current.getModel();

      if (originalModel && modifiedModel) {
        monaco.editor.setModelLanguage(originalModel, currentLanguage);
        monaco.editor.setModelLanguage(modifiedModel, currentLanguage);
      }
    }
  }, [currentLanguage]);

  // 添加窗口大小变化监听器
  useEffect(() => {
    // 使用 setTimeout 确保在 React 严格模式下只执行一次
    const timeoutId = setTimeout(() => {
      createDiffEditor();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // 如果编辑器已经创建，则销毁
      if (editorRef.current) {
        // editorRef.current?.dispose();
      }
    };
  }, []); // 空依赖数组确保只在挂载时执行

  // 创建差异编辑器实例
  async function createDiffEditor() {
    // const settings = await storage.getItem<SettingsState>("settings");

    // if (settings?.monacoEditorCDN == "cdn") {
    //   loader.config({
    //     paths: {
    //       vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs",
    //     },
    //   });
    //   loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });
    // } else {
    //   loader.config({ monaco });
    // }
    loader.config({ monaco });

    loader.init().then((monacoInstance) => {
      if (editorContainerRef.current) {
        // 创建差异编辑器
        editorRef.current = monacoInstance.editor.createDiffEditor(
          editorContainerRef.current,
          {
            fontSize: fontSize,
            originalEditable: true, // 允许编辑原始文本
            renderSideBySide: true, // 并排显示
            useInlineViewWhenSpaceIsLimited: false, // 当空间有限时使用InlineView
            minimap: {
              enabled: true, // 启用缩略图
            },
            // fontFamily: `${jetbrainsMono.style.fontFamily}, "Arial","Microsoft YaHei","黑体","宋体", sans-serif`, // 字体
            colorDecorators: true, // 颜色装饰器
            readOnly: false, // 是否开启已读功能
            theme: theme || "vs-light", // 主题
            mouseWheelZoom: true, // 启用鼠标滚轮缩放
            formatOnPaste: false, // 粘贴时自动格式化
            formatOnType: false, // 输入时自动格式化
            automaticLayout: true, // 自动布局
            scrollBeyondLastLine: false, // 禁用滚动超出最后一行
            suggestOnTriggerCharacters: true, // 在触发字符时显示建议
            acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
            acceptSuggestionOnEnter: "smart", // 按Enter键接受建议
            wordWrap: "on", // 自动换行
            autoSurround: "never", // 是否应自动环绕选择
            cursorBlinking: "smooth", // 光标动画样式
            cursorSmoothCaretAnimation: "on", // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置
            cursorStyle: "line", //  光标样式
            cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
            cursorSurroundingLinesStyle: "all", // "default" | "all" 光标环绕样式
            links: true, // 是否点击链接
            diffAlgorithm: "advanced",
          },
        );
        onMount && onMount();

        // 设置模型
        const originalModel = monacoInstance.editor.createModel(
          originalValue,
          language || "json",
        );
        const modifiedModel = monacoInstance.editor.createModel(
          modifiedValue,
          language || "json",
        );

        editorRef.current.setModel({
          original: originalModel,
          modified: modifiedModel,
        });

        // 获取两个编辑器实例
        originalEditorRef.current = editorRef.current.getOriginalEditor();
        modifiedEditorRef.current = editorRef.current.getModifiedEditor();

        // 监听原始编辑器内容变化
        originalEditorRef.current.onDidChangeModelContent(() => {
          onUpdateOriginalValue(originalEditorRef.current!.getValue());
        });

        // 监听修改编辑器内容变化
        modifiedEditorRef.current.onDidChangeModelContent(() => {
          onUpdateModifiedValue &&
            onUpdateModifiedValue(modifiedEditorRef.current!.getValue());
        });
      }
    });
  }

  const formatEditorAction = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
  ) => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const editorFormat = (type: MonacoDiffEditorEditorType): boolean => {
    switch (type) {
      case MonacoDiffEditorEditorType.left:
        formatEditorAction(originalEditorRef);
        break;
      case MonacoDiffEditorEditorType.right:
        formatEditorAction(modifiedEditorRef);
        break;
      case MonacoDiffEditorEditorType.all:
        formatEditorAction(originalEditorRef);
        formatEditorAction(modifiedEditorRef);
        break;
      default:
        console.log("unknown type", type);

        return false;
    }

    return true;
  };

  // 设置编辑器内容，保留历史, 支持 ctrl + z 撤销
  const setEditorValue = (
    editor: editor.IStandaloneCodeEditor | null,
    jsonText: string,
  ) => {
    if (!editor) {
      return;
    }
    const model = editor.getModel();

    if (!model) {
      return;
    }
    editor.executeEdits("", [
      {
        range: model.getFullModelRange(),
        text: jsonText,
        forceMoveMarkers: true,
      },
    ]);
  };
  const clearEditor = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
  ) => {
    setEditorValue(editorRef.current, "");
  };

  const sortEditor = (
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>,
    sort: "asc" | "desc",
  ): boolean => {
    const val = editorRef.current!.getValue();

    if (!val) {
      return false;
    }

    try {
      const jsonObj = JSON.parse(val);

      setEditorValue(editorRef.current, sortJson(jsonObj, sort));

      return true;
    } catch {
      return false;
    }
  };

  // 复制到剪贴板
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateOriginalValue: (value: string) => {
      setEditorValue(originalEditorRef.current, value);
    },
    updateModifiedValue: (value: string) => {
      setEditorValue(modifiedEditorRef.current, value);
    },
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    layout: () => {
      if (editorRef.current) {
        editorRef.current.layout();
        originalEditorRef.current?.layout();
        modifiedEditorRef.current?.layout();
      }
    },
    copy: (type) => {
      if (!editorRef.current) {
        return false;
      }

      let val = "";

      if (type == MonacoDiffEditorEditorType.left) {
        val = originalEditorRef.current!.getValue();
      } else if (type == MonacoDiffEditorEditorType.right) {
        val = modifiedEditorRef.current!.getValue();
      }

      copyText(val);
      toast.success("复制成功");

      return true;
    },
    format: (type) => {
      const ok = editorFormat(type);

      if (!ok) {
        toast.error("格式化失败，请检查JSON格式是否正确");

        return false;
      }
      toast.success("格式化成功");

      return ok;
    },
    clear: (type) => {
      if (!editorRef.current) {
        return false;
      }
      switch (type) {
        case MonacoDiffEditorEditorType.left:
          clearEditor(originalEditorRef);
          break;
        case MonacoDiffEditorEditorType.right:
          clearEditor(modifiedEditorRef);
          break;
        case MonacoDiffEditorEditorType.all:
          clearEditor(originalEditorRef);
          clearEditor(modifiedEditorRef);
          break;
        default:
          return false;
      }
      toast.success("清空成功");

      return true;
    },
    fieldSort: (type, sort): boolean => {
      if (!editorRef.current) {
        return false;
      }
      let ok = false;

      switch (type) {
        case MonacoDiffEditorEditorType.left:
          ok = sortEditor(originalEditorRef, sort);
          break;
        case MonacoDiffEditorEditorType.right:
          ok = sortEditor(modifiedEditorRef, sort);
          break;
        case MonacoDiffEditorEditorType.all:
          ok = sortEditor(originalEditorRef, sort);
          ok = sortEditor(modifiedEditorRef, sort);
          break;
        default:
          return false;
      }

      if (!ok) {
        toast.error("JSON格式错误，请检查后重试");

        return false;
      }

      toast.success("排序成功");

      return true;
    },
  }));

  // 更新编辑器选项
  const updateEditorOptions = (options: editor.IEditorOptions) => {
    if (editorRef.current) {
      editorRef.current.updateOptions(options);
      originalEditorRef.current?.updateOptions(options);
      modifiedEditorRef.current?.updateOptions(options);
    }
  };


  return (
    <>
      <div
        ref={editorContainerRef}
        className={cn("w-full flex-grow relative")}
        style={{ height: height }}
      >
        {/* 添加 DraggableMenu 组件 */}
        <DraggableMenu
          containerRef={editorContainerRef}
          currentFontSize={fontSize}
          currentLanguage={currentLanguage}
          tabKey={tabKey}
          onFontSizeChange={setFontSize}
          onLanguageChange={setCurrentLanguage}
          onReset={() => {
            setFontSize(14);
            setCurrentLanguage("json");
          }}
        />
      </div>
    </>
  );
};

MonacoDiffEditor.displayName = "MonacoDiffEditor";

export default MonacoDiffEditor;
