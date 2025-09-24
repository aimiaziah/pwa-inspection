import { useAuth } from '@/hooks/useAuth';

export default function TestAuth() {
  try {
    const { user, isAuthenticated } = useAuth();

    return (
      <div className="p-8">
        <h1>Auth Test</h1>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user?.name || 'None'}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1>Auth Error</h1>
        <p>Error: {error.message}</p>
      </div>
    );
  }
}
