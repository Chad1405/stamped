import { describe, expect, it } from "vitest";
import { isPassSale } from "./payments";

const paid = { mode: "payment", status: "complete", payment_status: "paid", client_reference_id: "a".repeat(32), line_items: { data: [{ price: { id: "price_pass" } }] } } as const;
describe("what counts as a sale of the pass", () => {
  it("is a completed, paid session for exactly the pass price, made for a player", () => {
    expect(isPassSale(paid, "price_pass")).toBe(true);
  });
  it("is nothing else in the Stripe account", () => {
    expect(isPassSale({ ...paid, line_items: { data: [{ price: { id: "price_other" } }] } }, "price_pass")).toBe(false);   // another product
    expect(isPassSale({ ...paid, line_items: { data: [{ price: { id: "price_pass" } }, { price: { id: "price_other" } }] } }, "price_pass")).toBe(false);
    expect(isPassSale({ ...paid, payment_status: "no_payment_required" }, "price_pass")).toBe(false);   // free or 100% off
    expect(isPassSale({ ...paid, payment_status: "unpaid" }, "price_pass")).toBe(false);   // a delayed method that hasn't settled
    expect(isPassSale({ ...paid, mode: "setup" }, "price_pass")).toBe(false);
    expect(isPassSale({ ...paid, status: "open" }, "price_pass")).toBe(false);
    expect(isPassSale({ ...paid, client_reference_id: null }, "price_pass")).toBe(false);   // e.g. a Payment Link
    expect(isPassSale({ ...paid, line_items: null }, "price_pass")).toBe(false);
  });
});
