import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

import JsonPathBar from "@/components/jsonTable/jsonPathBar.tsx";

interface JsonTableProps {
  data: any;
  onPathChange?: (path: string) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  hideEmpty?: boolean;
  hideNull?: boolean;
}

const JsonTable: React.FC<JsonTableProps> = ({
  data,
  onPathChange,
  expandedPaths,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  hideEmpty = false,
  hideNull = false,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("root");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const lastAutoExpandedDataRef = useRef<any>(null);

  // 添加自动展开单个子元素的函数
  const collectSingleChildPaths = (
    value: any,
    path: string = "root",
    paths: Set<string> = new Set(),
  ): Set<string> => {
    if (typeof value !== "object" || value === null) {
      return paths;
    }

    if (Array.isArray(value)) {
      if (value.length === 1) {
        paths.add(path);
        collectSingleChildPaths(value[0], `${path}[0]`, paths);
      } else {
        // 遍历数组中的所有元素
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            collectSingleChildPaths(item, `${path}[${index}]`, paths);
          }
        });
      }
    } else {
      const keys = Object.keys(value);

      if (keys.length === 1) {
        paths.add(path);
        collectSingleChildPaths(value[keys[0]], `${path}.${keys[0]}`, paths);
      } else {
        // 遍历对象中的所有属性
        keys.forEach((key) => {
          if (typeof value[key] === "object" && value[key] !== null) {
            collectSingleChildPaths(value[key], `${path}.${key}`, paths);
          }
        });
      }
    }

    return paths;
  };

  // 检查路径是否是选定路径的子路径
  const isPathSelected = (path: string): boolean => {
    if (!selectedPath) return false;

    // 完全匹配
    if (path === selectedPath) return true;

    // 检查是否是子路径
    if (
      path.startsWith(selectedPath + ".") ||
      path.startsWith(selectedPath + "[")
    ) {
      return true;
    }

    return false;
  };

  // 处理元素点击
  const handleElementClick = (path: string, event: React.SyntheticEvent) => {
    event.stopPropagation();
    setSelectedPath(path);
    setCurrentPath(path);
    onPathChange && onPathChange(path);
    scrollToElement(path);
  };

  // 使用useCallback包装自动展开逻辑，防止不必要的重复执行
  const autoExpandSingleChildren = useCallback(() => {
    // 如果数据没有变化，则不重复执行
    if (lastAutoExpandedDataRef.current === data) {
      return;
    }

    const pathsToExpand = collectSingleChildPaths(data);

    pathsToExpand.forEach((path) => {
      if (!expandedPaths.has(path)) {
        onToggleExpand(path);
      }
    });

    // 记录已经自动展开过的数据
    lastAutoExpandedDataRef.current = data;
  }, [data, expandedPaths, onToggleExpand]);

  // 初始化时和数据变化时执行自动展开
  useEffect(() => {
    autoExpandSingleChildren();
  }, [data, autoExpandSingleChildren]); // 只在数据变化时触发

  // 修改滚动到元素的函数
  const scrollToElement = (path: string) => {
    const element = document.getElementById(`json-path-${path}`);

    if (element) {
      const container = element.closest(".overflow-auto");

      if (container) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 添加滚动偏移量，使滚动位置稍微小一点
        const offset = 40; // 偏移量，可以根据需要调整

        // 计算水平和垂直方向的滚动位置
        const scrollLeft =
          elementRect.left - containerRect.left + container.scrollLeft - offset;
        const scrollTop =
          elementRect.top - containerRect.top + container.scrollTop - offset;

        // 平滑滚动到目标位置
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          top: Math.max(0, scrollTop),
          behavior: "smooth",
        });
      } else {
        // 使用scrollIntoView时添加margin
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // 监听展开路径变化
  useEffect(() => {
    if (currentPath) {
      scrollToElement(currentPath);
    }
  }, [currentPath]);

  // 判断值是否为可展开的对象或数组
  const isExpandable = (value: any): boolean => {
    return typeof value === "object" && value !== null;
  };

  // 判断是否是对象数组
  const isObjectArray = (data: any[]): boolean => {
    return (
      data.length > 0 &&
      data.every((item) => typeof item === "object" && item !== null)
    );
  };

  // 获取所有对象字段的集合
  const getAllObjectKeys = (objects: object[]): string[] => {
    const keysSet = new Set<string>();

    objects.forEach((obj) => {
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => keysSet.add(key));
      }
    });

    return Array.from(keysSet);
  };

  // 渲染单元格内容
  const renderCell = (value: any, path: string) => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined)
      return <span className="text-gray-500">undefined</span>;

    if (isExpandable(value)) {
      const isExpanded = expandedPaths.has(path);
      const icon = isExpanded ? "tabler:chevron-down" : "tabler:chevron-right";

      return (
        <button
          className="flex items-center cursor-pointer hover:text-primary bg-transparent border-0 p-0"
          id={`json-path-${path}`}
          onClick={(e) => {
            onToggleExpand(path);
            handleElementClick(path, e);
          }}
        >
          <Icon className="mr-1" icon={icon} width={16} />
          <span className="whitespace-nowrap">
            {Array.isArray(value)
              ? `Array[ ${value.length} ]`
              : `Object{ ${Object.keys(value).length} }`}
          </span>
        </button>
      );
    }

    // 为非可展开的元素添加点击处理器
    return (
      <span
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={(e) => handleElementClick(path, e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleElementClick(path, e);
          }
        }}
      >
        {typeof value === "string" ? (
          <span className="text-green-600">&quot;{value}&quot;</span>
        ) : typeof value === "number" ? (
          <span className="text-blue-600">{value}</span>
        ) : typeof value === "boolean" ? (
          <span className="text-purple-600">{String(value)}</span>
        ) : (
          <span>{String(value)}</span>
        )}
      </span>
    );
  };

  // 修改表格容器的样式，优化嵌套边框
  const renderObjectTable = (
    data: object,
    path: string = "root",
    isNested: boolean = false,
  ) => {
    const entries = Object.entries(data);

    return (
      <div
        className={`${isNested ? "border-0" : "border border-gray-400 rounded"} mb-2 overflow-x-auto inline-block`}
      >
        <table className="border-collapse w-auto">
          <tbody>
            {entries.map(([key, value]) => {
              if ((hideEmpty && value === "") || (hideNull && value === null)) {
                return null;
              }

              const valuePath = path ? `${path}.${key}` : key;
              const isSelected = isPathSelected(valuePath);

              return (
                <tr
                  key={key}
                  className={`${isSelected ? "!bg-blue-100" : ""} hover:bg-default-50`}
                >
                  <td
                    className="px-4 py-1 text-sm font-medium border border-gray-400 whitespace-nowrap cursor-pointer"
                    onClick={(e) => handleElementClick(valuePath, e)}
                  >
                    {key}
                  </td>
                  <td 
                    className="px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer"
                    onClick={(e) => handleElementClick(valuePath, e)}
                  >
                    {renderCell(value, valuePath)}
                    {isExpandable(value) && expandedPaths.has(valuePath) && (
                      <div className="mt-1 pl-4">
                        {Array.isArray(value)
                          ? isObjectArray(value)
                            ? renderObjectsArrayTable(value, valuePath, true)
                            : renderArrayTable(value, valuePath, true)
                          : renderObjectTable(value, valuePath, true)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderArrayTable = (
    data: any[],
    path: string = "root",
    isNested: boolean = false,
  ) => {
    return (
      <div
        className={`${isNested ? "border-0" : "border border-gray-400 rounded"} mb-2 overflow-x-auto inline-block`}
      >
        <table className="border-collapse w-auto">
          <tbody>
            {data.map((item, index) => {
              if ((hideEmpty && item === "") || (hideNull && item === null)) {
                return null;
              }

              const itemPath = `${path}[${index}]`;
              const isSelected = isPathSelected(itemPath);

              return (
                <tr
                  key={index}
                  className={`${isSelected ? "!bg-blue-100" : ""} hover:bg-default-50`}
                >
                  <td
                    className="px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer"
                    onClick={(e) => handleElementClick(itemPath, e)}
                  >
                    {index}
                  </td>
                  <td 
                    className="px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer"
                    onClick={(e) => handleElementClick(itemPath, e)}
                  >
                    {renderCell(item, itemPath)}
                    {isExpandable(item) && expandedPaths.has(itemPath) && (
                      <div className="mt-1 pl-4">
                        {Array.isArray(item)
                          ? isObjectArray(item)
                            ? renderObjectsArrayTable(item, itemPath, true)
                            : renderArrayTable(item, itemPath, true)
                          : renderObjectTable(item, itemPath, true)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderObjectsArrayTable = (
    data: any[],
    path: string = "root",
    isNested: boolean = false,
  ) => {
    const allKeys = getAllObjectKeys(data);

    if (allKeys.length === 0) {
      return renderArrayTable(data, path, isNested);
    }

    return (
      <div
        className={`${isNested ? "border-0" : "border border-gray-400 rounded"} mb-2 overflow-x-auto inline-block`}
      >
        <table className="border-collapse w-auto">
          <thead>
            <tr className="bg-default-50">
              <th className="w-16 px-4 py-1 text-left text-sm font-medium text-default-600 border border-gray-400 whitespace-nowrap">
                #
              </th>
              {allKeys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-1 text-left text-sm font-medium text-default-600 border border-gray-400 whitespace-nowrap"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              if ((hideEmpty && item === "") || (hideNull && item === null)) {
                return null;
              }

              const itemPath = `${path}[${index}]`;
              const isSelected = isPathSelected(itemPath);

              return (
                <tr
                  key={index}
                  className={`${isSelected ? "!bg-blue-100" : ""} hover:bg-default-50`}
                >
                  <td
                    className="px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer"
                    onClick={(e) => handleElementClick(itemPath, e)}
                  >
                    {index}
                  </td>
                  {allKeys.map((key) => {
                    const value = item[key];
                    const cellPath = `${itemPath}.${key}`;
                    const isCellSelected = isPathSelected(cellPath);

                    if (
                      (hideEmpty && value === "") ||
                      (hideNull && value === null)
                    ) {
                      return (
                        <td
                          key={key}
                          className="px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer"
                          onClick={(e) => handleElementClick(cellPath, e)}
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={key}
                        className={`${isCellSelected ? "!bg-blue-100" : ""} px-4 py-1 text-sm border border-gray-400 whitespace-nowrap cursor-pointer`}
                        onClick={(e) => handleElementClick(cellPath, e)}
                      >
                        {renderCell(value, cellPath)}
                        {isExpandable(value) && expandedPaths.has(cellPath) && (
                          <div className="mt-1 pl-4">
                            {Array.isArray(value)
                              ? isObjectArray(value)
                                ? renderObjectsArrayTable(value, cellPath, true)
                                : renderArrayTable(value, cellPath, true)
                              : renderObjectTable(value, cellPath, true)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // 渲染根表格
  const renderRootTable = () => {
    if (!data) return <div className="text-center py-2">没有数据</div>;

    if (Array.isArray(data)) {
      if (isObjectArray(data)) {
        // 如果数组中的所有元素都是对象，则使用对象数组表格渲染
        return renderObjectsArrayTable(data, "root", false);
      } else {
        // 否则使用普通数组表格渲染
        return renderArrayTable(data, "root", false);
      }
    } else if (typeof data === "object" && data !== null) {
      return renderObjectTable(data, "root", false);
    } else {
      return (
        <div
          className={`p-2 border border-gray-400 rounded ${isPathSelected("root") ? "bg-blue-100" : ""}`}
          role="button"
          tabIndex={0}
          onClick={(e) => handleElementClick("root", e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleElementClick("root", e);
            }
          }}
        >
          {renderCell(data, "root")}
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <JsonPathBar
        currentPath={currentPath}
        onCollapse={onCollapseAll}
        onExpand={onExpandAll}
      />
      <div className="flex-grow overflow-auto p-2">{renderRootTable()}</div>
    </div>
  );
};

export default JsonTable;
