# Quality Assessment Patch

เพิ่ม Tab `12. Quality Assessment` ต่อจาก Attachment

## Certificate Status
ช่อง Issue Date / Valid Date เป็น text input เพื่อรองรับรูปแบบวันที่ตามเอกสารจริง เช่น `23 Aug 2024`.

ช่อง Valid Date ที่เป็น Permanent ถูกล็อกเป็นพื้นสีเทาและแสดง `PERMANENT`:
- Certificate of Registry
- International Tonnage Certificate (1969)

รวม certificate ที่อยู่ในกลุ่มเดียวกันเพื่อลดจำนวนช่อง:
- Cargo Ship Safety Certificates — Construction / Equipment / Radio
- MARPOL Pollution Prevention Certificates — Oil / Sewage / Air

## Ship's Inspection Report
- Last inspection by Port State — Date / Place / By
- Last inspection by Flag State — Date / Place / By
- Last inspection by SIRE inspector — Date / Place / By

ข้อมูลบันทึกใน Supabase `study_sections` ด้วย `section_key = quality_assessment` จึงไม่ต้องรัน SQL migration เพิ่ม.
