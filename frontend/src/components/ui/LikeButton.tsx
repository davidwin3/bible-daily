import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleLike, useLikeStatus } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  likeCount: number;
  authorId: string;
  className?: string;
}

export function LikeButton({
  postId,
  likeCount,
  authorId,
  className,
}: LikeButtonProps) {
  const { user } = useAuth();
  const { data: likeStatus } = useLikeStatus(
    postId,
    !!user && user.id !== authorId
  );
  const toggleLikeMutation = useToggleLike();

  // 자신의 게시물인 경우 좋아요 버튼 비활성화
  const isOwnPost = user?.id === authorId;

  // 로그인하지 않은 경우 좋아요 버튼 비활성화
  const isDisabled = !user || isOwnPost || toggleLikeMutation.isPending;

  const handleToggleLike = () => {
    if (isDisabled) return;
    toggleLikeMutation.mutate(postId);
  };

  const isLiked = likeStatus?.liked || false;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isDisabled}
      className={cn(
        "flex items-center gap-1 text-muted-foreground hover:text-foreground",
        isLiked && "text-red-500 hover:text-red-600",
        isDisabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4 transition-colors", isLiked && "fill-current")}
      />
      <span className="text-sm">{likeCount}</span>
    </Button>
  );
}
