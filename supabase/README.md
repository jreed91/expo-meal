# Supabase Edge Functions

This directory contains the Supabase Edge Functions for the Expo Meal app. These serverless functions handle chat message processing and Claude AI integration on the backend.

## Functions

### process-chat

Processes chat messages by:

1. Loading conversation history from the database
2. Building user context (profile, recipes, pantry items, etc.)
3. Calling the Claude API
4. Executing any tool calls (add meal plans, pantry items, etc.)
5. Saving the updated conversation to the database

**Endpoint:** `POST /process-chat`

**Request Body:**

```json
{
  "message": "What can I make with chicken?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**

```json
{
  "message": {
    "id": "123",
    "role": "assistant",
    "content": "Here are some recipes...",
    "timestamp": "2025-11-26T12:00:00Z",
    "toolCalls": []
  },
  "conversationId": "conversation-id"
}
```

### get-messages

Retrieves messages for a conversation.

**Endpoint:** `POST /get-messages`

**Request Body:**

```json
{
  "conversationId": "conversation-id"
}
```

**Response:**

```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-11-26T12:00:00Z"
    }
  ],
  "conversationId": "conversation-id"
}
```

## Deployment

### Prerequisites

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Login to Supabase:

```bash
supabase login
```

3. Link your project:

```bash
supabase link --project-ref your-project-ref
```

### Deploy Functions

Deploy all functions:

```bash
supabase functions deploy
```

Deploy a specific function:

```bash
supabase functions deploy process-chat
```

### Environment Variables

Set the following environment variables in your Supabase project:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
```

You can verify secrets are set:

```bash
supabase secrets list
```

## Local Development

### Start Supabase locally:

```bash
supabase start
```

### Serve functions locally:

```bash
supabase functions serve
```

### Test a function locally:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Hello"}'
```

## Architecture

### Shared Code

The `_shared` directory contains code shared between functions:

- `types.ts` - TypeScript interfaces and types
- `claude.ts` - Claude API integration and tool definitions
- `database.ts` - Database utilities and tool execution

### Authentication

All functions require authentication via JWT. The `verify_jwt` option is enabled in `config.toml`.

### CORS

CORS headers are configured to allow requests from any origin. Update the `corsHeaders` in each function if you need to restrict access.

## Tools

The Claude AI assistant has access to the following tools:

1. **add_meal_plan** - Add meals to the user's meal planner
2. **add_pantry_item** - Add items to the pantry inventory
3. **add_grocery_item** - Add items to the grocery list
4. **update_allergies** - Update user allergy information

Tool execution happens automatically on the backend when Claude decides to use them.
