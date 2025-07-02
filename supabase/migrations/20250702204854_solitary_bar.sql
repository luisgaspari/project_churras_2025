/*
  # Sistema de Chat Completo

  1. Novas Tabelas
    - `conversations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `professional_id` (uuid, foreign key)
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `sender_id` (uuid, foreign key)
      - `content` (text)
      - `is_read` (boolean)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS nas tabelas
    - Políticas para CRUD operations
    - Índices para performance

  3. Funções
    - Trigger para atualizar last_message_at
    - Função para marcar mensagens como lidas
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one conversation per client-professional pair
  UNIQUE(client_id, professional_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO public
  USING (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO public
  USING (auth.uid() = client_id OR auth.uid() = professional_id);

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (client_id = auth.uid() OR professional_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (client_id = auth.uid() OR professional_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages they sent"
  ON messages
  FOR UPDATE
  TO public
  USING (auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS conversations_client_id_idx ON conversations(client_id);
CREATE INDEX IF NOT EXISTS conversations_professional_id_idx ON conversations(professional_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages(is_read);

-- Function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is inserted
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  conversation_uuid uuid,
  user_uuid uuid
)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = true 
  WHERE conversation_id = conversation_uuid 
  AND sender_id != user_uuid 
  AND is_read = false;
END;
$$ LANGUAGE plpgsql;