-- LIVE BASELINE LOGIC (project xzdpfnyvsgzdiuuamujv)
-- Captured to document production server-side logic before the rebuild.

-- ================= FUNCTIONS =================

CREATE OR REPLACE FUNCTION public.check_hotel_submit_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  pending_count integer;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM public.hotels
  WHERE submitted_by = NEW.submitted_by AND status = 'pending';
  
  IF pending_count >= 5 THEN
    RAISE EXCEPTION 'You have too many pending hotel submissions. Please wait for review.';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_submission_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  existing_count integer;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM public.perk_reports
  WHERE user_id = NEW.user_id AND hotel_id = NEW.hotel_id;
  
  IF existing_count >= 20 THEN
    RAISE EXCEPTION 'You have reached the maximum of 20 reports for this hotel.';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_vote_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.perk_votes
  WHERE user_id = NEW.user_id
  AND created_at > now() - interval '1 minute';
  
  IF recent_count >= 30 THEN
    RAISE EXCEPTION 'Vote rate limit exceeded. Please wait a moment.';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, target_type, target_id, details)
    VALUES (OLD.user_id, 'DELETE', TG_TABLE_NAME, OLD.id, 
      jsonb_build_object('old_data', row_to_json(OLD)));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, target_type, target_id, details)
    VALUES (NEW.user_id, 'UPDATE', TG_TABLE_NAME, NEW.id,
      jsonb_build_object('edit_count', NEW.edit_count));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, target_type, target_id)
    VALUES (NEW.user_id, 'INSERT', TG_TABLE_NAME, NEW.id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_self_vote()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  perk_owner uuid;
BEGIN
  SELECT user_id INTO perk_owner FROM public.perk_reports WHERE id = NEW.perk_id;
  IF perk_owner = NEW.user_id THEN
    RAISE EXCEPTION 'You cannot vote on your own report.';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitize_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  NEW.text = regexp_replace(NEW.text, '<[^>]*>', '', 'g');
  NEW.text = regexp_replace(NEW.text, 'https?://\S+', '[link removed]', 'gi');
  NEW.text = regexp_replace(NEW.text, 'www\.\S+', '[link removed]', 'gi');
  NEW.text = regexp_replace(NEW.text, 'javascript:', '', 'gi');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitize_perk_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Strip HTML tags
  NEW.description = regexp_replace(NEW.description, '<[^>]*>', '', 'g');
  -- Strip URLs  
  NEW.description = regexp_replace(NEW.description, 'https?://\S+', '[link removed]', 'gi');
  NEW.description = regexp_replace(NEW.description, 'www\.\S+', '[link removed]', 'gi');
  -- Strip javascript: and data: protocols
  NEW.description = regexp_replace(NEW.description, 'javascript:', '', 'gi');
  NEW.description = regexp_replace(NEW.description, 'data:', '', 'gi');
  
  IF NEW.promo_code IS NOT NULL THEN
    NEW.promo_code = regexp_replace(NEW.promo_code, '<[^>]*>', '', 'g');
    NEW.promo_code = regexp_replace(NEW.promo_code, 'https?://\S+', '', 'gi');
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitize_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.bio IS NOT NULL THEN
    NEW.bio = regexp_replace(NEW.bio, '<[^>]*>', '', 'g');
    NEW.bio = regexp_replace(NEW.bio, 'https?://\S+', '[link removed]', 'gi');
    NEW.bio = regexp_replace(NEW.bio, 'javascript:', '', 'gi');
  END IF;
  IF NEW.reddit_username IS NOT NULL THEN
    NEW.reddit_username = regexp_replace(NEW.reddit_username, '[^a-zA-Z0-9_-]', '', 'g');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_perk_edit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
    NEW.last_edited_at = now();
  END IF;
  RETURN NEW;
END;
$function$
;

-- ================= TRIGGERS =================

CREATE TRIGGER audit_comments AFTER INSERT OR DELETE OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_perk_reports AFTER INSERT OR DELETE OR UPDATE ON public.perk_reports FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER hotel_submit_limit BEFORE INSERT ON public.hotels FOR EACH ROW EXECUTE FUNCTION check_hotel_submit_limit();

CREATE TRIGGER no_self_vote BEFORE INSERT OR UPDATE ON public.perk_votes FOR EACH ROW EXECUTE FUNCTION prevent_self_vote();

CREATE TRIGGER sanitize_cmt BEFORE INSERT OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION sanitize_comment();

CREATE TRIGGER sanitize_perk BEFORE INSERT OR UPDATE ON public.perk_reports FOR EACH ROW EXECUTE FUNCTION sanitize_perk_report();

CREATE TRIGGER sanitize_prof BEFORE INSERT OR UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION sanitize_profile();

CREATE TRIGGER submission_limit BEFORE INSERT ON public.perk_reports FOR EACH ROW EXECUTE FUNCTION check_submission_limit();

CREATE TRIGGER track_edit BEFORE UPDATE ON public.perk_reports FOR EACH ROW EXECUTE FUNCTION track_perk_edit();

CREATE TRIGGER vote_rate_limit BEFORE INSERT ON public.perk_votes FOR EACH ROW EXECUTE FUNCTION check_vote_rate_limit();

