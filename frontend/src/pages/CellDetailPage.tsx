import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { dayjsUtils } from "@/lib/dayjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth";
import {
  useCell,
  useIsLeader,
  useAddCellMember,
  useRemoveCellMember,
} from "@/hooks/useCells";
import {
  ArrowLeftIcon,
  UsersIcon,
  CrownIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  MoreVerticalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CellDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { data: cell, isLoading, error } = useCell(id!);
  const { data: leadershipData } = useIsLeader(id!);
  const addMemberMutation = useAddCellMember();
  const removeMemberMutation = useRemoveCellMember();

  const isLeader = leadershipData?.isLeader || false;
  const isAdmin = user?.role === "admin";
  const canManage = isLeader || isAdmin;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !id) return;

    try {
      // 실제로는 이메일로 사용자 조회 API가 필요하지만,
      // 여기서는 간단히 userId를 직접 입력받는 것으로 구현
      await addMemberMutation.mutateAsync({
        cellId: id,
        userId: userEmail, // 실제로는 이메일로 userId를 찾아야 함
      });
      setUserEmail("");
      setAddMemberDialogOpen(false);
    } catch (error) {
      console.error("멤버 추가 실패:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    if (!confirm("정말로 이 멤버를 셀에서 제거하시겠습니까?")) return;

    try {
      await removeMemberMutation.mutateAsync({
        cellId: id,
        memberId,
      });
    } catch (error) {
      console.error("멤버 제거 실패:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return dayjsUtils.formatKorean(dateString);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="animate-pulse space-y-4">
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardHeader>
          </Card>
          <Card>
            <CardContent className="py-6">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4 mt-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !cell) {
    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">셀을 찾을 수 없습니다.</p>
            <Button
              onClick={() => navigate("/cells")}
              className="mt-4"
              variant="outline"
            >
              셀 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cells")}
          className="p-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">셀 상세</h1>
      </div>

      {/* 셀 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{cell.name}</CardTitle>
              {cell.description && (
                <CardDescription className="mt-2 whitespace-pre-wrap">
                  {cell.description}
                </CardDescription>
              )}
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/cells/${id}/edit`)}
                  >
                    셀 수정
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="text-destructive">
                      셀 삭제
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{cell.leader.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{cell.leader.name}</p>
                  <CrownIcon className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">셀 리더</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <UsersIcon className="h-3 w-3" />
              {cell.memberCount || 0}명
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 멤버 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>셀 멤버</CardTitle>
            {canManage && (
              <Dialog
                open={addMemberDialogOpen}
                onOpenChange={setAddMemberDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    멤버 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 멤버 추가</DialogTitle>
                    <DialogDescription>
                      추가할 멤버의 사용자 ID를 입력해주세요
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <Label htmlFor="userEmail">사용자 ID</Label>
                      <Input
                        id="userEmail"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="사용자 ID를 입력하세요"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddMemberDialogOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        disabled={addMemberMutation.isPending}
                      >
                        {addMemberMutation.isPending ? "추가 중..." : "추가"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cell.members && cell.members.length > 0 ? (
            <div className="space-y-3">
              {cell.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.profileImage} />
                      <AvatarFallback>
                        {member.user.realName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.realName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(member.joinedAt)} 참여
                      </div>
                    </div>
                  </div>
                  {canManage && member.user.id !== cell.leader.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">아직 멤버가 없습니다</p>
              {canManage && (
                <Button
                  onClick={() => setAddMemberDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  첫 번째 멤버 추가하기
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
