import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { LoginInput } from '../../../server/src/schema';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginInput>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.login.mutate(formData);
      
      // Store token in localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Call parent callback
      onLogin(response.token, response.user);
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (username: string) => {
    setFormData({
      username,
      password: username + '123' // Demo password pattern
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">⚡ ElectroStore POS</CardTitle>
          <CardDescription>
            Sign in to access the inventory management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Accounts:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => handleDemoLogin('admin')}
                type="button"
              >
                🔧 Admin (admin / admin123)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => handleDemoLogin('manager')}
                type="button"
              >
                👥 Manager (manager / manager123)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => handleDemoLogin('cashier')}
                type="button"
              >
                💰 Cashier (cashier / cashier123)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}