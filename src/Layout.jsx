import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  CheckSquare,
  Link2,
  Building2,
  LogOut,
  DollarSign
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";


const navigationItems = [
  {
    title: "לוח בקרה",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "לידים",
    url: createPageUrl("Leads"),
    icon: Users,
  },
  {
    title: "הצעות מחיר",
    url: createPageUrl("Quotes"),
    icon: FileText,
  },
  {
    title: "פרויקטים",
    url: createPageUrl("Projects"),
    icon: FolderOpen,
  },
  {
    title: "משימות",
    url: createPageUrl("Tasks"),
    icon: CheckSquare,
  },
  {
    title: "קישורים",
    url: createPageUrl("Links"),
    icon: Link2,
  },
  {
    title: "גבייה",
    url: createPageUrl("CollectionDashboard"),
    icon: DollarSign,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if this is a minimal/public form view (WorkLogForm)
  const isMinimalView = currentPageName === 'WorkLogForm';

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
    }
    return name.charAt(0);
  }

  // Render minimal layout for public forms
  if (isMinimalView) {
    return (
      <div dir="rtl" className="w-full min-h-screen bg-slate-50">
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      <style>{`
        :root {
          --primary: #1e3a8a;
          --primary-light: #3b82f6;
          --success: #10b981;
          --warning: #f59e0b;
          --danger: #ef4444;
          --background: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --text: #1e293b;
          --muted: #64748b;
        }
      `}</style>
      <SidebarProvider>
        <div className="flex w-full">
          <Sidebar side="right" className="border-l border-slate-200">
            <SidebarHeader className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-slate-900 text-base md:text-lg">ארגמן מערכת ניהול</h2>
                  <p className="text-xs text-slate-500">ניהול מכירות ופרויקטים</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-2">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-2 text-right">
                  ניווט
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-3 text-right">
                            <span className="font-medium text-sm">{item.title}</span>
                            <item.icon className="w-4 h-4 mr-auto" />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-2">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-right h-auto py-2 px-2">
                          <div className="flex items-center gap-3 w-full">
                              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-slate-600 font-medium text-sm">
                                      {user ? getInitials(user.full_name || user.email) : '...'}
                                  </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{user ? (user.full_name || user.email) : 'טוען...'}</p>
                                  <p className="text-xs text-slate-500 truncate">{user ? user.email : '...'}</p>
                              </div>
                          </div>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal text-right">
                          <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{user ? (user.full_name || user.email) : ''}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                  {user ? user.email : ''}
                              </p>
                          </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-right cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                          <LogOut className="ml-2 h-4 w-4" />
                          <span>התנתקות</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-h-screen">
            {/* Mobile Header with hamburger menu */}
            <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-sm sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">ארגמן מערכת ניהול</h1>
                </div>
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200 -mr-2" />
              </div>
            </header>

            {/* Desktop Header - optional */}
            <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 shadow-sm items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              </div>
            </header>

            {/* Main content area */}
            <div className="flex-1 overflow-auto bg-slate-50">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
