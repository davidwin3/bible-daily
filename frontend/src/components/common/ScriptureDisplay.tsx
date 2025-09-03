import React from "react";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mission, MissionScripture } from "@/lib/types";

interface ScriptureDisplayProps {
  mission: Mission;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export const ScriptureDisplay: React.FC<ScriptureDisplayProps> = ({
  mission,
  variant = "default",
  className,
}) => {
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

  // scriptures가 없는 경우 처리
  if (scriptures.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        <span>성경 구절 정보가 없습니다.</span>
      </div>
    );
  }

  // compact 버전 - 한 줄로 표시
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-sm text-muted-foreground",
          className
        )}
      >
        <BookOpen className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {scriptures.map((scripture, index) => (
            <span key={index}>
              {index > 0 && ", "}
              {formatScripture(scripture)}
            </span>
          ))}
        </span>
      </div>
    );
  }

  // detailed 버전 - 각 구절을 별도 배지로 표시
  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>읽을 말씀</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {scriptures.map((scripture, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {formatScripture(scripture)}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // default 버전 - 모바일 친화적인 세로 레이아웃
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>읽을 말씀</span>
      </div>
      <div className="space-y-1">
        {scriptures.map((scripture, index) => (
          <div key={index} className="text-sm bg-muted/50 rounded-md px-3 py-2">
            <span className="font-medium">{formatScripture(scripture)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
