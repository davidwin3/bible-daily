import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  MessageSquare,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useTodayMission } from "@/hooks/useMissions";
import { usePosts, type Post } from "@/hooks/usePosts";
import { ScriptureDisplay } from "@/components/common/ScriptureDisplay";
import { OfflineSyncStatus } from "@/components/OfflineSyncStatus";
import { dayjsUtils } from "@/lib/dayjs";

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  const { data: todayMission, isLoading: missionLoading } = useTodayMission();
  const { data: recentPosts, isLoading: postsLoading } = usePosts({ limit: 3 });

  return (
    <div className="space-y-6 pb-20">
      {/* 오프라인 동기화 상태 */}
      <OfflineSyncStatus />

      {/* 환영 메시지 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">
          {user
            ? `안녕하세요, ${user.realName}님!`
            : "Bible Daily에 오신 것을 환영합니다"}
        </h1>
        <p className="text-muted-foreground">
          오늘도 말씀과 함께 은혜로운 하루 되세요
        </p>
      </div>

      {/* 오늘의 미션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>오늘의 미션</CardTitle>
            </div>
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 mr-1" />
              {dayjsUtils.formatKorean(dayjsUtils.now())}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {missionLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ) : todayMission ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-3">
                  {todayMission.title || "오늘의 성경 읽기"}
                </h3>
                <ScriptureDisplay
                  mission={todayMission}
                  variant="compact"
                  allowExpand={true}
                />
              </div>
              {todayMission.description && (
                <p className="text-sm whitespace-pre-wrap">
                  {todayMission.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{todayMission.completionCount || 0}명 완료</span>
                  </div>
                  {todayMission.completionRate && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{Math.round(todayMission.completionRate)}%</span>
                    </div>
                  )}
                </div>
                <Link to="/missions">
                  <Button size="sm">자세히 보기</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                오늘의 미션이 준비되지 않았습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 소감 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>최근 소감</CardTitle>
            </div>
            <Link to="/posts">
              <Button variant="outline" size="sm">
                전체 보기
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentPosts?.posts?.length ? (
            <div className="space-y-4">
              {recentPosts.posts.map((post: Post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <div className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <h4 className="font-medium line-clamp-1">{post.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{post.author.name}</span>
                      <span>{dayjsUtils.formatSimple(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                아직 작성된 소감이 없습니다
              </p>
              {user && (
                <Link to="/posts/new" className="mt-2 inline-block">
                  <Button size="sm">첫 소감 작성하기</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 퀵 액션 */}
      {user && (
        <div className="grid grid-cols-2 gap-4">
          <Link to="/posts/new">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">소감 작성</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/missions">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">미션 보기</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
};
