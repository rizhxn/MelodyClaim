Before committing, enforce strict environment validation:

1. Remove any fallback values for FRONTEND_URL in backend.
2. Ensure server throws an error if FRONTEND_URL is undefined.
3. Keep VITE_BACKEND_URL required on frontend (no silent fallback).
4. Do not introduce any new logic beyond validation.

Goal: prevent silent misconfiguration in production.
