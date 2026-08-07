/* ============================================================
   phases.js
   ข้อมูลเฟส 1-5 ของบอส ประกอบจากท่าใน beats.js — แก้ไฟล์นี้เพื่อปรับความยาก/แพทเทิร์นแต่ละเฟส
============================================================ */

let PHASES = [];
function buildPhases() {
  PHASES = [
    // ===== PHASE 1 =====
    // ===== PHASE 1 =====
    {
      cycles: 2,
      beats: [

        // Beat 1 : Ring
        beatRingBurst({
          count: 26,
          speed: 2.7,
          rings: 2,
          ringGap: 190,
          telegraph: 800,
          recovery: 260
        }),

        // Beat 2 : Laser
        beatLaserSweep({
          telegraph: 850,
          sweepDuration: 950,
          arcSpan: 2.9,
          width: 22,
          recovery: 300
        }),

        // Beat 3 : Ring + Aim
        combine([
          beatRingBurst({
            count: 28,
            speed: 2.9,
            rings: 2,
            ringGap: 180,
            telegraph: 700
          }),
          beatAimedVolley({
            count: 4,
            spacingMs: 170,
            speed: 4.8,
            telegraph: 700
          })
        ], {
          recovery: 400
        })

      ]
    },

    // ===== PHASE 2 =====
    {
      cycles: 2,
      beats: [

        // Beat 1 : Laser
        beatLaserSweep({
          telegraph: 850,
          sweepDuration: 900,
          arcSpan: 3.0,
          width: 22,
          recovery: 250
        }),

        // Beat 2 : Wall
        beatBulletWall({
          gapWidth: 72,
          gapCount: 1,
          speed: 2.8,
          rows: 3,
          rowGap: 270,
          telegraph: 700,
          recovery: 320
        }),

        // Beat 3 : Ring + Aim
        combine([
          beatRingBurst({
            count: 30,
            speed: 3.0,
            rings: 2,
            ringGap: 180,
            telegraph: 700
          }),
          beatAimedVolley({
            count: 5,
            spacingMs: 150,
            speed: 5.0,
            telegraph: 700
          })
        ], {
          recovery: 320
        }),

        // Beat 4 : Laser + Ring
        combine([
          beatLaserSweep({
            telegraph: 650,
            sweepDuration: 850,
            arcSpan: 3.1,
            width: 24
          }),
          beatRingBurst({
            count: 28,
            speed: 3.1,
            rings: 2,
            ringGap: 180,
            telegraph: 650
          })
        ], {
          recovery: 420
        })

      ]
    },

    // ===== PHASE 3 =====
    {
      cycles: 2,
      beats: [

        // Beat 1 : Ring + Homing
        combine([
          beatRingBurst({
            count: 32,
            speed: 3.2,
            rings: 2,
            ringGap: 170,
            telegraph: 650
          }),
          beatHomingOrbs({
            count: 5,
            speed: 2.2,
            turnRate: 0.045,
            telegraph: 650
          })
        ], {
          recovery: 300
        }),

        // Beat 2 : Wall
        beatBulletWall({
          gapWidth: 68,
          gapCount: 1,
          speed: 2.9,
          rows: 3,
          rowGap: 260,
          telegraph: 700,
          recovery: 360
        }),

        // Beat 3 : Laser + Wall
        combine([
          beatLaserSweep({
            telegraph: 700,
            sweepDuration: 900,
            arcSpan: 3.0,
            width: 22
          }),
          beatBulletWall({
            gapWidth: 60,
            gapCount: 1,
            speed: 3.0,
            rows: 3,
            rowGap: 240,
            telegraph: 700
          })
        ], {
          recovery: 420
        }),

        // Beat 4 : Spiral
        beatSpiralStream({
          duration: 2400,
          rate: 48,
          speed: 3.2,
          arms: 4,
          rotSpeed: 0.08,
          telegraph: 650,
          recovery: 520
        })

      ]
    },

    // ===== PHASE 4 =====
    {
      cycles: 3,
      beats: [

        // Beat 1 : Double Laser
        combine([
          beatLaserSweep({
            telegraph: 650,
            sweepDuration: 820,
            arcSpan: 3.1,
            width: 24
          }),
          beatLaserSweep({
            telegraph: 650,
            sweepDuration: 820,
            arcSpan: 3.1,
            reverse: true,
            width: 24
          })
        ], {
          recovery: 320
        }),

        // Beat 2 : Spiral
        beatSpiralStream({
          duration: 2500,
          rate: 45,
          speed: 3.3,
          arms: 4,
          rotSpeed: 0.085,
          telegraph: 650,
          recovery: 360
        }),

        // Beat 3 : Wall + Aim
        combine([
          beatBulletWall({
            gapWidth: 60,
            gapCount: 2,
            speed: 3.1,
            rows: 4,
            rowGap: 230,
            telegraph: 650
          }),
          beatAimedVolley({
            count: 6,
            spacingMs: 120,
            speed: 5.5,
            telegraph: 650
          })
        ], {
          recovery: 420
        }),

        // Beat 4 : Laser + Ring
        combine([
          beatLaserSweep({
            telegraph: 600,
            sweepDuration: 820,
            arcSpan: 3.2,
            width: 24
          }),
          beatRingBurst({
            count: 34,
            speed: 3.3,
            rings: 2,
            ringGap: 170,
            telegraph: 600
          })
        ], {
          recovery: 520
        })

      ]
    },
    
    // ===== PHASE 5 =====
    {
      cycles: 3,
      beats: [

        // Beat 1 : Ring + Aim
        combine([
          beatRingBurst({
            count: 36,
            speed: 3.4,
            rings: 3,
            ringGap: 150,
            telegraph: 600
          }),
          beatAimedVolley({
            count: 7,
            spacingMs: 110,
            speed: 5.6,
            telegraph: 600
          })
        ], {
          recovery: 320
        }),

        // Beat 2 : Laser + Wall
        combine([
          beatLaserSweep({
            telegraph: 550,
            sweepDuration: 800,
            arcSpan: 3.2,
            width: 26
          }),
          beatBulletWall({
            gapWidth: 48,
            gapCount: 2,
            speed: 3.3,
            rows: 4,
            rowGap: 210,
            telegraph: 550
          })
        ], {
          recovery: 420
        }),

        // Beat 3 : Spiral + Homing
        combine([
          beatSpiralStream({
            duration: 3000,
            rate: 38,
            speed: 3.4,
            arms: 5,
            rotSpeed: 0.095,
            telegraph: 550
          }),
          beatHomingOrbs({
            count: 8,
            speed: 2.6,
            turnRate: 0.065,
            telegraph: 550
          })
        ], {
          recovery: 500
        }),

        // Beat 4 : FINAL
        combine([
          beatLaserSweep({
            telegraph: 500,
            sweepDuration: 780,
            arcSpan: 3.2,
            width: 26
          }),
          beatSpiralStream({
            duration: 2600,
            rate: 40,
            speed: 3.4,
            arms: 4,
            rotSpeed: 0.09,
            telegraph: 500
          }),
          beatRingBurst({
            count: 34,
            speed: 3.4,
            rings: 2,
            ringGap: 170,
            telegraph: 500
          })
        ], {
          recovery: 700
        })

      ]
    }
  ];
}
