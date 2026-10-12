# Changelog

## [1.1.0] - 2026-10-12

### Added

- Grid ที่สร้างจะอยู่ใน tag `Grid` อัตโนมัติ (ถ้ายังไม่มี tag นี้จะสร้างให้)
- คลิกขวาที่ Grid → "แก้ไข Grid" เพื่อเปิด dialog พร้อมค่าเดิม แล้วกด "อัปเดต Grid" (แก้ group เดิม ตำแหน่งเดิม) — ใช้ได้เฉพาะ Grid ที่สร้างจากเวอร์ชันนี้ขึ้นไป

### Fixed

- สลับหน่วย mm / cm / m แล้วค่าที่กรอกไว้ไม่แปลงตาม ทำให้ได้ขนาด grid ผิด (เช่น 1000 mm กลายเป็น 1000 m)

### Changed

- แยกโค้ด: geometry ไป `builder.rb`, CSS/JS ของ dialog แยกเป็นไฟล์ (`grid_dialog.css`, `grid_parts.css`, `grid_*.js`)
- JS เรียก Ruby ผ่าน `sketchup.<callback>()` แทน `skp:` URL

## [1.0.0] - 2026-10-11

### Added

- แยก Grid Dimension Tool ออกจาก Classmat Suite 2.0.0 เป็น plugin เดี่ยว
- เตือนเมื่อพบ Classmat Suite ตัวเก่าติดตั้งอยู่

### Changed

- รองรับ SketchUp 2024+ เท่านั้น
- ลงทะเบียนผ่าน Extension Manager (เปิด/ปิดได้)
- ขนาด/ตำแหน่งหน้าต่าง dialog เริ่มใหม่ (preferences key ใหม่)
- (รวมงานที่ยังไม่เคยปล่อยใน Classmat Suite) ตั้ง Label Offset / Label Size / หน่วยของ elevation label ได้จาก dialog
- วาดเส้น grid เฉพาะระดับต่ำสุด + เส้นนำ elevation ที่ column แรก (เดิมวาดทุกระดับ + เส้นตั้งเชื่อมทุกจุดตัด)
- หมุน elevation label ให้อ่านจาก Left View (ระนาบ YZ)
