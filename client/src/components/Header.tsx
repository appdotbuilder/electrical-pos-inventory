import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from './AuthContext';

export function Header() {
  const { user, logout, hasRole } = useAuth();

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'APP_ADMIN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CASHIER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'WAREHOUSE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return '🔧';
      case 'APP_ADMIN':
        return '⚙️';
      case 'MANAGER':
        return '👥';
      case 'CASHIER':
        return '💰';
      case 'WAREHOUSE':
        return '📦';
      default:
        return '👤';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            ⚡ ElectroStore POS
          </h1>
          <Badge variant="outline" className="text-xs">
            Inventory Management System
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge className={getRoleBadgeColor(user.role)}>
              {getRoleIcon(user.role)} {user.role.replace('_', ' ')}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <span className="text-sm font-medium">{user.full_name}</span>
                <span className="text-xs text-gray-500">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account Details</DropdownMenuLabel>
              <div className="px-2 py-1.5 text-sm text-gray-600">
                <div>{user.full_name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
                <div className="text-xs text-gray-500">@{user.username}</div>
                {user.commission_rate && (
                  <div className="text-xs text-green-600 mt-1">
                    Commission: {user.commission_rate}%
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
                <>
                  <DropdownMenuItem>
                    🔧 System Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={logout} className="text-red-600">
                🚪 Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}