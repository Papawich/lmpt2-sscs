# Ship Name Change + IMO Lock

Patch นี้ต่อจาก Sister Ship System patch ปัจจุบัน

## สิ่งที่แก้

- `IMO Number` เป็นค่าหลักของเรือและล็อกหลัง Add Vessel แล้ว
  - หน้า General Information แสดงเป็น `Locked`
  - Database trigger ป้องกันการแก้ IMO แม้มีการแก้ request จาก browser/API
- `Ship's Name` ปกติเป็น read-only
  - ผู้มีสิทธิ์แก้ Study และมีสิทธิ์ในเรือจะเห็นปุ่ม `Change`
  - กด `Change` -> พิมพ์ชื่อใหม่ -> `Save`
  - ชื่อใหม่จะอัปเดตพร้อมกันทั้ง Vessel Master, Vessel List/Main, Vessel Detail, Study header, SSCS studies ทุก record และ General Information `gi-01`
- Study ใหม่จะเติม `Ship's Name` และ `IMO Number` จาก Vessel Master ให้อัตโนมัติ ไม่ต้องกรอกซ้ำ
- การ Submit General Information จะไม่สามารถเปลี่ยน Ship Name หรือ IMO แบบอ้อม ๆ ได้อีก
- SQL จะทำ one-time cleanup ให้ Study เดิมใช้ Ship Name และ IMO ตาม Vessel Master ปัจจุบัน

## ติดตั้ง

### 1. Run SQL ก่อน

Supabase -> SQL Editor -> New query

เปิดไฟล์:

`007_vessel_identity_controls.sql`

Copy ทั้งหมด -> Run

### 2. Apply frontend patch

วาง `ship_name_imo_control.patch` ข้าง `package.json`

```bat
git apply --check ship_name_imo_control.patch
```

ถ้าไม่มี error:

```bat
git apply ship_name_imo_control.patch
npm run dev
```

## ทดสอบ

1. เข้า Study -> `1. General Information` -> `Ship Info`
2. `IMO Number` ต้องแก้ไม่ได้และขึ้น `Locked`
3. `Ship's Name` ต้องแสดงชื่อเดียวกับ Vessel Master
4. กด `Change`
5. พิมพ์ชื่อใหม่ -> `Save`
6. ตรวจ Main/Vessel Detail/Study header/Summary ว่าใช้ชื่อใหม่ตรงกัน
7. Refresh browser แล้วชื่อใหม่ต้องยังอยู่

## ขึ้น Production

เมื่อทดสอบผ่าน:

```bat
npm run build
git add .
git status
git commit -m "Lock IMO and add controlled ship name change"
git push
```

ไม่ต้อง deploy Edge Function ใหม่
