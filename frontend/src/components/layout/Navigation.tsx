import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Target, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/posts", label: "소감", icon: MessageSquare },
  { href: "/missions", label: "미션", icon: Target },
  { href: "/cells", label: "셀", icon: Users },
  { href: "/posts/new", label: "작성", icon: Plus },
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex flex-col items-center py-3 px-2 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
