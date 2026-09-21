# LMPT2 SSCS — Password Recovery Confirm-Link Patch

Patch นี้เปลี่ยน Forgot Password จาก OTP 6 หลัก เป็น:

1. ผู้ใช้กรอก email ที่ลงทะเบียนไว้
2. Supabase ส่งอีเมล Reset Password
3. อีเมลพาเข้าหน้า **CONFIRM PASSWORD RESET** ของเว็บ
4. การเปิดลิงก์อย่างเดียว **ยังไม่ consume token**
5. ผู้ใช้ต้องกด **CONFIRM PASSWORD RESET** เอง
6. เว็บจึง verify `TokenHash` กับ Supabase และเปิดหน้า SET NEW PASSWORD
7. ตั้งรหัสใหม่สำเร็จแล้วระบบ sign out และให้กลับ Sign In

แนวทางนี้ออกแบบมาเพื่อลดปัญหา Microsoft/Outlook Safe Links หรือ email security scanner เปิดลิงก์ก่อนผู้ใช้จริง

## 1) ลง patch

เอาไฟล์ `password_recovery_confirm_link.patch` ไปวางในโฟลเดอร์เดียวกับ `package.json` แล้วรัน:

```bat
git apply --check password_recovery_confirm_link.patch
```

ถ้าไม่มี error:

```bat
git apply password_recovery_confirm_link.patch
npm run dev
```

## 2) เปลี่ยน Supabase Reset Password email template

ไปที่:

Supabase → Authentication → Email Templates → Reset Password

Copy เนื้อหาทั้งหมดจากไฟล์ `SUPABASE_RESET_PASSWORD_TEMPLATE.html` ไปแทน template เดิม แล้ว Save

Template ใช้ `{{ .SiteURL }}` และ `{{ .TokenHash }}` ดังนั้น Site URL ต้องตั้งถูกต้อง เช่น:

`https://lmpt2-sscs.vercel.app`

ที่ Supabase → Authentication → URL Configuration

## 3) ทดสอบ

- เปิด Sign In → Forgot password
- กรอก email ที่มี account จริง
- เปิด email ใหม่ที่ได้รับ
- กด Continue password reset
- เว็บควรขึ้น CONFIRM PASSWORD RESET
- กด CONFIRM PASSWORD RESET
- เว็บควรขึ้น SET NEW PASSWORD
- กรอกรหัสใหม่ 2 ครั้ง
- กลับ Sign In และทดสอบ login ด้วยรหัสใหม่

## 4) ถ้าทดสอบผ่าน

```bat
git add .
git commit -m "Use confirmed link for password recovery"
git push
```

Vercel จะ deploy อัตโนมัติ

## หมายเหตุสำคัญ

- Supabase Auth ไม่สามารถส่งรหัสผ่านเดิมกลับทางอีเมลได้ เพราะเก็บ password เป็น hash ไม่ใช่ plaintext
- อย่าเพิ่ม service_role key หรือ database password ใน frontend
- ถ้า Supabase ไม่ให้แก้ Email Template ต้องตั้ง Custom SMTP หรือใช้แผนที่รองรับก่อน
