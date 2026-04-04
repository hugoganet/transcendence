import { useEffect, useState } from "react";
import { api } from "../api/client.js";

interface Providers {
  google: boolean;
  facebook: boolean;
}

export function OAuthButtons() {
  const [providers, setProviders] = useState<Providers>({ google: false, facebook: false });

  useEffect(() => {
    api.get<Providers>("/api/v1/auth/providers").then(setProviders).catch(() => {});
  }, []);

  if (!providers.google && !providers.facebook) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 flex-shrink text-sm text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
      <div className="space-y-2">
        {providers.google && (
          <button
            type="button"
            onClick={() => { window.location.href = "/api/v1/auth/google"; }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
        )}
        {providers.facebook && (
          <button
            type="button"
            onClick={() => { window.location.href = "/api/v1/auth/facebook"; }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-transparent bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>
        )}
      </div>
    </div>
  );
}
