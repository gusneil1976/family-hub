-- Zero-point tasks have nothing to approve — a completion adds 0 to the
-- scoreboard whether or not points_approved is set, so gating them behind
-- the approvals queue was just noise. New zero-point tasks are now
-- approved automatically at creation
-- (src/app/(app)/house-tasks/new/actions.ts); this backfills any that were
-- already sitting unapproved in the queue before that change.
update tasks set points_approved = true where points = 0 and points_approved = false;
