'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { signupSchema, validateForm } from '@/lib/validations';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate form with Zod
    const validation = validateForm(signupSchema, { email, password, confirmPassword });
    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] px-4">
        <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#1e3a5f]">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base text-gray-500">
              We&apos;ve sent a confirmation link to <strong className="text-[#1e3a5f]">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-600 px-6">
            <p>Click the link in your email to confirm your account and get started.</p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link
              href="/login"
              className="text-[#1e3a5f] hover:text-[#d4a853] font-medium transition-colors duration-200"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] px-4">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-0">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-[#d4a853] font-bold text-2xl">TP</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1e3a5f]">
            Create an Account
          </CardTitle>
          <CardDescription className="text-gray-500">
            Sign up to start identifying transfer pricing opportunities
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 px-6">
            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`h-11 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`h-11 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`h-11 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <Button
              type="submit"
              className="w-full h-11 bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-sm text-center text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[#1e3a5f] hover:text-[#d4a853] font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
