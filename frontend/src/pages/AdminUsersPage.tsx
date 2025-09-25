import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { dayjsUtils } from "@/lib/dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  Eye,
  UserCheck,
  UserX,
  Search,
  Filter,
  ChevronDown,
  UserCog,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import {
  useAdminUsers,
  useAdminUserDetail,
  useUpdateUserRole,
  useDeactivateUser,
  useReactivateUser,
} from "@/hooks/useAdmin";
import { AdminNav } from "@/components/layout/AdminNav";

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const { data: users, isLoading, error } = useAdminUsers();
  const { data: userDetail } = useAdminUserDetail(selectedUserId);
  const updateUserRole = useUpdateUserRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  // 필터링된 사용자 목록
  const filteredUsers =
    users?.filter((user) => {
      const matchesSearch =
        user.realName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    }) || [];

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (
      !confirm(
        `사용자의 역할을 ${getRoleLabel(newRole)}(으)로 변경하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      await updateUserRole.mutateAsync({ id: userId, role: newRole });
      setOpenPopoverId(null); // 역할 변경 후 Popover 닫기
    } catch (error) {
      console.error("역할 변경 실패:", error);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? "비활성화" : "활성화";
    if (!confirm(`사용자를 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      if (isActive) {
        await deactivateUser.mutateAsync(userId);
      } else {
        await reactivateUser.mutateAsync(userId);
      }
    } catch (error) {
      console.error(`사용자 ${action} 실패:`, error);
    }
  };

  const openDetailDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "teacher":
        return "선생님";
      case "student":
        return "학생";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return ShieldCheck;
      case "teacher":
        return UserCog;
      case "student":
        return GraduationCap;
      default:
        return UserCog;
    }
  };

  const roleOptions = [
    { value: "student", label: "학생", icon: GraduationCap },
    { value: "teacher", label: "선생님", icon: UserCog },
    { value: "admin", label: "관리자", icon: ShieldCheck },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "default";
      case "student":
        return "secondary";
      default:
        return "outline";
    }
  };

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
            사용자 목록을 불러오는데 실패했습니다.
          </p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="container mx-auto px-4 py-4 sm:py-8 pb-20">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            사용자 관리
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            등록된 사용자를 관리하고 권한을 설정하세요.
          </p>
        </div>

        {/* 필터 */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              필터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 필드 (모바일에서 전체 너비) */}
            <div>
              <label className="block text-sm font-medium mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름 또는 이메일"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 역할 및 상태 필터 (모바일에서 2열) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">역할</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">전체</option>
                  <option value="admin">관리자</option>
                  <option value="teacher">선생님</option>
                  <option value="student">학생</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">상태</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("");
                    setStatusFilter("");
                  }}
                  className="w-full text-sm"
                  size="sm"
                >
                  초기화
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 목록 */}
        <div className="grid gap-3 sm:gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 sm:p-6">
                {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-start">
                  <div className="flex-1 space-y-3 sm:space-y-2">
                    {/* 뱃지들 */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="text-xs"
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.isActive ? "활성" : "비활성"}
                      </Badge>
                      {user.cellInfo && (
                        <Badge variant="outline" className="text-xs">
                          {user.cellInfo.name}
                        </Badge>
                      )}
                    </div>

                    {/* 사용자 기본 정보 */}
                    <div className="flex items-center gap-3">
                      {user.profileImage && (
                        <img
                          src={user.profileImage}
                          alt={user.realName}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold truncate">
                          {user.realName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* 통계 정보 - 모바일에서 세로 배치 */}
                    <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                      <span className="block sm:inline">
                        가입일: {dayjsUtils.formatSimple(user.createdAt)}
                      </span>
                      {user.lastLoginAt && (
                        <span className="block sm:inline">
                          최근 로그인:{" "}
                          {dayjsUtils.formatSimple(user.lastLoginAt)}
                        </span>
                      )}
                      <div className="flex items-center gap-4 sm:gap-6">
                        {user.recentMissions !== undefined && (
                          <span>최근 미션: {user.recentMissions}개</span>
                        )}
                        {user.completionRate !== undefined && (
                          <span>완료율: {user.completionRate.toFixed(1)}%</span>
                        )}
                        {user.totalPosts !== undefined && (
                          <span>게시물: {user.totalPosts}개</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 - 모바일에서는 분리된 행으로 */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(user.id)}
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">상세</span>
                    </Button>

                    {/* 역할 변경 */}
                    <div className="flex-1 sm:flex-none">
                      <Popover
                        open={openPopoverId === user.id}
                        onOpenChange={(open) =>
                          setOpenPopoverId(open ? user.id : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto justify-between"
                            disabled={updateUserRole.isPending}
                          >
                            <div className="flex items-center gap-1">
                              {(() => {
                                const Icon = getRoleIcon(user.role);
                                return <Icon className="h-3 w-3" />;
                              })()}
                              <span className="text-xs">
                                {getRoleLabel(user.role)}
                              </span>
                            </div>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="end">
                          <div className="space-y-1">
                            {roleOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <Button
                                  key={option.value}
                                  variant={
                                    user.role === option.value
                                      ? "secondary"
                                      : "ghost"
                                  }
                                  size="sm"
                                  className="w-full justify-start gap-2 h-8"
                                  onClick={() =>
                                    handleRoleChange(user.id, option.value)
                                  }
                                  disabled={updateUserRole.isPending}
                                >
                                  <Icon className="h-3 w-3" />
                                  <span className="text-xs">
                                    {option.label}
                                  </span>
                                  {user.role === option.value && (
                                    <div className="ml-auto h-1 w-1 rounded-full bg-primary" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* 활성화/비활성화 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.isActive)
                      }
                      className={`flex-shrink-0 ${
                        user.isActive
                          ? "text-red-600 hover:text-red-700"
                          : "text-green-600 hover:text-green-700"
                      }`}
                      disabled={
                        deactivateUser.isPending || reactivateUser.isPending
                      }
                    >
                      {user.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  {searchTerm || roleFilter || statusFilter
                    ? "조건에 맞는 사용자가 없습니다."
                    : "등록된 사용자가 없습니다."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사용자 상세 다이얼로그 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                사용자 상세 정보
              </DialogTitle>
            </DialogHeader>
            {userDetail && (
              <div className="space-y-4 sm:space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">
                    기본 정보
                  </h3>
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    {userDetail.profileImage && (
                      <img
                        src={userDetail.profileImage}
                        alt={userDetail.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-semibold truncate">
                        {userDetail.name}
                      </h4>
                      <p className="text-sm sm:text-base text-muted-foreground truncate">
                        {userDetail.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant={getRoleBadgeVariant(userDetail.role)}
                          className="text-xs"
                        >
                          {getRoleLabel(userDetail.role)}
                        </Badge>
                        <Badge
                          variant={
                            userDetail.isActive ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {userDetail.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">가입일:</span>
                      <span className="ml-2 block sm:inline">
                        {dayjsUtils.formatKorean(userDetail.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        최근 로그인:
                      </span>
                      <span className="ml-2 block sm:inline">
                        {userDetail.lastLoginAt
                          ? dayjsUtils.formatKorean(userDetail.lastLoginAt)
                          : "없음"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Firebase UID:
                      </span>
                      <span className="ml-2 font-mono text-xs break-all">
                        {userDetail.firebaseUid}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 셀 정보 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">
                    셀 정보
                  </h3>
                  {userDetail.cellInfo ? (
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            셀 이름:
                          </span>
                          <span className="ml-2 font-medium block sm:inline">
                            {userDetail.cellInfo.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            셀 리더:
                          </span>
                          <span className="ml-2 block sm:inline">
                            {userDetail.cellInfo.leader.name}
                          </span>
                        </div>
                      </div>
                      {userDetail.cellInfo.description && (
                        <div className="mt-3 sm:mt-2">
                          <span className="text-muted-foreground text-xs sm:text-sm">
                            설명:
                          </span>
                          <p className="mt-1 text-xs sm:text-sm whitespace-pre-wrap">
                            {userDetail.cellInfo.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      소속된 셀이 없습니다.
                    </p>
                  )}
                </div>

                {/* 미션 통계 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">
                    미션 통계
                  </h3>
                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">
                        전체 통계
                      </h4>
                      <div className="text-xs sm:text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            전체 미션:
                          </span>
                          <span>{userDetail.missionStats.totalMissions}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            완료 미션:
                          </span>
                          <span>
                            {userDetail.missionStats.completedMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            전체 완료율:
                          </span>
                          <span>
                            {userDetail.missionStats.overallCompletionRate.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">
                        최근 30일
                      </h4>
                      <div className="text-xs sm:text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            최근 미션:
                          </span>
                          <span>
                            {userDetail.missionStats.recentMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            최근 완료:
                          </span>
                          <span>
                            {userDetail.missionStats.recentCompletedMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            최근 완료율:
                          </span>
                          <span>
                            {userDetail.missionStats.recentCompletionRate.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 게시물 통계 */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">
                    게시물 통계
                  </h3>
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        전체 게시물:
                      </span>
                      <span>{userDetail.postStats.totalPosts}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        최근 게시물 (30일):
                      </span>
                      <span>{userDetail.postStats.recentPosts}개</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
