import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';

// أبعاد المخطط الهندسية المربعة المتطابقة تماماً مع الصورة (1200 × 1200)
const CANVAS_SIZE = 1200;

const GROUND_ZONES = [
  // ================= 1. جناح الصفوف 1-5 (العمود الأيسر) =================
  // الصف الخامس - الصف العلوي
  { id: 'g5_sup', x: 20, y: 125, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g5_store', x: 20, y: 155, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g5_4', x: 55, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 4' },
  { id: 'g5_5', x: 125, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 5' },
  { id: 'g5_6', x: 195, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 6' },
  { id: 'g5_admin', x: 265, y: 125, w: 65, h: 55, name_ar: 'الإدارة' },
  { id: 'g5_stairs_top', x: 332, y: 125, w: 60, h: 55, name_ar: 'درج' },

  // الصف الخامس - الصف السفلي
  { id: 'g5_stairs_mid', x: 20, y: 215, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g5_3', x: 55, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 3' },
  { id: 'g5_2', x: 125, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 2' },
  { id: 'g5_1', x: 195, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 1' },
  { id: 'g5_teachers', x: 265, y: 215, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g5_wc', x: 332, y: 215, w: 60, h: 55, name_ar: 'دورة مياه' },

  // الساحة الأولى ومضمار الجري
  { id: 'yard_1', x: 20, y: 285, w: 325, h: 225, name_ar: 'ساحة ومضمار (1)' },
  { id: 'yard_1_store', x: 350, y: 340, w: 42, h: 35, name_ar: 'مخزن' },

  // الصف الثاني - الصف العلوي
  { id: 'g2_sup', x: 20, y: 535, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g2_store', x: 20, y: 565, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g2_5', x: 55, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 5' },
  { id: 'g2_3', x: 125, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 3' },
  { id: 'g2_1', x: 195, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 1' },
  { id: 'g2_class_extra', x: 265, y: 535, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g2_stairs_top', x: 332, y: 535, w: 60, h: 55, name_ar: 'درج' },

  // الصف الثاني - الصف السفلي
  { id: 'g2_stairs_mid', x: 20, y: 625, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g2_special', x: 55, y: 625, w: 68, h: 55, name_ar: 'قسم التربية الخاصة' },
  { id: 'g2_4', x: 125, y: 625, w: 68, h: 55, name_ar: 'الصف الثاني 4' },
  { id: 'g2_2', x: 195, y: 625, w: 68, h: 55, name_ar: 'الصف الثاني 2' },
  { id: 'g2_teachers', x: 265, y: 625, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g2_wc', x: 332, y: 625, w: 60, h: 55, name_ar: 'دورة مياه' },

  // ساحة الألعاب المظللة (1)
  { id: 'play_yard_1', x: 20, y: 695, w: 372, h: 105, name_ar: 'ساحة الألعاب المظللة (1)' },

  // الصف الأول - الصف العلوي
  { id: 'g1_stairs_top', x: 20, y: 815, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g1_5', x: 55, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 5' },
  { id: 'g1_3', x: 125, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 3' },
  { id: 'g1_1', x: 195, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 1' },
  { id: 'g1_class_extra', x: 265, y: 815, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g1_wc', x: 332, y: 815, w: 60, h: 55, name_ar: 'دورة مياه' },

  // الصف الأول - الصف السفلي
  { id: 'g1_sup', x: 20, y: 905, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g1_store', x: 20, y: 935, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g1_6', x: 55, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 6' },
  { id: 'g1_4', x: 125, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 4' },
  { id: 'g1_2', x: 195, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 2' },
  { id: 'g1_teachers', x: 265, y: 905, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g1_stairs_bot', x: 332, y: 905, w: 60, h: 55, name_ar: 'درج' },


  // ================= 2. الخدمات والمرافق المركزية (العمود الأوسط) =================
  // الكافتيريا والخدمات العلوية
  { id: 'cafe_a', x: 418, y: 125, w: 105, h: 145, name_ar: 'كافتيريا (أ)' },
  { id: 'cafe_prep', x: 528, y: 125, w: 65, h: 145, name_ar: 'خدمات وتحضير ومخزن' },
  { id: 'cafe_b', x: 598, y: 125, w: 105, h: 145, name_ar: 'كافتيريا (ب)' },

  // قاعات المحاضرات والموسيقى
  { id: 'art_room', x: 418, y: 285, w: 90, h: 70, name_ar: 'غرفة المحاضرات (أ)' },
  { id: 'music_room', x: 613, y: 285, w: 90, h: 70, name_ar: 'غرفة المحاضرات (ب)' },
  { id: 'music_sub', x: 480, y: 368, w: 160, h: 58, name_ar: 'غرفة الموسيقى' },

  // المسبح الرياضي والخدمات
  { id: 'pool_wc_l', x: 418, y: 368, w: 55, h: 58, name_ar: 'دورة مياه' },
  { id: 'pool', x: 418, y: 440, w: 285, h: 80, name_ar: 'المسبح الرياضي' },

  // الصالة الرياضية
  { id: 'gym', x: 418, y: 535, w: 285, h: 145, name_ar: 'الصالة الرياضية' },

  // المختبرات المدرسية
  { id: 'lab_sci_2', x: 418, y: 700, w: 65, h: 75, name_ar: 'مختبر العلوم 2' },
  { id: 'lab_comp_2', x: 488, y: 700, w: 65, h: 75, name_ar: 'مختبر الحاسوب 2' },
  { id: 'lab_comp_1', x: 558, y: 700, w: 65, h: 75, name_ar: 'مختبر الحاسوب 1' },
  { id: 'lab_sci_1', x: 638, y: 700, w: 65, h: 75, name_ar: 'مختبر العلوم 1' },

  // الإدارة المركزية
  { id: 'sec_office', x: 418, y: 815, w: 60, h: 55, name_ar: 'الإدارة' },
  { id: 'gen_admin', x: 485, y: 815, w: 85, h: 55, name_ar: 'الإدارة العامة' },
  { id: 'stu_affairs', x: 575, y: 815, w: 75, h: 55, name_ar: 'الإدارة' },
  { id: 'adm_wc', x: 655, y: 815, w: 48, h: 55, name_ar: 'الإدارة' },

  // الواجهة الأمامية للإدارة
  { id: 'secretary', x: 418, y: 905, w: 60, h: 55, name_ar: 'الإدارة' },
  { id: 'principal', x: 485, y: 905, w: 55, h: 55, name_ar: 'الإدارة' },
  { id: 'reception', x: 545, y: 905, w: 55, h: 55, name_ar: 'الاستقبال الرئيسي' },
  { id: 'vice_princ', x: 605, y: 905, w: 50, h: 55, name_ar: 'الإدارة' },
  { id: 'waiting', x: 660, y: 905, w: 43, h: 55, name_ar: 'الإدارة' },


  // ================= 3. جناح الصفوف 3-6 (العمود الأيمن) =================
  // الصف السادس - الصف العلوي
  { id: 'g6_stairs_top', x: 728, y: 125, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g6_admin', x: 792, y: 125, w: 65, h: 55, name_ar: 'الإدارة' },
  { id: 'g6_6', x: 862, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 6' },
  { id: 'g6_5', x: 932, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 5' },
  { id: 'g6_4', x: 1002, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 4' },
  { id: 'g6_sup_store', x: 1075, y: 125, w: 32, h: 55, name_ar: 'مشرف ومخزن' },

  // الصف السادس - الصف السفلي
  { id: 'g6_wc', x: 728, y: 215, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g6_teachers', x: 792, y: 215, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g6_1', x: 862, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 1' },
  { id: 'g6_2', x: 932, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 2' },
  { id: 'g6_3', x: 1002, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 3' },
  { id: 'g6_stairs_bot', x: 1075, y: 215, w: 32, h: 55, name_ar: 'درج' },

  // الساحة الثانية ومضمار الجري
  { id: 'yard_2_store', x: 728, y: 340, w: 42, h: 35, name_ar: 'مخزن' },
  { id: 'yard_2', x: 775, y: 285, w: 332, h: 225, name_ar: 'ساحة ومضمار (2)' },

  // الصف الرابع - الصف العلوي
  { id: 'g4_stairs_top', x: 728, y: 535, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g4_class_extra', x: 792, y: 535, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g4_2', x: 862, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 3' },
  { id: 'g4_4', x: 932, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 4' },
  { id: 'g4_6', x: 1002, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 5' },
  { id: 'g4_sup_store', x: 1075, y: 535, w: 32, h: 55, name_ar: 'مشرف ومخزن' },

  // الصف الرابع - الصف السفلي
  { id: 'g4_wc', x: 728, y: 625, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g4_teachers', x: 792, y: 625, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g4_1', x: 862, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 1' },
  { id: 'g4_3', x: 932, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 2' },
  { id: 'g4_5', x: 1002, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 5' },
  { id: 'g4_stairs_bot', x: 1075, y: 625, w: 32, h: 55, name_ar: 'درج' },

  // ساحة الألعاب المظللة (2)
  { id: 'play_yard_2', x: 728, y: 695, w: 379, h: 105, name_ar: 'ساحة الألعاب المظللة (2)' },

  // الصف الثالث - الصف العلوي
  { id: 'g3_wc', x: 728, y: 815, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g3_admin', x: 792, y: 815, w: 65, h: 55, name_ar: 'غرفة الإدارة' },
  { id: 'g3_2', x: 862, y: 815, w: 68, h: 55, name_ar: 'الصف الثالث 3' },
  { id: 'g3_4', x: 932, y: 815, w: 68, h: 55, name_ar: 'الصف الثالث 4' },
  { id: 'g3_special', x: 1002, y: 815, w: 68, h: 55, name_ar: 'قسم التربية الخاصة' },
  { id: 'g3_stairs_top', x: 1075, y: 815, w: 32, h: 55, name_ar: 'درج' },

  // الصف الثالث - الصف السفلي
  { id: 'g3_stairs_mid', x: 728, y: 905, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g3_teachers', x: 792, y: 905, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g3_1', x: 862, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 1' },
  { id: 'g3_3', x: 932, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 2' },
  { id: 'g3_5', x: 1002, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 3' },
  { id: 'g3_sup_store', x: 1075, y: 905, w: 32, h: 55, name_ar: 'مشرف ومخزن' },
];

export default function GroundFloorMap({ onSelectZone, onChangeZoneImage, activeFaults = [] }) {
  const [zoomScale, setZoomScale] = useState(1);

  return (
    <View style={styles.container}>
      {/* شريط التحكم العلوي */}
      <View style={styles.controlBar}>
        <Text style={styles.barTitle}>🗺️ المخطط المتكامل لمجمع زايد التعليمي</Text>
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
          <View style={{ width: CANVAS_SIZE * zoomScale, height: CANVAS_SIZE * zoomScale, position: 'relative', backgroundColor: '#FFFFFF' }}>
            {/* صورة المخطط المعماري الكاملة */}
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
                    Alert.alert('تحديث صورة المرفق 📷', `هل ترغب في تغيير وتحديث صورة (${z.name_ar})؟`, [
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
                      : (pressed ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.01)'),
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
  controlBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  barTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row-reverse', gap: 6 },
  btnZoom: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  btnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  faultBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  faultText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }
});
