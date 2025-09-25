import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BellIcon, CheckIcon, XIcon } from "lucide-react";
import { subscribeToTopic, unsubscribeFromTopic } from "@/lib/notifications";
import { useAuth } from "@/contexts/auth";
import {
  type NotificationTopic,
  type TopicInfo,
  getTopicInfoList,
  ESSENTIAL_TOPICS,
} from "@/lib/notification-topics";

// 기본 구독 상태 (실제로는 서버에서 가져와야 함)
const DEFAULT_SUBSCRIPTION_STATUS: Record<NotificationTopic, boolean> = {
  "new-missions": true,
  "mission-reminders": true,
  "community-updates": false,
  announcements: true,
};

interface TopicSubscriptionSettingsProps {
  onSendToTopic?: (
    topic: NotificationTopic,
    title: string,
    body: string
  ) => Promise<void>;
}

export const TopicSubscriptionSettings: React.FC<
  TopicSubscriptionSettingsProps
> = ({ onSendToTopic }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicInfo[]>(
    getTopicInfoList(DEFAULT_SUBSCRIPTION_STATUS)
  );
  const [isLoading, setIsLoading] = useState<NotificationTopic | null>(null);

  const handleTopicToggle = async (
    topicId: NotificationTopic,
    subscribe: boolean
  ) => {
    if (isLoading) return;

    setIsLoading(topicId);
    try {
      if (subscribe) {
        await subscribeToTopic(topicId);
      } else {
        await unsubscribeFromTopic(topicId);
      }

      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, isSubscribed: subscribe } : topic
        )
      );
    } catch (error) {
      console.error(
        `Failed to ${subscribe ? "subscribe to" : "unsubscribe from"} topic:`,
        error
      );
      // TODO: 사용자에게 에러 알림 표시
    } finally {
      setIsLoading(null);
    }
  };

  const handleTestTopicNotification = async (
    topicId: NotificationTopic,
    topicName: string
  ) => {
    if (!onSendToTopic) return;

    try {
      await onSendToTopic(
        topicId,
        `${topicName} 테스트 알림`,
        `${topicName} 토픽 알림이 정상적으로 작동합니다!`
      );
    } catch (error) {
      console.error("Failed to send topic test notification:", error);
    }
  };

  const getSubscriptionStats = () => {
    const subscribed = topics.filter((t) => t.isSubscribed).length;
    const total = topics.length;
    return { subscribed, total };
  };

  const stats = getSubscriptionStats();

  return (
    <Card className="border-0 shadow-sm rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              토픽 구독 관리
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              관심 있는 알림 카테고리를 선택하세요
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {stats.subscribed}/{stats.total} 구독 중
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-start justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Label
                  htmlFor={`topic-${topic.id}`}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {topic.name}
                </Label>
                {ESSENTIAL_TOPICS.includes(topic.id) && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    필수
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {topic.description}
              </p>

              {/* 구독 상태 표시 */}
              <div className="flex items-center gap-2 mt-2">
                {topic.isSubscribed ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckIcon className="h-3 w-3" />
                    구독 중
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <XIcon className="h-3 w-3" />
                    구독 안함
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {/* 테스트 버튼 (관리자용) */}
              {user?.role === "admin" &&
                onSendToTopic &&
                topic.isSubscribed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleTestTopicNotification(topic.id, topic.name)
                    }
                    className="text-xs px-2 py-1 h-7"
                  >
                    테스트
                  </Button>
                )}

              {/* 구독 토글 스위치 */}
              <Switch
                id={`topic-${topic.id}`}
                checked={topic.isSubscribed}
                onCheckedChange={(checked) =>
                  handleTopicToggle(topic.id, checked)
                }
                disabled={
                  ESSENTIAL_TOPICS.includes(topic.id) || isLoading === topic.id
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        ))}

        {/* 안내 메시지 */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <BellIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <p className="font-medium mb-1">토픽 구독 안내</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 새로운 FCM 토큰은 자동으로 필수 토픽에 구독됩니다</li>
                <li>• 토픽별로 알림을 받을지 선택할 수 있습니다</li>
                <li>• 필수 토픽은 구독 해제할 수 없습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
