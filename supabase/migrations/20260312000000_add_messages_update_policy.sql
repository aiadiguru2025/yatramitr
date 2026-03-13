-- Allow connection participants (non-sender) to mark messages as read
CREATE POLICY "messages_update_read" ON public.messages
  FOR UPDATE USING (
    -- User must be a participant in the connection
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
        AND (c.requester = auth.uid() OR c.addressee = auth.uid())
    )
    -- Only allow marking messages the user received (not sent)
    AND sender_id != auth.uid()
  )
  WITH CHECK (
    -- Only allow updating read_at
    sender_id != auth.uid()
  );
