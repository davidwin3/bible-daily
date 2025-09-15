import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth";

export const CompleteRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { pendingRegistration, completeRegistration, user } = useAuth();

  const [realName, setRealName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 이미 로그인된 사용자나 회원가입이 필요하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    } else if (!pendingRegistration) {
      navigate("/login", { replace: true });
    }
  }, [user, pendingRegistration, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!realName.trim()) {
      setError("실명을 입력해주세요.");
      return;
    }

    if (realName.trim().length < 2) {
      setError("실명은 2자 이상 입력해주세요.");
      return;
    }

    // 정규식으로 한글만 입력되었는지 확인
    if (!/^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+$/.test(realName.trim())) {
      setError("실명은 한글만 입력해주세요.");
      return;
    }

    if (realName.trim().length > 100) {
      setError("실명은 100자 이하로 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await completeRegistration({
        realName: realName.trim(),
        firebaseToken: pendingRegistration!.firebaseToken,
      });

      // 회원가입 완료 후 홈으로 이동
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "회원가입 완료에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중이거나 필요한 데이터가 없으면 아무것도 렌더링하지 않음
  if (!pendingRegistration) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">회원가입 완료</CardTitle>
          <CardDescription>
            은혜로운 나눔을 위해 실명을 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="realName">실명 *</Label>
              <Input
                id="realName"
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="실명을 입력해주세요"
                disabled={isLoading}
                className="w-full"
                maxLength={100}
              />
              <p className="text-sm text-gray-500">
                실명은 다른 사용자들에게 표시되며, 변경이 불가능합니다.
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !realName.trim()}
              className="w-full"
            >
              {isLoading ? "완료 중..." : "회원가입 완료"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
