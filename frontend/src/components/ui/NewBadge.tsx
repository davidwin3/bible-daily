import { Badge } from "./badge";

interface NewBadgeProps {
  className?: string;
}

export function NewBadge({ className }: NewBadgeProps) {
  return (
    <Badge
      variant="destructive"
      className={`
        absolute -top-2 -right-5
        px-1 py-0.5 
        text-[9px] font-bold 
        min-w-[26px] h-3.5
        flex items-center justify-center
        animate-pulse
        z-10
        ${className}
      `}
    >
      N
    </Badge>
  );
}
