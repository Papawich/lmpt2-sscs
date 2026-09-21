# Password Reset แบบไม่ใช้อีเมล / ไม่ใช้ Resend

เพื่อความปลอดภัย **ไม่สามารถให้ผู้ที่รู้แค่อีเมลเปลี่ยนรหัสผ่านได้ทันที** เพราะจะทำให้ใครก็ยึดบัญชีคนอื่นได้ และ Supabase ไม่ได้เก็บรหัสผ่านเดิมแบบอ่านกลับได้

Patch นี้เปลี่ยน Flow เป็น:

1. ผู้ใช้กด **Forgot password**
2. กรอกอีเมลที่สมัครไว้ แล้วกด **Request Password Reset**
3. หน้าเว็บขึ้น **Waiting for Administrator Approval** โดยไม่ส่งอีเมลใด ๆ
4. Admin เข้า **Admin Panel > Password Reset Requests** แล้วตรวจสอบตัวตนผู้ใช้ผ่านช่องทางของบริษัท เช่น Teams/โทรศัพท์/พบตัวจริง ก่อนกด **Approve Reset**
5. ผู้ใช้กด **Check Approval Status**
6. เมื่ออนุมัติแล้ว ผู้ใช้จึงกรอก **New Password / Confirm New Password** และอัปเดตรหัสใหม่ได้

รหัสผ่านใหม่ไม่ถูกเก็บใน table `password_reset_requests`; จะถูกส่งตรงไปยัง Edge Function หลัง Admin approve เท่านั้น

## ขั้นตอนติดตั้ง

### 1) Apply frontend patch
วาง `password_reset_no_email.patch` ข้าง `package.json` แล้วรัน:

```bat
git apply --check password_reset_no_email.patch
git apply password_reset_no_email.patch
npm run dev
```

### 2) สร้าง table
เปิด Supabase > SQL Editor แล้ว Run:

`supabase/004_password_reset_requests.sql`

### 3) Deploy Edge Function
Function อยู่ที่:

`supabase/functions/password-reset/index.ts`

ถ้าใช้ Supabase CLI:

```bat
supabase functions deploy password-reset --no-verify-jwt
```

`--no-verify-jwt` จำเป็นเพราะผู้ใช้ที่ลืมรหัสผ่านยังไม่มี session; Function นี้ใช้ one-time reset secret + Admin approval เป็น custom authorization แทน

> ห้ามนำ `SUPABASE_SERVICE_ROLE_KEY` ไปใส่ใน `.env.local` หรือ Vercel frontend เด็ดขาด Edge Function จะได้รับ service role จาก Supabase ฝั่ง server เอง

### 4) ทดสอบ
- logout
- Forgot password
- request reset
- login Admin ในอีก browser
- Approve Reset
- กลับ browser ผู้ใช้ > Check Approval Status
- ตั้งรหัสใหม่
- Sign in ด้วยรหัสใหม่

ไม่ต้องตั้ง SMTP, Resend, Email Template หรือ Recovery URL สำหรับ flow นี้
