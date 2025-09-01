import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { completeEmailSignIn, checkEmailSignInLink } from '@/lib/email-auth';
import { useAuth } from '@/contexts/auth';

export const EmailAuthCallbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleEmailSignIn = async () => {
      try {
        // 이메일 인증 링크인지 확인
        if (!checkEmailSignInLink()) {
          setError('유효하지 않은 인증 링크입니다.');
          setLoading(false);
          return;
        }

        // 이메일 인증 완료
        await completeEmailSignIn(window.location.href);
        setSuccess(true);
        
        // 3초 후 홈으로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
        
      } catch (error: any) {
        console.error('Email sign-in failed:', error);
        setError(error.message || '인증 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    // 이미 로그인된 경우 홈으로 리다이렉트
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    handleEmailSignIn();
  }, [navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>인증 처리 중...</CardTitle>
            <CardDescription>잠시만 기다려주세요</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">로그인 성공!</CardTitle>
            <CardDescription>
              이메일 인증이 완료되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                환영합니다! 곧 홈 페이지로 이동합니다.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate('/', { replace: true })}
              className="w-full"
            >
              홈으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">인증 실패</CardTitle>
          <CardDescription>
            이메일 인증 처리 중 문제가 발생했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>다음 사항을 확인해보세요:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>인증 링크가 만료되지 않았는지 확인</li>
              <li>같은 기기와 브라우저에서 링크를 클릭했는지 확인</li>
              <li>이메일 링크를 완전히 클릭했는지 확인</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인 페이지로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
