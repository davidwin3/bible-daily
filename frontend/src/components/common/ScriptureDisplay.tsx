import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Copy,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mission, MissionScripture } from "@/lib/types";

interface ScriptureDisplayProps {
  mission: Mission;
  variant?: "default" | "compact" | "detailed" | "mobile";
  className?: string;
  showActions?: boolean;
  allowExpand?: boolean;
}

export const ScriptureDisplay: React.FC<ScriptureDisplayProps> = ({
  mission,
  variant = "default",
  className,
  showActions = true,
  allowExpand = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // 구절 포맷팅 함수
  const formatScripture = (scripture: MissionScripture) => {
    let result = `${scripture.startBook} ${scripture.startChapter}`;

    if (scripture.startVerse) {
      result += `:${scripture.startVerse}`;
    }

    // 끝 구절이 있는 경우
    if (scripture.endChapter || scripture.endVerse) {
      if (
        scripture.endChapter &&
        scripture.endChapter !== scripture.startChapter
      ) {
        result += ` - ${scripture.startBook} ${scripture.endChapter}`;
        if (scripture.endVerse) {
          result += `:${scripture.endVerse}`;
        }
      } else if (
        scripture.endVerse &&
        scripture.endVerse !== scripture.startVerse
      ) {
        result += `-${scripture.endVerse}`;
      }
    }

    return result;
  };

  const scriptures =
    mission.scriptures?.sort((a, b) => a.order - b.order) || [];

  // 유틸리티 함수들
  const getAllScripturesText = () => {
    return scriptures.map(formatScripture).join(", ");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getAllScripturesText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const openBibleApp = () => {
    const scriptureText = getAllScripturesText();
    // YouVersion Bible App 링크 (새번역 RNKSV)
    const youVersionUrl = `https://www.bible.com/search/bible?q=${encodeURIComponent(
      scriptureText
    )}&version_id=142`;
    window.open(youVersionUrl, "_blank");
  };

  // scriptures가 없는 경우 처리
  if (scriptures.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        <span>성경 구절 정보가 없습니다.</span>
      </div>
    );
  }

  // compact 버전 - 한 줄로 표시 (모바일 개선)
  if (variant === "compact") {
    const displayText = getAllScripturesText();
    const isLongText = displayText.length > 30;
    const shouldTruncate = !allowExpand || !isExpanded;

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BookOpen className="h-3 w-3 flex-shrink-0 text-primary" />
            <span
              className={cn(
                "text-sm text-muted-foreground font-medium",
                shouldTruncate && isLongText && "truncate"
              )}
              title={displayText}
            >
              {shouldTruncate && isLongText
                ? `${displayText.slice(0, 30)}...`
                : displayText}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {allowExpand && isLongText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}

            {showActions && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-6 w-6 p-0"
                  title="성경 구절 복사"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openBibleApp}
                  className="h-6 w-6 p-0"
                  title="성경 앱에서 열기"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // mobile 버전 - 모바일 최적화된 터치 친화적 디자인
  if (variant === "mobile") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>읽을 말씀</span>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    복사
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={openBibleApp}
                className="h-8 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                성경앱
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {scriptures.map((scripture, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-3 touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">
                  {formatScripture(scripture)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // detailed 버전 - 각 구절을 별도 배지로 표시 (개선)
  if (variant === "detailed") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>읽을 말씀</span>
          </div>

          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-7 w-7 p-0"
                title="성경 구절 복사"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={openBibleApp}
                className="h-7 w-7 p-0"
                title="성경 앱에서 열기"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {scriptures.map((scripture, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs py-1 px-2 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(formatScripture(scripture));
              }}
              title="클릭하여 복사"
            >
              {formatScripture(scripture)}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // default 버전 - 모바일 친화적인 세로 레이아웃 (개선)
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>읽을 말씀</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 w-7 p-0"
              title="성경 구절 복사"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={openBibleApp}
              className="h-7 w-7 p-0"
              title="성경 앱에서 열기"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {scriptures.map((scripture, index) => (
          <div
            key={index}
            className="bg-muted/50 hover:bg-muted/70 rounded-lg px-4 py-3 transition-colors cursor-pointer touch-manipulation"
            onClick={() => {
              navigator.clipboard.writeText(formatScripture(scripture));
            }}
            title="클릭하여 복사"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {formatScripture(scripture)}
              </span>
              <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
