import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth";
import { dayjsUtils } from "@/lib/dayjs";
import {
  UserIcon,
  BellIcon,
  LogOutIcon,
  SettingsIcon,
  MailIcon,
  CalendarIcon,
  Palette,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardContent className="py-8 text-center">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              프로필을 보려면 로그인이 필요합니다
            </p>
            <Button onClick={() => navigate("/login")} className="mt-4">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profileImage} alt={user.realName} />
              <AvatarFallback className="text-xl">
                {user.realName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.realName}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MailIcon className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {user.createdAt
                    ? dayjsUtils.formatKorean(user.createdAt)
                    : "알 수 없음"}{" "}
                  가입
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설정 메뉴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start ml-7"
            onClick={() => navigate("/notifications")}
          >
            <BellIcon className="h-4 w-4 mr-3" />
            알림 설정
          </Button>

          <Separator />

          {/* 테마 설정 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4" />
              <span>테마 설정</span>
            </div>
          </div>
          <div className="pl-7">
            <ThemeToggle variant="dropdown" />
          </div>

          <Separator />

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-4 w-4 mr-3" />
            로그아웃
          </Button>
        </CardContent>
      </Card>

      {/* 활동 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>내 활동</CardTitle>
          <CardDescription>
            Bible Daily에서의 활동을 확인해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              활동 통계는 곧 추가될 예정입니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
