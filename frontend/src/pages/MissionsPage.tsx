import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  CalendarIcon,
  CheckCircleIcon,
  CircleIcon,
  TrendingUpIcon,
} from "lucide-react";
import { ScriptureDisplay } from "@/components/common/ScriptureDisplay";
import { TodayMissionCard } from "@/components/missions/TodayMissionCard";
import dayjs, { dayjsUtils } from "@/lib/dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { missionKeys } from "@/queries";
import { missionsAPI } from "@/lib/api";

export const MissionsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(
    dayjsUtils.toDate(dayjsUtils.now()) || new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(
    dayjsUtils.toDate(dayjsUtils.now()) || new Date()
  );

  const month =
    dayjsUtils.parse(currentMonth)?.format("YYYY-MM") ||
    dayjs().format("YYYY-MM");

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

    // 다른 미션들의 완료 상태를 캐시에서 확인
    const completionData = queryClient.getQueryData(
      missionKeys.completionStatus(missionId)
    ) as { completed: boolean } | undefined;

    return completionData?.completed || false;
  };

  const handleToggleCompletion = (missionId: string) => {
    if (!user) return;
    toggleCompletionMutation.mutate(missionId);
  };

  const formatDate = (date: Date | string) => {
    return dayjsUtils.parse(date)?.format("M월 D일 (ddd)") || "";
  };

  const getMissionForDate = (date: Date) => {
    return missions.find((mission) => {
      return dayjsUtils.isSameDay(mission.date, date);
    });
  };

  // 선택된 미션의 완료 상태를 미리 로드
  const selectedMission = useMemo(() => {
    return getMissionForDate(selectedDate);
  }, [selectedDate, missions]);

  // 선택된 미션의 완료 상태 조회 (캐시에 저장하기 위함)
  useCompletionStatus(
    selectedMission?.id || "",
    !!user && !!selectedMission && selectedMission.id !== todayMission?.id
  );

  // 미션 클릭 시 완료 상태 로드
  const loadMissionCompletion = (missionId: string) => {
    if (!user || missionId === todayMission?.id) return;

    // 이미 캐시에 있는지 확인
    const cached = queryClient.getQueryData(
      missionKeys.completionStatus(missionId)
    );
    if (!cached) {
      // 캐시에 없으면 수동으로 로드
      queryClient.prefetchQuery({
        queryKey: missionKeys.completionStatus(missionId),
        queryFn: async () => {
          const response = await missionsAPI.getCompletionStatus(missionId);
          return response.data as { completed: boolean };
        },
      });
    }
  };

  // 페이지 로드 시 선택된 날짜의 미션 완료 상태 로드
  useEffect(() => {
    if (selectedMission && user && selectedMission.id !== todayMission?.id) {
      loadMissionCompletion(selectedMission.id);
    }
  }, [selectedMission?.id, user, todayMission?.id]);

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
      {/* 페이지 헤더 섹션 */}
      <div className="text-center space-y-4 py-6">
        <img
          src="/images/logo-title.png"
          alt="Bible Daily"
          className="h-20 w-20 mx-auto rounded-xl shadow-lg border-2 border-primary/20"
        />
        <p className="text-muted-foreground text-lg">
          매일 하나님의 말씀과 함께하는 특별한 시간
        </p>
      </div>

      {/* Today's Mission */}
      {todayMission && (
        <TodayMissionCard
          mission={todayMission}
          variant="detailed"
          isCompleted={isMissionCompleted(todayMission.id)}
          onToggleCompletion={
            user ? () => handleToggleCompletion(todayMission.id) : undefined
          }
          isLoading={toggleCompletionMutation.isPending}
          showUser={!!user}
        />
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
            onSelect={(date) => {
              if (date) {
                // 오늘 이후 날짜는 선택할 수 없도록 제한
                const today = dayjs();
                if (dayjs(date).isAfter(today, "day")) {
                  return;
                }
                setSelectedDate(date);
                const mission = getMissionForDate(date);
                if (mission) {
                  loadMissionCompletion(mission.id);
                }
              }
            }}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full h-fit"
            disabled={(date) => {
              // 오늘 이후 날짜는 비활성화
              const today = dayjs();
              return dayjs(date).isAfter(today, "day");
            }}
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
          // 오늘 이후 날짜는 미션을 표시하지 않음
          const today = dayjs();
          if (dayjs(selectedDate).isAfter(today, "day")) {
            return null;
          }

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
                  <p className="text-muted-foreground mb-3 whitespace-pre-wrap">
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
