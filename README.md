# Card Battle Arena

A competitive card game where you create custom cards and battle against other players.

## Environment Variables

This application requires Supabase environment variables to function. You need to configure these variables based on where you're deploying:

### Required Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Setup Instructions

#### For Local Development

1. Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

#### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy your site

#### For GitHub Pages

The environment variables are already configured in `.github/workflows/static.yml`. If you need to update them:

1. Open `.github/workflows/static.yml`
2. Update the `env` section in the build step
3. Commit and push your changes

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.
