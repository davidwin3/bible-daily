import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth";
import { useCreatePost } from "@/hooks/usePosts";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";

interface CreatePostForm {
  title: string;
  content: string;
  bibleVerse: string;
}

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<CreatePostForm>({
    title: "",
    content: "",
    bibleVerse: "",
  });
  const [errors, setErrors] = useState<Partial<CreatePostForm>>({});

  const createPostMutation = useCreatePost();

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    navigate("/login");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreatePostForm> = {};

    if (!form.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    } else if (form.title.length > 200) {
      newErrors.title = "제목은 200자 이하로 입력해주세요.";
    }

    if (!form.content.trim()) {
      newErrors.content = "내용을 입력해주세요.";
    } else if (form.content.length > 1000) {
      newErrors.content = "내용은 1000자 이하로 입력해주세요.";
    }

    if (form.bibleVerse && form.bibleVerse.length > 200) {
      newErrors.bibleVerse = "성경 구절은 200자 이하로 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const postData = {
      title: form.title.trim(),
      content: form.content.trim(),
      bibleVerse: form.bibleVerse.trim() || undefined,
    };

    createPostMutation.mutate(postData, {
      onSuccess: (data) => {
        // 성공적으로 생성되면 상세 페이지로 이동
        navigate(`/posts/${data.id}`);
      },
      onError: (error: unknown) => {
        console.error("Failed to create post:", error);

        // 서버 에러 처리
        const errorResponse = error as {
          response?: { data?: { message?: string | string[] } };
        };
        if (errorResponse.response?.data?.message) {
          if (Array.isArray(errorResponse.response.data.message)) {
            // 유효성 검사 에러
            const serverErrors: Partial<CreatePostForm> = {};
            errorResponse.response.data.message.forEach((msg: string) => {
              if (msg.includes("title")) serverErrors.title = msg;
              if (msg.includes("content")) serverErrors.content = msg;
              if (msg.includes("bibleVerse")) serverErrors.bibleVerse = msg;
            });
            setErrors(serverErrors);
          } else {
            alert(errorResponse.response.data.message);
          }
        } else {
          alert("소감 작성 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      },
    });
  };

  const handleInputChange = (field: keyof CreatePostForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/posts")}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">소감 작성</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>새로운 소감 작성</CardTitle>
          <CardDescription>
            오늘 읽은 성경말씀에 대한 소감을 자유롭게 나누어 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="소감의 제목을 입력해주세요"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={errors.title ? "border-red-500" : ""}
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
                <p className="text-sm text-muted-foreground ml-auto">
                  {form.title.length}/200
                </p>
              </div>
            </div>

            {/* 성경 구절 */}
            <div className="space-y-2">
              <Label htmlFor="bibleVerse">관련 성경 구절 (선택사항)</Label>
              <Input
                id="bibleVerse"
                placeholder="예: 요한복음 3:16, 시편 23편"
                value={form.bibleVerse}
                onChange={(e) =>
                  handleInputChange("bibleVerse", e.target.value)
                }
                className={errors.bibleVerse ? "border-red-500" : ""}
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                {errors.bibleVerse && (
                  <p className="text-sm text-red-500">{errors.bibleVerse}</p>
                )}
                <p className="text-sm text-muted-foreground ml-auto">
                  {form.bibleVerse.length}/200
                </p>
              </div>
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">소감 내용 *</Label>
              <Textarea
                id="content"
                placeholder="성경말씀을 읽고 느낀 점, 깨달은 점, 적용하고 싶은 점 등을 자유롭게 나누어 주세요."
                value={form.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className={`min-h-[200px] ${
                  errors.content ? "border-red-500" : ""
                }`}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
                <p className="text-sm text-muted-foreground ml-auto">
                  {form.content.length}/1000
                </p>
              </div>
            </div>

            {/* 작성 가이드 */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 소감 작성 팁</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 성경말씀을 읽으며 마음에 와닿은 부분을 나누어 보세요</li>
                <li>• 일상생활에 어떻게 적용할 수 있을지 생각해보세요</li>
                <li>
                  • 다른 친구들에게 격려가 될 수 있는 내용으로 작성해주세요
                </li>
                <li>• 욕설이나 부적절한 내용은 삼가해 주세요</li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/posts")}
                disabled={createPostMutation.isPending}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={
                  createPostMutation.isPending ||
                  !form.title.trim() ||
                  !form.content.trim()
                }
                className="flex-1 flex items-center gap-2"
              >
                {createPostMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                {createPostMutation.isPending ? "작성 중..." : "소감 작성"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
