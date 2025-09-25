import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Smartphone, Copy, AlertTriangle } from "lucide-react";
import {
  detectInAppBrowser,
  bypassInAppBrowser,
  copyToClipboard,
  type InAppBrowserInfo,
} from "@/lib/inapp-browser-utils";

interface InAppBrowserHandlerProps {
  autoRedirect?: boolean;
  showWarning?: boolean;
}

export function InAppBrowserHandler({
  autoRedirect = true,
  showWarning = true,
}: InAppBrowserHandlerProps) {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    const info = detectInAppBrowser();
    setBrowserInfo(info);

    // 인앱 브라우저이고 자동 리다이렉트가 활성화된 경우
    if (info.isInApp && autoRedirect) {
      // 1초 후 자동 우회 시도
      const timer = setTimeout(() => {
        try {
          bypassInAppBrowser();
        } catch (error) {
          console.error("자동 우회 실패:", error);
          setShowManualGuide(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoRedirect]);

  const handleManualRedirect = () => {
    try {
      bypassInAppBrowser();
    } catch (error) {
      console.error("수동 우회 실패:", error);
      setShowManualGuide(true);
    }
  };

  const handleCopyUrl = () => {
    const success = copyToClipboard(window.location.href);
    if (success) {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 3000);
    }
  };

  const getBrowserName = (type: string): string => {
    switch (type) {
      case "kakaotalk":
        return "카카오톡";
      case "line":
        return "라인";
      case "naver":
        return "네이버";
      case "instagram":
        return "인스타그램";
      case "facebook":
        return "페이스북";
      default:
        return "인앱 브라우저";
    }
  };

  // 인앱 브라우저가 아니면 아무것도 렌더링하지 않음
  if (!browserInfo?.isInApp) {
    return null;
  }

  // 경고만 표시하는 경우
  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-xl">인앱 브라우저 호환 문제</CardTitle>
          <CardDescription>
            {getBrowserName(browserInfo.browserType)}에서 접속하셨습니다.
            <br />더 나은 서비스 이용을 위해 외부 브라우저로 접속해주세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!showManualGuide ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  아래 버튼을 눌러 외부 브라우저로 이동하세요.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleManualRedirect}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  {browserInfo.isIOS ? "Safari로 열기" : "Chrome으로 열기"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowManualGuide(true)}
                  className="w-full"
                >
                  수동으로 이동하기
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Copy className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  URL을 복사한 후 외부 브라우저에서 접속해주세요.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCopyUrl}
                  variant={urlCopied ? "default" : "outline"}
                  className="w-full"
                  disabled={urlCopied}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {urlCopied ? "복사 완료!" : "URL 복사하기"}
                </Button>

                {browserInfo.isIOS && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Safari 접속 방법:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>위 버튼을 눌러 URL을 복사</li>
                      <li>Safari 브라우저 실행</li>
                      <li>주소창을 길게 터치</li>
                      <li>'붙여넣기 및 이동' 선택</li>
                    </ol>
                  </div>
                )}

                {browserInfo.isAndroid && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Chrome 접속 방법:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>위 버튼을 눌러 URL을 복사</li>
                      <li>Chrome 브라우저 실행</li>
                      <li>주소창에 붙여넣기</li>
                      <li>이동 버튼 터치</li>
                    </ol>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => setShowManualGuide(false)}
                className="w-full text-sm"
              >
                다시 자동 이동 시도
              </Button>
            </>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              인앱 브라우저에서는 일부 기능이 제한될 수 있습니다.
              <br />
              최적의 경험을 위해 외부 브라우저 사용을 권장합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 인앱 브라우저 감지 시 자동으로 우회를 시도하는 훅
 */
export function useInAppBrowserDetection() {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);

  useEffect(() => {
    const info = detectInAppBrowser();
    setBrowserInfo(info);
  }, []);

  return browserInfo;
}

/**
 * 간단한 인앱 브라우저 알림 컴포넌트
 */
export function InAppBrowserAlert() {
  const browserInfo = useInAppBrowserDetection();

  if (!browserInfo?.isInApp) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <p className="text-sm text-orange-800">
        현재 브라우저에서는 로그인이 원할하지 않을수 있습니다. 외부 브라우저로
        접속해주세요.
        <Button
          variant="link"
          className="p-0 h-auto text-orange-600 underline ml-1"
          onClick={() => bypassInAppBrowser()}
        >
          외부 브라우저로 이동
        </Button>
      </p>
    </div>
  );
}
