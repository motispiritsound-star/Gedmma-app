-- Domain invariants that must hold regardless of application code.

-- 1. Seats can never be oversold and never go negative. The booking service
--    reserves a seat with a single conditional UPDATE; this CHECK is the
--    last line of defence against a concurrent oversell.
ALTER TABLE "Capacity"
  ADD CONSTRAINT "capacity_seats_within_bounds"
  CHECK ("seatsTaken" >= 0 AND "seatsTaken" <= "totalSeats");

ALTER TABLE "Capacity"
  ADD CONSTRAINT "capacity_total_seats_positive"
  CHECK ("totalSeats" > 0);

-- 2. Reviews use a 1..5 star scale.
ALTER TABLE "Review"
  ADD CONSTRAINT "review_rating_range"
  CHECK ("rating" >= 1 AND "rating" <= 5);

-- 3. Money is stored in minor units and is never negative.
ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_non_negative" CHECK ("amountCents" >= 0);
ALTER TABLE "Refund"  ADD CONSTRAINT "refund_amount_positive"     CHECK ("amountCents" > 0);
ALTER TABLE "Payout"  ADD CONSTRAINT "payout_amounts_consistent"
  CHECK ("grossCents" >= 0 AND "commissionCents" >= 0 AND "netCents" = "grossCents" - "commissionCents");
ALTER TABLE "Activity" ADD CONSTRAINT "activity_credit_cost_positive" CHECK ("creditCost" > 0);
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "plan_price_non_negative" CHECK ("priceCents" >= 0);

-- 4. A credit ledger entry must actually move credits, and the running balance
--    can never be negative.
ALTER TABLE "CreditLedgerEntry"
  ADD CONSTRAINT "ledger_delta_non_zero" CHECK ("delta" <> 0);
ALTER TABLE "CreditLedgerEntry"
  ADD CONSTRAINT "ledger_balance_non_negative" CHECK ("balanceAfter" >= 0);

-- 5. The ledger is append-only: financial history is evidence, not state.
CREATE OR REPLACE FUNCTION skillpass_ledger_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'CreditLedgerEntry is append-only (attempted %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "credit_ledger_append_only"
  BEFORE UPDATE OR DELETE ON "CreditLedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION skillpass_ledger_append_only();

-- 6. The audit log is append-only for the same reason.
CREATE OR REPLACE FUNCTION skillpass_audit_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only (attempted %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_log_append_only"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION skillpass_audit_append_only();

-- 7. Sessions must end after they start.
ALTER TABLE "Session"
  ADD CONSTRAINT "session_time_order" CHECK ("endsAt" > "startsAt");

-- 8. A subscription belongs to exactly one of family / provider.
ALTER TABLE "Subscription"
  ADD CONSTRAINT "subscription_single_owner"
  CHECK (("familyId" IS NOT NULL AND "providerId" IS NULL)
      OR ("familyId" IS NULL AND "providerId" IS NOT NULL));

-- 9. Partial index: only one WAITING waitlist row per child per session matters
--    for promotion ordering; keep that scan cheap.
CREATE INDEX "waitlist_waiting_order_idx"
  ON "WaitlistEntry" ("sessionId", "position")
  WHERE "status" = 'WAITING';

-- 10. Search hot path: published activities of approved providers by category.
CREATE INDEX "activity_published_search_idx"
  ON "Activity" ("status", "category", "creditCost")
  WHERE "status" = 'PUBLISHED';
