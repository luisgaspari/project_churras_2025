/*
  # Remover Sistema de Chat Completo

  1. Remover Tabelas
    - Drop table `messages`
    - Drop table `conversations`

  2. Remover Funções
    - Drop function `mark_messages_as_read`
    - Drop function `update_conversation_last_message`

  3. Remover Triggers
    - Drop trigger `update_conversation_last_message_trigger`
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;

-- Drop functions
DROP FUNCTION IF EXISTS mark_messages_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS update_conversation_last_message();
DROP FUNCTION IF EXISTS update_reviews_updated_at();

-- Drop tables (messages first due to foreign key)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- Recreate the reviews function that was accidentally dropped
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;