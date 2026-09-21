# Workflow Email + Certificate Expiring 90 Days

Patch นี้ทำ 2 ส่วน โดยไม่ต้องแก้ SQL และไม่ต้อง deploy Supabase Edge Function ใหม่

## 1) เพิ่ม EmailJS notification ใน workflow

เพิ่มอีเมลอัตโนมัติ 3 ขั้นตอน:

1. **Terminal Officer → Request Revision**
   - ส่งไปยัง Ship Officer ผู้เริ่ม Study
   - Subject: `SSCS Revision Requested — {Vessel Name}`
   - แจ้งว่า Study ถูกส่งกลับเป็น Draft เพื่อแก้ไขและ Submit ใหม่

2. **Ship Officer → Request to Edit**
   - ส่งไปยัง Terminal Officer ที่ account Approved
   - Subject: `SSCS Edit Request — {Vessel Name}`
   - แจ้งให้เข้าเว็บเพื่อ Approve / Reject edit request

3. **Terminal Officer → Reject Edit**
   - ส่งไปยัง Ship Officer ผู้เริ่ม Study
   - Subject: `Edit Request Rejected — {Vessel Name}`
   - แจ้งว่า Study ยังคง Locked

นอกจากนี้ patch ทำให้ **Approve Edit** จากหน้า Vessel Detail ส่งอีเมลเดิมด้วย เพื่อให้ behavior ตรงกันไม่ว่าจะกดจาก Vessel Detail หรือหน้า Study

## 2) Certificate Expiring ภายใน 90 วัน

หน้า Home / All Vessels:
- ถ้า Study ล่าสุดเป็น `Approved`
- และมี Certificate แบบไม่ใช่ Permanent ที่ `Valid Date` อยู่ระหว่าง **วันนี้ ถึง 90 วันข้างหน้า (รวมวันนี้และวันที่ 90)**
- จะแสดง badge สีเหลืองข้าง `Approved`:

`CERTIFICATE EXPIRING`

ถ้ามากกว่า 1 รายการจะแสดงจำนวน เช่น:

`CERTIFICATE EXPIRING (3)`

Certificate ที่หมดอายุแล้วจะยังคงใช้ badge สีแดง `CERTIFICATE INVALID` ตามระบบเดิม

Certificate แบบ Permanent (Certificate of Registry / International Tonnage Certificate) ไม่นับใน 90-day warning

## วิธีติดตั้ง

วางไฟล์ `workflow_email_cert_90day.patch` ที่ root ของ project ข้าง `package.json`

```bat
git apply --check workflow_email_cert_90day.patch
```

ถ้าไม่มี error:

```bat
git apply workflow_email_cert_90day.patch
npm run dev
```

## วิธีทดสอบ

### Email
- Submit Study แล้ว Terminal Officer กด `Request Revision` → Ship Officer ควรได้รับ email
- Approved Study แล้ว Ship Officer กด `Request to Edit` → Terminal Officer ควรได้รับ email
- Terminal Officer กด `Reject Edit` → Ship Officer ควรได้รับ email

### 90-day warning
ลองตั้ง Valid Date ของ certificate ที่ไม่ใช่ Permanent เป็นวันที่ภายใน 90 วันจากวันนี้ แล้ว Approve Study จากนั้นกลับหน้า Home ควรเห็น badge สีเหลืองข้าง `Approved`

## เมื่อทดสอบผ่าน

```bat
git add .
git commit -m "Add workflow emails and 90 day certificate warning"
git push
```
