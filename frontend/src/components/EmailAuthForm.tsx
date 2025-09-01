import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendEmailSignInLink, validateEmail, validateEmailDomain } from '@/lib/email-auth';

interface EmailAuthFormProps {
  onBack: () => void;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('이메일 주소를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    const domainValidation = validateEmailDomain(email);
    if (!domainValidation.isValid) {
      setError(domainValidation.message || '지원되지 않는 이메일 도메인입니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendEmailSignInLink(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || '이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">이메일을 확인해주세요</CardTitle>
          <CardDescription>
            로그인 링크를 이메일로 전송했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-medium">{email}로 로그인 링크를 전송했습니다.</div>
              <div className="text-sm space-y-1">
                <p>• 이메일함을 확인하고 로그인 링크를 클릭해주세요</p>
                <p>• 링크는 1시간 동안 유효합니다</p>
                <p>• 스팸함도 확인해보세요</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full"
            >
              다른 이메일로 시도
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">이메일로 로그인</CardTitle>
        <CardDescription>
          이메일 주소를 입력하면 로그인 링크를 전송해드립니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일 주소</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  전송 중...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  로그인 링크 전송
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 이메일 링크는 보안상 1시간 후 만료됩니다</p>
            <p>• 같은 기기에서 링크를 클릭해야 합니다</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
