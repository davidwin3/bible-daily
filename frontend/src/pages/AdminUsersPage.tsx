import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Eye, UserCheck, UserX, Search, Filter } from "lucide-react";
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

  const { data: users, isLoading, error } = useAdminUsers();
  const { data: userDetail } = useAdminUserDetail(selectedUserId);
  const updateUserRole = useUpdateUserRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  // 필터링된 사용자 목록
  const filteredUsers =
    users?.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">
            등록된 사용자를 관리하고 권한을 설정하세요.
          </p>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="이름 또는 이메일"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">역할</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("");
                    setStatusFilter("");
                  }}
                  className="w-full"
                >
                  초기화
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 목록 */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "활성" : "비활성"}
                      </Badge>
                      {user.cellInfo && (
                        <Badge variant="outline">{user.cellInfo.name}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      {user.profileImage && (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>
                        가입일: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user.lastLoginAt && (
                        <span>
                          최근 로그인:{" "}
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(user.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* 역할 변경 */}
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={updateUserRole.isPending}
                    >
                      <option value="student">학생</option>
                      <option value="teacher">선생님</option>
                      <option value="admin">관리자</option>
                    </select>

                    {/* 활성화/비활성화 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.isActive)
                      }
                      className={
                        user.isActive
                          ? "text-red-600 hover:text-red-700"
                          : "text-green-600 hover:text-green-700"
                      }
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
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>사용자 상세 정보</DialogTitle>
            </DialogHeader>
            {userDetail && (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                  <div className="flex items-start gap-4 mb-4">
                    {userDetail.profileImage && (
                      <img
                        src={userDetail.profileImage}
                        alt={userDetail.name}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold">
                        {userDetail.name}
                      </h4>
                      <p className="text-gray-600">{userDetail.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getRoleBadgeVariant(userDetail.role)}>
                          {getRoleLabel(userDetail.role)}
                        </Badge>
                        <Badge
                          variant={
                            userDetail.isActive ? "default" : "secondary"
                          }
                        >
                          {userDetail.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">가입일:</span>
                      <span className="ml-2">
                        {new Date(userDetail.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">최근 로그인:</span>
                      <span className="ml-2">
                        {userDetail.lastLoginAt
                          ? new Date(
                              userDetail.lastLoginAt
                            ).toLocaleDateString()
                          : "없음"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Firebase UID:</span>
                      <span className="ml-2 font-mono text-xs">
                        {userDetail.firebaseUid}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 셀 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">셀 정보</h3>
                  {userDetail.cellInfo ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">셀 이름:</span>
                          <span className="ml-2 font-medium">
                            {userDetail.cellInfo.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">셀 리더:</span>
                          <span className="ml-2">
                            {userDetail.cellInfo.leader.name}
                          </span>
                        </div>
                      </div>
                      {userDetail.cellInfo.description && (
                        <div className="mt-2">
                          <span className="text-gray-500">설명:</span>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {userDetail.cellInfo.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">소속된 셀이 없습니다.</p>
                  )}
                </div>

                {/* 미션 통계 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">미션 통계</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium">전체 통계</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">전체 미션:</span>
                          <span>{userDetail.missionStats.totalMissions}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">완료 미션:</span>
                          <span>
                            {userDetail.missionStats.completedMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">전체 완료율:</span>
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
                      <h4 className="font-medium">최근 30일</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">최근 미션:</span>
                          <span>
                            {userDetail.missionStats.recentMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">최근 완료:</span>
                          <span>
                            {userDetail.missionStats.recentCompletedMissions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">최근 완료율:</span>
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
                  <h3 className="text-lg font-semibold mb-3">게시물 통계</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">전체 게시물:</span>
                      <span>{userDetail.postStats.totalPosts}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">최근 게시물 (30일):</span>
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
