import { z } from "zod";
import { Prisma, CredentialType, PricingType, UrlStatus } from "@prisma/client";
import { NextResponse } from "next/server";
export const httpUrl = z.string().trim().max(1000).refine(value => /^https?:\/\//i.test(value) && URL.canParse(value), "Use an HTTP or HTTPS URL");
export const optionalUrl = httpUrl.or(z.literal(""));
export const recordId = z.string().cuid().optional();
export const activeField = z.enum(["true", "false"]).default("true").transform(value => value === "true");
export const slugField = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180);
export const catalogueSlug = (name: string) => name.toLowerCase().replace(/\+\+/g, " plus plus ").replace(/#/g, " sharp ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const courseSchema = z.object({
  id: recordId, name: z.string().trim().min(1).max(300), skillId: z.string().cuid(), providerId: z.string().cuid(), levelId: z.string().cuid(),
  officialUrl: optionalUrl.default(""), officialUrlStatus: z.nativeEnum(UrlStatus).default("OFFICIAL_LINK_PENDING"),
  duration: z.string().trim().max(120).default(""), pricingType: z.nativeEnum(PricingType).default("FREE"),
  credentialAvailable: activeField.default(false), credentialType: z.nativeEnum(CredentialType).default("NONE"), active: activeField,
}).superRefine((value, ctx) => {
  if (value.officialUrlStatus === "VERIFIED" && !value.officialUrl) ctx.addIssue({ code: "custom", message: "A verified course requires an official URL", path: ["officialUrl"] });
  if (value.credentialAvailable !== (value.credentialType !== "NONE")) ctx.addIssue({ code: "custom", message: "Credential availability and type must agree", path: ["credentialType"] });
});
export function adminResult(request: Request, path: string, error?: string) {
  return NextResponse.redirect(new URL(path + (error ? "?error=" + encodeURIComponent(error) : "?saved=1"), request.url), 303);
}
export function catalogueError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "That name or slug already exists. Edit the existing record or use a unique value.";
    if (error.code === "P2003" || error.code === "P2025") return "A selected record no longer exists. Refresh and try again.";
  }
  throw error;
}
