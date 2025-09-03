import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Eye,
  ChevronDown,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import {
  useAdminCells,
  useCreateCell,
  useUpdateCell,
  useDeleteCell,
  useAdminCellDetail,
  useAddMemberToCell,
  useRemoveMemberFromCell,
  useAdminUsers,
} from "@/hooks/useAdmin";
import { AdminNav } from "@/components/layout/AdminNav";

interface CellFormData {
  name: string;
  description?: string;
  leaderId: string;
}

export const AdminCellsPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [selectedCellId, setSelectedCellId] = useState<string>("");
  const [formData, setFormData] = useState<CellFormData>({
    name: "",
    description: "",
    leaderId: "",
  });

  const { data: cells, isLoading, error } = useAdminCells();
  const { data: users } = useAdminUsers();
  const { data: cellDetail } = useAdminCellDetail(selectedCellId);
  const createCell = useCreateCell();
  const updateCell = useUpdateCell();
  const deleteCell = useDeleteCell();
  const addMember = useAddMemberToCell();
  const removeMember = useRemoveMemberFromCell();

  // 선생님/관리자 사용자만 필터링 (셀 리더가 될 수 있는 사용자들)
  const potentialLeaders =
    users?.filter((user) => user.role === "teacher" || user.role === "admin") ||
    [];

  // 셀에 속하지 않은 사용자들
  const availableUsers = users?.filter((user) => !user.cellInfo) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCell.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("셀 생성 실패:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    try {
      await updateCell.mutateAsync({
        id: editingCell.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setEditingCell(null);
      resetForm();
    } catch (error) {
      console.error("셀 수정 실패:", error);
    }
  };

  const handleDelete = async (id: string, memberCount: number) => {
    if (memberCount > 0) {
      alert("활성 멤버가 있는 셀은 삭제할 수 없습니다.");
      return;
    }

    if (!confirm("셀을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteCell.mutateAsync(id);
    } catch (error) {
      console.error("셀 삭제 실패:", error);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedCellId) return;

    try {
      await addMember.mutateAsync({ cellId: selectedCellId, userId });
    } catch (error) {
      console.error("멤버 추가 실패:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedCellId) return;

    if (!confirm("멤버를 셀에서 제거하시겠습니까?")) {
      return;
    }

    try {
      await removeMember.mutateAsync({ cellId: selectedCellId, userId });
    } catch (error) {
      console.error("멤버 제거 실패:", error);
    }
  };

  const openEditDialog = (cell: any) => {
    setEditingCell(cell);
    setFormData({
      name: cell.name,
      description: cell.description || "",
      leaderId: cell.leaderId,
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (cellId: string) => {
    setSelectedCellId(cellId);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      leaderId: "",
    });
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
            셀 목록을 불러오는데 실패했습니다.
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              셀 관리
            </h1>
            <p className="text-gray-600">
              소그룹 셀을 관리하고 멤버를 배정하세요.
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />새 셀 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 셀 추가</DialogTitle>
              </DialogHeader>
              <CellForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreate}
                isLoading={createCell.isPending}
                submitText="셀 생성"
                leaders={potentialLeaders}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* 셀 목록 */}
        <div className="grid gap-4">
          {cells?.map((cell) => (
            <Card key={cell.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={cell.isActive ? "default" : "secondary"}
                        >
                          {cell.isActive ? "활성" : "비활성"}
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-500">
                          ID: {cell.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{cell.name}</h3>

                    {cell.description && (
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap text-sm">
                        {cell.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>리더: {cell.leader.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>멤버: {cell.memberCount || 0}명</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(cell.id)}
                      className="flex-1 lg:flex-initial"
                    >
                      <Eye className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">상세</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(cell)}
                      className="flex-1 lg:flex-initial"
                    >
                      <Edit className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">수정</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(cell.id, cell.memberCount || 0)
                      }
                      className="text-red-600 hover:text-red-700 flex-1 lg:flex-initial"
                      disabled={(cell.memberCount || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">삭제</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {cells?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 셀이 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>셀 수정</DialogTitle>
            </DialogHeader>
            <CellForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdate}
              isLoading={updateCell.isPending}
              submitText="셀 수정"
              leaders={potentialLeaders}
            />
          </DialogContent>
        </Dialog>

        {/* 셀 상세 다이얼로그 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>셀 상세 정보</DialogTitle>
            </DialogHeader>
            {cellDetail && (
              <div className="space-y-6">
                {/* 셀 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="flex flex-col sm:block">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        셀 이름:
                      </span>
                      <span className="font-medium mt-1 sm:ml-2 sm:mt-0">
                        {cellDetail.name}
                      </span>
                    </div>
                    <div className="flex flex-col sm:block">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        리더:
                      </span>
                      <span className="font-medium mt-1 sm:ml-2 sm:mt-0">
                        {cellDetail.leader.name}
                      </span>
                    </div>
                    <div className="flex flex-col sm:block">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        멤버 수:
                      </span>
                      <span className="font-medium mt-1 sm:ml-2 sm:mt-0">
                        {cellDetail.memberCount}명
                      </span>
                    </div>
                    <div className="flex flex-col sm:block">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        상태:
                      </span>
                      <div className="mt-1 sm:ml-2 sm:mt-0 sm:inline">
                        <Badge
                          variant={
                            cellDetail.isActive ? "default" : "secondary"
                          }
                        >
                          {cellDetail.isActive ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {cellDetail.description && (
                    <div className="mt-4">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        설명:
                      </span>
                      <p className="mt-2 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {cellDetail.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* 멤버 목록 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">멤버 목록</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          멤버 추가
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>멤버 추가</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            셀에 속하지 않은 사용자를 선택하여 추가하세요.
                          </p>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {availableUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex justify-between items-center p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {user.email}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {user.role === "admin"
                                      ? "관리자"
                                      : user.role === "teacher"
                                      ? "선생님"
                                      : "학생"}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddMember(user.id)}
                                  disabled={addMember.isPending}
                                >
                                  추가
                                </Button>
                              </div>
                            ))}
                            {availableUsers.length === 0 && (
                              <p className="text-center text-gray-500 py-8">
                                추가할 수 있는 사용자가 없습니다.
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {cellDetail.members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex flex-col lg:flex-row lg:justify-between p-3 border rounded-lg gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm sm:text-base">
                                {member.user.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 break-all">
                                {member.user.email}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {member.user.role === "admin"
                                  ? "관리자"
                                  : member.user.role === "teacher"
                                  ? "선생님"
                                  : "학생"}
                              </Badge>
                              {!member.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  비활성
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-500 mt-3">
                            <div className="flex flex-col">
                              <span className="text-gray-400">가입일</span>
                              <span>
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400">최근 미션</span>
                              <span>{member.recentMissions}개</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400">완료율</span>
                              <span>{member.completionRate?.toFixed(1)}%</span>
                            </div>
                            {member.user.lastLoginAt && (
                              <div className="flex flex-col">
                                <span className="text-gray-400">
                                  최근 로그인
                                </span>
                                <span>
                                  {new Date(
                                    member.user.lastLoginAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {member.isActive && (
                          <div className="flex lg:flex-col justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-600 hover:text-red-700 w-full lg:w-auto"
                              disabled={removeMember.isPending}
                            >
                              <UserMinus className="h-4 w-4 lg:mr-2" />
                              <span className="hidden lg:inline">제거</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {cellDetail.members?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>멤버가 없습니다.</p>
                      </div>
                    )}
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

interface CellFormProps {
  formData: CellFormData;
  setFormData: (data: CellFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  submitText: string;
  leaders: any[];
}

const CellForm: React.FC<CellFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitText,
  leaders,
}) => {
  const selectedLeader = leaders.find((leader) => leader.id === formData.leaderId);

  const getRoleIcon = (role: string) => {
    return role === "admin" ? ShieldCheck : UserCog;
  };

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "관리자" : "선생님";
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">셀 이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="예: 하늘셀, 은혜셀"
          required
        />
      </div>

      <div>
        <Label>셀 리더</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={isLoading}
            >
              {selectedLeader ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getRoleIcon(selectedLeader.role);
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span className="text-sm">
                    {selectedLeader.name} ({getRoleLabel(selectedLeader.role)})
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">리더를 선택하세요</span>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {leaders.map((leader) => {
                const Icon = getRoleIcon(leader.role);
                return (
                  <Button
                    key={leader.id}
                    variant={formData.leaderId === leader.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 h-auto p-3"
                    onClick={() => setFormData({ ...formData, leaderId: leader.id })}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{leader.name}</p>
                      <p className="text-xs text-gray-500 truncate">{leader.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {getRoleLabel(leader.role)}
                      </Badge>
                    </div>
                    {formData.leaderId === leader.id && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </Button>
                );
              })}
              {leaders.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">선택 가능한 리더가 없습니다.</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="셀에 대한 설명"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "처리 중..." : submitText}
      </Button>
    </form>
  );
};
