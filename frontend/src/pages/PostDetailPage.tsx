import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth";
import { usePost, useDeletePost } from "@/hooks/usePosts";
import { LikeButton } from "@/components/ui/LikeButton";
import {
  ArrowLeftIcon,
  HeartIcon,
  EditIcon,
  TrashIcon,
  MoreVerticalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: post, isLoading, error } = usePost(id!);
  const deletePostMutation = useDeletePost();

  const handleEdit = () => {
    navigate(`/posts/${id}/edit`);
  };

  const handleDelete = () => {
    if (!confirm("정말로 이 소감을 삭제하시겠습니까?")) {
      return;
    }

    if (id) {
      deletePostMutation.mutate(id, {
        onSuccess: () => {
          navigate("/posts");
        },
        onError: () => {
          alert("소감 삭제 중 오류가 발생했습니다.");
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  if (isLoading) {
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
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {error
                ? "소감을 불러오는 중 오류가 발생했습니다."
                : "소감을 찾을 수 없습니다."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/posts")}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          목록으로
        </Button>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <EditIcon className="h-4 w-4 mr-2" />
                수정하기
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deletePostMutation.isPending}
                className="text-red-600"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {deletePostMutation.isPending ? "삭제 중..." : "삭제하기"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
              {post.bibleVerse && (
                <Badge variant="secondary" className="mb-3">
                  {post.bibleVerse}
                </Badge>
              )}
            </div>
          </div>

          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.profileImage} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.createdAt)}
                  {post.createdAt !== post.updatedAt && " (수정됨)"}
                </p>
              </div>
            </div>

            {/* Like Button */}
            {user && !isAuthor && (
              <LikeButton
                postId={post.id}
                likeCount={post.likeCount || 0}
                authorId={post.author.id}
                className="flex items-center gap-2"
              />
            )}

            {/* Like Count (for non-logged in users or author) */}
            {(!user || isAuthor) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <HeartIcon className="h-4 w-4" />
                {post.likeCount}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Separator className="mb-6" />
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {formatContent(post.content)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Like Button */}
      <div className="flex justify-center">
        <LikeButton
          postId={post.id}
          likeCount={post.likeCount}
          authorId={post.author.id}
          className="text-base"
        />
      </div>

      {/* Login prompt for non-logged in users */}
      {!user && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              소감에 좋아요를 누르거나 소감을 작성하려면 로그인이 필요합니다.
            </p>
            <Button onClick={() => navigate("/login")}>로그인하기</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
