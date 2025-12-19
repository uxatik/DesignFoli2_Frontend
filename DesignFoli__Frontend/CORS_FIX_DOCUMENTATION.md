# CORS Fix Documentation

## Problem
The application was experiencing CORS errors when making requests to `https://design-foli-backend.vercel.app` from the frontend running on `http://localhost:3000`. The error message was:

```
Access to fetch at 'https://design-foli-backend.vercel.app/api/v1/users/profile' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution
Implemented a Next.js API proxy that routes all backend requests through the Next.js server, bypassing CORS restrictions. This is a common pattern for handling CORS issues in frontend applications.

## Implementation

### 1. API Proxy Route (`src/app/api/proxy/[...path]/route.ts`)
Created a catch-all API route that:
- Accepts all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Forwards requests to the backend API
- Preserves authentication headers
- Returns responses with proper status codes

### 2. Updated API Client (`src/utils/api.ts`)
Modified the `useApiClient` hook to use the proxy:
```typescript
// Before: Direct backend calls
return new ApiClient(getToken, process.env.NEXT_PUBLIC_API_BASE_URL || '');

// After: Proxy calls
return new ApiClient(getToken, '/api/proxy');
```

### 3. Helper Utility (`src/utils/fetchWithProxy.ts`)
Created helper functions for making proxy requests:
- `fetchWithProxy()`: Makes fetch calls through the proxy
- `getProxyUrl()`: Converts backend endpoints to proxy URLs

## Usage

### Using the API Client (Recommended)
```typescript
import { useApiClient, userService } from '@/utils/api';

const MyComponent = () => {
  const apiClient = useApiClient();
  
  const fetchProfile = async () => {
    const profile = await userService.getProfile(apiClient);
  };
};
```

### Using fetchWithProxy Helper
```typescript
import { fetchWithProxy } from '@/utils/fetchWithProxy';

const response = await fetchWithProxy('/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Using getProxyUrl
```typescript
import { getProxyUrl } from '@/utils/fetchWithProxy';

const url = getProxyUrl('/users/profile');
// Returns: '/api/proxy/users/profile'
```

## Migration Guide

To update existing API calls in other files:

### Before:
```typescript
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### After (Option 1 - Using fetchWithProxy):
```typescript
import { fetchWithProxy } from '@/utils/fetchWithProxy';

const response = await fetchWithProxy('/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### After (Option 2 - Manual proxy URL):
```typescript
const response = await fetch('/api/proxy/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Files Modified
- ✅ `src/app/api/proxy/[...path]/route.ts` - Created proxy route
- ✅ `src/utils/api.ts` - Updated to use proxy
- ✅ `src/utils/fetchWithProxy.ts` - Created helper utilities

## Files That May Need Updates
The following files contain direct API calls that could be migrated to use the proxy:
- `src/contexts/StyleContext.tsx`
- `src/app/[id]/page.tsx`
- `src/app/signup/signupWithEmail/page.tsx`
- `src/app/signup/signupConfirm/page.tsx`
- `src/app/publish/page.tsx`
- `src/app/page.tsx`
- `src/app/editprofile/page.tsx`
- `src/app/components/StyleConfiguration.tsx`
- `src/app/components/WorkTabCard.tsx`
- `src/app/components/Navbar.tsx`
- `src/app/case-study/[id]/page.tsx`
- `src/app/case-study/[id]/CaseStudyClient.tsx`
- `src/app/case-study/view/[id]/page.tsx`

## Testing
After restarting the development server, the `/users/profile` endpoint and other API calls through `useApiClient` will now work without CORS errors.

To test:
1. Restart the development server: `npm run dev`
2. Navigate to pages that use the API client
3. Check browser console - CORS errors should be resolved
4. Verify API calls are going through `/api/proxy/*` endpoints

## Benefits
- ✅ No CORS errors
- ✅ Centralized request handling
- ✅ Easy to add middleware (rate limiting, logging, etc.)
- ✅ Can add request/response transformations
- ✅ Works in both development and production
