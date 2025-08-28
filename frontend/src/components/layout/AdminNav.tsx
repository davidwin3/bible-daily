import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, Users, User } from "lucide-react";

const navItems = [
  {
    title: "대시보드",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "미션 관리",
    href: "/admin/missions",
    icon: BookOpen,
  },
  {
    title: "셀 관리",
    href: "/admin/cells",
    icon: Users,
  },
  {
    title: "사용자 관리",
    href: "/admin/users",
    icon: User,
  },
];

export const AdminNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-muted/50 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
