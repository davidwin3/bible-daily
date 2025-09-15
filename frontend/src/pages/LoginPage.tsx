import { useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const { login, user, loading, pendingRegistration } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    } else if (pendingRegistration) {
      navigate("/complete-registration", { replace: true });
    }
  }, [user, pendingRegistration, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Bible Daily
          </CardTitle>
          <CardDescription>
            성경말씀을 나누고 소통하는 공간에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              구글 계정으로 간편하게 시작하세요
            </p>
          </div>
          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그인 중...
              </>
            ) : (
              "구글로 로그인"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
