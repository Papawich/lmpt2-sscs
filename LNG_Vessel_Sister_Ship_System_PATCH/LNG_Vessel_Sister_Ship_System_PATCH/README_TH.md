# Sister Ship System — LMPT2 SSCS

Patch นี้ทำต่อจาก project เวอร์ชันล่าสุดที่มี Main Sync + Units และ Workflow Email/Certificate 90-day แล้ว

## สิ่งที่เพิ่ม

### 1) Add Vessel
เมื่อกด **Add Vessel** จะมี checkbox `Sister Ship`

เมื่อเลือก Sister Ship ต้อง:
- เลือก `Refer to vessel` โดยค้นหาจาก Vessel List
- รายการอ้างอิงจะแสดงเฉพาะเรือที่มี **Approved SSCS Study**
- แนบไฟล์ **Sister Ship Statement**
- เรือใหม่จะมีสถานะ Sister Ship = `PENDING`

Sister Ship Statement จะถูกเก็บใน Required Documents > `6.1 Sister Ship Statement`

### 2) Terminal Officer Verification
หน้า Vessel Detail จะแสดงกล่อง `Sister Ship Reference`

Terminal Officer สามารถ:
- **Verify Sister Ship**
- **Reject**

ก่อน Verify ระบบตรวจว่า:
- มี Reference Vessel
- Reference Vessel มี Approved SSCS
- Sister Ship Statement ถูกแนบแล้ว

เมื่อ Verify ระบบจะบันทึก Reference SSCS Study ID เพื่อให้ข้อมูลที่นำมาใช้อ้างอิงเป็น snapshot จาก Study ที่ได้รับ Approved จริง ไม่เปลี่ยนตาม draft ของ reference vessel ภายหลัง

### 3) Required Documents
สำหรับ Sister Ship ที่ Verified:

ดึงจาก Reference Ship และล็อกไม่ให้ upload/delete ใน sister ship:
- 2.1 General Arrangement Plan
- 2.2 Parallel Flat Body
- 2.3 Ship Shore Interface Plan
- 2.4 Manifold Arrangement
- 2.5 Gangway Landing Area drawing/photo
- 3.1–3.4 Manual ทั้งหมด
- 4.1–4.2 Optimoor ทั้งหมด

**ไม่ดึง 2.6 SDP drawing and flange photo** — ต้องเป็นไฟล์ของ Sister Ship เอง

`6.1 Sister Ship Statement` เป็นไฟล์ของ Sister Ship ที่แนบตอน Add Vessel และจะถูกล็อกหลัง Terminal Officer Verify

Group 6 จะไม่แสดงในเรือปกติ

### 4) Data ที่ดึงจาก Reference Ship หลัง Verify
- Tab 1 General Information > **Ship Major Dimensions เท่านั้น**
- Tab 2 Fender / Flat Body
- Tab 3 Mooring Arrangement
- Tab 4 Gangway
- Tab 5 Unloading Arm
- Tab 6 Cargo Management
- Tab 7 Ship Shore Link System
- Tab 10 Utility System

ข้อมูลเหล่านี้จะถูก copy จาก Approved Reference Study ตอน Verify และแสดงเป็น read-only ใน Sister Ship

ข้อมูลที่ยังเป็นของ Sister Ship เอง เช่น:
- General Information > Ship Info
- Required Documents กลุ่ม 1, 5 และ 2.6
- CTMS
- SDPs
- Attachment
- Quality Assessment

### 5) Workflow Protection
- Sister Ship ที่ยัง `PENDING` จะ **Submit for Review ไม่ได้** จนกว่า Terminal Officer จะ Verify หรือ Reject
- Ship Officer ไม่สามารถแก้ Sister Ship verification status ผ่าน browser/API ได้
- Main Vessel List มี badge `SISTER PENDING / VERIFIED / REJECTED`

---

# วิธีติดตั้ง

## ขั้นที่ 1 — Run SQL ก่อน
ไปที่ Supabase > SQL Editor > New query

เปิดไฟล์:

`006_sister_ship_system.sql`

Copy ทั้งหมดแล้วกด **Run**

SQL นี้เพิ่ม sister-ship fields และ database protection trigger

## ขั้นที่ 2 — Apply frontend patch
นำไฟล์ `sister_ship_system.patch` ไปวางข้าง `package.json`

CMD:

```bat
git apply --check sister_ship_system.patch
```

ถ้าไม่มี error:

```bat
git apply sister_ship_system.patch
npm run dev
```

> ถ้า `git apply --check` มี error ห้าม apply ต่อ ให้ส่ง error มาเช็กก่อน

## ขั้นที่ 3 — Test
แนะนำใช้เรือ Reference ที่มี Approved Study อยู่แล้ว

1. Login Ship Officer
2. Add Vessel
3. Check `Sister Ship`
4. Search แล้วเลือก Reference Vessel
5. Attach Sister Ship Statement
6. Add Vessel
7. ตรวจ Tab 0 ว่ามี 6.1 Sister Ship Statement
8. เปิด Browser/Incognito อีกตัว Login Terminal Officer
9. เปิด Vessel Detail ของ Sister Ship
10. กด **Verify Sister Ship**
11. กลับเข้า Study แล้วตรวจว่า:
   - Ship Major Dimensions ถูกดึงและ read-only
   - Tabs 2,3,4,5,6,7,10 ถูกดึงและ read-only
   - Required Docs 2.1–2.5, 3.x, 4.x แสดงไฟล์จาก Reference Ship
   - Required Doc 2.6 ยัง upload ได้สำหรับ Sister Ship
   - 6.1 Statement แสดงและถูกล็อก

## ขั้นที่ 4 — Build และ Push

```bat
npm run build
git add .
git status
git commit -m "Add sister ship reference workflow"
git push
```

Vercel จะ deploy อัตโนมัติ

## ไม่ต้องทำ
- ไม่ต้อง deploy Edge Function ใหม่
- ไม่ต้องแก้ EmailJS
- ไม่ต้องสร้าง Storage bucket ใหม่

ระบบใช้ bucket `sscs-documents` เดิมสำหรับ Sister Ship Statement และ reference documents ใช้ metadata/path ของ Approved Reference Study เดิม
