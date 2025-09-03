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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Eye,
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">셀 관리</h1>
            <p className="text-gray-600">
              소그룹 셀을 관리하고 멤버를 배정하세요.
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
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
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={cell.isActive ? "default" : "secondary"}>
                        {cell.isActive ? "활성" : "비활성"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ID: {cell.id.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{cell.name}</h3>

                    {cell.description && (
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">
                        {cell.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(cell.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(cell)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(cell.id, cell.memberCount || 0)
                      }
                      className="text-red-600 hover:text-red-700"
                      disabled={(cell.memberCount || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4" />
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>셀 상세 정보</DialogTitle>
            </DialogHeader>
            {cellDetail && (
              <div className="space-y-6">
                {/* 셀 기본 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">셀 이름:</span>
                      <span className="ml-2 font-medium">
                        {cellDetail.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">리더:</span>
                      <span className="ml-2 font-medium">
                        {cellDetail.leader.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">멤버 수:</span>
                      <span className="ml-2 font-medium">
                        {cellDetail.memberCount}명
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <Badge
                        variant={cellDetail.isActive ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {cellDetail.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>
                  </div>
                  {cellDetail.description && (
                    <div className="mt-3">
                      <span className="text-gray-500">설명:</span>
                      <p className="mt-1 text-sm whitespace-pre-wrap">
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
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                              <p className="text-sm text-gray-500">
                                {member.user.email}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {member.user.role === "admin"
                                ? "관리자"
                                : member.user.role === "teacher"
                                ? "선생님"
                                : "학생"}
                            </Badge>
                            {!member.isActive && (
                              <Badge variant="secondary">비활성</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>
                              가입일:{" "}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                            <span>최근 미션: {member.recentMissions}개</span>
                            <span>
                              완료율: {member.completionRate?.toFixed(1)}%
                            </span>
                            {member.user.lastLoginAt && (
                              <span>
                                최근 로그인:{" "}
                                {new Date(
                                  member.user.lastLoginAt
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {member.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-red-600 hover:text-red-700"
                            disabled={removeMember.isPending}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
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
        <Label htmlFor="leaderId">셀 리더</Label>
        <select
          id="leaderId"
          value={formData.leaderId}
          onChange={(e) =>
            setFormData({ ...formData, leaderId: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">리더를 선택하세요</option>
          {leaders.map((leader) => (
            <option key={leader.id} value={leader.id}>
              {leader.name} ({leader.email}) -{" "}
              {leader.role === "admin" ? "관리자" : "선생님"}
            </option>
          ))}
        </select>
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
