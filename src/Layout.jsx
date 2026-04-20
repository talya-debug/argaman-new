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
      <div dir="rtl" className="w-full min-h-screen" style={{ background: 'var(--dark)' }}>
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <Toaster position="top-center" richColors />
      <SidebarProvider>
        <div className="flex w-full">
          <Sidebar side="right" className="border-l" style={{ borderColor: 'var(--dark-border)' }}>
            <SidebarHeader className="border-b p-4" style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-sidebar)' }}>
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="ארגמן" className="h-10" />
                <div className="text-right">
                  <h2 className="font-bold text-base md:text-lg" style={{ color: 'var(--text-primary)' }}>ארגמן מערכת ניהול</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ניהול מכירות ופרויקטים</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-2" style={{ background: 'var(--dark-sidebar)' }}>
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider px-2 py-2 text-right" style={{ color: 'var(--text-muted)' }}>
                  ניווט
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`transition-all duration-200 rounded-lg mb-1`}
                            style={isActive ? {
                              background: 'var(--argaman-bg)',
                              color: 'var(--argaman-light)',
                              borderRight: '2px solid var(--argaman)',
                            } : {
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-3 text-right hover:opacity-80">
                              <span className="font-medium text-sm">{item.title}</span>
                              <item.icon className="w-4 h-4 mr-auto" />
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-2" style={{ borderColor: 'var(--dark-border)', background: 'var(--dark-sidebar)' }}>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-right h-auto py-2 px-2 hover:opacity-80 transition-all duration-200">
                          <div className="flex items-center gap-3 w-full">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--argaman), var(--argaman-light))' }}>
                                  <span className="text-white font-medium text-sm">
                                      {user ? getInitials(user.full_name || user.email) : '...'}
                                  </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user ? (user.full_name || user.email) : 'טוען...'}</p>
                                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user ? user.email : '...'}</p>
                              </div>
                          </div>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }} align="end" forceMount>
                      <DropdownMenuLabel className="font-normal text-right">
                          <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none" style={{ color: 'var(--text-primary)' }}>{user ? (user.full_name || user.email) : ''}</p>
                              <p className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>
                                  {user ? user.email : ''}
                              </p>
                          </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator style={{ background: 'var(--dark-border)' }} />
                      <DropdownMenuItem onClick={handleLogout} className="text-right cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10 transition-all duration-200">
                          <LogOut className="ml-2 h-4 w-4" />
                          <span>התנתקות</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-h-screen">
            {/* Mobile Header with hamburger menu */}
            <header className="md:hidden border-b px-4 py-3 sticky top-0 z-10" style={{ background: 'var(--dark-sidebar)', borderColor: 'var(--dark-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.jpg" alt="ארגמן" className="h-8" />
                  <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>ארגמן מערכת ניהול</h1>
                </div>
                <SidebarTrigger className="p-2 rounded-lg transition-colors duration-200 -mr-2" style={{ color: 'var(--text-secondary)' }} />
              </div>
            </header>

            {/* Desktop Header */}
            <header className="hidden md:flex border-b px-6 py-3 items-center justify-between" style={{ background: 'var(--dark-sidebar)', borderColor: 'var(--dark-border)' }}>
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 rounded-lg transition-colors duration-200" style={{ color: 'var(--text-secondary)' }} />
              </div>
            </header>

            {/* Main content area */}
            <div className="flex-1 overflow-auto" style={{ background: 'var(--dark)' }}>
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
