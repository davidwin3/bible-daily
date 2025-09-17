import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ClockIcon, TargetIcon, MoonIcon } from "lucide-react";

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  missionDeadline: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

interface LocalNotificationSettingsProps {
  settings: NotificationSettings;
  onUpdateSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
  getNextReminderDisplay: () => string | null;
}

export const LocalNotificationSettings: React.FC<
  LocalNotificationSettingsProps
> = ({ settings, onUpdateSetting, getNextReminderDisplay }) => {
  return (
    <Card className="border-0 shadow-sm rounded-xl">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="p-2.5 bg-green-50 rounded-xl">
            <ClockIcon className="h-4 w-4 text-green-600" />
          </div>
          로컬 알림
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-gray-600">
          앱에서 자동으로 생성되는 알림들을 설정할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 space-y-6">
        {/* 일일 리마인더 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between min-h-[44px]">
            <div className="flex-1 min-w-0 pr-3">
              <Label className="text-sm font-medium text-gray-900 leading-tight">
                매일 성경 읽기 리마인더
              </Label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                매일 정해진 시간에 성경 읽기 알림을 받습니다
              </p>
            </div>
            <Switch
              checked={settings.dailyReminder}
              onCheckedChange={(checked) =>
                onUpdateSetting("dailyReminder", checked)
              }
              className="flex-shrink-0"
            />
          </div>

          {settings.dailyReminder && (
            <div className="ml-0 pl-4 border-l-2 border-gray-100 space-y-3">
              <div>
                <Label htmlFor="reminderTime" className="text-sm text-gray-700">
                  알림 시간
                </Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) =>
                    onUpdateSetting("dailyReminderTime", e.target.value)
                  }
                  className="w-36 h-10 mt-1"
                />
              </div>

              {getNextReminderDisplay() && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">다음 알림:</span>{" "}
                    {getNextReminderDisplay()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    매일 설정된 시간에 성경 읽기 알림을 받습니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* 미션 마감 알림 */}
        <div className="flex items-start justify-between min-h-[44px]">
          <div className="flex-1 min-w-0 pr-3">
            <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
              <TargetIcon className="h-3.5 w-3.5 text-orange-500" />
              미션 마감 알림
            </Label>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              미션 마감 전에 알림을 받습니다 (오후 9시)
            </p>
          </div>
          <Switch
            checked={settings.missionDeadline}
            onCheckedChange={(checked) =>
              onUpdateSetting("missionDeadline", checked)
            }
            className="flex-shrink-0"
          />
        </div>

        <Separator className="my-4" />

        {/* 방해 금지 시간 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between min-h-[44px]">
            <div className="flex-1 min-w-0 pr-3">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                <MoonIcon className="h-3.5 w-3.5 text-purple-500" />
                방해 금지 시간
              </Label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                지정된 시간 동안에는 알림을 받지 않습니다
              </p>
            </div>
            <Switch
              checked={settings.quietHours}
              onCheckedChange={(checked) =>
                onUpdateSetting("quietHours", checked)
              }
              className="flex-shrink-0"
            />
          </div>

          {settings.quietHours && (
            <div className="ml-0 pl-4 border-l-2 border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quietStart" className="text-sm text-gray-700">
                  시작 시간
                </Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={settings.quietStart}
                  onChange={(e) =>
                    onUpdateSetting("quietStart", e.target.value)
                  }
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quietEnd" className="text-sm text-gray-700">
                  종료 시간
                </Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={settings.quietEnd}
                  onChange={(e) => onUpdateSetting("quietEnd", e.target.value)}
                  className="h-10 mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
