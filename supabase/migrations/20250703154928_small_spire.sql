/*
  # Remove Chat System Completely

  1. Remove Tables
    - Drop `messages` table
    - Drop `conversations` table

  2. Remove Functions
    - Drop chat-related functions
    - Preserve reviews function

  3. Remove Triggers
    - Drop all chat-related triggers
    - Preserve reviews trigger
*/

-- Drop chat-related triggers first
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;

-- Drop chat-related functions
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS update_conversation_last_message();

-- Drop chat tables (messages first due to foreign key)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- Note: We keep the reviews function and trigger intact since they're still needed
-- The update_reviews_updated_at function and its trigger remain untouched