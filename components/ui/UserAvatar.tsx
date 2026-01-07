'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, CreditCard, Shield, FileText, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserAvatar() {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get user initials
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(profile?.full_name, user.email);
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-orange-500 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleMenuClick('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMenuClick('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMenuClick('/subscription')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Subscription</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleMenuClick('/privacy')}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy Policy</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMenuClick('/terms')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Terms of Service</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
