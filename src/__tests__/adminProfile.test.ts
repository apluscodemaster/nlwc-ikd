import { describe, it, expect } from "vitest";
import {
  nameFromEmail,
  initialsFromName,
  resolveAdminIdentity,
} from "@/lib/adminProfile";

describe("nameFromEmail", () => {
  it("splits a dotted local part into first and last name", () => {
    expect(nameFromEmail("adebanjo.adeniji@concept-nova.com")).toBe(
      "Adebanjo Adeniji",
    );
  });

  it("handles underscore and hyphen separators", () => {
    expect(nameFromEmail("john_doe@x.com")).toBe("John Doe");
    expect(nameFromEmail("john-doe@x.com")).toBe("John Doe");
  });

  it("ignores plus-addressing", () => {
    expect(nameFromEmail("john.doe+admin@x.com")).toBe("John Doe");
  });

  it("normalises casing", () => {
    expect(nameFromEmail("JOHN.DOE@x.com")).toBe("John Doe");
  });

  it("drops a trailing numeric counter", () => {
    expect(nameFromEmail("john.doe.2@x.com")).toBe("John Doe");
  });

  it("returns null for role addresses that aren't people", () => {
    expect(nameFromEmail("admin@x.com")).toBeNull();
    expect(nameFromEmail("info@x.com")).toBeNull();
    expect(nameFromEmail("no-reply@x.com")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(nameFromEmail(null)).toBeNull();
    expect(nameFromEmail(undefined)).toBeNull();
    expect(nameFromEmail("")).toBeNull();
    expect(nameFromEmail("@x.com")).toBeNull();
  });

  it("handles a single-token local part", () => {
    expect(nameFromEmail("grace@x.com")).toBe("Grace");
  });
});

describe("initialsFromName", () => {
  it("uses first and last word", () => {
    expect(initialsFromName("Adebanjo Adeniji")).toBe("AA");
    expect(initialsFromName("Mary Jane Watson")).toBe("MW");
  });

  it("uses one letter for a single word", () => {
    expect(initialsFromName("Grace")).toBe("G");
  });

  it("never returns empty", () => {
    expect(initialsFromName("")).toBe("A");
    expect(initialsFromName("   ")).toBe("A");
  });
});

describe("resolveAdminIdentity", () => {
  it("prefers a real profile displayName", () => {
    expect(
      resolveAdminIdentity({
        displayName: "Pastor Sam Okoro",
        email: "different.person@x.com",
      }),
    ).toEqual({ name: "Pastor Sam Okoro", initials: "PO", fromProfile: true });
  });

  it("falls back to the email-derived name", () => {
    const id = resolveAdminIdentity({
      displayName: null,
      email: "adebanjo.adeniji@concept-nova.com",
    });
    expect(id.name).toBe("Adebanjo Adeniji");
    expect(id.initials).toBe("AA");
    expect(id.fromProfile).toBe(false);
  });

  it("ignores a whitespace-only displayName", () => {
    const id = resolveAdminIdentity({
      displayName: "   ",
      email: "john.doe@x.com",
    });
    expect(id.name).toBe("John Doe");
    expect(id.fromProfile).toBe(false);
  });

  it("falls back to Administrator for a role address", () => {
    const id = resolveAdminIdentity({ email: "admin@x.com" });
    expect(id.name).toBe("Administrator");
    expect(id.initials).toBe("A");
  });

  it("never renders an empty name or initials with no data at all", () => {
    const id = resolveAdminIdentity({});
    expect(id.name).toBe("Administrator");
    expect(id.initials).toBe("A");
  });
});
