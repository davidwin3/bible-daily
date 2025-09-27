import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";

interface MissionUncompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  missionDate?: string;
}

export const MissionUncompleteDialog: React.FC<
  MissionUncompleteDialogProps
> = ({ open, onOpenChange, onConfirm, missionDate }) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
            미션 완료 취소
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              {missionDate ? `${missionDate} 미션의` : "이 미션의"} 완료 상태를
              취소하시겠습니까?
            </p>
            <p className="text-amber-600 font-medium">
              ⚠️ 미션 완료를 취소하면 연속 완료 기록이 깨질 수 있습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              이 작업은 되돌릴 수 있지만, 연속 완료 통계에 영향을 줄 수
              있습니다.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700"
          >
            완료 취소하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
