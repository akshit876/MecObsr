'use client';
import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useModelStore from '@/store/modelStore';

const Login = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [username, setU] = React.useState('');
  const [pass, setP] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [models, setModels] = React.useState([]);
  const [selectedModelId, setSelectedModelId] = React.useState('');
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);

  console.log({ models });
  // Redirect if already logged in
  React.useEffect(() => {
    if (session?.user) {
      const role = session.user.role;
      if (role === 'operator') {
        router.push('/');
      } else {
        router.push('/');
      }
    }
  }, [session, router]);

  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/part-number-config');
        const data = await response.json();
        if (Array.isArray(data)) {
          // Filter and map the models to get their Model Number values
          const modelsList = data.map((config) => {
            const modelNumberField = config.fields.find(
              (field) => field.fieldName === 'Model Number',
            );
            return {
              id: config._id,
              modelNumber: modelNumberField?.value || 'Unnamed Model',
              fields: config.fields,
            };
          });
          setModels(modelsList);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        toast.error('Failed to load models');
      }
    };

    fetchModels();
  }, []);

  const handleModelChange = (e) => {
    setSelectedModelId(e.target.value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First attempt login
      const result = await signIn('credentials', {
        email: username,
        password: pass,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      // After successful login, log the session
      const sessionLogResponse = await fetch('/api/auth/session-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAgent: window.navigator.userAgent,
        }),
      });

      if (!sessionLogResponse.ok) {
        console.error('Failed to log session');
      }

      // After successful login, update the model configuration
      const selectedModelData = models.find((model) => model.id === selectedModelId);
      if (!selectedModelData) {
        throw new Error('Model configuration not found');
      }

      // Update the current model configuration in MongoDB
      const response = await fetch('/api/part-number/update-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelConfig: selectedModelData,
          selectedBy: username,
          selectedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update model configuration');
      }

      const updatedConfig = await response.json();

      // Update Zustand store with the selected model
      setSelectedModel({
        id: selectedModelId,
        fields: selectedModelData.fields,
        config: updatedConfig,
      });

      toast.success('Login successful');

      // Use replace instead of push for more reliable redirection
      router.replace('/');

      // Force a hard reload after a brief delay to ensure all states are updated
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Login process failed');
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
          <div className="mb-4">
            <label htmlFor="model" className="block text-sm font-medium text-gray-600">
              Model Number
            </label>
            <select
              id="model"
              name="model"
              className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={isLoading}
              required
            >
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.modelNumber || 'Unnamed Model'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading || !selectedModelId}
          >
            {isLoading ? 'Processing...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
