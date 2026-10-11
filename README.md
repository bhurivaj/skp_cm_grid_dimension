# SKP CM Grid Dimension

SketchUp plugin สำหรับสร้าง construction grid lines พร้อม label (A, B, C… / 1, 2, 3…) และ elevation หลายระดับ

- รองรับ: SketchUp 2024+
- เดิมเป็นส่วนหนึ่งของ Classmat Suite

## ติดตั้ง

SketchUp → Extensions → Extension Manager → Install Extension → เลือก `skp_cm_grid_dimension_<version>.rbz`

## ย้ายจาก Classmat Suite

ถ้ายังมี Classmat Suite ตัวเก่า plugin จะแสดงรายการไฟล์ที่ต้องลบในโฟลเดอร์ Plugins
ถ้าใช้ BoQ Counter ด้วย ให้ติดตั้ง SKP CM BoQ Counter และเปิด SketchUp 1 ครั้งก่อนลบ `classmat_config.json`

## Build

    ./build.sh   # ได้ skp_cm_grid_dimension_<VERSION>.rbz
