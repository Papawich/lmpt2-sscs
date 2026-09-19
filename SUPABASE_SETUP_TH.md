# ตั้งค่า LMPT2 SSCS ให้ใช้ Supabase Cloud

เวอร์ชันนี้แก้จากไฟล์ Figma export ให้ใช้ Supabase เป็น backend โดยตรง โดยยังคง UI/SSCS workflow เดิมไว้เป็นหลัก

สิ่งที่ย้ายขึ้น cloud แล้ว:

- Login / password → Supabase Auth
- User profile + สถานะ Pending/Approved/Rejected → `profiles`
- Vessel database → `vessels`
- SSCS studies → `sscs_studies`
- ข้อมูลแต่ละ SSCS section → `study_sections` (JSONB)
- Required Documents → Supabase Storage bucket `sscs-documents` + metadata table `documents`
- Audit ของการเปลี่ยนสิทธิ์และสถานะ study → `audit_logs`
- Row Level Security (RLS) ตาม role

> ห้ามใส่ Supabase `service_role` key ใน frontend หรือไฟล์ `.env` ของ Vite เด็ดขาด ใช้เฉพาะ Publishable/anon key เท่านั้น

## 1) สร้างตารางและ Security Policy

ใน Supabase Dashboard ของ project **SSCS LMPT2 database** ไปที่ **SQL Editor** แล้วรันไฟล์ตามลำดับ:

1. `supabase/001_initial_schema.sql`
2. `supabase/002_seed_vessels.sql`

ไฟล์ที่ 2 จะนำ vessel 58 รายการจากเว็บต้นฉบับขึ้นฐานข้อมูล โดยไม่สร้าง demo password/user ในฐานข้อมูล

## 2) ตั้งค่า Auth ให้เข้ากับ OTP EmailJS เดิม

เว็บนี้ยังคงใช้ OTP จาก EmailJS ก่อนสร้างบัญชี Supabase Auth เพื่อรักษา flow เดิมของหน้า Register

ใน Supabase Authentication settings ของ Email provider ให้ **ปิด Confirm email** หากต้องการใช้ EmailJS OTP นี้เป็นขั้นตอนยืนยันอีเมลหลัก

ถ้าเปิด Confirm email ไว้ ผู้ใช้จะได้รับขั้นตอนยืนยันจาก Supabase เพิ่มอีกชั้น และ login อาจขึ้น `Email not confirmed`

> สำหรับระบบ production ที่ต้องการ security สูงกว่า แนะนำระยะถัดไปให้ย้าย OTP ทั้งหมดไป Supabase Auth/Edge Function แทน OTP ที่ generate ใน browser

## 3) ตั้ง Environment Variables

Copy `.env.example` เป็น `.env.local` แล้วใส่ค่าจริง:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx

VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_ADMIN_NOTIFICATION_EMAILS=admin@company.com
```

ค่าของ Supabase หาได้จาก Project Settings / API ของ Supabase project

โปรเจกต์รองรับทั้ง:

- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY` (ชื่อแบบเดิม)

ใช้เพียงอันใดอันหนึ่ง

## 4) สร้าง Admin คนแรก

เพราะไม่ควร seed password ลง SQL ให้ทำดังนี้:

1. เปิดเว็บแล้ว Register ด้วย account ที่ต้องการใช้เป็น Admin
2. ยืนยัน OTP ให้ registration เสร็จ ระบบจะสร้าง `profiles` เป็น `pending`
3. เปิด `supabase/003_bootstrap_admin.sql`
4. เปลี่ยน `YOUR_ADMIN_EMAIL@COMPANY.COM` เป็น email จริง
5. Run ใน Supabase SQL Editor
6. กลับมาที่เว็บแล้ว Sign in

หลังจากนั้น Admin สามารถ Approve/Reject ผู้ใช้ใหม่จากหน้า Admin Panel ได้ตาม UI เดิม

## 5) Required Documents

เมื่อ Supabase ถูกตั้งค่าแล้ว ไฟล์ในหน้า Required Documents จะไม่ถูกเก็บเป็น Base64 ใน browser อีกต่อไป แต่จะ upload ไป private Storage bucket:

`sscs-documents/<study-id>/<document-type>/<file>`

ดาวน์โหลดผ่าน signed URL ชั่วคราว และ RLS ตรวจสิทธิ์จาก study ที่เกี่ยวข้อง

ไฟล์สูงสุดที่ migration ตั้งไว้คือ 50 MB ต่อไฟล์

## 6) Role / Permission หลัก

- **Admin**: จัดการ approval ผู้ใช้ และเข้าถึงข้อมูลทั้งหมด
- **Terminal Officer**: อ่าน/แก้/review study และเปลี่ยน workflow status
- **Ship Officer**: สร้าง request/study และแก้เฉพาะ study ของตัวเองใน `draft` หรือ `editing`; ส่ง study และ request edit ได้
- **Viewer**: read-only

RLS อยู่ที่ database ดังนั้นการแก้ JavaScript ใน browser ไม่ควรทำให้ข้ามสิทธิ์เหล่านี้ได้

## 7) Run ในเครื่อง

```bash
npm install
npm run dev
```

หรือ build:

```bash
npm run build
```

ถ้าไม่ได้ใส่ Supabase env เว็บยังมี **Local Demo Mode** เพื่อ preview UI เหมือน export เดิม แต่ข้อมูลในโหมดนั้นไม่ persistent

## 8) ก่อนใช้งานจริง

ควรทดสอบอย่างน้อย 4 account จริง:

- Admin
- Terminal Officer
- Ship Officer
- Viewer

ทดสอบ flow: Register → Admin approve → Login → Add Vessel/Request Access → Fill SSCS → Upload documents → Submit → Terminal review → Approve → Request Edit

และตรวจ Supabase Table Editor / Storage ว่าข้อมูลยังอยู่หลัง refresh และเปิดจากเครื่องอื่น
