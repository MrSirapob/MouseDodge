# 🎮 MOUSE DODGE

> **Vertical Slice Prototype**
> ทดลองระบบการเล่น (Gameplay Prototype) ของ Boss Fight

---
## Play Online

สามารถทดลองเล่นเวอร์ชันปัจจุบันได้ที่

**🌐 https://mousedodge.sirapob.my.id/**

> เวอร์ชันนี้เป็น **Vertical Slice Prototype** สำหรับทดสอบระบบ Boss Fight และ Gameplay เท่านั้น ไม่ใช่ตัวเกมเต็ม

---

## Overview

**MOUSE DODGE** เป็นเกมแนว **Mouse Bullet Hell** ที่พัฒนาด้วย **HTML5 Canvas** และ **Vanilla JavaScript**

เวอร์ชันนี้เป็นเพียง **Vertical Slice Prototype** สำหรับทดลองระบบการต่อสู้กับบอส (Boss Fight) เท่านั้น โดยยังไม่ใช่ตัวเกมเต็ม

ผู้เล่นจะต้องควบคุมตัวละครด้วยเมาส์เพื่อหลบรูปแบบการโจมตีของบอส พร้อมใช้สกิล **Slow Motion** ให้ถูกจังหวะเพื่อเอาชีวิตรอด

บอสภายในเวอร์ชันนี้แบ่งการต่อสู้ออกเป็น **5 Phase** ซึ่งแต่ละ Phase จะมีรูปแบบการโจมตีและระดับความยากที่เพิ่มขึ้นเรื่อย ๆ

---

# Features

### Gameplay

* Mouse Movement
* Bullet Hell Gameplay
* Single Boss Fight
* 5 Battle Phases
* Multiple Attack Patterns
* Telegraph Warning System
* Slow Motion Skill
* Graze Mechanic
* Pause System
* Victory Screen
* Game Over Screen

---

# Controls

| Input      | Action               |
| ---------- | -------------------- |
| Mouse      | Move Player          |
| Left Click | Activate Slow Motion |
| Space      | Pause / Resume       |

---

# Gameplay

ผู้เล่นจะต้องหลบกระสุนทั้งหมดที่บอสปล่อยออกมา

เมื่อชนกระสุน ผู้เล่นจะเสียพลังชีวิต (Life)

หากพลังชีวิตหมด เกมจะจบทันที

ผู้เล่นสามารถใช้สกิล **Slow Motion** เพื่อชะลอเวลาของเกมชั่วคราว และต้องรอ Cooldown ก่อนใช้งานอีกครั้ง

นอกจากนี้ยังมีระบบ **Graze** ซึ่งเมื่อผู้เล่นหลบกระสุนในระยะประชิด จะช่วยลดเวลาคูลดาวน์ของสกิล Slow Motion

---

# Boss Battle

ภายในเวอร์ชันนี้มีบอสเพียงตัวเดียว

```
EYE OF THE HOLLOW
```

บอสใช้ระบบโจมตีแบบ Pattern และแบ่งการต่อสู้ออกเป็นทั้งหมด **5 Phase**

เมื่อผ่านจำนวนรอบของแต่ละ Phase แล้ว เกมจะเปลี่ยนเข้าสู่ Phase ถัดไปโดยอัตโนมัติ

เมื่อผ่านครบทั้ง 5 Phase จะถือว่าชนะเกม

---

# Attack Patterns

ภายในเกมมีรูปแบบการโจมตีดังต่อไปนี้

* Ring Burst
* Aimed Volley
* Spiral Stream
* Laser Sweep
* Homing Orbs
* Bullet Wall
* Combined Pattern

แต่ละ Pattern จะถูกเรียกใช้งานผ่านระบบ Beat และสามารถนำมาผสมกันเป็นการโจมตีชุดเดียวได้

---

# Battle Flow

```
Menu
   │
   ▼
Start Game
   │
   ▼
Phase 1
   │
   ▼
Phase 2
   │
   ▼
Phase 3
   │
   ▼
Phase 4
   │
   ▼
Phase 5
   │
   ├──────────────┐
   ▼              ▼
Victory      Game Over
```

---

# User Interface

ประกอบด้วยหน้าจอดังนี้

* Main Menu
* How To Play
* Pause
* Victory
* Game Over
* In-game HUD

HUD ภายในเกมแสดงข้อมูลดังนี้

* Boss Progress
* Remaining Lives
* Slow Motion Cooldown
* Pause Button

---

# Technologies

* HTML5
* CSS3
* Vanilla JavaScript
* HTML5 Canvas API

โปรเจกต์นี้ไม่ได้ใช้ Framework หรือ Game Engine ใด ๆ

---

# Current Scope

เวอร์ชันนี้มีไว้เพื่อทดลองระบบ Gameplay เท่านั้น

สิ่งที่มีในเวอร์ชันนี้

* Boss Fight
* Bullet Patterns
* Phase System
* Telegraph
* Slow Motion
* Graze
* Particle Effects
* Screen Shake
* Pause
* Victory / Game Over

สิ่งที่ยังไม่มี

* Story
* Multiple Bosses
* Multiple Stages
* Background Music
* Sound Effects
* Save System
* Score System
* Settings Menu

---

# Project Goal

เป้าหมายของ Vertical Slice นี้คือการทดสอบระบบหลักของเกม ได้แก่

* การต่อสู้กับบอส
* ความสนุกของ Gameplay
* ความหลากหลายของ Attack Pattern
* ความสมดุลของแต่ละ Phase
* ความรู้สึกในการหลบกระสุน
* ระบบ Slow Motion และ Graze

ก่อนที่จะนำระบบเหล่านี้ไปต่อยอดเป็นเกมเต็มในอนาคต

---

# License

This project is currently a personal prototype created for gameplay experimentation.
