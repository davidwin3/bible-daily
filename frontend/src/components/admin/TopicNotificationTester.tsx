/**
 * 토픽별 알림 테스트 컴포넌트
 * 관리자가 각 토픽에 대해 테스트 알림을 보낼 수 있습니다
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  NOTIFICATION_TOPICS,
  TOPIC_DESCRIPTIONS,
  type NotificationTopic,
  getAllTopics,
} from "@/lib/notification-topics";
import {
  useSendTopicNotification,
  useSubscribeAllToTopic,
  type TopicNotificationPayload,
} from "@/hooks/useAdmin";

export function TopicNotificationTester() {
  const [selectedTopic, setSelectedTopic] = useState<NotificationTopic | "">(
    ""
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [customData, setCustomData] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const sendTopicNotification = useSendTopicNotification();
  const subscribeAllToTopic = useSubscribeAllToTopic();

  const allTopics = getAllTopics();

  // 토픽별 기본 메시지 템플릿
  const getDefaultMessage = (topic: NotificationTopic) => {
    const templates = {
      [NOTIFICATION_TOPICS.NEW_MISSIONS]: {
        title: "📖 새로운 미션이 등록되었습니다!",
        body: "새로운 성경 읽기 미션을 확인하고 참여해보세요. 말씀으로 하루를 시작하세요!",
      },
      [NOTIFICATION_TOPICS.MISSION_REMINDERS]: {
        title: "⏰ 미션 리마인더",
        body: "오늘의 성경 읽기 미션을 아직 완료하지 않으셨네요. 지금 바로 말씀과 함께하세요!",
      },
      [NOTIFICATION_TOPICS.COMMUNITY_UPDATES]: {
        title: "💬 새로운 커뮤니티 소식",
        body: "교회 커뮤니티에 새로운 게시글과 나눔이 올라왔습니다. 함께 소통해보세요!",
      },
      [NOTIFICATION_TOPICS.ANNOUNCEMENTS]: {
        title: "📢 중요한 공지사항",
        body: "교회에서 전하는 중요한 소식이 있습니다. 꼭 확인해주세요!",
      },
    };

    return templates[topic];
  };

  const handleTopicSelect = (topic: NotificationTopic) => {
    setSelectedTopic(topic);
    const defaultMsg = getDefaultMessage(topic);
    setTitle(defaultMsg.title);
    setBody(defaultMsg.body);
    setCustomData(JSON.stringify({ topic, testMessage: "true" }, null, 2));
    setResult(null);
  };

  const handleSendNotification = async () => {
    if (!selectedTopic || !title || !body) {
      setResult({
        success: false,
        message: "토픽, 제목, 내용을 모두 입력해주세요.",
      });
      return;
    }

    try {
      let parsedData = {};
      if (customData.trim()) {
        parsedData = JSON.parse(customData);
      }

      const payload: TopicNotificationPayload = {
        topic: selectedTopic,
        title,
        body,
        data: parsedData,
      };

      const response = await sendTopicNotification.mutateAsync(payload);

      setResult({
        success: response.success,
        message: response.success
          ? `${TOPIC_DESCRIPTIONS[selectedTopic].name} 토픽으로 알림이 성공적으로 전송되었습니다!`
          : `알림 전송 실패: ${response.error || "알 수 없는 오류"}`,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
      setResult({
        success: false,
        message: "알림 전송 중 오류가 발생했습니다.",
      });
    }
  };

  const handleSubscribeAllToTopic = async () => {
    if (!selectedTopic) {
      setResult({
        success: false,
        message: "토픽을 선택해주세요.",
      });
      return;
    }

    try {
      const response = await subscribeAllToTopic.mutateAsync(selectedTopic);
      setResult({
        success: response.success,
        message: response.success
          ? `모든 활성 사용자가 ${TOPIC_DESCRIPTIONS[selectedTopic].name} 토픽에 구독되었습니다.`
          : `구독 처리 실패: ${response.error || "알 수 없는 오류"}`,
      });
    } catch (error) {
      console.error("Failed to subscribe all to topic:", error);
      setResult({
        success: false,
        message: "토픽 구독 처리 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          토픽별 알림 테스트
        </CardTitle>
        <CardDescription>
          각 토픽별로 테스트 알림을 전송하고 구독 관리를 할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 토픽 선택 */}
        <div className="space-y-2">
          <Label htmlFor="topic-select">알림 토픽 선택</Label>
          <Select value={selectedTopic} onValueChange={handleTopicSelect}>
            <SelectTrigger>
              <SelectValue placeholder="테스트할 토픽을 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {allTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  <div className="flex items-center gap-2">
                    <span>{TOPIC_DESCRIPTIONS[topic].name}</span>
                    {TOPIC_DESCRIPTIONS[topic].isEssential && (
                      <Badge variant="secondary" className="text-xs">
                        필수
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTopic && (
            <p className="text-sm text-muted-foreground">
              {TOPIC_DESCRIPTIONS[selectedTopic].description}
            </p>
          )}
        </div>

        {/* 알림 내용 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">알림 제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">알림 내용</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* 추가 데이터 */}
        <div className="space-y-2">
          <Label htmlFor="custom-data">추가 데이터 (JSON 형식, 선택사항)</Label>
          <Textarea
            id="custom-data"
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            placeholder='{ "key": "value" }'
            className="min-h-[100px] font-mono text-sm"
          />
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSendNotification}
            disabled={
              !selectedTopic ||
              !title ||
              !body ||
              sendTopicNotification.isPending
            }
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {sendTopicNotification.isPending
              ? "전송 중..."
              : "테스트 알림 전송"}
          </Button>

          <Button
            variant="outline"
            onClick={handleSubscribeAllToTopic}
            disabled={!selectedTopic || subscribeAllToTopic.isPending}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {subscribeAllToTopic.isPending ? "처리 중..." : "모든 사용자 구독"}
          </Button>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div
            className={`p-4 rounded-md border ${
              result.success
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`h-4 w-4 ${
                  result.success ? "text-green-600" : "text-red-600"
                }`}
              />
              <span
                className={result.success ? "text-green-800" : "text-red-800"}
              >
                {result.message}
              </span>
            </div>
          </div>
        )}

        {/* 토픽별 설정 정보 */}
        {selectedTopic && (
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {TOPIC_DESCRIPTIONS[selectedTopic].name} 설정 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>토픽 ID:</strong> {selectedTopic}
              </div>
              <div>
                <strong>설명:</strong>{" "}
                {TOPIC_DESCRIPTIONS[selectedTopic].description}
              </div>
              <div>
                <strong>타입:</strong>{" "}
                {TOPIC_DESCRIPTIONS[selectedTopic].isEssential ? (
                  <Badge variant="secondary">필수 토픽</Badge>
                ) : (
                  <Badge variant="outline">선택 토픽</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
