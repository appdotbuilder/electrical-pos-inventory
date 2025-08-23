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
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300 shadow-md';
      case 'APP_ADMIN':
        return 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-300 shadow-md';
      case 'MANAGER':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-300 shadow-md';
      case 'CASHIER':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300 shadow-md';
      case 'WAREHOUSE':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-300 shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-300 shadow-md';
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
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 border-b border-blue-800 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">⚡</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  ElectroStore POS
                </h1>
                <p className="text-xs text-blue-200 font-medium">
                  Professional Inventory Management System
                </p>
              </div>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className="flex items-center space-x-3">
              <Badge 
                className={`${getRoleBadgeColor(user.role)} font-medium px-3 py-1 shadow-sm`}
                variant="secondary"
              >
                <span className="mr-1">{getRoleIcon(user.role)}</span>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium">{user.full_name}</div>
                    <div className="text-xs text-blue-200">{user.email}</div>
                  </div>
                  <div className="text-xs text-blue-200">▼</div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white shadow-xl border-0">
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <div className="px-2 py-2 bg-gray-50 rounded-md mx-2 mb-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`${getRoleBadgeColor(user.role)} text-xs`}
                      variant="secondary"
                    >
                      <span className="mr-1">{getRoleIcon(user.role)}</span>
                      {user.role.replace('_', ' ')}
                    </Badge>
                    {user.commission_rate && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {user.commission_rate}% Commission
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                {hasRole(['SYSTEM_ADMIN', 'APP_ADMIN']) && (
                  <>
                    <DropdownMenuItem className="py-3 cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">🔧</span>
                        <div>
                          <div className="font-medium">System Settings</div>
                          <div className="text-xs text-gray-500">Configure system preferences</div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={logout} className="text-red-600 py-3 focus:bg-red-50 cursor-pointer hover:bg-red-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🚪</span>
                    <div>
                      <div className="font-medium">Sign Out</div>
                      <div className="text-xs text-gray-500">End your session safely</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}