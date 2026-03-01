
-- Add 'build' to the session_mode enum
ALTER TYPE public.session_mode ADD VALUE IF NOT EXISTS 'build';

-- Create build_projects table
CREATE TABLE public.build_projects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    user_id uuid NOT NULL,
    session_id uuid REFERENCES public.sessions(id),
    project_name text,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
    branding jsonb NOT NULL DEFAULT '{}'::jsonb,
    rating integer,
    rating_comment text,
    is_favorite boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "build_projects_select_own_org"
ON public.build_projects FOR SELECT
USING (org_id = ANY (get_user_org_ids()));

CREATE POLICY "build_projects_insert_own"
ON public.build_projects FOR INSERT
WITH CHECK (user_id = auth.uid() AND org_id = ANY (get_user_org_ids()));

CREATE POLICY "build_projects_update_own"
ON public.build_projects FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "build_projects_delete_own"
ON public.build_projects FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER set_build_projects_updated_at
BEFORE UPDATE ON public.build_projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
