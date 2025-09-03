import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
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
import {
  OLD_TESTAMENT_BOOKS,
  NEW_TESTAMENT_BOOKS,
  findBookByName,
  getChapterNumbers,
  getVerseNumbersForChapter,
} from "@/lib/bible-data";
import type { Mission, MissionFormData, MissionScripture } from "@/lib/types";

export const AdminMissionsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    month: format(new Date(), "yyyy-MM"),
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<MissionFormData>({
    date: format(new Date(), "yyyy-MM-dd"),
    scriptures: [
      {
        startBook: "",
        startChapter: 1,
        startVerse: undefined,
        endBook: "",
        endChapter: undefined,
        endVerse: undefined,
        order: 0,
      },
    ],
    title: "",
    description: "",
  });

  const { data: missions, isLoading, error } = useAdminMissions(filters);
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const softDeleteMission = useSoftDeleteMission();

  const convertFormDataToCreateData = (formData: MissionFormData) => {
    return {
      date: formData.date,
      scriptures: formData.scriptures.map((scripture) => ({
        startBook: scripture.startBook,
        startChapter: scripture.startChapter,
        startVerse: scripture.startVerse,
        endBook: scripture.endBook,
        endChapter: scripture.endChapter,
        endVerse: scripture.endVerse,
        order: scripture.order,
      })),
      title: formData.title,
      description: formData.description,
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createData = convertFormDataToCreateData(formData);
      await createMission.mutateAsync(createData);
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
      const updateData = convertFormDataToCreateData(formData);
      await updateMission.mutateAsync({
        id: editingMission.id,
        data: updateData,
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

  const openEditDialog = (mission: Mission) => {
    setEditingMission(mission);

    // 기존 미션이 scriptures를 가지고 있으면 사용하고, 없으면 하위 호환성으로 단일 구절 생성
    let scriptures: MissionScripture[] = [];
    if (mission.scriptures && mission.scriptures.length > 0) {
      scriptures = mission.scriptures;
    } else if (mission.startBook && mission.startChapter) {
      scriptures = [
        {
          startBook: mission.startBook,
          startChapter: mission.startChapter,
          startVerse: mission.startVerse,
          endBook: mission.endBook,
          endChapter: mission.endChapter,
          endVerse: mission.endVerse,
          order: 0,
        },
      ];
    }

    setFormData({
      date: format(new Date(mission.date), "yyyy-MM-dd"),
      scriptures:
        scriptures.length > 0
          ? scriptures
          : [
              {
                startBook: "",
                startChapter: 1,
                startVerse: undefined,
                endBook: "",
                endChapter: undefined,
                endVerse: undefined,
                order: 0,
              },
            ],
      title: mission.title || "",
      description: mission.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      scriptures: [
        {
          startBook: "",
          startChapter: 1,
          startVerse: undefined,
          endBook: "",
          endChapter: undefined,
          endVerse: undefined,
          order: 0,
        },
      ],
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                      {mission.title ? `${mission.title}` : "-"}
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
                          {mission.scriptures &&
                          mission.scriptures.length > 0 ? (
                            mission.scriptures.map((scripture, index) => (
                              <span key={index}>
                                {index > 0 && ", "}
                                {scripture.startBook} {scripture.startChapter}
                                {scripture.startVerse &&
                                  `:${scripture.startVerse}`}
                                {scripture.endBook &&
                                  scripture.endBook !== scripture.startBook &&
                                  ` - ${scripture.endBook}`}
                                {scripture.endChapter &&
                                  ` ${scripture.endChapter}`}
                                {scripture.endVerse && `:${scripture.endVerse}`}
                              </span>
                            ))
                          ) : (
                            <>
                              {mission.startBook} {mission.startChapter}
                              {mission.startVerse && `:${mission.startVerse}`}
                              {" - "}
                              {mission.endBook && `${mission.endBook}`}
                              {mission.endChapter && ` ${mission.endChapter}`}
                              {mission.endVerse && `:${mission.endVerse}`}
                            </>
                          )}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
  const addScripture = () => {
    const newScriptures = [
      ...formData.scriptures,
      {
        startBook: "",
        startChapter: 1,
        startVerse: undefined,
        endBook: "",
        endChapter: undefined,
        endVerse: undefined,
        order: formData.scriptures.length,
      },
    ];
    setFormData({ ...formData, scriptures: newScriptures });
  };

  const removeScripture = (index: number) => {
    if (formData.scriptures.length <= 1) return; // 최소 1개는 유지
    const newScriptures = formData.scriptures.filter((_, i) => i !== index);
    // order 재정렬
    const reorderedScriptures = newScriptures.map((scripture, i) => ({
      ...scripture,
      order: i,
    }));
    setFormData({ ...formData, scriptures: reorderedScriptures });
  };

  const updateScripture = (
    index: number,
    updates: Partial<MissionScripture>
  ) => {
    const newScriptures = formData.scriptures.map((scripture, i) =>
      i === index ? { ...scripture, ...updates } : scripture
    );
    setFormData({ ...formData, scriptures: newScriptures });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg font-semibold">성경구절</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addScripture}
          >
            <Plus className="h-4 w-4 mr-2" />
            구절 추가
          </Button>
        </div>

        <div className="space-y-6">
          {formData.scriptures.map((scripture, index) => (
            <ScriptureInput
              key={index}
              scripture={scripture}
              index={index}
              onUpdate={updateScripture}
              onRemove={removeScripture}
              canRemove={formData.scriptures.length > 1}
            />
          ))}
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

interface ScriptureInputProps {
  scripture: MissionScripture;
  index: number;
  onUpdate: (index: number, updates: Partial<MissionScripture>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const ScriptureInput: React.FC<ScriptureInputProps> = ({
  scripture,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  // 선택된 성경책에 따른 장 수 계산
  const startBook = findBookByName(scripture.startBook);
  const endBook = findBookByName(scripture.endBook || "");
  const startChapterOptions = startBook
    ? getChapterNumbers(startBook.chapters)
    : [];
  const endChapterOptions = endBook ? getChapterNumbers(endBook.chapters) : [];

  // 시작 성경책의 인덱스 찾기
  const startBookIndex = scripture.startBook
    ? [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS].findIndex(
        (book) => book.name === scripture.startBook
      )
    : -1;

  // 끝 성경책 옵션 필터링 (시작 성경책 이후의 성경책들만)
  const availableEndBooks =
    startBookIndex >= 0
      ? [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS].slice(startBookIndex)
      : [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];

  // 선택된 성경책과 장에 따른 정확한 절 수 계산
  const startVerseOptions =
    scripture.startBook && scripture.startChapter
      ? getVerseNumbersForChapter(scripture.startBook, scripture.startChapter)
      : [];
  const endVerseOptions =
    scripture.endBook && scripture.endChapter
      ? getVerseNumbersForChapter(scripture.endBook, scripture.endChapter)
      : scripture.startBook && scripture.endChapter
      ? getVerseNumbersForChapter(scripture.startBook, scripture.endChapter)
      : [];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">구절 {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>시작 성경책</Label>
            <Select
              value={scripture.startBook}
              onValueChange={(value: string) => {
                const newStartBookIndex = [
                  ...OLD_TESTAMENT_BOOKS,
                  ...NEW_TESTAMENT_BOOKS,
                ].findIndex((book) => book.name === value);
                const currentEndBookIndex = scripture.endBook
                  ? [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS].findIndex(
                      (book) => book.name === scripture.endBook
                    )
                  : -1;

                // 끝 성경책이 시작 성경책보다 앞에 있으면 초기화
                const shouldResetEndBook =
                  currentEndBookIndex >= 0 &&
                  currentEndBookIndex < newStartBookIndex;

                onUpdate(index, {
                  startBook: value,
                  startChapter: 1,
                  startVerse: undefined,
                  endBook: shouldResetEndBook ? undefined : scripture.endBook,
                  endChapter: shouldResetEndBook
                    ? undefined
                    : scripture.endChapter,
                  endVerse: shouldResetEndBook ? undefined : scripture.endVerse,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="성경책 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>구약</SelectLabel>
                  {OLD_TESTAMENT_BOOKS.map((book) => (
                    <SelectItem key={book.id} value={book.name}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>신약</SelectLabel>
                  {NEW_TESTAMENT_BOOKS.map((book) => (
                    <SelectItem key={book.id} value={book.name}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>시작 장</Label>
            <Select
              value={scripture.startChapter.toString()}
              onValueChange={(value: string) =>
                onUpdate(index, {
                  startChapter: parseInt(value),
                  startVerse: undefined,
                })
              }
              disabled={!scripture.startBook}
            >
              <SelectTrigger>
                <SelectValue placeholder="장" />
              </SelectTrigger>
              <SelectContent>
                {startChapterOptions.map((chapter) => (
                  <SelectItem key={chapter} value={chapter.toString()}>
                    {chapter}장
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>시작 절 (선택)</Label>
            <Select
              value={scripture.startVerse?.toString() || ""}
              onValueChange={(value: string) =>
                onUpdate(index, {
                  startVerse: value ? parseInt(value) : undefined,
                })
              }
              disabled={!scripture.startBook || !scripture.startChapter}
            >
              <SelectTrigger>
                <SelectValue placeholder="절" />
              </SelectTrigger>
              <SelectContent>
                {startVerseOptions.map((verse) => (
                  <SelectItem key={verse} value={verse.toString()}>
                    {verse}절
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>끝 성경책 (선택)</Label>
            <Select
              value={scripture.endBook || ""}
              onValueChange={(value: string) =>
                onUpdate(index, {
                  endBook: value || undefined,
                  endChapter: undefined,
                  endVerse: undefined,
                })
              }
              disabled={!scripture.startBook}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>구약</SelectLabel>
                  {availableEndBooks
                    .filter((book) => book.testament === "old")
                    .map((book) => (
                      <SelectItem key={book.id} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>신약</SelectLabel>
                  {availableEndBooks
                    .filter((book) => book.testament === "new")
                    .map((book) => (
                      <SelectItem key={book.id} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>끝 장 (선택)</Label>
            <Select
              value={scripture.endChapter?.toString() || ""}
              onValueChange={(value: string) =>
                onUpdate(index, {
                  endChapter: value ? parseInt(value) : undefined,
                  endVerse: undefined,
                })
              }
              disabled={!scripture.endBook}
            >
              <SelectTrigger>
                <SelectValue placeholder="장" />
              </SelectTrigger>
              <SelectContent>
                {endChapterOptions.map((chapter) => (
                  <SelectItem key={chapter} value={chapter.toString()}>
                    {chapter}장
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>끝 절 (선택)</Label>
            <Select
              value={scripture.endVerse?.toString() || ""}
              onValueChange={(value: string) =>
                onUpdate(index, {
                  endVerse: value ? parseInt(value) : undefined,
                })
              }
              disabled={!scripture.endChapter}
            >
              <SelectTrigger>
                <SelectValue placeholder="절" />
              </SelectTrigger>
              <SelectContent>
                {endVerseOptions.map((verse) => (
                  <SelectItem key={verse} value={verse.toString()}>
                    {verse}절
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};
