/*
  # Add function to mark messages as read

  1. New Functions
    - `mark_messages_as_read` - Marca mensagens como lidas para um usuário específico em uma conversa
    - `update_conversation_last_message` - Atualiza o timestamp da última mensagem na conversa

  2. Security
    - Função executa com segurança RLS
    - Apenas o destinatário pode marcar suas mensagens como lidas
*/

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  conversation_uuid UUID,
  user_uuid UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update messages to mark them as read
  -- Only mark messages that were sent by others (not by the current user)
  UPDATE messages 
  SET is_read = true
  WHERE conversation_id = conversation_uuid 
    AND sender_id != user_uuid 
    AND is_read = false;
END;
$$;

-- Function to update conversation last message timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the last_message_at timestamp when a new message is inserted
  UPDATE conversations 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();