import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateUserInput } from '../../../server/src/schema';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

export function RegisterPage({ onRegisterSuccess, onBackToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState<CreateUserInput>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'CASHIER',
    commission_rate: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await trpc.createUser.mutate(formData);
      setSuccess(true);
      
      // Auto-navigate back to login after 2 seconds
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2 text-green-800">Registration Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully. You will be redirected to the login page.
            </p>
            <Button onClick={onRegisterSuccess} variant="outline">
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">⚡ ElectroStore POS</CardTitle>
          <CardDescription>
            Create a new account to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Choose a username (minimum 3 characters)"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter your email address"
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
                  setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Choose a password (minimum 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev: CreateUserInput) => ({ 
                    ...prev, 
                    role: value as CreateUserInput['role']
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Cashier</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="WAREHOUSE">
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span>Warehouse Personnel</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>Manager</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="APP_ADMIN">
                    <div className="flex items-center gap-2">
                      <span>🔧</span>
                      <span>App Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SYSTEM_ADMIN">
                    <div className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>System Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'CASHIER' && (
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ 
                      ...prev, 
                      commission_rate: e.target.value ? parseFloat(e.target.value) : null
                    }))
                  }
                  placeholder="Optional: Enter commission rate"
                />
              </div>
            )}

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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={onBackToLogin}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Already have an account? Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}