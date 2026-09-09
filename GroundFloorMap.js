import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';

// أبعاد المخطط الهندسية المطابقة للصورة الأصلية
const MAP_WIDTH = 1620;
const MAP_HEIGHT = 1320;

// إحداثيات كافة الغرف والقاعات بالملليمتر
const GROUND_ZONES = [
  // ================= جناح الصفوف 1-5 (اليسار) =================
  { id: 'g5_sup', x: 35, y: 130, w: 40, h: 35, name_ar: 'مشرف' },
  { id: 'g5_store', x: 35, y: 165, w: 40, h: 30, name_ar: 'مخزن' },
  { id: 'g5_4', x: 75, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 4' },
  { id: 'g5_5', x: 145, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 5' },
  { id: 'g5_6', x: 215, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 6' },
  { id: 'g5_admin', x: 285, y: 130, w: 90, h: 65, name_ar: 'الإدارة' },
  { id: 'g5_stairs_top', x: 375, y: 130, w: 125, h: 65, name_ar: 'درج' },
  { id: 'g5_stairs_mid', x: 35, y: 221, w: 45, h: 65, name_ar: 'درج' },
  { id: 'g5_3', x: 80, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 3' },
  { id: 'g5_2', x: 150, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 2' },
  { id: 'g5_1', x: 220, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 1' },
  { id: 'g5_teachers', x: 290, y: 221, w: 85, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g5_wc', x: 375, y: 221, w: 125, h: 65, name_ar: 'دورة مياه' },
  { id: 'yard_1', x: 35, y: 295, w: 405, h: 235, name_ar: 'ساحة ومضمار 1' },
  { id: 'yard_1_store', x: 450, y: 340, w: 45, h: 35, name_ar: 'مخزن' },

  { id: 'g2_sup', x: 35, y: 540, w: 40, h: 35, name_ar: 'مشرف' },
  { id: 'g2_store', x: 35, y: 575, w: 40, h: 30, name_ar: 'مخزن' },
  { id: 'g2_5', x: 75, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 5' },
  { id: 'g2_3', x: 145, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 3' },
  { id: 'g2_1', x: 215, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 1' },
  { id: 'g2_class_extra', x: 285, y: 540, w: 90, h: 65, name_ar: 'قاعة دراسية' },
  { id: 'g2_stairs_top', x: 375, y: 540, w: 125, h: 65, name_ar: 'درج' },
  { id: 'g2_stairs_mid', x: 35, y: 631, w: 45, h: 65, name_ar: 'درج' },
  { id: 'g2_special', x: 80, y: 631, w: 85, h: 65, name_ar: 'قسم التربية الخاصة' },
  { id: 'g2_4', x: 165, y: 631, w: 70, h: 65, name_ar: 'الصف الثاني 4' },
  { id: 'g2_2', x: 235, y: 631, w: 70, h: 65, name_ar: 'الصف الثاني 2' },
  { id: 'g2_teachers', x: 305, y: 631, w: 75, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g2_wc', x: 380, y: 631, w: 120, h: 65, name_ar: 'دورة مياه' },
  { id: 'play_yard_1', x: 35, y: 705, w: 465, h: 105, name_ar: 'ساحة ألعاب 1' },

  { id: 'g1_stairs_top', x: 35, y: 820, w: 45, h: 65, name_ar: 'درج' },
  { id: 'g1_5', x: 80, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 5' },
  { id: 'g1_3', x: 150, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 3' },
  { id: 'g1_1', x: 220, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 1' },
  { id: 'g1_class_extra', x: 290, y: 820, w: 85, h: 65, name_ar: 'قاعة دراسية' },
  { id: 'g1_wc', x: 375, y: 820, w: 125, h: 65, name_ar: 'دورة مياه' },
  { id: 'g1_sup', x: 35, y: 911, w: 40, h: 35, name_ar: 'مشرف' },
  { id: 'g1_store', x: 35, y: 946, w: 40, h: 30, name_ar: 'مخزن' },
  { id: 'g1_6', x: 75, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 6' },
  { id: 'g1_4', x: 145, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 4' },
  { id: 'g1_2', x: 215, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 2' },
  { id: 'g1_teachers', x: 285, y: 911, w: 90, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g1_stairs_bot', x: 375, y: 911, w: 125, h: 65, name_ar: 'درج' },

  // ================= الخدمات المركزية (الوسط) =================
  { id: 'cafe_a', x: 545, y: 130, w: 185, h: 180, name_ar: 'كافتيريا (أ)' },
  { id: 'cafe_store', x: 730, y: 130, w: 160, h: 55, name_ar: 'مخزن أغذية' },
  { id: 'cafe_prep', x: 730, y: 185, w: 160, h: 60, name_ar: 'خدمات وتحضير' },
  { id: 'cafe_wc', x: 730, y: 245, w: 160, h: 65, name_ar: 'دورات مياه' },
  { id: 'cafe_b', x: 890, y: 130, w: 185, h: 180, name_ar: 'كافتيريا (ب)' },
  { id: 'art_room', x: 545, y: 320, w: 115, h: 85, name_ar: 'غرفة الفنية' },
  { id: 'theater', x: 660, y: 320, w: 300, h: 85, name_ar: 'قاعة المحاضرات والمسرح' },
  { id: 'music_room', x: 960, y: 320, w: 115, h: 85, name_ar: 'غرفة الموسيقى' },
  { id: 'pool', x: 610, y: 415, w: 400, h: 145, name_ar: 'المسبح الرياضي' },
  { id: 'gym', x: 610, y: 570, w: 400, h: 190, name_ar: 'الصالة الرياضية' },
  { id: 'lab_sci_2', x: 545, y: 770, w: 110, h: 100, name_ar: 'مختبر العلوم 2' },
  { id: 'lab_comp_2', x: 655, y: 770, w: 110, h: 100, name_ar: 'مختبر الحاسوب 2' },
  { id: 'lab_comp_1', x: 765, y: 770, w: 110, h: 100, name_ar: 'مختبر الحاسوب 1' },
  { id: 'lab_prep', x: 875, y: 770, w: 60, h: 100, name_ar: 'تحضير' },
  { id: 'lab_sci_1', x: 935, y: 770, w: 140, h: 100, name_ar: 'مختبر العلوم 1' },
  { id: 'sec_office', x: 555, y: 895, w: 90, h: 60, name_ar: 'مكتب الأمن' },
  { id: 'gen_admin', x: 655, y: 895, w: 145, h: 60, name_ar: 'الإدارة العامة' },
  { id: 'stu_affairs', x: 810, y: 895, w: 145, h: 60, name_ar: 'شؤون الطلاب' },
  { id: 'adm_wc', x: 965, y: 895, w: 100, h: 60, name_ar: 'حمامات' },
  { id: 'secretary', x: 555, y: 965, w: 95, h: 65, name_ar: 'السكرتارية' },
  { id: 'principal', x: 660, y: 965, w: 95, h: 65, name_ar: 'المدير' },
  { id: 'reception', x: 765, y: 965, w: 95, h: 65, name_ar: 'الاستقبال الرئيسي' },
  { id: 'vice_princ', x: 870, y: 965, w: 95, h: 65, name_ar: 'مساعد المدير' },
  { id: 'waiting', x: 975, y: 965, w: 90, h: 65, name_ar: 'الانتظار' },

  // ================= جناح الصفوف 3-6 (اليمين) =================
  { id: 'g6_stairs_top', x: 1120, y: 130, w: 50, h: 65, name_ar: 'درج' },
  { id: 'g6_admin', x: 1170, y: 130, w: 75, h: 65, name_ar: 'الإدارة' },
  { id: 'g6_6', x: 1245, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 6' },
  { id: 'g6_5', x: 1315, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 5' },
  { id: 'g6_4', x: 1385, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 4' },
  { id: 'g6_sup_store', x: 1455, y: 130, w: 130, h: 65, name_ar: 'مشرف ومخزن' },
  { id: 'g6_wc', x: 1120, y: 221, w: 60, h: 65, name_ar: 'دورة مياه' },
  { id: 'g6_teachers', x: 1180, y: 221, w: 85, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g6_1', x: 1265, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 1' },
  { id: 'g6_2', x: 1335, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 2' },
  { id: 'g6_3', x: 1405, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 3' },
  { id: 'g6_stairs_bot', x: 1475, y: 221, w: 110, h: 65, name_ar: 'درج' },
  { id: 'yard_2_store', x: 1125, y: 340, w: 45, h: 35, name_ar: 'مخزن' },
  { id: 'yard_2', x: 1180, y: 295, w: 405, h: 235, name_ar: 'ساحة ومضمار 2' },
  { id: 'g4_stairs_top', x: 1120, y: 540, w: 55, h: 65, name_ar: 'درج/مخزن' },
  { id: 'g4_class_extra', x: 1175, y: 540, w: 85, h: 65, name_ar: 'قاعة دراسية' },
  { id: 'g4_2', x: 1260, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 2' },
  { id: 'g4_4', x: 1330, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 4' },
  { id: 'g4_6', x: 1400, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 6' },
  { id: 'g4_sup_store', x: 1470, y: 540, w: 115, h: 65, name_ar: 'مشرف ومخزن' },
  { id: 'g4_wc', x: 1120, y: 631, w: 60, h: 65, name_ar: 'دورة مياه' },
  { id: 'g4_teachers', x: 1180, y: 631, w: 85, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g4_1', x: 1265, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 1' },
  { id: 'g4_3', x: 1335, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 3' },
  { id: 'g4_5', x: 1405, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 5' },
  { id: 'g4_stairs_bot', x: 1475, y: 631, w: 110, h: 65, name_ar: 'درج' },
  { id: 'play_yard_2', x: 1120, y: 705, w: 465, h: 105, name_ar: 'ساحة ألعاب 2' },
  { id: 'g3_wc', x: 1120, y: 820, w: 60, h: 65, name_ar: 'دورة مياه' },
  { id: 'g3_admin', x: 1180, y: 820, w: 85, h: 65, name_ar: 'غرفة الإدارة' },
  { id: 'g3_2', x: 1265, y: 820, w: 70, h: 65, name_ar: 'الصف الثالث 2' },
  { id: 'g3_4', x: 1335, y: 820, w: 70, h: 65, name_ar: 'الصف الثالث 4' },
  { id: 'g3_special', x: 1405, y: 820, w: 80, h: 65, name_ar: 'قسم التربية الخاصة' },
  { id: 'g3_stairs_top', x: 1485, y: 820, w: 100, h: 65, name_ar: 'درج' },
  { id: 'g3_stairs_mid', x: 1120, y: 911, w: 55, h: 65, name_ar: 'درج' },
  { id: 'g3_teachers', x: 1175, y: 911, w: 85, h: 65, name_ar: 'غرفة المعلمين' },
  { id: 'g3_1', x: 1260, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 1' },
  { id: 'g3_3', x: 1330, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 3' },
  { id: 'g3_5', x: 1400, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 5' },
  { id: 'g3_sup_store', x: 1470, y: 911, w: 115, h: 65, name_ar: 'مشرف ومخزن' }
];

export default function GroundFloorMap({ onSelectZone, onChangeZoneImage, activeFaults = [] }) {
  const [zoomScale, setZoomScale] = useState(1);

  return (
    <View style={styles.container}>
      {/* شريط أدوات التكبير */}
      <View style={styles.headerControls}>
        <Text style={styles.headerText}>🗺️ مخطط مجمع زايد التعليمي</Text>
        <View style={styles.btnRow}>
          <Pressable onPress={() => setZoomScale(s => Math.min(s * 1.25, 2.2))} style={styles.btnZoom}>
            <Text style={styles.btnText}>➕ تكبير</Text>
          </Pressable>
          <Pressable onPress={() => setZoomScale(s => Math.max(s * 0.8, 0.6))} style={styles.btnZoom}>
            <Text style={styles.btnText}>➖ تصغير</Text>
          </Pressable>
          <Pressable onPress={() => setZoomScale(1)} style={[styles.btnZoom, { backgroundColor: '#475569' }]}>
            <Text style={styles.btnText}>🔄 100%</Text>
          </Pressable>
        </View>
      </View>

      {/* منطقة التمرير الحر أفقياً ورأسياً */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
          <View style={{ width: MAP_WIDTH * zoomScale, height: MAP_HEIGHT * zoomScale, position: 'relative', backgroundColor: '#FFFFFF' }}>
            {/* صورة المخطط المعماري الحقيقي كخلفية ثابتة */}
            <Image
              source={require('./assets/ground_plan.png')}
              style={StyleSheet.absoluteFillObject}
              resizeMode="stretch"
            />

            {/* مربعات اللمس الزجاجية الشفافة */}
            {GROUND_ZONES.map(z => {
              const faultCount = activeFaults.filter(f => f.zone_id === z.id || f.location === z.name_ar).length;
              const hasFault = faultCount > 0;

              return (
                <Pressable
                  key={z.id}
                  onPress={() => onSelectZone(z)}
                  onLongPress={() => {
                    Alert.alert('تحديث صورة المرفق 📷', `هل ترغب في تغيير وتعيين صورة جديدة لـ (${z.name_ar})؟`, [
                      { text: 'إلغاء', style: 'cancel' },
                      { text: 'اختيار صورة', onPress: () => onChangeZoneImage(z) }
                    ]);
                  }}
                  delayLongPress={500}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    left: z.x * zoomScale,
                    top: z.y * zoomScale,
                    width: z.w * zoomScale,
                    height: z.h * zoomScale,
                    borderRadius: 4,
                    borderWidth: hasFault ? 2 : (pressed ? 2 : 1),
                    borderColor: hasFault ? '#EF4444' : (pressed ? '#0284C7' : 'rgba(2, 132, 199, 0.25)'),
                    backgroundColor: hasFault
                      ? 'rgba(239, 68, 68, 0.35)'
                      : (pressed ? 'rgba(2, 132, 199, 0.22)' : 'rgba(255, 255, 255, 0.02)'),
                    justifyContent: 'center',
                    alignItems: 'center',
                  })}
                >
                  {hasFault && (
                    <View style={styles.faultBadge}>
                      <Text style={styles.faultText}>🚨 {faultCount}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerControls: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerText: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row-reverse', gap: 6 },
  btnZoom: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  btnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  faultBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  faultText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }
});
