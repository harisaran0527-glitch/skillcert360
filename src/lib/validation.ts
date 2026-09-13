import { VALID_SECTIONS } from "./ui-options";
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(8).max(128),
});

export const studentSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    registerNumber: z.string().trim().min(2).max(30),
    email: z.string().trim().email(),
    departmentId: z.string().cuid(),
    year: z.coerce.number().int().min(1).max(8),
    sectionId: z.string().cuid().optional(),
    sectionName: z.enum(VALID_SECTIONS).optional(),
    temporaryPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
  })
  .refine((d) => d.temporaryPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }).refine(d => !!d.sectionName || !!d.sectionId, { message: "Choose section A, B or C", path: ["sectionName"] });

export const editStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  registerNumber: z.string().trim().min(2).max(30),
  email: z.string().trim().email(),
  departmentId: z.string().cuid(),
  year: z.coerce.number().int().min(1).max(8),
  sectionId: z.string().cuid().optional(),
  sectionName: z.enum(VALID_SECTIONS).optional(),
}).refine(d => !!d.sectionName || !!d.sectionId, { message: "Choose section A, B or C", path: ["sectionName"] });

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
