import { HomeIcon, FileText, User, Settings } from "lucide-react";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import IntelligentFormAutomation from "./pages/IntelligentFormAutomation.tsx";
import UserDashboard from "./components/UserDashboard.tsx";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Form Assistant",
    to: "/intelligent-automation",
    icon: <FileText className="h-4 w-4" />,
    page: <IntelligentFormAutomation />,
  },
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: <User className="h-4 w-4" />,
    page: <UserDashboard />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <Settings className="h-4 w-4" />,
    page: <Auth />,
  },
];