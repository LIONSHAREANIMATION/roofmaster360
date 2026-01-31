import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  subscriptionStatus: text("subscription_status").default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  aiRequestsUsed: integer("ai_requests_used").default(0),
  companyName: text("company_name"),
  companyLogo: text("company_logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  address: text("address").notNull(),
  length: real("length").default(0),
  width: real("width").default(0),
  pitch: real("pitch").default(0),
  roofArea: real("roof_area").default(0),
  roofSquares: integer("roof_squares"),
  selectedMaterial: text("selected_material"),
  materialPricePerSquare: real("material_price_per_square"),
  microBreakdown: jsonb("micro_breakdown"),
  laborRate: real("labor_rate").default(0),
  laborHours: real("labor_hours").default(0),
  additionalCosts: real("additional_costs").default(0),
  estimateTotal: real("estimate_total").default(0),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
