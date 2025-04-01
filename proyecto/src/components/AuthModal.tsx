import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!email || !password) {
          throw new Error('Por favor, completa todos los campos.');
        }

        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Por favor, ingresa un correo electrónico válido.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          console.error('Error de registro:', error);
          let errorMessage = 'Error durante el registro. Por favor, intenta nuevamente.';

          if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, verifica tu correo electrónico para completar el registro.';
          } else if (error.message.includes('User already registered')) {
            errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
          } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Por favor, ingresa un correo electrónico válido.';
          } else if (error.message.includes('duplicate key value violates unique constraint')) {
            errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
          }

          throw new Error(errorMessage);
        }

        if (data?.user) {
          if (data.user.identities?.length === 0) {
            throw new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
          }
          alert('¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta.');
          // No cerramos la modal inmediatamente para permitir al usuario leer el mensaje
          setEmail('');
          setPassword('');
        } else {
          throw new Error('No se pudo crear la cuenta. Por favor, intenta nuevamente.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Error de inicio de sesión:', error);
          let errorMessage = 'Error durante el inicio de sesión. Por favor, intenta nuevamente.';

          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, verifica tu correo electrónico para activar tu cuenta.';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
          }

          throw new Error(errorMessage);
        }

        if (data?.session) {
          window.location.reload();
        } else {
          throw new Error('No se pudo iniciar sesión. Por favor, intenta nuevamente.');
        }
      }
    } catch (err) {
      let errorMessage = 'Error durante la autenticación. Por favor, intenta nuevamente.';

      // Manejo específico de errores de Supabase
      if (err instanceof Error) {
        console.error('Detalles del error:', err);

        if (err.message.includes('provider is not enabled')) {
          errorMessage = 'El inicio de sesión con Google no está habilitado. Por favor, habilítalo en la consola de Supabase (Authentication > Providers).';
        } else if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, verifica tu correo electrónico para activar tu cuenta.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
        } else if (err.message.includes('User already registered')) {
          errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
        } else if (err.message.includes('Password should be at least 6 characters')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Por favor, ingresa un correo electrónico válido.';
        } else if (err.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
        } else if (err.message.includes('NetworkError')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        } else if (err.message.includes('JWT expired')) {
          errorMessage = 'La sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (err.message.includes('AuthApiError')) {
          errorMessage = 'Error en el servidor de autenticación. Por favor, intenta más tarde.';
        }
      }
      setError(errorMessage);
      console.error('Error de autenticación:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si supabase está inicializado correctamente
      if (!supabase) {
        throw new Error('No se pudo inicializar el cliente de Supabase. Verifica las credenciales en el archivo .env');
      }
      
      // Verificar si las variables de entorno están configuradas
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Las credenciales de Supabase no están configuradas. Por favor, verifica el archivo .env');
      }
      
      console.log('Iniciando autenticación con Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
        },
      });
      
      if (error) {
        console.error('Error detallado de OAuth:', error);
        throw error;
      }
      
      if (!data || !data.url) {
        throw new Error('No se recibió URL de redirección de Supabase');
      }
      
      // Validar que la URL sea válida antes de redirigir
      try {
        // Verificar que data.url sea una cadena no vacía y tenga formato de URL válido
        if (typeof data.url !== 'string' || data.url.trim() === '') {
          throw new Error('La URL de redirección está vacía o no es válida');
        }
        
        // Intentar crear un objeto URL para validar el formato
        const urlObj = new URL(data.url);
        
        // Verificar que la URL tenga un protocolo válido (http o https)
        if (!urlObj.protocol || !['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error(`Protocolo de URL inválido: ${urlObj.protocol}`);
        }
        
        console.log('URL de redirección validada correctamente:', urlObj.toString());
        
        // Redirigir explícitamente al usuario a la URL de autenticación
        console.log('Redirección a Google OAuth iniciada:', data.url);
        window.location.href = data.url;
      } catch (urlError) {
        console.error('Error al validar la URL de redirección:', urlError);
        throw new Error(`URL de redirección inválida: ${urlError.message}`);
      }
      
    } catch (err) {
      console.error('Error de inicio de sesión con Google:', err);
      let errorMessage = 'Error durante el inicio de sesión con Google.';
      
      if (err.message?.includes('provider is not enabled') || 
          err.message?.includes('validation_failed') || 
          err.message?.includes('Unsupported provider')) {
        errorMessage = 'El inicio de sesión con Google no está habilitado en este proyecto. ' + 
                      'Para habilitar el inicio de sesión con Google, sigue estos pasos: \n\n' + 
                      '1. Inicia sesión en la consola de Supabase (https://supabase.com) \n' + 
                      '2. Selecciona tu proyecto \n' + 
                      '3. Ve a Authentication > Providers \n' + 
                      '4. Habilita Google \n' + 
                      '5. Configura el Client ID y Client Secret de Google OAuth \n' +
                      '6. Agrega el dominio de tu aplicación a los dominios autorizados en la consola de Google Cloud \n\n' +
                      'Error específico: "Unsupported provider: provider is not enabled"';
      } else if (err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      } else if (err.message?.includes('No se pudo inicializar')) {
        errorMessage = err.message;
      } else if (err.message?.includes('No se recibió URL de redirección')) {
        errorMessage = 'Error en la configuración de autenticación. Por favor, contacta al administrador.';
      } else if (err.message?.includes('PKCE flow not supported')) {
        errorMessage = 'El flujo PKCE no está soportado. Verifica la configuración de Supabase.';
      } else if (err.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'Error de configuración: la URL de redirección no coincide con las URLs autorizadas en la consola de Google Cloud.';
      } else if (err.message?.includes('invalid_client')) {
        errorMessage = 'Error de configuración: Client ID o Client Secret inválidos en la configuración de Google OAuth.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {supabase && (
              <button
                onClick={handleGoogleSignIn}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-4 h-4"
                />
                Continue with Google
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}