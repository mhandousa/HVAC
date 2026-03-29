-- Create table to track sent verification notification emails
CREATE TABLE public.verification_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL,
  zone_name TEXT,
  remediation_record_id TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('initial', 'overdue', 'urgent')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  days_pending INTEGER,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_verification_notifications_org ON verification_notification_logs(organization_id);
CREATE INDEX idx_verification_notifications_zone ON verification_notification_logs(zone_id, notification_type);
CREATE INDEX idx_verification_notifications_sent ON verification_notification_logs(sent_at DESC);
CREATE INDEX idx_verification_notifications_project ON verification_notification_logs(project_id);

-- Enable Row Level Security
ALTER TABLE verification_notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's notification logs"
  ON verification_notification_logs FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert notification logs for their org"
  ON verification_notification_logs FOR INSERT
  WITH CHECK (organization_id = user_org_id());

-- Add comment for documentation
COMMENT ON TABLE verification_notification_logs IS 'Tracks email notifications sent for acoustic zone verification reminders';