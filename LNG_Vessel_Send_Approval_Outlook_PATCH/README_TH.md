# Send an Approval — Outlook Draft

Patch นี้เพิ่มปุ่ม **Send an Approval** ข้าง `View Study` ในหน้า Vessel Detail

เงื่อนไขการแสดงปุ่ม:
- ผู้ใช้ต้องเป็น `Terminal Officer`
- Study ต้องมีสถานะ `Approved`

เมื่อกดปุ่ม:
- เปิด email draft ผ่าน `mailto:` (ถ้า Windows ตั้ง Outlook เป็น default mail app จะเปิด Outlook)
- **ไม่ส่งอีเมลอัตโนมัติ** ผู้ใช้ยังตรวจ/แก้ไขและกด Send เอง
- ช่อง To จะเติม email ของผู้ที่ Initiate Study ถ้าพบ account ในระบบ; ถ้าไม่พบจะเว้นว่าง
- Subject: `[SSCS | LMPT2] Approved | the LNG/C {vessel name}`
- Body มี Approval Details และข้อมูลจาก SSCS Summary ได้แก่ Ship Name, Gas Management, Drafts, Mooring Pattern, Rope, Gangway, Unloading Arm, CTMS, SDPs และ Terminal Officer Notes (ถ้ามี)

## วิธีติดตั้ง
วาง `send_approval_outlook.patch` ไว้ที่ root project (ข้าง `package.json`) แล้วรัน:

```bat
git apply --check send_approval_outlook.patch
```

ถ้าไม่มี error:

```bat
git apply send_approval_outlook.patch
npm run dev
```

ทดสอบด้วย Terminal Officer และ Approved Study

เมื่อผ่านแล้ว:

```bat
git add .
git commit -m "Add approval email draft for terminal officer"
git push
```

## หมายเหตุ Outlook
Patch ใช้ `mailto:` เพื่อเปิดโปรแกรม email ที่ Windows กำหนดเป็น default. ถ้าต้องการให้เปิด Outlook Desktop ให้ตั้ง Outlook เป็น default handler สำหรับ Email / MAILTO ใน Windows Settings.
