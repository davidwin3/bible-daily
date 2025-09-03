import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/auth";
import {
  useTodayMission,
  useMissions,
  useUserProgress,
  useToggleCompletion,
  useCompletionStatus,
} from "@/hooks/useMissions";
import {
  BookOpenIcon,
  CheckCircleIcon,
  CircleIcon,
  CalendarIcon,
  TrendingUpIcon,
  TargetIcon,
} from "lucide-react";
import { ScriptureDisplay } from "@/components/common/ScriptureDisplay";

export const MissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const month = currentMonth.toISOString().slice(0, 7);

  const { data: todayMission } = useTodayMission();
  const { data: missions = [], isLoading } = useMissions({ month });
  const { data: userProgress } = useUserProgress(user ? month : undefined);
  const { data: todayCompletionStatus } = useCompletionStatus(
    todayMission?.id || "",
    !!user && !!todayMission
  );
  const toggleCompletionMutation = useToggleCompletion();

  // 완료된 미션들의 ID를 추적하기 위한 함수
  const isMissionCompleted = (missionId: string) => {
    if (missionId === todayMission?.id) {
      return todayCompletionStatus?.completed || false;
    }
    // 다른 미션들의 완료 상태는 별도로 관리할 수 있음
    return false;
  };

  const handleToggleCompletion = (missionId: string) => {
    if (!user) return;
    toggleCompletionMutation.mutate(missionId);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const getMissionForDate = (date: Date) => {
    return missions.find((mission) => {
      const missionDate = new Date(mission.date);
      return missionDate.toDateString() === date.toDateString();
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-bold">미션 말씀</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">미션 말씀</h1>

      {/* Today's Mission */}
      {todayMission && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">오늘의 미션</CardTitle>
                <Badge variant="secondary">
                  {formatDate(todayMission.date)}
                </Badge>
              </div>
              {user && (
                <Button
                  variant={
                    isMissionCompleted(todayMission.id) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleToggleCompletion(todayMission.id)}
                  disabled={toggleCompletionMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {isMissionCompleted(todayMission.id) ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <CircleIcon className="h-4 w-4" />
                  )}
                  {isMissionCompleted(todayMission.id) ? "완료됨" : "읽기 완료"}
                </Button>
              )}
            </div>
            {todayMission.title && (
              <CardDescription className="text-base font-medium">
                {todayMission.title}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ScriptureDisplay
              mission={todayMission}
              variant="mobile"
              showActions={true}
              className="mb-4"
            />

            {todayMission.description && (
              <p className="text-muted-foreground mb-4">
                {todayMission.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUpIcon className="h-4 w-4" />
                완료율: {Math.round(todayMission.completionRate || 0)}%
              </div>
              <div>완료: {todayMission.completionCount || 0}명</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Progress */}
      {user && userProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              이번 달 진행 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {userProgress.completedMissions}
                </div>
                <div className="text-sm text-muted-foreground">완료한 미션</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(userProgress.completionRate)}%
                </div>
                <div className="text-sm text-muted-foreground">완료율</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userProgress.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">연속 완료</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userProgress.longestStreak}
                </div>
                <div className="text-sm text-muted-foreground">최장 연속</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            미션 달력
          </CardTitle>
          <CardDescription>
            날짜를 클릭하여 해당 날의 미션을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full h-fit"
            modifiers={{
              mission: (date: Date) => !!getMissionForDate(date),
              completed: (date: Date) => {
                const mission = getMissionForDate(date);
                return mission ? isMissionCompleted(mission.id) : false;
              },
            }}
            modifiersStyles={{
              mission: { position: "relative" },
              completed: { fontWeight: "bold", color: "green" },
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Mission */}
      {selectedDate &&
        (() => {
          const selectedMission = getMissionForDate(selectedDate);
          if (!selectedMission) return null;

          return (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5" />
                      {formatDate(selectedMission.date)} 미션
                    </CardTitle>
                    {selectedMission.title && (
                      <CardDescription className="mt-1">
                        {selectedMission.title}
                      </CardDescription>
                    )}
                  </div>
                  {user && (
                    <Button
                      variant={
                        isMissionCompleted(selectedMission.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleToggleCompletion(selectedMission.id)}
                      disabled={toggleCompletionMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {isMissionCompleted(selectedMission.id) ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <CircleIcon className="h-4 w-4" />
                      )}
                      {isMissionCompleted(selectedMission.id)
                        ? "완료됨"
                        : "읽기 완료"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScriptureDisplay
                  mission={selectedMission}
                  variant="default"
                  className="mb-3"
                />

                {selectedMission.description && (
                  <p className="text-muted-foreground mb-3">
                    {selectedMission.description}
                  </p>
                )}

                <Separator className="my-3" />

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUpIcon className="h-4 w-4" />
                    완료율: {Math.round(selectedMission.completionRate || 0)}%
                  </div>
                  <div>완료: {selectedMission.completionCount || 0}명</div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Login Prompt */}
      {!user && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              미션 완료 체크와 진행 현황을 확인하려면 로그인이 필요합니다.
            </p>
            <Button onClick={() => (window.location.href = "/login")}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
