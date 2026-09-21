# Main Vessel Sync + Unit Labels

Patch นี้เพิ่ม 3 เรื่อง:

1. เมื่อ SSCS ถูก **Submit for Review** ข้อมูล General Information (gi-01 ถึง gi-13) จะกลายเป็นข้อมูลล่าสุดที่หน้า Main / Search / Vessel list ใช้แสดง
   - Draft / Editing ที่ยังไม่ Submit รอบใหม่ จะยังไม่เปลี่ยนข้อมูลหน้า Main
2. เพิ่มหน่วย **m.** ในทุกช่องของ `Length of Flat Body From Vapour Manifold`
3. เพิ่มหน่วย **kg/h** ให้ `Gas Management System > Capacity`

## สำคัญ: Run SQL 1 ครั้ง

เพื่อให้ `public.vessels` ใน Supabase ถูกอัปเดตจริงและคงข้อมูลล่าสุดหลัง refresh/เข้าใหม่ ให้เปิด:

**Supabase > SQL Editor > New query**

แล้ว Run ไฟล์:

`005_sync_vessel_master_on_submit.sql`

SQL นี้จะ:
- backfill เรือที่มี Study เคย Submit แล้ว ให้ข้อมูล master ตรงกับ Study ล่าสุด
- สร้าง trigger สำหรับการ Submit ครั้งถัดไป
- sync เฉพาะ General Information gi-01..gi-13

ไม่ลบ Study / Document / User และไม่เปลี่ยน Auth

## Apply frontend patch

วาง `main_sync_units.patch` ข้าง `package.json` แล้วรัน:

```bat
git apply --check main_sync_units.patch
```

ถ้าไม่มี error:

```bat
git apply main_sync_units.patch
npm run dev
```

## ทดสอบ

1. เปิด Study Draft
2. เปลี่ยน Ship Name / IMO / Flag / Capacity / Owner หรือข้อมูล General Information อื่น
3. ก่อน Submit กลับหน้า Main แล้วข้อมูล master ไม่ควรถูกแทนด้วย Draft ใหม่
4. กด `SUBMIT FOR REVIEW`
5. กลับหน้า Main แล้วตรวจว่าข้อมูลใน Vessel list และ Search เป็นค่าล่าสุด
6. Refresh browser แล้วตรวจซ้ำ (ต้อง Run SQL ด้านบนแล้ว)
7. ตรวจ Fender / Flat Body ว่าทุกช่อง Flat Body แสดง `m.`
8. ตรวจ Cargo Management > Gas Management System ว่า Capacity แสดง `kg/h`

## Push ขึ้น Vercel

หลังทดสอบผ่าน:

```bat
git add .
git status
git commit -m "Sync vessel master on submit and add units"
git push
```
