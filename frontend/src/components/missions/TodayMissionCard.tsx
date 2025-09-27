import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  CircleIcon,
  TargetIcon,
  TrendingUpIcon,
  Users,
  Calendar,
} from "lucide-react";
import { ScriptureDisplay } from "@/components/common/ScriptureDisplay";
import { MissionUncompleteDialog } from "./MissionUncompleteDialog";
import { dayjsUtils } from "@/lib/dayjs";
import type { Mission } from "@/lib/types";
import { useEventTracking } from "@/hooks/useAnalytics";

interface TodayMissionCardProps {
  mission: Mission;
  isCompleted?: boolean;
  onToggleCompletion?: () => void;
  isLoading?: boolean;
  variant?: "compact" | "detailed";
  showUser?: boolean;
  enableUncompleteDialog?: boolean; // 미완료 다이얼로그 활성화 여부
}

export const TodayMissionCard: React.FC<TodayMissionCardProps> = ({
  mission,
  isCompleted = false,
  onToggleCompletion,
  isLoading = false,
  variant = "detailed",
  showUser = true,
  enableUncompleteDialog = false,
}) => {
  const [uncompleteDialog, setUncompleteDialog] = useState({
    open: false,
    missionDate: "",
  });
  const { trackButtonClick } = useEventTracking();

  const handleToggleClick = () => {
    if (!onToggleCompletion) return;

    // 이벤트 추적
    trackButtonClick("mission_completion_toggle", {
      event_category: "mission",
      custom_parameters: {
        mission_id: mission.id,
        action: isCompleted ? "uncomplete" : "complete",
        variant: variant,
      },
    });

    // 다이얼로그가 활성화되어 있고, 현재 완료 상태인 경우 다이얼로그 표시
    if (enableUncompleteDialog && isCompleted) {
      const missionDate = formatDate(mission.date);
      setUncompleteDialog({
        open: true,
        missionDate,
      });
      return;
    }

    // 그 외의 경우는 바로 토글
    onToggleCompletion();
  };

  const handleConfirmUncomplete = () => {
    if (onToggleCompletion) {
      onToggleCompletion();
    }
  };

  const formatDate = (date: Date | string) => {
    if (variant === "compact") {
      return dayjsUtils.formatKorean(
        dayjsUtils.parse(date) || dayjsUtils.now()
      );
    }
    return dayjsUtils.parse(date)?.format("M월 D일 (ddd)") || "";
  };

  const truncateDescription = (text: string, maxLines: number = 3) => {
    if (variant !== "compact") return text;

    const lines = text.split("\n");
    if (lines.length <= maxLines) {
      // 줄 수가 적으면 글자 수로도 체크
      return text.length > 150 ? text.substring(0, 150) + "..." : text;
    }
    return lines.slice(0, maxLines).join("\n") + "...";
  };

  if (variant === "compact") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5 text-primary" />
              <CardTitle>오늘의 미션</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(mission.date)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-3">
                {mission.title || "오늘의 성경 읽기"}
              </h3>
              <ScriptureDisplay
                mission={mission}
                variant="compact"
                allowExpand={true}
                showBibleApp={false}
              />
            </div>
            {mission.description && (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {truncateDescription(mission.description)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{mission.completionCount || 0}명 완료</span>
                </div>
              </div>
              <Link key="more" to="/missions">
                <Button
                  size="sm"
                  onClick={() =>
                    trackButtonClick("mission_detail_view", {
                      event_category: "navigation",
                      custom_parameters: {
                        mission_id: mission.id,
                        source: "homepage_mission_card",
                      },
                    })
                  }
                >
                  자세히 보기
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant for missions page
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">오늘의 미션</CardTitle>
            <Badge variant="secondary">{formatDate(mission.date)}</Badge>
          </div>
          {showUser && onToggleCompletion && (
            <Button
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              onClick={handleToggleClick}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isCompleted ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <CircleIcon className="h-4 w-4" />
              )}
              {isCompleted ? "완료됨" : "읽기 완료"}
            </Button>
          )}
        </div>
        {mission.title && (
          <CardTitle className="text-base font-medium text-muted-foreground">
            {mission.title}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <ScriptureDisplay mission={mission} variant="mobile" className="mb-4" />

        {mission.description && (
          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
            {mission.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUpIcon className="h-4 w-4" />
            완료율: {Math.round(mission.completionRate || 0)}%
          </div>
          <div>완료: {mission.completionCount || 0}명</div>
        </div>
      </CardContent>

      {/* Mission Uncomplete Dialog */}
      {enableUncompleteDialog && (
        <MissionUncompleteDialog
          open={uncompleteDialog.open}
          onOpenChange={(open) =>
            setUncompleteDialog((prev) => ({ ...prev, open }))
          }
          onConfirm={handleConfirmUncomplete}
          missionDate={uncompleteDialog.missionDate}
        />
      )}
    </Card>
  );
};
