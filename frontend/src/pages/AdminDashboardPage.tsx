import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Heart, Target } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdmin";
import { AdminNav } from "@/components/layout/AdminNav";

export const AdminDashboardPage: React.FC = () => {
  const { data: dashboard, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            대시보드를 불러오는데 실패했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const overviewCards = [
    {
      title: "전체 사용자",
      value: dashboard.overview.totalUsers,
      icon: Users,
      description: `활성 사용자: ${dashboard.overview.activeUsers}명`,
    },
    {
      title: "전체 셀",
      value: dashboard.overview.totalCells,
      icon: Heart,
      description: "활성 셀 그룹",
    },
    {
      title: "전체 미션",
      value: dashboard.overview.totalMissions,
      icon: BookOpen,
      description: "등록된 미션 수",
    },
    {
      title: "전체 완료율",
      value: `${dashboard.overview.overallCompletionRate.toFixed(1)}%`,
      icon: Target,
      description: "미션 완료율",
    },
  ];

  return (
    <>
      <AdminNav />
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">전체 시스템 현황을 확인하세요.</p>
        </div>

        {/* 개요 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 미션 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>미션 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 미션:</span>
                  <span className="font-medium">
                    {dashboard.missions.totalMissions}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 참여:</span>
                  <span className="font-medium">
                    {dashboard.missions.totalUserMissions}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">완료된 미션:</span>
                  <span className="font-medium">
                    {dashboard.missions.completedUserMissions}회
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 완료율:</span>
                  <span className="font-medium">
                    {dashboard.missions.overallCompletionRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {dashboard.missions.recentStats.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">최근 7일 미션</h4>
                  <div className="space-y-2">
                    {dashboard.missions.recentStats
                      .slice(0, 5)
                      .map((stat, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">
                            {new Date(stat.date).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="font-medium">
                            {stat.completionRate.toFixed(1)}% (
                            {stat.completionCount}/{stat.totalUsers})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 셀 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>셀 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 셀:</span>
                  <span className="font-medium">
                    {dashboard.cells.totalCells}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 멤버:</span>
                  <span className="font-medium">
                    {dashboard.cells.totalMembers}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">평균 멤버 수:</span>
                  <span className="font-medium">
                    {dashboard.cells.averageMembersPerCell}명
                  </span>
                </div>
              </div>

              {dashboard.cells.topActiveCells.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">활발한 셀 TOP 5</h4>
                  <div className="space-y-2">
                    {dashboard.cells.topActiveCells.map((cell, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600">{cell.cellName}</span>
                        <span className="font-medium">
                          {cell.completionRate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 사용자 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">전체 사용자:</span>
                  <span className="font-medium">
                    {dashboard.users.totalUsers}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">활성 사용자:</span>
                  <span className="font-medium">
                    {dashboard.users.activeUsers}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">비활성 사용자:</span>
                  <span className="font-medium">
                    {dashboard.users.inactiveUsers}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">최근 활동률:</span>
                  <span className="font-medium">
                    {dashboard.users.activityRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">역할별 분포</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">관리자:</span>
                    <span className="font-medium">
                      {dashboard.users.roleDistribution.admin}명
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">선생님:</span>
                    <span className="font-medium">
                      {dashboard.users.roleDistribution.teacher}명
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">학생:</span>
                    <span className="font-medium">
                      {dashboard.users.roleDistribution.student}명
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <CardTitle>시스템 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    셀에 속한 사용자:
                  </span>
                  <span className="font-medium">
                    {dashboard.users.usersInCells}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    셀에 속하지 않은 사용자:
                  </span>
                  <span className="font-medium">
                    {dashboard.users.usersNotInCells}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    신규 가입자 (30일):
                  </span>
                  <span className="font-medium">
                    {dashboard.users.newUsers}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    최근 활성 사용자 (7일):
                  </span>
                  <span className="font-medium">
                    {dashboard.users.recentActiveUsers}명
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
