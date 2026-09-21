# Vessel Detail — Use SSCS General Information

Patch นี้แก้เฉพาะ `src/app/App.tsx`

หน้า Vessel Detail จะอ่านข้อมูลจาก **SSCS Study > General Information** ก่อน และ fallback ไป Vessel master เดิมเมื่อช่องนั้นยังว่าง:

- Ship's Name (`gi-01`)
- IMO Number (`gi-02`)
- Call Sign (`gi-03`)
- Flag Country (`gi-04`)
- Port of Registry (`gi-05`)
- Year Built (`gi-06`)
- Owner (`gi-07`)
- Operator (`gi-08`)
- Type of Cargo Containment System (`gi-09`)
- Tank Capacity — Total 100% Full (`gi-10`)
- Classification Society (`gi-11`)
- 1st / 2nd Gas Management System (`gi-12`, `gi-13`)

ไม่ต้องแก้ SQL หรือ Supabase schema

## วิธีใช้
วาง `vessel_detail_from_study.patch` ไว้ข้าง `package.json` แล้วรัน:

```bat
git apply --check vessel_detail_from_study.patch
git apply vessel_detail_from_study.patch
npm run dev
```

หาก `--check` มี error อย่า apply ต่อ ให้ส่ง error กลับมา
