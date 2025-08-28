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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth";
import { usePosts } from "@/hooks/usePosts";
import { LikeButton } from "@/components/ui/LikeButton";
import {
  PlusIcon,
  SearchIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
} from "lucide-react";

export const PostsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: postsData,
    isLoading,
    error,
  } = usePosts({
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR");
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">소감 게시판</h1>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">소감 게시판</h1>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-red-500">
            게시글을 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      </div>
    );
  }

  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;
  const totalPages = postsData?.totalPages || 1;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">소감 게시판</h1>
          <p className="text-muted-foreground">
            총 {total}개의 소감이 있습니다
          </p>
        </div>
        {user && (
          <Button
            onClick={() => navigate("/posts/new")}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            소감 작성
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목이나 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                아직 작성된 소감이 없습니다.
              </p>
              {user && (
                <Button
                  onClick={() => navigate("/posts/new")}
                  className="mt-4"
                  variant="outline"
                >
                  첫 번째 소감 작성하기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle
                    className="text-lg line-clamp-1 cursor-pointer"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    {post.title}
                  </CardTitle>
                  <LikeButton
                    postId={post.id}
                    likeCount={post.likeCount}
                    authorId={post.author.id}
                    className="shrink-0"
                  />
                </div>
                {post.bibleVerse && (
                  <Badge variant="secondary" className="w-fit">
                    {post.bibleVerse}
                  </Badge>
                )}
              </CardHeader>
              <CardContent
                className="pt-0"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <CardDescription className="text-sm mb-4 line-clamp-2 cursor-pointer">
                  {truncateContent(post.content)}
                </CardDescription>
                <Separator className="my-3" />
                <div className="flex justify-between items-center text-sm text-muted-foreground cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {post.author.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};
