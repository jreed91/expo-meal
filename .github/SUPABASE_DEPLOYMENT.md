# Supabase Edge Functions Deployment

This repository includes automated deployment of Supabase Edge Functions via GitHub Actions.

## Automated Deployment

The workflow deploys Edge Functions automatically when:
- Changes are pushed to the `main` branch in the `supabase/functions/` directory
- Manually triggered via GitHub Actions UI

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your repository:

### 1. SUPABASE_ACCESS_TOKEN

**How to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Go to "Account Settings"
4. Navigate to "Access Tokens"
5. Click "Generate New Token"
6. Give it a name (e.g., "GitHub Actions")
7. Copy the token (you won't be able to see it again!)

**How to add it to GitHub:**
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SUPABASE_ACCESS_TOKEN`
5. Value: Paste your Supabase access token
6. Click "Add secret"

### 2. SUPABASE_PROJECT_ID

**How to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → General
4. Find "Project ID" or "Reference ID"
5. Copy the ID (format: `abcdefghijklmnopqrst`)

**How to add it to GitHub:**
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SUPABASE_PROJECT_ID`
5. Value: Paste your project ID
6. Click "Add secret"

### 3. ANTHROPIC_API_KEY

This secret is used by the chat functionality to interact with Claude AI.

**How to get it:**
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

**How to add it to GitHub:**
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your Anthropic API key
6. Click "Add secret"

**Important:** The GitHub Actions workflow automatically syncs this secret to Supabase on each deployment, so you don't need to manually set it in Supabase.

## Manual Deployment

You can also manually trigger deployment:

1. Go to Actions tab in your repository
2. Select "Deploy Supabase Functions" workflow
3. Click "Run workflow"
4. Optionally specify a single function name to deploy
5. Click "Run workflow"

## Functions Deployed

The following Edge Functions are deployed:

- `process-chat` - Chat message processing with Claude AI
- `get-messages` - Retrieve conversation history
- `pantry` - Pantry items CRUD operations
- `recipes` - Recipe CRUD operations
- `meal-plans` - Meal plan CRUD operations
- `grocery-lists` - Grocery lists and items CRUD operations
- `profiles` - User profile operations

## Local Testing

Before deploying, test your functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test a specific function
curl -i --location --request POST 'http://localhost:54321/functions/v1/pantry' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Troubleshooting

### Deployment fails with "Unauthorized"
- Check that `SUPABASE_ACCESS_TOKEN` is correctly set in GitHub secrets
- Verify the token hasn't expired (tokens can be regenerated)

### Deployment fails with "Project not found"
- Verify `SUPABASE_PROJECT_ID` matches your actual project ID
- Check the format (should be alphanumeric, no spaces)

### Functions deployed but not working
- Check Supabase Logs in the dashboard (Logs → Edge Functions)
- Verify `ANTHROPIC_API_KEY` is set in Supabase secrets
- Ensure RLS policies are correctly configured

### How to view deployment logs
1. Go to GitHub repository
2. Click on "Actions" tab
3. Select the deployment workflow run
4. Click on the "Deploy Edge Functions" job
5. Expand the steps to see detailed logs

## Security Notes

- Never commit API keys or secrets to the repository
- All secrets should be managed through GitHub Secrets
- Supabase Access Tokens should be rotated periodically
- Use different tokens for different environments (dev/staging/prod)
