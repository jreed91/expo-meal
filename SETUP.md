# Setup Guide

This guide will help you set up the expo-meal app with Supabase backend and Claude AI integration.

## Prerequisites

- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- A Supabase account (free tier works)
- An Anthropic API key for Claude

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: expo-meal (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
4. Wait for the project to be created (takes 1-2 minutes)

### Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema
6. Verify that all tables were created successfully in the **Table Editor**

### Configure Email Authentication

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Make sure **Email** is enabled (it should be by default)
3. Configure email templates if desired (optional)

### Get Your API Keys

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key under "Project API keys")

## 2. Anthropic API Setup

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys**
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

## 3. Environment Configuration

1. In the project root, find the `.env` file
2. Replace the placeholder values with your actual keys:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Anthropic API Configuration
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Important**: Never commit the `.env` file to git. It's already in `.gitignore`.

## 4. Install Dependencies

```bash
npm install
```

## 5. Run the App

### Start the development server:

```bash
npm start
```

### Run on specific platforms:

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Database Schema Overview

The app uses the following main tables:

- **profiles**: User profiles with allergy information
- **recipes**: Recipe storage with ingredients and instructions
- **meal_plans**: Weekly meal planning (breakfast, lunch, dinner, snacks)
- **pantry_items**: Pantry inventory tracking
- **grocery_lists**: Grocery list headers
- **grocery_list_items**: Individual items in grocery lists

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Features

✅ Multi-user authentication
✅ Recipe management with favorites
✅ Weekly meal planning (all meal types)
✅ Smart grocery list generation
✅ Pantry tracking with expiry dates
✅ Allergy tracking per user
✅ Claude AI chatbot integration
✅ Offline support (coming soon)

## Troubleshooting

### Can't connect to Supabase
- Verify your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure the URL starts with `https://`
- Check that your Supabase project is active

### Authentication not working
- Ensure the `handle_new_user()` trigger is set up correctly in SQL
- Check the Supabase Auth logs in the dashboard

### Database queries failing
- Verify RLS policies are enabled
- Check that you're logged in with a valid user
- Review the Supabase logs for detailed error messages

## Next Steps

Once setup is complete:

1. Run the app and create your first account
2. Add your allergies in the profile
3. Import or create recipes
4. Plan your weekly meals
5. Generate grocery lists
6. Chat with Claude for meal suggestions!

For more help, check the [Supabase documentation](https://supabase.com/docs) or [Anthropic documentation](https://docs.anthropic.com).
