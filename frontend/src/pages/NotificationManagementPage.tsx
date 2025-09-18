import React from "react";
import { AdminNav } from "@/components/layout/AdminNav";
import { TopicSubscriptionSettings } from "@/components/notifications/TopicSubscriptionSettings";
import { AdminNotificationTest } from "@/components/notifications/AdminNotificationTest";
import {
  sendNotificationToToken,
  sendNotificationToUser,
  sendNotificationToTopic,
} from "@/lib/notifications";
import type { NotificationTopic } from "@/lib/notification-topics";

export const NotificationManagementPage: React.FC = () => {
  return (
    <>
      <AdminNav />
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">알림 관리</h1>
          <p className="text-gray-600">토픽 구독 및 알림 전송을 관리하세요.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* 토픽 구독 관리 */}
          <TopicSubscriptionSettings
            onSendToTopic={
              sendNotificationToTopic as (
                topic: NotificationTopic,
                title: string,
                body: string
              ) => Promise<void>
            }
          />

          {/* 관리자 테스트 기능 */}
          <AdminNotificationTest
            onSendToToken={sendNotificationToToken}
            onSendToUser={sendNotificationToUser}
          />
        </div>
      </div>
    </>
  );
};
