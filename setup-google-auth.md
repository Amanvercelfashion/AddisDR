# Google OAuth Setup

AddisDR uses Google Sign-In (OAuth 2.0) for authentication. Follow the steps below to enable it.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > OAuth consent screen**
4. Choose **External** user type (or Internal if your org uses Google Workspace)
5. Fill in the required fields:
   - **App name**: `AddisDR`
   - **User support email**: your email
   - **Developer contact info**: your email
6. Skip the scopes step (default is fine)
7. Add test users (if External) — add your email(s)
8. Publish the app when ready

## 2. Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **+ Create Credentials > OAuth client ID**
3. **Application type**: Web application
4. **Name**: `AddisDR Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:5173` (Vite dev server)
   - `https://your-production-domain.com`
   - `http://localhost` (if needed)
6. **Authorized redirect URIs**: (leave blank for client-side flow)
7. Click **Create**
8. Copy the **Client ID** shown in the popup

## 3. Configure Environment Variable

In `frontend/.env`, set:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Replace `your-client-id.apps.googleusercontent.com` with the Client ID from step 2.

## 4. How It Works

- The **Google Identity Services** library is loaded via `<script>` in `index.html`
- When the user clicks the Google Sign-In button (rendered in `AuthModal.jsx`), Google returns a credential token
- The token is sent to the backend at `POST /api/auth/google`
- The backend verifies the token using Supabase Auth or a custom verification function
- On success, a user object is returned and stored in `localStorage`

## 5. Backend Verification

The backend endpoint `POST /api/auth/google` receives `{ credential }` and:

1. Verifies the Google ID token
2. Extracts user info (name, email, Google sub)
3. Creates or retrieves the user in the database
4. Returns the user object

## 6. Troubleshooting

- **"Google is not defined"**: Ensure the GSI script loads before React — check `index.html` has `<script src="https://accounts.google.com/gsi/client" async defer></script>`
- **Button not rendering**: The `VITE_GOOGLE_CLIENT_ID` is checked — if it starts with `your-`, the button is hidden
- **Redirect URI mismatch**: Make sure the origin in your browser matches an authorized origin
- **Backend 401**: The Google token may be expired or invalid — verify the backend's token verification logic
