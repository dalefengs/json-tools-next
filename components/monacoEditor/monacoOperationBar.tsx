import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

import StatusButton, { IconStatus } from "@/components/button/statusButton";

interface MonacoOperationBarProps {
  onCopy: (type?: "default" | "compress" | "escape") => boolean;
  onFormat: () => boolean;
  onClear: () => boolean;
  onFieldSort: (type: "asc" | "desc") => boolean;
  onMore: (key: "unescape" | "del_comment") => boolean;
  ref?: React.RefObject<MonacoOperationBarRef>;
}

export interface MonacoOperationBarRef {}

const MonacoOperationBar: React.FC<MonacoOperationBarProps> = ({
  onCopy,
  onFormat,
  onClear,
  onFieldSort,
  onMore,
}) => {
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<IconStatus>(IconStatus.Default);
  const [formatStatus, setFormatStatus] = useState<IconStatus>(
    IconStatus.Default,
  );
  const [clearStatus, setClearStatus] = useState<IconStatus>(
    IconStatus.Default,
  );

  // 防止下拉菜单打开时，鼠标移开后立即关闭
  const sortDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();
  const moreDropdownOpenTimeoutRef = React.useRef<NodeJS.Timeout>();

  const dropdownTimeout = 300;

  const handleCopy = (type?: "compress" | "escape") => {
    onCopy(type);
    setIsCopyDropdownOpen(false);
  };

  // 字段排序下拉菜单
  const showSortDropdown = () => {
    clearTimeout(sortDropdownOpenTimeoutRef.current);
    setSortDropdownOpen(true);
  };
  const unShowSortDropdown = () => {
    clearTimeout(sortDropdownOpenTimeoutRef.current);
    sortDropdownOpenTimeoutRef.current = setTimeout(() => {
      setSortDropdownOpen(false);
    }, dropdownTimeout);
  };

  // 更多下拉菜单
  const showMoreDropdown = () => {
    clearTimeout(moreDropdownOpenTimeoutRef.current);
    setMoreDropdownOpen(true);
  };
  const unShowMoreDropdown = () => {
    clearTimeout(moreDropdownOpenTimeoutRef.current);
    moreDropdownOpenTimeoutRef.current = setTimeout(() => {
      setMoreDropdownOpen(false);
    }, dropdownTimeout);
  };

  return (
    <div className="h-10 flex items-center space-x-2 p-1 bg-default-100">
      <ButtonGroup className="ml-2" variant="light">
        <StatusButton
          icon="si:copy-line"
          status={copyStatus}
          successText="已复制"
          text="复制"
          onClick={() => {
            setTimeout(() => {
              setCopyStatus(IconStatus.Default);
            }, 1000);
            setCopyStatus(onCopy() ? IconStatus.Success : IconStatus.Error);
          }}
        />

        <Dropdown
          classNames={{
            base: "before:bg-default-200", // change arrow background
            content: "min-w-[140px]",
          }}
          isOpen={isCopyDropdownOpen}
          radius="sm"
          onOpenChange={setIsCopyDropdownOpen}
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              className="p-0 m-0 min-w-[22px] w-auto"
              startContent={<Icon icon="formkit:down" width={16} />}
            />
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Copy options"
            onAction={(key) => {
              switch (key) {
                case "compress":
                  handleCopy("compress");
                  break;
                case "escape":
                  handleCopy("escape");
                  break;
              }
            }}
          >
            <DropdownItem key="compress" textValue="压缩后复制">
              <div className="flex items-center space-x-2">
                <Icon icon="f7:rectangle-compress-vertical" width={16} />
                <span>压缩后复制</span>
              </div>
            </DropdownItem>
            <DropdownItem key="escape" textValue="转义后复制">
              <div className="flex items-center space-x-2">
                <Icon icon="si:swap-horiz-line" width={16} />
                <span>转义后复制</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <StatusButton
        icon="ph:magic-wand-light"
        status={formatStatus}
        text="格式化"
        onClick={() => {
          setTimeout(() => {
            setFormatStatus(IconStatus.Default);
          }, 2000);
          setFormatStatus(onFormat() ? IconStatus.Success : IconStatus.Error);
        }}
      />

      {/* 字段排序下拉菜单 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isSortDropdownOpen}
        radius="sm"
      >
        <DropdownTrigger
          onMouseEnter={showSortDropdown}
          onMouseLeave={unShowSortDropdown}
        >
          <Button
            className={cn("pl-2 pr-1 h-8 gap-1 text-default-600")}
            startContent={
              <Icon icon="fluent:arrow-sort-24-regular" width={16} />
            }
            variant="light"
          >
            字段排序
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Sort options"
          onAction={(key) => {
            switch (key) {
              case "asc":
                onFieldSort("asc");
                break;
              case "desc":
                onFieldSort("desc");
                break;
            }
            toast.success("字段排序成功");
            setSortDropdownOpen(false);
          }}
          onMouseEnter={showSortDropdown}
          onMouseLeave={unShowSortDropdown}
        >
          <DropdownItem key="asc" textValue="字段升序">
            <div className="flex items-center space-x-2">
              <Icon icon="f7:rectangle-compress-vertical" width={16} />
              <span>字段升序</span>
            </div>
          </DropdownItem>
          <DropdownItem key="desc" textValue="字段降序">
            <div className="flex items-center space-x-2">
              <Icon icon="si:swap-horiz-line" width={16} />
              <span>字段降序</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* 清空按钮 */}
      <StatusButton
        icon="mynaui:trash"
        status={clearStatus}
        successText="已清空"
        text="清空"
        onClick={() => {
          setTimeout(() => {
            setClearStatus(IconStatus.Default);
          }, 1000);
          setClearStatus(onClear() ? IconStatus.Success : IconStatus.Error);
        }}
      />

      {/* 更多按钮 */}
      <Dropdown
        classNames={{
          base: "before:bg-default-200", // change arrow background
          content: "min-w-[140px]",
        }}
        isOpen={isMoreDropdownOpen}
        radius="sm"
        // onOpenChange={setMoreDropdownOpen}
      >
        <DropdownTrigger
          onMouseEnter={showMoreDropdown}
          onMouseLeave={unShowMoreDropdown}
        >
          <Button
            className={cn("pl-1 pr-1 h-8 gap-1 text-default-600 !min-w-16")}
            startContent={<Icon icon="mingcute:more-2-fill" width={20} />}
            variant="light"
          >
            更多
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="more options"
          onAction={(key) => {
            switch (key) {
              case "unescape":
                if (onMore("unescape")) {
                  toast.success("去除转义成功");
                }
                break;
              case "del_comment":
                if (onMore("del_comment")) {
                  toast.success("移除注释成功");
                } else {
                  toast.error("移除注释失败");
                }
                break;
            }
            setMoreDropdownOpen(false);
          }}
          onMouseEnter={showMoreDropdown}
          onMouseLeave={unShowMoreDropdown}
        >
          <DropdownItem key="unescape" textValue="去除转移">
            <div className="flex items-center space-x-2">
              <Icon icon="iconoir:remove-link" width={16} />
              <span>去除转义</span>
            </div>
          </DropdownItem>
          <DropdownItem key="del_comment" textValue="移除注释">
            <div className="flex items-center space-x-2">
              <Icon icon="tabler:notes-off" width={16} />
              <span>移除注释</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default MonacoOperationBar;
