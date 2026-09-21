# LMPT2 — Forgot Password แบบ OTP

Patch นี้เปลี่ยน Forgot Password จากการกดลิงก์ในอีเมลเป็น flow:

1. ผู้ใช้กรอกอีเมล
2. Supabase ส่ง recovery OTP 6 หลัก
3. ผู้ใช้กรอก OTP ในเว็บ
4. เว็บตรวจ OTP กับ Supabase
5. ผู้ใช้กรอกรหัสผ่านใหม่ + ยืนยันรหัสผ่าน
6. ระบบเปลี่ยนรหัสผ่าน แล้ว sign out ให้ผู้ใช้ login ใหม่

นอกจากนี้ยังรองรับ Supabase recovery link เดิมเป็น fallback ถ้าลิงก์ยัง valid และจะแสดงข้อความที่เข้าใจง่ายเมื่อเจอ `otp_expired`.

## 1) ลง patch

นำ `password_recovery_otp.patch` ไปวางในโฟลเดอร์เดียวกับ `package.json` แล้วรัน:

```bat
git apply --check password_recovery_otp.patch
```

ถ้าไม่มี error:

```bat
git apply password_recovery_otp.patch
npm run dev
```

## 2) ตั้ง Supabase Reset Password email template — จำเป็น

ไปที่:

`Supabase Dashboard → Authentication → Email Templates → Reset Password`

ตั้ง Subject ตัวอย่าง:

`LMPT2 password reset code`

จากนั้นแทนเนื้อหาเดิมที่มีปุ่ม/ลิงก์ Reset password ด้วยเนื้อหาในไฟล์
`SUPABASE_RESET_PASSWORD_TEMPLATE.html`

จุดสำคัญที่สุดคือ template ต้องมี:

```html
{{ .Token }}
```

Supabase จะใส่ OTP 6 หลักลงในตำแหน่งนี้

> อย่าใช้เฉพาะ `{{ .ConfirmationURL }}` สำหรับ flow หลัก เพราะระบบอีเมลบริษัทอาจเปิดลิงก์เพื่อตรวจความปลอดภัยก่อนผู้ใช้ ทำให้ one-time link หมดอายุได้

## 3) ทดสอบ

1. เปิดหน้า Sign In → Forgot password?
2. กรอกอีเมล account ที่มีอยู่จริง
3. ควรได้อีเมลที่มี OTP 6 หลัก (ไม่มีความจำเป็นต้องกดลิงก์)
4. กรอก OTP ในหน้าเว็บ
5. ตั้ง New Password อย่างน้อย 8 ตัวอักษร
6. Confirm New Password
7. กด Update Password
8. กลับ Sign In และ login ด้วยรหัสใหม่

## 4) หลังทดสอบผ่าน

```bat
git add .
git commit -m "Use OTP for password recovery"
git push
```

Vercel จะ deploy ให้จาก branch `main` อัตโนมัติ

## SQL / ENV

- ไม่ต้อง Run SQL เพิ่ม
- ไม่ต้องเพิ่ม Environment Variable
- ใช้ Supabase Auth project เดิม
