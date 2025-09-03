import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  detectInAppBrowser,
  bypassInAppBrowser,
  type InAppBrowserInfo,
} from "@/lib/inapp-browser-utils";
import {
  InAppBrowserHandler,
  InAppBrowserAlert,
} from "@/components/common/InAppBrowserHandler";
import {
  Smartphone,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export function InAppTestPage() {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);
  const [showFullHandler, setShowFullHandler] = useState(false);

  const handleDetect = () => {
    const info = detectInAppBrowser();
    setBrowserInfo(info);
  };

  const handleBypass = () => {
    bypassInAppBrowser();
  };

  const getBrowserTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      kakaotalk: "default",
      line: "secondary",
      naver: "destructive",
      instagram: "outline",
      facebook: "outline",
      other: "secondary",
      none: "outline",
    };

    return (
      <Badge variant={variants[type] || "outline"}>
        {type === "none" ? "일반 브라우저" : type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">인앱 브라우저 테스트</h1>
          <p className="text-muted-foreground">
            카카오톡, 라인 등 인앱 브라우저에서 외부 브라우저로 우회하는 기능을
            테스트합니다.
          </p>
        </div>

        {/* 인앱 브라우저 알림 */}
        <InAppBrowserAlert />

        {/* 브라우저 감지 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              브라우저 감지 결과
            </CardTitle>
            <CardDescription>
              현재 접속한 브라우저의 정보를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleDetect} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              브라우저 정보 감지
            </Button>

            {browserInfo && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">브라우저 타입:</span>
                  {getBrowserTypeBadge(browserInfo.browserType)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">인앱 브라우저:</span>
                  <Badge
                    variant={browserInfo.isInApp ? "destructive" : "default"}
                  >
                    {browserInfo.isInApp ? "예" : "아니오"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">플랫폼:</span>
                  <Badge variant="outline">
                    {browserInfo.isIOS
                      ? "iOS"
                      : browserInfo.isAndroid
                      ? "Android"
                      : "기타"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="font-medium">User Agent:</span>
                  <p className="text-xs text-muted-foreground break-all p-2 bg-white rounded border">
                    {browserInfo.userAgent}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 우회 테스트 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              외부 브라우저 우회 테스트
            </CardTitle>
            <CardDescription>
              인앱 브라우저에서 외부 브라우저로 이동하는 기능을 테스트합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleBypass}
                variant="default"
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                외부 브라우저로 이동
              </Button>

              <Button
                onClick={() => setShowFullHandler(true)}
                variant="outline"
                className="w-full"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                전체 핸들러 표시
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                • <strong>카카오톡:</strong> kakaotalk:// 스킴 사용
              </p>
              <p>
                • <strong>라인:</strong> openExternalBrowser 파라미터 사용
              </p>
              <p>
                • <strong>Android:</strong> Chrome Intent 사용
              </p>
              <p>
                • <strong>iOS:</strong> 수동 안내 및 클립보드 복사
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 방법 안내 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>카카오톡 또는 라인에서 이 페이지 링크를 공유</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>인앱 브라우저로 링크 열기</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>자동 우회 기능 작동 확인</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>수동 우회 버튼 테스트</span>
              </li>
            </ol>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 팁:</strong> 각 브라우저별로 다른 우회 방법이
                적용됩니다. 개발자 도구 콘솔에서 실행 로그를 확인할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 전체 핸들러 모달 */}
        {showFullHandler && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <InAppBrowserHandler autoRedirect={false} showWarning={true} />
              <div className="p-4">
                <Button
                  onClick={() => setShowFullHandler(false)}
                  variant="outline"
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
