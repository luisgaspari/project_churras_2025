/*
  # Sistema de Assinatura para Profissionais

  1. Nova Tabela
    - `subscriptions`
      - `id` (uuid, primary key)
      - `professional_id` (uuid, foreign key)
      - `plan_type` (enum: monthly, semestral, annual)
      - `status` (enum: active, expired, cancelled)
      - `start_date` (date)
      - `end_date` (date)
      - `amount` (numeric)
      - `payment_method` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Enum Types
    - `subscription_plan_type`
    - `subscription_status`

  3. Segurança
    - Enable RLS na tabela subscriptions
    - Políticas para CRUD operations
    - Função para verificar status da assinatura

  4. Índices
    - Índice para professional_id
    - Índice para status e end_date
*/

-- Create subscription plan type enum
CREATE TYPE subscription_plan_type AS ENUM ('monthly', 'semestral', 'annual');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type subscription_plan_type NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professionals can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO public
  USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can create their own subscriptions"
  ON subscriptions
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO public
  USING (auth.uid() = professional_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscriptions_professional_id_idx ON subscriptions(professional_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_end_date_idx ON subscriptions(status, end_date);
CREATE INDEX IF NOT EXISTS subscriptions_end_date_idx ON subscriptions(end_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to check if professional has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(professional_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE professional_id = professional_uuid 
    AND status = 'active' 
    AND end_date >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get current subscription
CREATE OR REPLACE FUNCTION get_current_subscription(professional_uuid uuid)
RETURNS TABLE (
  id uuid,
  plan_type subscription_plan_type,
  status subscription_status,
  start_date date,
  end_date date,
  amount numeric,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.status,
    s.start_date,
    s.end_date,
    s.amount,
    CASE 
      WHEN s.end_date >= CURRENT_DATE THEN (s.end_date - CURRENT_DATE)::integer
      ELSE 0
    END as days_remaining
  FROM subscriptions s
  WHERE s.professional_id = professional_uuid
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;