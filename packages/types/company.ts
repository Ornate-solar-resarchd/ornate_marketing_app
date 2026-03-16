import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: z.string(),
  icon: z.string(),
  order: z.number(),
  createdAt: z.string().datetime(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoryWithCountSchema = CategorySchema.extend({
  _count: z.object({ companies: z.number() }),
});

export type CategoryWithCount = z.infer<typeof CategoryWithCountSchema>;

export const CompanySchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: z.string(),
  icon: z.string(),
  color: z.string(),
  logoUrl: z.string(),
  websiteUrl: z.string(),
  docTypes: z.array(z.string()),
  categoryId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Company = z.infer<typeof CompanySchema>;

export const CategoryWithCompaniesSchema = CategorySchema.extend({
  companies: z.array(CompanySchema),
});

export type CategoryWithCompanies = z.infer<typeof CategoryWithCompaniesSchema>;

export const CreateCompanySchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoUrl: z.string().url(),
  websiteUrl: z.string().url(),
  docTypes: z.array(z.string()).min(1),
  categoryId: z.string().min(1),
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
