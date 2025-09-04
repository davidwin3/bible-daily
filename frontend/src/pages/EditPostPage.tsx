import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { usePost, useUpdatePost } from "@/hooks/usePosts";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";

interface EditPostForm {
  title: string;
  content: string;
  bibleVerse: string;
}

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<EditPostForm>({
    title: "",
    content: "",
    bibleVerse: "",
  });
  const [errors, setErrors] = useState<Partial<EditPostForm>>({});

  const { data: post, isLoading, error } = usePost(id!);
  const updatePostMutation = useUpdatePost();

  // 게시물 데이터로 폼 초기화
  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!user) {
      navigate("/login");
      return;
    }
    if (post) {
      // 게시물 작성자가 아니면 접근 불가
      if (post.author.id !== user.id) {
        alert("수정 권한이 없습니다.");
        navigate(`/posts/${id}`);
        return;
      }

      setForm({
        title: post.title,
        content: post.content,
        bibleVerse: post.bibleVerse || "",
      });
    }
  }, [post, user?.id, id, navigate]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<EditPostForm> = {};

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

    updatePostMutation.mutate(
      { id: id!, data: postData },
      {
        onSuccess: () => {
          // 성공적으로 수정되면 상세 페이지로 이동
          navigate(`/posts/${id}`);
        },
        onError: (error: unknown) => {
          console.error("Failed to update post:", error);

          // 서버 에러 처리
          const errorResponse = error as {
            response?: { data?: { message?: string | string[] } };
          };
          if (errorResponse.response?.data?.message) {
            if (Array.isArray(errorResponse.response.data.message)) {
              // 유효성 검사 에러
              const serverErrors: Partial<EditPostForm> = {};
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
            alert("소감 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
          }
        },
      }
    );
  };

  const handleInputChange = (field: keyof EditPostForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/posts/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            뒤로가기
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6 pb-20">
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
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">게시물을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/posts/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">소감 수정</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>소감 수정하기</CardTitle>
          <CardDescription>
            오늘 읽은 말씀에 대한 소감을 수정해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                type="text"
                placeholder="소감의 제목을 입력해주세요"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                placeholder="오늘 읽은 말씀에 대한 소감을 자유롭게 나누어주세요"
                value={form.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className={`min-h-[200px] ${
                  errors.content ? "border-red-500" : ""
                }`}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {form.content.length}/1000자
              </p>
            </div>

            {/* 성경 구절 */}
            <div className="space-y-2">
              <Label htmlFor="bibleVerse">관련 성경 구절 (선택사항)</Label>
              <Input
                id="bibleVerse"
                type="text"
                placeholder="예: 요한복음 3:16"
                value={form.bibleVerse}
                onChange={(e) =>
                  handleInputChange("bibleVerse", e.target.value)
                }
                className={errors.bibleVerse ? "border-red-500" : ""}
              />
              {errors.bibleVerse && (
                <p className="text-sm text-red-500">{errors.bibleVerse}</p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={updatePostMutation.isPending}
                className="flex-1"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {updatePostMutation.isPending ? "수정 중..." : "수정하기"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/posts/${id}`)}
                disabled={updatePostMutation.isPending}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
