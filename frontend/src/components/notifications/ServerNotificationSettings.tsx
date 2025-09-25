import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BellIcon,
  HeartIcon,
  MessageSquareIcon,
  TargetIcon,
} from "lucide-react";

interface ServerNotificationPreferences {
  newMission: boolean;
  newLike: boolean;
  cellMessages: boolean;
}

interface ServerNotificationSettingsProps {
  settings: ServerNotificationPreferences;
  onUpdateSetting: <K extends keyof ServerNotificationPreferences>(
    key: K,
    value: ServerNotificationPreferences[K]
  ) => void;
}

export const ServerNotificationSettings: React.FC<
  ServerNotificationSettingsProps
> = ({ settings, onUpdateSetting }) => {
  return (
    <Card className="border-0 shadow-sm rounded-xl">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
            <BellIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          서버 알림
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          서버에서 전송되는 실시간 알림들을 설정할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 space-y-6">
        <div className="flex items-start justify-between min-h-[44px]">
          <div className="flex-1 min-w-0 pr-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2 leading-tight">
              <TargetIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              새 미션 등록 알림
            </Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              새로운 성경 읽기 미션이 등록되면 알림을 받습니다
            </p>
          </div>
          <Switch
            checked={settings.newMission}
            onCheckedChange={(checked) =>
              onUpdateSetting("newMission", checked)
            }
            className="flex-shrink-0"
          />
        </div>

        <Separator className="my-4" />

        <div className="flex items-start justify-between min-h-[44px]">
          <div className="flex-1 min-w-0 pr-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2 leading-tight">
              <HeartIcon className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              좋아요 알림
            </Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              내 소감에 좋아요가 달리면 알림을 받습니다
            </p>
          </div>
          <Switch
            checked={settings.newLike}
            onCheckedChange={(checked) => onUpdateSetting("newLike", checked)}
            className="flex-shrink-0"
          />
        </div>

        <Separator className="my-4" />

        <div className="flex items-start justify-between min-h-[44px]">
          <div className="flex-1 min-w-0 pr-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2 leading-tight">
              <MessageSquareIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              셀 메시지 알림
            </Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              셀 담당자의 독려 메시지를 알림으로 받습니다
            </p>
          </div>
          <Switch
            checked={settings.cellMessages}
            onCheckedChange={(checked) =>
              onUpdateSetting("cellMessages", checked)
            }
            className="flex-shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
};
