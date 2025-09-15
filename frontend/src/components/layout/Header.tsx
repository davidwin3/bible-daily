import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { User, Settings } from "lucide-react";

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
        <Link
          to="/"
          className="flex items-center gap-3 font-bold text-xl text-primary"
        >
          <span>Bible Daily</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">관리자</span>
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage} alt={user.realName} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
