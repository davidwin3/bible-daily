import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Calendar, BookOpen, Target } from "lucide-react";
import {
  useAdminMissions,
  useCreateMission,
  useUpdateMission,
  useDeleteMission,
  useSoftDeleteMission,
} from "@/hooks/useAdmin";
import { AdminNav } from "@/components/layout/AdminNav";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface MissionFormData {
  date: string;
  startBook: string;
  startChapter: number;
  startVerse?: number;
  endBook?: string;
  endChapter?: number;
  endVerse?: number;
  title?: string;
  description?: string;
}

export const AdminMissionsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    month: format(new Date(), "yyyy-MM"),
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [formData, setFormData] = useState<MissionFormData>({
    date: format(new Date(), "yyyy-MM-dd"),
    startBook: "",
    startChapter: 1,
    startVerse: undefined,
    endBook: "",
    endChapter: undefined,
    endVerse: undefined,
    title: "",
    description: "",
  });

  const { data: missions, isLoading, error } = useAdminMissions(filters);
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const softDeleteMission = useSoftDeleteMission();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMission.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("미션 생성 실패:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMission) return;

    try {
      await updateMission.mutateAsync({
        id: editingMission.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setEditingMission(null);
      resetForm();
    } catch (error) {
      console.error("미션 수정 실패:", error);
    }
  };

  const handleDelete = async (id: string, hasUserActivities: boolean) => {
    if (
      !confirm(
        hasUserActivities
          ? "사용자 활동이 있는 미션입니다. 비활성화하시겠습니까?"
          : "미션을 완전히 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    try {
      if (hasUserActivities) {
        await softDeleteMission.mutateAsync(id);
      } else {
        await deleteMission.mutateAsync(id);
      }
    } catch (error) {
      console.error("미션 삭제 실패:", error);
    }
  };

  const openEditDialog = (mission: any) => {
    setEditingMission(mission);
    setFormData({
      date: format(new Date(mission.date), "yyyy-MM-dd"),
      startBook: mission.startBook,
      startChapter: mission.startChapter,
      startVerse: mission.startVerse,
      endBook: mission.endBook,
      endChapter: mission.endChapter,
      endVerse: mission.endVerse,
      title: mission.title || "",
      description: mission.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      startBook: "",
      startChapter: 1,
      startVerse: undefined,
      endBook: "",
      endChapter: undefined,
      endVerse: undefined,
      title: "",
      description: "",
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
            미션 목록을 불러오는데 실패했습니다.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">미션 관리</h1>
            <p className="text-gray-600">일일 성경 읽기 미션을 관리하세요.</p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />새 미션 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 미션 추가</DialogTitle>
              </DialogHeader>
              <MissionForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreate}
                isLoading={createMission.isPending}
                submitText="미션 생성"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="month">월별 조회</Label>
                <Input
                  id="month"
                  type="month"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 미션 목록 */}
        <div className="grid gap-4">
          {missions?.map((mission) => (
            <Card key={mission.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant={mission.isActive ? "default" : "secondary"}
                      >
                        {mission.isActive ? "활성" : "비활성"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(mission.date), "PPP", { locale: ko })}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      {mission.title ||
                        `${mission.startBook} ${mission.startChapter}장`}
                      {mission.startVerse && ` ${mission.startVerse}절`}
                      {mission.endBook &&
                        mission.endBook !== mission.startBook &&
                        ` - ${mission.endBook}`}
                      {mission.endChapter && ` ${mission.endChapter}장`}
                      {mission.endVerse && ` ${mission.endVerse}절`}
                    </h3>

                    {mission.description && (
                      <p className="text-gray-600 mb-3">
                        {mission.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(mission.date), "MM/dd")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {mission.startBook} {mission.startChapter}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>
                          완료율: {mission.completionRate?.toFixed(1) || 0}% (
                          {mission.completionCount || 0}/
                          {mission.totalUsers || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(mission)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(mission.id, (mission.totalUsers || 0) > 0)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {missions?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 미션이 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>미션 수정</DialogTitle>
            </DialogHeader>
            <MissionForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdate}
              isLoading={updateMission.isPending}
              submitText="미션 수정"
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

interface MissionFormProps {
  formData: MissionFormData;
  setFormData: (data: MissionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  submitText: string;
}

const MissionForm: React.FC<MissionFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitText,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="date">날짜</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startBook">시작 성경책</Label>
          <Input
            id="startBook"
            value={formData.startBook}
            onChange={(e) =>
              setFormData({ ...formData, startBook: e.target.value })
            }
            placeholder="예: 창세기"
            required
          />
        </div>
        <div>
          <Label htmlFor="startChapter">시작 장</Label>
          <Input
            id="startChapter"
            type="number"
            min="1"
            value={formData.startChapter}
            onChange={(e) =>
              setFormData({
                ...formData,
                startChapter: parseInt(e.target.value),
              })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startVerse">시작 절 (선택)</Label>
          <Input
            id="startVerse"
            type="number"
            min="1"
            value={formData.startVerse || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                startVerse: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="endBook">끝 성경책 (선택)</Label>
          <Input
            id="endBook"
            value={formData.endBook || ""}
            onChange={(e) =>
              setFormData({ ...formData, endBook: e.target.value })
            }
            placeholder="다른 책까지 읽는 경우"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="endChapter">끝 장 (선택)</Label>
          <Input
            id="endChapter"
            type="number"
            min="1"
            value={formData.endChapter || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                endChapter: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="endVerse">끝 절 (선택)</Label>
          <Input
            id="endVerse"
            type="number"
            min="1"
            value={formData.endVerse || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                endVerse: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="title">제목 (선택)</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="미션 제목"
        />
      </div>

      <div>
        <Label htmlFor="description">설명 (선택)</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="미션에 대한 설명이나 안내사항"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "처리 중..." : submitText}
      </Button>
    </form>
  );
};
