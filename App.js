import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// 1. أبعاد وإحداثيات المخطط المعماري الحقيقي (1200 × 1200)
// ==========================================
const MAP_SIZE = 1200;

const GROUND_ZONES = [
  // جناح الصفوف 1-5 (اليسار)
  { id: 'g5_sup', x: 20, y: 125, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g5_store', x: 20, y: 155, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g5_4', x: 55, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 4' },
  { id: 'g5_5', x: 125, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 5' },
  { id: 'g5_6', x: 195, y: 125, w: 68, h: 55, name_ar: 'الصف الخامس 6' },
  { id: 'g5_admin', x: 265, y: 125, w: 65, h: 55, name_ar: 'الإدارة' },
  { id: 'g5_stairs_top', x: 332, y: 125, w: 60, h: 55, name_ar: 'درج' },

  { id: 'g5_stairs_mid', x: 20, y: 215, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g5_3', x: 55, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 3' },
  { id: 'g5_2', x: 125, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 2' },
  { id: 'g5_1', x: 195, y: 215, w: 68, h: 55, name_ar: 'الصف الخامس 1' },
  { id: 'g5_teachers', x: 265, y: 215, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g5_wc', x: 332, y: 215, w: 60, h: 55, name_ar: 'دورة مياه' },

  { id: 'yard_1', x: 20, y: 285, w: 325, h: 225, name_ar: 'ساحة ومضمار (1)' },
  { id: 'yard_1_store', x: 350, y: 340, w: 42, h: 35, name_ar: 'مخزن' },

  { id: 'g2_sup', x: 20, y: 535, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g2_store', x: 20, y: 565, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g2_5', x: 55, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 5' },
  { id: 'g2_3', x: 125, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 3' },
  { id: 'g2_1', x: 195, y: 535, w: 68, h: 55, name_ar: 'الصف الثاني 1' },
  { id: 'g2_class_extra', x: 265, y: 535, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g2_stairs_top', x: 332, y: 535, w: 60, h: 55, name_ar: 'درج' },

  { id: 'g2_stairs_mid', x: 20, y: 625, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g2_special', x: 55, y: 625, w: 68, h: 55, name_ar: 'قسم التربية الخاصة' },
  { id: 'g2_4', x: 125, y: 625, w: 68, h: 55, name_ar: 'الصف الثاني 4' },
  { id: 'g2_2', x: 195, y: 625, w: 68, h: 55, name_ar: 'الصف الثاني 2' },
  { id: 'g2_teachers', x: 265, y: 625, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g2_wc', x: 332, y: 625, w: 60, h: 55, name_ar: 'دورة مياه' },

  { id: 'play_yard_1', x: 20, y: 695, w: 372, h: 105, name_ar: 'ساحة الألعاب المظللة (1)' },

  { id: 'g1_stairs_top', x: 20, y: 815, w: 32, h: 55, name_ar: 'درج' },
  { id: 'g1_5', x: 55, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 5' },
  { id: 'g1_3', x: 125, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 3' },
  { id: 'g1_1', x: 195, y: 815, w: 68, h: 55, name_ar: 'الصف الأول 1' },
  { id: 'g1_class_extra', x: 265, y: 815, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g1_wc', x: 332, y: 815, w: 60, h: 55, name_ar: 'دورة مياه' },

  { id: 'g1_sup', x: 20, y: 905, w: 32, h: 28, name_ar: 'مشرف' },
  { id: 'g1_store', x: 20, y: 935, w: 32, h: 25, name_ar: 'مخزن' },
  { id: 'g1_6', x: 55, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 6' },
  { id: 'g1_4', x: 125, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 4' },
  { id: 'g1_2', x: 195, y: 905, w: 68, h: 55, name_ar: 'الصف الأول 2' },
  { id: 'g1_teachers', x: 265, y: 905, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g1_stairs_bot', x: 332, y: 905, w: 60, h: 55, name_ar: 'درج' },

  // الخدمات المركزية (الوسط)
  { id: 'cafe_a', x: 418, y: 125, w: 105, h: 145, name_ar: 'كافتيريا (أ)' },
  { id: 'cafe_prep', x: 528, y: 125, w: 65, h: 145, name_ar: 'خدمات وتحضير ومخزن' },
  { id: 'cafe_b', x: 598, y: 125, w: 105, h: 145, name_ar: 'كافتيريا (ب)' },

  { id: 'art_room', x: 418, y: 285, w: 90, h: 70, name_ar: 'غرفة المحاضرات (أ)' },
  { id: 'music_room', x: 613, y: 285, w: 90, h: 70, name_ar: 'غرفة المحاضرات (ب)' },
  { id: 'music_sub', x: 480, y: 368, w: 160, h: 58, name_ar: 'غرفة الموسيقى' },
  { id: 'pool_wc_l', x: 418, y: 368, w: 55, h: 58, name_ar: 'دورة مياه' },
  { id: 'pool', x: 418, y: 440, w: 285, h: 80, name_ar: 'المسبح الرياضي' },
  { id: 'gym', x: 418, y: 535, w: 285, h: 145, name_ar: 'الصالة الرياضية' },

  { id: 'lab_sci_2', x: 418, y: 700, w: 65, h: 75, name_ar: 'مختبر العلوم 2' },
  { id: 'lab_comp_2', x: 488, y: 700, w: 65, h: 75, name_ar: 'مختبر الحاسوب 2' },
  { id: 'lab_comp_1', x: 558, y: 700, w: 65, h: 75, name_ar: 'مختبر الحاسوب 1' },
  { id: 'lab_sci_1', x: 638, y: 700, w: 65, h: 75, name_ar: 'مختبر العلوم 1' },

  { id: 'sec_office', x: 418, y: 815, w: 60, h: 55, name_ar: 'مكتب الأمن' },
  { id: 'gen_admin', x: 485, y: 815, w: 85, h: 55, name_ar: 'الإدارة العامة' },
  { id: 'stu_affairs', x: 575, y: 815, w: 75, h: 55, name_ar: 'شؤون الطلاب' },
  { id: 'adm_wc', x: 655, y: 815, w: 48, h: 55, name_ar: 'حمامات الإدارة' },

  { id: 'secretary', x: 418, y: 905, w: 60, h: 55, name_ar: 'السكرتارية' },
  { id: 'principal', x: 485, y: 905, w: 55, h: 55, name_ar: 'المدير' },
  { id: 'reception', x: 545, y: 905, w: 55, h: 55, name_ar: 'الاستقبال الرئيسي' },
  { id: 'vice_princ', x: 605, y: 905, w: 50, h: 55, name_ar: 'مساعد المدير' },
  { id: 'waiting', x: 660, y: 905, w: 43, h: 55, name_ar: 'الانتظار' },

  // جناح الصفوف 3-6 (اليمين)
  { id: 'g6_stairs_top', x: 728, y: 125, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g6_admin', x: 792, y: 125, w: 65, h: 55, name_ar: 'الإدارة' },
  { id: 'g6_6', x: 862, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 6' },
  { id: 'g6_5', x: 932, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 5' },
  { id: 'g6_4', x: 1002, y: 125, w: 68, h: 55, name_ar: 'الصف السادس 4' },
  { id: 'g6_sup_store', x: 1075, y: 125, w: 32, h: 55, name_ar: 'مشرف ومخزن' },

  { id: 'g6_wc', x: 728, y: 215, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g6_teachers', x: 792, y: 215, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g6_1', x: 862, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 1' },
  { id: 'g6_2', x: 932, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 2' },
  { id: 'g6_3', x: 1002, y: 215, w: 68, h: 55, name_ar: 'الصف السادس 3' },
  { id: 'g6_stairs_bot', x: 1075, y: 215, w: 32, h: 55, name_ar: 'درج' },

  { id: 'yard_2_store', x: 728, y: 340, w: 42, h: 35, name_ar: 'مخزن' },
  { id: 'yard_2', x: 775, y: 285, w: 332, h: 225, name_ar: 'ساحة ومضمار (2)' },

  { id: 'g4_stairs_top', x: 728, y: 535, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g4_class_extra', x: 792, y: 535, w: 65, h: 55, name_ar: 'قاعة دراسية' },
  { id: 'g4_2', x: 862, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 3' },
  { id: 'g4_4', x: 932, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 4' },
  { id: 'g4_6', x: 1002, y: 535, w: 68, h: 55, name_ar: 'الصف الرابع 5' },
  { id: 'g4_sup_store', x: 1075, y: 535, w: 32, h: 55, name_ar: 'مشرف ومخزن' },

  { id: 'g4_wc', x: 728, y: 625, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g4_teachers', x: 792, y: 625, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g4_1', x: 862, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 1' },
  { id: 'g4_3', x: 932, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 2' },
  { id: 'g4_5', x: 1002, y: 625, w: 68, h: 55, name_ar: 'الصف الرابع 5' },
  { id: 'g4_stairs_bot', x: 1075, y: 625, w: 32, h: 55, name_ar: 'درج' },

  { id: 'play_yard_2', x: 728, y: 695, w: 379, h: 105, name_ar: 'ساحة الألعاب المظللة (2)' },

  { id: 'g3_wc', x: 728, y: 815, w: 60, h: 55, name_ar: 'دورة مياه' },
  { id: 'g3_admin', x: 792, y: 815, w: 65, h: 55, name_ar: 'غرفة الإدارة' },
  { id: 'g3_2', x: 862, y: 815, w: 68, h: 55, name_ar: 'الصف الثالث 3' },
  { id: 'g3_4', x: 932, y: 815, w: 68, h: 55, name_ar: 'الصف الثالث 4' },
  { id: 'g3_special', x: 1002, y: 815, w: 68, h: 55, name_ar: 'قسم التربية الخاصة' },
  { id: 'g3_stairs_top', x: 1075, y: 815, w: 32, h: 55, name_ar: 'درج' },

  { id: 'g3_stairs_mid', x: 728, y: 905, w: 60, h: 55, name_ar: 'درج' },
  { id: 'g3_teachers', x: 792, y: 905, w: 65, h: 55, name_ar: 'غرفة المعلمين' },
  { id: 'g3_1', x: 862, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 1' },
  { id: 'g3_3', x: 932, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 2' },
  { id: 'g3_5', x: 1002, y: 905, w: 68, h: 55, name_ar: 'الصف الثالث 3' },
  { id: 'g3_sup_store', x: 1075, y: 905, w: 32, h: 55, name_ar: 'مشرف ومخزن' },
];

export default function App() {
  // الحالات الأساسية
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('map');
  const [zoomScale, setZoomScale] = useState(1);

  // إدارة الغرف والبلاغات
  const [selectedZone, setSelectedZone] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalNewFault, setModalNewFault] = useState(false);
  const [faultDesc, setFaultDesc] = useState('');
  const [faultType, setFaultType] = useState('كهرباء');

  // قائمة الأعطال الافتراضية
  const [faults, setFaults] = useState([
    { id: 'f1', zone_id: 'g5_4', location: 'الصف الخامس 4', type: 'تكييف وكهرباء', desc: 'عطل في وحدة التكييف الرئيسية', status: 'pending' },
    { id: 'f2', zone_id: 'gym', location: 'الصالة الرياضية', type: 'إضاءة', desc: 'كشافات الإنارة بحاجة لصيانة', status: 'pending' },
  ]);

  // الضغط العادي لفتح تفاصيل الغرفة
  const handleZonePress = (zone) => {
    setSelectedZone(zone);
    setDrawerVisible(true);
  };

  // الضغط المطول لتحديث صورة الغرفة
  const handleZoneLongPress = (zone) => {
    Alert.alert(
      'تحديث صورة المرفق 📷',
      `هل ترغب في تعيين وتحديث صورة جديدة لـ (${zone.name_ar})؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'اختيار من الاستوديو',
          onPress: () => Alert.alert('تم بنجاح', `تم تحديث صورة ${zone.name_ar} بنجاح!`),
        },
      ]
    );
  };

  // إضافة بلاغ عطل جديد
  const handleAddFault = () => {
    if (!faultDesc.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة وصف العطل أولاً.');
      return;
    }
    const newF = {
      id: 'f_' + Date.now(),
      zone_id: selectedZone ? selectedZone.id : 'gen',
      location: selectedZone ? selectedZone.name_ar : 'المجمع العام',
      type: faultType,
      desc: faultDesc,
      status: 'pending',
    };
    setFaults([newF, ...faults]);
    setFaultDesc('');
    setModalNewFault(false);
    Alert.alert('تم بنجاح 🚨', 'تم تسجيل بلاغ العطل بنجاح في النظام.');
  };

  // تصفية الأعطال حسب الفلتر المختار
  const filteredFaults = faults.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'elec') return f.type.includes('كهرباء') || f.type.includes('إضاءة');
    if (activeFilter === 'plumb') return f.type.includes('سباكة') || f.type.includes('مياه');
    if (activeFilter === 'furn') return f.type.includes('أثاث') || f.type.includes('مقاعد');
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

      {/* الشريط العلوي للعنوان */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>مخطط مجمع زايد التعليمي والرياضي</Text>
        <TouchableOpacity style={styles.btnHeaderBack} onPress={() => setActiveTab('map')}>
          <Text style={styles.btnHeaderBackTxt}>الرئيسية ↩</Text>
        </TouchableOpacity>
      </View>

      {/* اختيار الطابق (الأرضي / العلوي) */}
      <View style={styles.floorBar}>
        <TouchableOpacity
          style={[styles.floorBtn, selectedFloor === 'ground' && styles.floorBtnActive]}
          onPress={() => setSelectedFloor('ground')}
        >
          <Text style={[styles.floorBtnTxt, selectedFloor === 'ground' && styles.floorBtnTxtActive]}>
            الدور الأرضي
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floorBtn, selectedFloor === 'upper' && styles.floorBtnActive]}
          onPress={() => setSelectedFloor('upper')}
        >
          <Text style={[styles.floorBtnTxt, selectedFloor === 'upper' && styles.floorBtnTxtActive]}>
            الدور العلوي
          </Text>
        </TouchableOpacity>
      </View>

      {/* شريط الفلاتر السريعة */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipTxt, activeFilter === 'all' && styles.filterChipTxtActive]}>
            الكل ({faults.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'elec' && styles.filterChipActive]}
          onPress={() => setActiveFilter('elec')}
        >
          <Text style={[styles.filterChipTxt, activeFilter === 'elec' && styles.filterChipTxtActive]}>
            ⚡ كهرباء وإنارة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'plumb' && styles.filterChipActive]}
          onPress={() => setActiveFilter('plumb')}
        >
          <Text style={[styles.filterChipTxt, activeFilter === 'plumb' && styles.filterChipTxtActive]}>
            💧 سباكة ومياه
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'furn' && styles.filterChipActive]}
          onPress={() => setActiveFilter('furn')}
        >
          <Text style={[styles.filterChipTxt, activeFilter === 'furn' && styles.filterChipTxtActive]}>
            🪑 أثاث ومقاعد
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* جسم الصفحة الرئيسي */}
      {activeTab === 'map' ? (
        <View style={styles.mapWrapper}>
          {/* شريط أدوات التكبير */}
          <View style={styles.zoomControls}>
            <Text style={styles.zoomTitle}>
              {selectedFloor === 'ground' ? '🗺️ المخطط المعماري الكامل' : '🏢 الدور العلوي'}
            </Text>
            <View style={styles.zoomBtnGroup}>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.min(s * 1.25, 2.2))} style={styles.btnZoom}>
                <Text style={styles.btnZoomTxt}>➕ تكبير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.max(s * 0.8, 0.6))} style={styles.btnZoom}>
                <Text style={styles.btnZoomTxt}>➖ تصغير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1)} style={[styles.btnZoom, { backgroundColor: '#334155' }]}>
                <Text style={styles.btnZoomTxt}>🔄 100%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* مساحة التمرير الحر أفقياً ورأسياً */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
              <View
                style={{
                  width: MAP_SIZE * zoomScale,
                  height: MAP_SIZE * zoomScale,
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* صورة المخطط المعماري الحقيقية */}
                <Image
                  source={require('./assets/ground_plan.png')}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="stretch"
                />

                {/* مناطق اللمس الزجاجية الشفافة المطابقة للجدران */}
                {selectedFloor === 'ground' &&
                  GROUND_ZONES.map((z) => {
                    const zoneFaults = filteredFaults.filter(
                      (f) => f.zone_id === z.id || f.location === z.name_ar
                    );
                    const hasFault = zoneFaults.length > 0;

                    return (
                      <Pressable
                        key={z.id}
                        onPress={() => handleZonePress(z)}
                        onLongPress={() => handleZoneLongPress(z)}
                        delayLongPress={500}
                        style={({ pressed }) => ({
                          position: 'absolute',
                          left: z.x * zoomScale,
                          top: z.y * zoomScale,
                          width: z.w * zoomScale,
                          height: z.h * zoomScale,
                          borderRadius: 4,
                          borderWidth: hasFault ? 2 : pressed ? 2 : 1,
                          borderColor: hasFault ? '#EF4444' : pressed ? '#0284C7' : 'rgba(2, 132, 199, 0.25)',
                          backgroundColor: hasFault
                            ? 'rgba(239, 68, 68, 0.35)'
                            : pressed
                            ? 'rgba(2, 132, 199, 0.25)'
                            : 'rgba(255, 255, 255, 0.02)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        })}
                      >
                        {hasFault && (
                          <View style={styles.badgeAlert}>
                            <Text style={styles.badgeAlertTxt}>🚨 {zoneFaults.length}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      ) : (
        /* تبويب قائمة الأعطال */
        <ScrollView style={styles.faultsListScroll}>
          <Text style={styles.sectionTitle}>سجل البلاغات والأعطال المفتوحة ({filteredFaults.length})</Text>
          {filteredFaults.map((item) => (
            <View key={item.id} style={styles.faultCard}>
              <View style={styles.faultCardHeader}>
                <Text style={styles.faultLocTxt}>📍 {item.location}</Text>
                <Text style={styles.faultTypeTag}>{item.type}</Text>
              </View>
              <Text style={styles.faultDescTxt}>{item.desc}</Text>
              <View style={styles.faultCardFooter}>
                <Text style={styles.faultStatusPending}>قيد المعالجة ⏳</Text>
                <TouchableOpacity
                  style={styles.btnCardAction}
                  onPress={() => Alert.alert('تقرير PDF', `جاري تصدير تقرير البلاغ: ${item.location}`)}
                >
                  <Text style={styles.btnCardActionTxt}>📄 استخراج PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* التبويبات السفلية */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Ionicons name="home-outline" size={22} color={activeTab === 'home' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'home' && styles.navTxtActive]}>الرئيسية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'map' && styles.navTxtActive]}>المخطط</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'faults' && styles.navTxtActive]}>الأعطال</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('locations')}>
          <Ionicons name="location-outline" size={22} color={activeTab === 'locations' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'locations' && styles.navTxtActive]}>المواقع</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل الغرفة وتاريخ الصيانة */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{selectedZone?.name_ar || 'تفاصيل المرفق'}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerSub}>معرف المرفق: {selectedZone?.id}</Text>

            <View style={styles.drawerActionsRow}>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#EF4444' }]}
                onPress={() => setModalNewFault(true)}
              >
                <Text style={styles.btnActionTxt}>🚨 تسجيل عطل جديد</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#0284C7' }]}
                onPress={() => {
                  Alert.alert('تقرير الصيانة 📄', `تم استخراج تقرير PDF لـ (${selectedZone?.name_ar}) بنجاح.`);
                }}
              >
                <Text style={styles.btnActionTxt}>📑 سحب ملف PDF</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: '#334155', marginTop: 10 }]}
              onPress={() => handleZoneLongPress(selectedZone)}
            >
              <Text style={styles.btnActionTxt}>📷 تحديث وتغيير صورة القاعة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* نافذة تسجيل عطل جديد */}
      <Modal visible={modalNewFault} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inputModalCard}>
            <Text style={styles.modalTitle}>تسجيل بلاغ صيانة جديد 🚨</Text>
            <Text style={styles.modalSubtitle}>المكان: {selectedZone?.name_ar}</Text>

            <TextInput
              style={styles.textInput}
              placeholder="اكتب وصف العطل بالتفصيل..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={faultDesc}
              onChangeText={setFaultDesc}
            />

            <View style={styles.typeSelectorRow}>
              {['كهرباء', 'سباكة', 'تكييف', 'أثاث'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, faultType === t && styles.typeBtnActive]}
                  onPress={() => setFaultType(t)}
                >
                  <Text style={[styles.typeBtnTxt, faultType === t && styles.typeBtnTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleAddFault}>
                <Text style={styles.btnConfirmTxt}>حفظ البلاغ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalNewFault(false)}>
                <Text style={styles.btnCancelTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// التنسيقات الهندسية (CAD Theme)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B132B' },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderColor: '#3A506B',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  btnHeaderBack: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#0B132B', borderRadius: 12 },
  btnHeaderBackTxt: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold' },

  floorBar: { flexDirection: 'row', padding: 8, gap: 8, backgroundColor: '#0B132B' },
  floorBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#1C2541' },
  floorBtnActive: { backgroundColor: '#0284C7' },
  floorBtnTxt: { color: '#94A3B8', fontWeight: 'bold', fontSize: 13 },
  floorBtnTxtActive: { color: '#FFFFFF' },

  filterScroll: { maxHeight: 42, paddingHorizontal: 8, backgroundColor: '#0B132B' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1C2541',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  filterChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterChipTxt: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  filterChipTxtActive: { color: '#0B132B' },

  mapWrapper: { flex: 1, backgroundColor: '#0B132B' },
  zoomControls: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderColor: '#3A506B',
  },
  zoomTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  zoomBtnGroup: { flexDirection: 'row-reverse', gap: 6 },
  btnZoom: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  btnZoomTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  badgeAlert: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeAlertTxt: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },

  faultsListScroll: { flex: 1, padding: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  faultCard: { backgroundColor: '#1C2541', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#3A506B' },
  faultCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  faultLocTxt: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  faultTypeTag: { color: '#38BDF8', fontSize: 11, backgroundColor: '#0B132B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  faultDescTxt: { color: '#CBD5E1', fontSize: 12, marginBottom: 8, textAlign: 'right' },
  faultCardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  faultStatusPending: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },
  btnCardAction: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  btnCardActionTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#1C2541',
    borderTopWidth: 1,
    borderColor: '#3A506B',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#1C2541', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: 2, borderColor: '#38BDF8' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  drawerSub: { color: '#94A3B8', fontSize: 12, marginTop: 4, textAlign: 'right' },
  drawerActionsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnAction: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnActionTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  inputModalCard: { backgroundColor: '#1C2541', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3A506B', alignSelf: 'center', width: '90%' },
  modalTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  modalSubtitle: { color: '#38BDF8', fontSize: 12, marginTop: 2, marginBottom: 12, textAlign: 'right' },
  textInput: { backgroundColor: '#0B132B', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#3A506B', textAlignVertical: 'top' },
  typeSelectorRow: { flexDirection: 'row-reverse', gap: 6, marginVertical: 12 },
  typeBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0B132B', alignItems: 'center', borderWidth: 1, borderColor: '#3A506B' },
  typeBtnActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  typeBtnTxt: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  typeBtnTxtActive: { color: '#FFFFFF' },
  modalBtnRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 6 },
  btnConfirm: { flex: 1, backgroundColor: '#10B981', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnConfirmTxt: { color: '#FFFFFF', fontWeight: 'bold' },
  btnCancel: { flex: 1, backgroundColor: '#475569', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnCancelTxt: { color: '#FFFFFF', fontWeight: 'bold' },
});
