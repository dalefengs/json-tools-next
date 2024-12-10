"use client";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@nextui-org/react";
import {
  Content,
  ContentErrors,
  createJSONEditor,
  JsonEditor,
  JSONEditorPropsOptional,
  JSONPatchResult,
  Mode,
} from "vanilla-jsoneditor-cn";

import "@/styles/vanilla.css";

export interface VanillaJsonEditorProps {
  ref?: React.Ref<VanillaJsonEditorRef>;
  tabKey: string;
  height?: number;
  content?: Content;
  mode?: Mode;
  onUpdateValue?: (value: Content) => void;
  onChangeMode?: (mode: Mode) => void;
}

export interface VanillaJsonEditorRef {
  updateEditorContentAndMode: (mode: Mode, content: Content) => void;
}

const VanillaJsonEditor: React.FC<VanillaJsonEditorProps> = ({
  ref,
  height,
  mode,
  content,
  onUpdateValue,
  onChangeMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JsonEditor>();
  //
  // const clearButtonItem = {
  //   type: 'button',
  //   text: '清空',
  //   icon: { iconName: '', prefix: '', icon: [96, 96, [], '', 'M15 2H9c-1.103 0-2 .897-2 2v2H3v2h2v12c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2V8h2V6h-4V4c0-1.103-.897-2-2-2M9 4h6v2H9zm8 16H7V8h10z'] },
  //   onClick: () => {
  //     console.log('清空当前内容');
  //   },
  //   title: '清空当前内容',
  //   className: 'jse-group-text-button',
  // }

  const options: JSONEditorPropsOptional = {
    mode: mode,
    // parser
    content: content,
    // @ts-ignore
    // eslint-disable-next-line react-compiler/react-compiler
    target: containerRef.current,
    onChange: (
      content: Content,
      previousContent: Content,
      changeStatus: {
        contentErrors: ContentErrors | undefined;
        patchResult: JSONPatchResult | undefined;
      },
    ) => {
      // console.log('onChange', 'content', content, 'previousContent', previousContent, 'changeStatus', changeStatus)
      // let jsonText = ''
      // if (content.json !== undefined) {
      //   console.log('当前 tree 模式更新数据', 'content.json', content.json)
      //   jsonText = JSON.stringify(content.json, null, 2)
      // } else if (content.text !== undefined) {
      //   console.log('当前 text 模式更新数据', 'content.text', content.text)
      //   jsonText = content.text
      // }
      // emit('update:modelValue', jsonText)
      // sidebarStore.activeTab.vanilla = content
      console.log("update:modelValue", content);
      onUpdateValue && onUpdateValue(content);
    },
    onChangeMode: (mode: Mode) => {
      onChangeMode && onChangeMode(mode);
    },
    onError(err: Error) {
      console.error("error in VanillaEditor:", err);
    },
  };

  // 更新 editor 的内容和模式
  const updateEditorContentAndMode = (mode: Mode, content: Content) => {
    if (editorRef.current) {
      const options: JSONEditorPropsOptional = {
        mode: mode,
      };

      editorRef.current.set(content);
      editorRef.current.updateProps(options);
    }
  };

  const initEditor = () => {
    console.log("init VanillaEditor", content);
    if (containerRef.current) {
      editorRef.current = createJSONEditor({
        target: containerRef.current,
        props: options,
      });
    }
  };

  useImperativeHandle(ref, () => ({
    updateEditorContentAndMode: (mode: Mode, content: Content) => {
      updateEditorContentAndMode(mode, content);
    },
  }));

  useEffect(() => {
    if (!editorRef.current) {
      initEditor();
    }
  }, []);

  // useEffect(() => {
  //   console.log("66666666 update content", content);
  // }, [content]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full flex-grow vanilla-json-editor", {
        // "jse-theme-dark": theme == "dark",
      })}
      style={{ height: height }}
    />
  );
};

VanillaJsonEditor.displayName = "VanillaJsonEditor";
export default VanillaJsonEditor;