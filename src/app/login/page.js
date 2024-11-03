'use client';
import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const Login = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [username, setU] = React.useState('');
  const [pass, setP] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (session?.user) {
      const role = session.user.role;
      if (role === 'operator') {
        router.push('/part-number-select');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: username,
        password: pass,
        redirect: false,
      });

      console.log('SignIn Result:', result);

      if (result?.error) {
        toast.error('Invalid username or password');
        return;
      }

      // Get the updated session after login
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      
      console.log('Session Data:', sessionData);

      if (sessionData?.user) {
        toast.success('Login successful!');
        
        // Redirect based on role
        if (sessionData.user.role === 'operator') {
          router.push('/part-number-select');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // If loading session, show loading state
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={username}
              onChange={(e) => setU(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={pass}
              onChange={(e) => setP(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
