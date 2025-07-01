/*
  # Sistema de Avaliações

  1. Nova Tabela
    - `reviews`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `professional_id` (uuid, foreign key)
      - `rating` (integer, 1-5)
      - `comment` (text, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `reviews`
    - Políticas para CRUD operations
    - Constraint para rating entre 1-5
    - Unique constraint para evitar múltiplas avaliações do mesmo booking

  3. Índices
    - Índice para professional_id para consultas rápidas
    - Índice para booking_id para verificação de duplicatas
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one review per booking
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Clients can create reviews for their bookings"
  ON reviews
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND client_id = auth.uid() 
      AND status = 'completed'
    )
  );

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Clients can update their own reviews"
  ON reviews
  FOR UPDATE
  TO public
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own reviews"
  ON reviews
  FOR DELETE
  TO public
  USING (auth.uid() = client_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reviews_professional_id_idx ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS reviews_booking_id_idx ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();