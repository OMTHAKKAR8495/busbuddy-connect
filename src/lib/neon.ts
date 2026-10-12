import { neon } from "@neondatabase/serverless";

// Neon PostgreSQL Serverless Connection string for old-king-40138450
const NEON_DATABASE_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_vx9dalhAFf8u@ep-billowing-pine-b5mr2ja6-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const neonSql = neon(NEON_DATABASE_URL);

export type RegisteredUser = {
  id: string;
  full_name: string;
  email: string;
  roll_number?: string | null;
  phone?: string | null;
  role: "student" | "driver" | "admin";
  created_at: string;
};

// Register user directly into Neon PostgreSQL
export async function registerUserInNeon(params: {
  fullName: string;
  email: string;
  password: string;
  rollNumber?: string | null;
  phone?: string | null;
  role: "student" | "driver" | "admin";
}): Promise<RegisteredUser> {
  const { fullName, email, password, rollNumber, phone, role } = params;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Insert into app_accounts
  const rows = await neonSql`
    INSERT INTO public.app_accounts (full_name, email, password, roll_number, phone, role)
    VALUES (${fullName.trim()}, ${cleanEmail}, ${password}, ${rollNumber || null}, ${phone || null}, ${role})
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password = EXCLUDED.password,
      roll_number = EXCLUDED.roll_number,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role
    RETURNING id, full_name, email, roll_number, phone, role, created_at;
  `;

  const user = rows[0] as RegisteredUser;

  // 2. Also mirror into registered_students_master if student
  if (role === "student") {
    try {
      await neonSql`
        INSERT INTO public.registered_students_master (id, student_name, roll_number, email, phone, status, registered_at)
        VALUES (${user.id}, ${user.full_name}, ${user.roll_number || '24BT04171'}, ${user.email}, ${user.phone || '+91 98765 43210'}, 'Active', NOW())
        ON CONFLICT (email) DO UPDATE SET
          student_name = EXCLUDED.student_name,
          roll_number = EXCLUDED.roll_number;
      `;
    } catch (e) {
      console.warn("registered_students_master insert fallback:", e);
    }
  }

  // 3. Mirror into profiles & user_roles
  try {
    await neonSql`
      INSERT INTO public.profiles (id, full_name, roll_number, phone)
      VALUES (${user.id}, ${user.full_name}, ${user.roll_number || null}, ${user.phone || null})
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        roll_number = EXCLUDED.roll_number;
    `;
    await neonSql`
      INSERT INTO public.user_roles (user_id, role)
      VALUES (${user.id}, ${role}::public.app_role)
      ON CONFLICT DO NOTHING;
    `;
  } catch (e) {
    console.warn("profiles/user_roles mirror fallback:", e);
  }

  return user;
}

// Authenticate user directly against Neon PostgreSQL
export async function loginUserWithNeon(email: string, password: string): Promise<RegisteredUser | null> {
  const cleanEmail = email.trim().toLowerCase();
  const rows = await neonSql`
    SELECT id, full_name, email, roll_number, phone, role, created_at
    FROM public.app_accounts
    WHERE LOWER(email) = ${cleanEmail} AND password = ${password}
    LIMIT 1;
  `;

  if (rows.length === 0) return null;
  return rows[0] as RegisteredUser;
}
