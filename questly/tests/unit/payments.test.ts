import { describe, expect, it } from "vitest";
import { MockPaymentProvider, paymentProvider, resetPaymentProvider } from "@/modules/subscriptions/payment-provider";
import { recommendationEnhancer } from "@/modules/recommendations/ai-provider";
import { currentWeather } from "@/modules/recommendations/weather";

describe("running without external services", () => {
  it("falls back to the mock payment provider when Stripe is not configured", () => {
    resetPaymentProvider();
    expect(paymentProvider().kind).toBe("MOCK");
  });

  it("creates a simulated checkout session with no network access", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createCheckoutSession({
      familyId: "fam1",
      customerEmail: "parent@example.test",
      plan: "FAMILY_PREMIUM",
      successUrl: "http://localhost:3000/settings/subscription/confirm",
      cancelUrl: "http://localhost:3000/settings/subscription",
    });

    expect(session.simulated).toBe(true);
    expect(session.url).toContain("/settings/subscription/confirm");
    expect(session.url).toContain("simulated=1");
  });

  it("ignores webhooks when no provider is configured", async () => {
    const provider = new MockPaymentProvider();
    await expect(provider.parseWebhook()).resolves.toEqual({ type: "ignored" });
  });

  it("uses a no-op recommendation enhancer by default", async () => {
    const enhancer = recommendationEnhancer();
    expect(enhancer.name).toBe("none");
    const input = [] as never[];
    await expect(enhancer.enhance(input, {} as never)).resolves.toBe(input);
  });

  it("derives weather locally without an external forecast API", async () => {
    const winter = await currentWeather(new Date("2026-01-15T12:00:00Z"));
    expect(winter).toEqual({ season: "WINTER", weather: "COLD" });
  });
});
