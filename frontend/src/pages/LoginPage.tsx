import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Info, Smartphone, Globe, Mail } from 'lucide-react';
import { EmailAuthForm } from '@/components/EmailAuthForm';

export const LoginPage: React.FC = () => {
  const { login, user, loading, error, isWebView, isSecure, clearError } = useAuth();
  const navigate = useNavigate();
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      clearError();
      await login();
    } catch (error: unknown) {
      console.error('Login failed:', error);
      // 에러는 AuthContext에서 처리됨
      
      // 보안 브라우저 정책 관련 에러인 경우 가이드 표시
      const errorMessage = (error as { message?: string }).message || '';
      const errorCode = (error as { code?: string }).code || '';
      
      if (errorMessage.includes('보안 브라우저') || 
          errorCode === 'auth/unauthorized-domain') {
        setShowBrowserGuide(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 이메일 인증 폼 표시
  if (showEmailAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <EmailAuthForm onBack={() => setShowEmailAuth(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Bible Daily</CardTitle>
          <CardDescription>
            성경말씀을 나누고 소통하는 공간에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 브라우저 환경 정보 */}
          <div className="flex gap-2 justify-center">
            {isWebView && (
              <Badge variant="outline" className="text-xs">
                <Smartphone className="w-3 h-3 mr-1" />
                앱 내 브라우저
              </Badge>
            )}
            {!isSecure && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                보안 취약
              </Badge>
            )}
            {isSecure && !isWebView && (
              <Badge variant="default" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                안전한 브라우저
              </Badge>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 브라우저 가이드 */}
          {(showBrowserGuide || isWebView) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">로그인 문제가 발생했나요?</div>
                <div className="text-sm space-y-1">
                  <p>• 일반 브라우저(Chrome, Safari 등)에서 접속해보세요</p>
                  <p>• 앱 내 브라우저가 아닌 기본 브라우저를 사용해주세요</p>
                  <p>• HTTPS 연결인지 확인해주세요</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              구글 계정으로 간편하게 시작하세요
            </p>
            {isWebView && (
              <p className="text-xs text-orange-600">
                앱 내 브라우저에서는 리다이렉트 방식으로 로그인됩니다
              </p>
            )}
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
              '구글로 로그인'
            )}
          </Button>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 이메일 인증 버튼 */}
          <Button
            variant="outline"
            onClick={() => setShowEmailAuth(true)}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            <Mail className="w-4 h-4 mr-2" />
            이메일로 로그인
          </Button>

          {/* 추가 도움말 */}
          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrowserGuide(!showBrowserGuide)}
              className="text-xs text-muted-foreground"
            >
              로그인에 문제가 있나요?
            </Button>
            
            {(isWebView || !isSecure) && (
              <p className="text-xs text-orange-600">
                문제가 계속되면 이메일 로그인을 시도해보세요
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
