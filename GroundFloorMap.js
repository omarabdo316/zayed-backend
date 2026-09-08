import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';

const ZONES_DATA = [
  // جناح الصفوف 1-5 (اليسار)
  { id: 'g5_sup', x: 35, y: 130, w: 40, h: 35, name_ar: 'مشرف', color: '#81D4FA', isService: true },
  { id: 'g5_store', x: 35, y: 165, w: 40, h: 30, name_ar: 'مخزن', color: '#81D4FA', isService: true },
  { id: 'g5_4', x: 75, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 4', name_en: 'Grade 5-4', color: '#FFE082' },
  { id: 'g5_5', x: 145, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 5', name_en: 'Grade 5-5', color: '#FFE082' },
  { id: 'g5_6', x: 215, y: 130, w: 70, h: 65, name_ar: 'الصف الخامس 6', name_en: 'Grade 5-6', color: '#FFE082' },
  { id: 'g5_admin', x: 285, y: 130, w: 90, h: 65, name_ar: 'الإدارة', name_en: 'Admin', color: '#C8E6C9' },
  { id: 'g5_stairs_top', x: 375, y: 130, w: 125, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g5_stairs_mid', x: 35, y: 221, w: 45, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g5_3', x: 80, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 3', name_en: 'Grade 5-3', color: '#FFE082' },
  { id: 'g5_2', x: 150, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 2', name_en: 'Grade 5-2', color: '#FFE082' },
  { id: 'g5_1', x: 220, y: 221, w: 70, h: 65, name_ar: 'الصف الخامس 1', name_en: 'Grade 5-1', color: '#FFE082' },
  { id: 'g5_teachers', x: 290, y: 221, w: 85, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g5_wc', x: 375, y: 221, w: 125, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'yard_1', x: 35, y: 295, w: 405, h: 235, name_ar: 'ساحة ومضمار 1', color: '#DCEDC8', isCourt: true },
  { id: 'yard_1_store', x: 450, y: 340, w: 45, h: 35, name_ar: 'مخزن', color: '#81D4FA', isService: true },
  { id: 'g2_sup', x: 35, y: 540, w: 40, h: 35, name_ar: 'مشرف', color: '#81D4FA', isService: true },
  { id: 'g2_store', x: 35, y: 575, w: 40, h: 30, name_ar: 'مخزن', color: '#81D4FA', isService: true },
  { id: 'g2_5', x: 75, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 5', name_en: 'Grade 2-5', color: '#FFE082' },
  { id: 'g2_3', x: 145, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 3', name_en: 'Grade 2-3', color: '#FFE082' },
  { id: 'g2_1', x: 215, y: 540, w: 70, h: 65, name_ar: 'الصف الثاني 1', name_en: 'Grade 2-1', color: '#FFE082' },
  { id: 'g2_class_extra', x: 285, y: 540, w: 90, h: 65, name_ar: 'قاعة دراسية', name_en: 'Classroom', color: '#C8E6C9' },
  { id: 'g2_stairs_top', x: 375, y: 540, w: 125, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g2_stairs_mid', x: 35, y: 631, w: 45, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g2_special', x: 80, y: 631, w: 85, h: 65, name_ar: 'قسم التربية الخاصة', color: '#C8E6C9' },
  { id: 'g2_4', x: 165, y: 631, w: 70, h: 65, name_ar: 'الصف الثاني 4', name_en: 'Grade 2-4', color: '#FFE082' },
  { id: 'g2_2', x: 235, y: 631, w: 70, h: 65, name_ar: 'الصف الثاني 2', name_en: 'Grade 2-2', color: '#FFE082' },
  { id: 'g2_teachers', x: 305, y: 631, w: 75, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g2_wc', x: 380, y: 631, w: 120, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'play_yard_1', x: 35, y: 705, w: 465, h: 105, name_ar: 'ساحة ألعاب 1', color: '#F9FBE7', isCourt: true },
  { id: 'g1_stairs_top', x: 35, y: 820, w: 45, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g1_5', x: 80, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 5', name_en: 'Grade 1-5', color: '#FFE082' },
  { id: 'g1_3', x: 150, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 3', name_en: 'Grade 1-3', color: '#FFE082' },
  { id: 'g1_1', x: 220, y: 820, w: 70, h: 65, name_ar: 'الصف الأول 1', name_en: 'Grade 1-1', color: '#FFE082' },
  { id: 'g1_class_extra', x: 290, y: 820, w: 85, h: 65, name_ar: 'قاعة دراسية', name_en: 'Classroom', color: '#C8E6C9' },
  { id: 'g1_wc', x: 375, y: 820, w: 125, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'g1_sup', x: 35, y: 911, w: 40, h: 35, name_ar: 'مشرف', color: '#81D4FA', isService: true },
  { id: 'g1_store', x: 35, y: 946, w: 40, h: 30, name_ar: 'مخزن', color: '#81D4FA', isService: true },
  { id: 'g1_6', x: 75, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 6', name_en: 'Grade 1-6', color: '#FFE082' },
  { id: 'g1_4', x: 145, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 4', name_en: 'Grade 1-4', color: '#FFE082' },
  { id: 'g1_2', x: 215, y: 911, w: 70, h: 65, name_ar: 'الصف الأول 2', name_en: 'Grade 1-2', color: '#FFE082' },
  { id: 'g1_teachers', x: 285, y: 911, w: 90, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g1_stairs_bot', x: 375, y: 911, w: 125, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },

  // الخدمات المركزية (الوسط)
  { id: 'cafe_a', x: 545, y: 130, w: 185, h: 180, name_ar: 'كافتيريا (أ)', color: '#FFF9C4' },
  { id: 'cafe_store', x: 730, y: 130, w: 160, h: 55, name_ar: 'مخزن أغذية', color: '#81D4FA', isService: true },
  { id: 'cafe_prep', x: 730, y: 185, w: 160, h: 60, name_ar: 'خدمات وتحضير', color: '#81D4FA', isService: true },
  { id: 'cafe_wc', x: 730, y: 245, w: 160, h: 65, name_ar: 'دورات مياه', color: '#81D4FA', isService: true },
  { id: 'cafe_b', x: 890, y: 130, w: 185, h: 180, name_ar: 'كافتيريا (ب)', color: '#FFF9C4' },
  { id: 'art_room', x: 545, y: 320, w: 115, h: 85, name_ar: 'غرفة الفنية', color: '#FFCCBC' },
  { id: 'theater', x: 660, y: 320, w: 300, h: 85, name_ar: 'المسرح', color: '#FFCCBC' },
  { id: 'music_room', x: 960, y: 320, w: 115, h: 85, name_ar: 'غرفة الموسيقى', color: '#FFCCBC' },
  { id: 'pool_svc_l', x: 545, y: 415, w: 65, h: 145, name_ar: 'خدمات المسبح', color: '#81D4FA', isService: true },
  { id: 'pool', x: 610, y: 415, w: 400, h: 145, name_ar: 'المسبح الرياضي', color: '#80DEEA', isCourt: true },
  { id: 'pool_svc_r', x: 1010, y: 415, w: 65, h: 145, name_ar: 'مخزن المسبح', color: '#81D4FA', isService: true },
  { id: 'gym_wc_l', x: 545, y: 570, w: 65, h: 190, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'gym', x: 610, y: 570, w: 400, h: 190, name_ar: 'الصالة الرياضية', color: '#FFE0B2', isCourt: true },
  { id: 'gym_wc_r', x: 1010, y: 570, w: 65, h: 190, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'lab_sci_2', x: 545, y: 770, w: 110, h: 100, name_ar: 'مختبر العلوم 2', color: '#FFCCBC' },
  { id: 'lab_comp_2', x: 655, y: 770, w: 110, h: 100, name_ar: 'مختبر الحاسوب 2', color: '#FFCCBC' },
  { id: 'lab_comp_1', x: 765, y: 770, w: 110, h: 100, name_ar: 'مختبر الحاسوب 1', color: '#FFCCBC' },
  { id: 'lab_prep', x: 875, y: 770, w: 60, h: 100, name_ar: 'تحضير', color: '#81D4FA', isService: true },
  { id: 'lab_sci_1', x: 935, y: 770, w: 140, h: 100, name_ar: 'مختبر العلوم 1', color: '#FFCCBC' },
  { id: 'sec_office', x: 555, y: 895, w: 90, h: 60, name_ar: 'مكتب الأمن', color: '#FFFFFF' },
  { id: 'gen_admin', x: 655, y: 895, w: 145, h: 60, name_ar: 'الإدارة العامة', color: '#FFFFFF' },
  { id: 'stu_affairs', x: 810, y: 895, w: 145, h: 60, name_ar: 'شؤون الطلاب', color: '#FFFFFF' },
  { id: 'adm_wc', x: 965, y: 895, w: 100, h: 60, name_ar: 'حمامات', color: '#81D4FA', isService: true },
  { id: 'secretary', x: 555, y: 965, w: 95, h: 65, name_ar: 'السكرتارية', color: '#FFFFFF' },
  { id: 'principal', x: 660, y: 965, w: 95, h: 65, name_ar: 'المدير', color: '#FFFFFF' },
  { id: 'reception', x: 765, y: 965, w: 95, h: 65, name_ar: 'الاستقبال الرئيسي', color: '#E0F7FA' },
  { id: 'vice_princ', x: 870, y: 965, w: 95, h: 65, name_ar: 'مساعد المدير', color: '#FFFFFF' },
  { id: 'waiting', x: 975, y: 965, w: 90, h: 65, name_ar: 'الانتظار', color: '#FFFFFF' },

  // جناح الصفوف 3-6 (اليمين)
  { id: 'g6_stairs_top', x: 1120, y: 130, w: 50, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g6_admin', x: 1170, y: 130, w: 75, h: 65, name_ar: 'الإدارة', color: '#C8E6C9' },
  { id: 'g6_6', x: 1245, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 6', name_en: 'Grade 6-6', color: '#FFE082' },
  { id: 'g6_5', x: 1315, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 5', name_en: 'Grade 6-5', color: '#FFE082' },
  { id: 'g6_4', x: 1385, y: 130, w: 70, h: 65, name_ar: 'الصف السادس 4', name_en: 'Grade 6-4', color: '#FFE082' },
  { id: 'g6_sup_store', x: 1455, y: 130, w: 130, h: 65, name_ar: 'مشرف ومخزن', color: '#81D4FA', isService: true },
  { id: 'g6_wc', x: 1120, y: 221, w: 60, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'g6_teachers', x: 1180, y: 221, w: 85, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g6_1', x: 1265, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 1', name_en: 'Grade 6-1', color: '#FFE082' },
  { id: 'g6_2', x: 1335, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 2', name_en: 'Grade 6-2', color: '#FFE082' },
  { id: 'g6_3', x: 1405, y: 221, w: 70, h: 65, name_ar: 'الصف السادس 3', name_en: 'Grade 6-3', color: '#FFE082' },
  { id: 'g6_stairs_bot', x: 1475, y: 221, w: 110, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'yard_2_store', x: 1125, y: 340, w: 45, h: 35, name_ar: 'مخزن', color: '#81D4FA', isService: true },
  { id: 'yard_2', x: 1180, y: 295, w: 405, h: 235, name_ar: 'ساحة ومضمار 2', color: '#DCEDC8', isCourt: true },
  { id: 'g4_stairs_top', x: 1120, y: 540, w: 55, h: 65, name_ar: 'درج/مخزن', color: '#D7CCC8', isService: true },
  { id: 'g4_class_extra', x: 1175, y: 540, w: 85, h: 65, name_ar: 'قاعة دراسية', name_en: 'Classroom', color: '#C8E6C9' },
  { id: 'g4_2', x: 1260, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 2', name_en: 'Grade 4-2', color: '#FFE082' },
  { id: 'g4_4', x: 1330, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 4', name_en: 'Grade 4-4', color: '#FFE082' },
  { id: 'g4_6', x: 1400, y: 540, w: 70, h: 65, name_ar: 'الصف الرابع 6', name_en: 'Grade 4-6', color: '#FFE082' },
  { id: 'g4_sup_store', x: 1470, y: 540, w: 115, h: 65, name_ar: 'مشرف ومخزن', color: '#81D4FA', isService: true },
  { id: 'g4_wc', x: 1120, y: 631, w: 60, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'g4_teachers', x: 1180, y: 631, w: 85, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g4_1', x: 1265, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 1', name_en: 'Grade 4-1', color: '#FFE082' },
  { id: 'g4_3', x: 1335, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 3', name_en: 'Grade 4-3', color: '#FFE082' },
  { id: 'g4_5', x: 1405, y: 631, w: 70, h: 65, name_ar: 'الصف الرابع 5', name_en: 'Grade 4-5', color: '#FFE082' },
  { id: 'g4_stairs_bot', x: 1475, y: 631, w: 110, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'play_yard_2', x: 1120, y: 705, w: 465, h: 105, name_ar: 'ساحة ألعاب 2', color: '#F9FBE7', isCourt: true },
  { id: 'g3_wc', x: 1120, y: 820, w: 60, h: 65, name_ar: 'دورة مياه', color: '#81D4FA', isService: true },
  { id: 'g3_admin', x: 1180, y: 820, w: 85, h: 65, name_ar: 'غرفة الإدارة', color: '#C8E6C9' },
  { id: 'g3_2', x: 1265, y: 820, w: 70, h: 65, name_ar: 'الصف الثالث 2', name_en: 'Grade 3-2', color: '#FFE082' },
  { id: 'g3_4', x: 1335, y: 820, w: 70, h: 65, name_ar: 'الصف الثالث 4', name_en: 'Grade 3-4', color: '#FFE082' },
  { id: 'g3_special', x: 1405, y: 820, w: 80, h: 65, name_ar: 'قسم التربية الخاصة', color: '#C8E6C9' },
  { id: 'g3_stairs_top', x: 1485, y: 820, w: 100, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g3_stairs_mid', x: 1120, y: 911, w: 55, h: 65, name_ar: 'درج', color: '#D7CCC8', isService: true },
  { id: 'g3_teachers', x: 1175, y: 911, w: 85, h: 65, name_ar: 'غرفة المعلمين', name_en: 'Teachers', color: '#C8E6C9' },
  { id: 'g3_1', x: 1260, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 1', name_en: 'Grade 3-1', color: '#FFE082' },
  { id: 'g3_3', x: 1330, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 3', name_en: 'Grade 3-3', color: '#FFE082' },
  { id: 'g3_5', x: 1400, y: 911, w: 70, h: 65, name_ar: 'الصف الثالث 5', name_en: 'Grade 3-5', color: '#FFE082' },
  { id: 'g3_sup_store', x: 1470, y: 911, w: 115, h: 65, name_ar: 'مشرف ومخزن', color: '#81D4FA', isService: true },
];

export default function GroundFloorMap({ onSelectZone, onChangeZoneImage, activeFaults = [] }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.toolBar}>
        <Pressable style={styles.btnTool} onPress={() => setZoomLevel((p) => Math.min(p * 1.25, 2.2))}>
          <Text style={styles.btnToolTxt}>➕ تكبير</Text>
        </Pressable>
        <Pressable style={styles.btnTool} onPress={() => setZoomLevel((p) => Math.max(p * 0.8, 0.5))}>
          <Text style={styles.btnToolTxt}>➖ تصغير</Text>
        </Pressable>
        <Pressable style={[styles.btnTool, { backgroundColor: '#37474F' }]} onPress={() => setZoomLevel(1)}>
          <Text style={styles.btnToolTxt}>🔄 100%</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <ScrollView showsVerticalScrollIndicator={true}>
          <View style={[styles.canvas, { transform: [{ scale: zoomLevel }], transformOrigin: 'top left' }]}>
            <View style={styles.mainHeader}>
              <Text style={styles.mainTitleTxt}>المخطط الشامل للمجمع التعليمي والرياضي: الخدمات والأجنحة التعليمية</Text>
            </View>

            <View style={[styles.wingHeaderBox, { left: 25, width: 485 }]}><Text style={styles.wingTitleTxt}>جناح الصفوف 1-5</Text></View>
            <View style={[styles.wingHeaderBox, { left: 535, width: 550, backgroundColor: '#E0F2F1' }]}><Text style={[styles.wingTitleTxt, { color: '#00695C' }]}>الخدمات والمرافق المركزية</Text></View>
            <View style={[styles.wingHeaderBox, { left: 1110, width: 485 }]}><Text style={styles.wingTitleTxt}>جناح الصفوف 3-6</Text></View>

            <View style={[styles.subWingBox, { left: 35, top: 195, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف الخامس</Text></View>
            <View style={[styles.subWingBox, { left: 35, top: 605, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف الثاني</Text></View>
            <View style={[styles.subWingBox, { left: 35, top: 885, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف الأول</Text></View>
            <View style={[styles.subWingBox, { left: 1120, top: 195, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف السادس</Text></View>
            <View style={[styles.subWingBox, { left: 1120, top: 605, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف الرابع</Text></View>
            <View style={[styles.subWingBox, { left: 1120, top: 885, width: 465 }]}><Text style={styles.subWingTxt}>جناح الصف الثالث</Text></View>

            {ZONES_DATA.map((z) => {
              const faultCount = activeFaults.filter((f) => f.zone_id === z.id || f.location === z.name_ar).length;
              const hasFault = faultCount > 0;

              return (
                <Pressable
                  key={z.id}
                  onPress={() => onSelectZone(z)}
                  onLongPress={() => {
                    Alert.alert(
                      'تحديث صورة المرفق 📷',
                      `هل ترغب في تغيير وتعيين صورة جديدة لـ (${z.name_ar})؟`,
                      [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'اختيار صورة', onPress: () => onChangeZoneImage(z) },
                      ]
                    );
                  }}
                  delayLongPress={550}
                  style={[
                    styles.roomBox,
                    {
                      left: z.x,
                      top: z.y,
                      width: z.w,
                      height: z.h,
                      backgroundColor: hasFault ? 'rgba(239, 68, 68, 0.4)' : z.color,
                      borderColor: hasFault ? '#DC2626' : '#263238',
                      borderWidth: hasFault ? 2.5 : 1.2,
                    },
                  ]}
                >
                  {!z.isService && (
                    <View style={styles.pillBadge}>
                      <Text style={styles.roomTxt} numberOfLines={2}>{z.name_ar}</Text>
                    </View>
                  )}
                  {z.isService && (
                    <Text style={styles.serviceTxt} numberOfLines={1}>{z.name_ar}</Text>
                  )}
                  {hasFault && (
                    <View style={styles.faultBadge}><Text style={styles.faultTxt}>🚨 {faultCount}</Text></View>
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
  outerContainer: { flex: 1, backgroundColor: '#263238' },
  toolBar: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#37474F', gap: 10 },
  btnTool: { backgroundColor: '#0D47A1', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  btnToolTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  canvas: { width: 1620, height: 1280, backgroundColor: '#FAFAFA', position: 'relative', margin: 15, borderRadius: 8, borderWidth: 2, borderColor: '#263238' },
  mainHeader: { position: 'absolute', top: 15, left: 25, width: 1570, height: 50, backgroundColor: '#ECEFF1', borderWidth: 2, borderColor: '#263238', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mainTitleTxt: { fontSize: 20, fontWeight: '900', color: '#212121' },
  wingHeaderBox: { position: 'absolute', top: 75, height: 40, backgroundColor: '#E8EAF6', borderWidth: 1.5, borderColor: '#9FA8DA', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  wingTitleTxt: { fontSize: 18, fontWeight: '900', color: '#1A237E' },
  subWingBox: { position: 'absolute', height: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#455A64', justifyContent: 'center', alignItems: 'center' },
  subWingTxt: { fontSize: 13, fontWeight: 'bold', color: '#0D47A1' },
  roomBox: { position: 'absolute', justifyContent: 'center', alignItems: 'center', padding: 2 },
  pillBadge: { backgroundColor: '#FFFFFF', borderWidth: 1.2, borderColor: '#263238', borderRadius: 14, paddingHorizontal: 6, paddingVertical: 3, maxWidth: '92%', alignItems: 'center', justifyContent: 'center' },
  roomTxt: { fontSize: 10.5, fontWeight: 'bold', color: '#111111', textAlign: 'center' },
  serviceTxt: { fontSize: 9.5, fontWeight: 'bold', color: '#37474F', textAlign: 'center' },
  faultBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  faultTxt: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
});
