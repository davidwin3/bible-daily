import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth";
import { useCells, useUserCell } from "@/hooks/useCells";
import { UsersIcon, UserCheckIcon, CrownIcon, PlusIcon } from "lucide-react";

export const CellsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cells, isLoading: cellsLoading } = useCells();
  const { data: userCell, isLoading: userCellLoading } = useUserCell();

  if (cellsLoading || userCellLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 페이지 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">셀 관리</CardTitle>
          <CardDescription>
            소그룹 셀을 통해 함께 성장하고 격려해보세요
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 내 셀 정보 */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheckIcon className="h-5 w-5" />내 셀 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userCell ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{userCell.name}</h3>
                    {userCell.description && (
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                        {userCell.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/cells/${userCell.id}`)}
                  >
                    상세보기
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CrownIcon className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">리더</span>
                    <span className="font-medium">{userCell.leader.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {userCell.memberCount || 0}명
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  아직 소속된 셀이 없습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  셀 담당자에게 문의하여 셀에 참여해보세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 관리자 기능 */}
      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>관리자 기능</CardTitle>
            <CardDescription>셀을 생성하고 관리할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/cells/new")}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />새 셀 만들기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 모든 셀 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">모든 셀</h2>
          <span className="text-sm text-muted-foreground">
            총 {cells?.length || 0}개
          </span>
        </div>

        {cells && cells.length > 0 ? (
          <div className="grid gap-4">
            {cells.map((cell) => (
              <Card
                key={cell.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/cells/${cell.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cell.name}</CardTitle>
                    <Badge variant="outline">{cell.memberCount || 0}명</Badge>
                  </div>
                  {cell.description && (
                    <CardDescription className="line-clamp-2 whitespace-pre-wrap">
                      {cell.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {cell.leader.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{cell.leader.name}</p>
                      <p className="text-xs text-muted-foreground">셀 리더</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">아직 생성된 셀이 없습니다</p>
              {user?.role === "admin" && (
                <Button
                  onClick={() => navigate("/cells/new")}
                  className="mt-4"
                  variant="outline"
                >
                  첫 번째 셀 만들기
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
