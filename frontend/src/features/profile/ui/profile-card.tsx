'use client';

import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userApi, type User } from '@/entities/user';

function initials(user: User): string {
  const source = user.name?.trim() || user.email;
  return source.slice(0, 2).toUpperCase();
}

interface ProfileCardProps {
  onLogout: () => void;
}

export function ProfileCard({ onLogout }: ProfileCardProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    userApi
      .me()
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>{user ? initials(user) : '...'}</AvatarFallback>
      </Avatar>
      <div className="hidden sm:block">
        <p className="text-sm font-medium">{user?.name || 'Пользователь'}</p>
        <p className="text-muted-foreground text-xs">{user?.email ?? ''}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onLogout}>
        Выйти
      </Button>
    </div>
  );
}
