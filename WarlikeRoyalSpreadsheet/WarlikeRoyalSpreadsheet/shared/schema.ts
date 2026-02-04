import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar").notNull(),
  profilePic: text("profile_pic").notNull(),
  socialPoints: integer("social_points").default(0).notNull(),
  role: text("role").default("Student").notNull(),
  grade: text("grade"),
  bio: text("bio"),
  interests: jsonb("interests").$type<string[]>(),
  unlockedBadges: jsonb("unlocked_badges").$type<string[]>().default([]).notNull(),
  preferences: jsonb("preferences").$type<{
    theme: string;
    notifications: { email: boolean; inApp: boolean };
    language: string;
    privacyShowHistory: boolean;
  }>().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  imageUrl: text("image_url").notNull(),
  donorId: text("donor_id").notNull(),
  donorName: text("donor_name").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;
