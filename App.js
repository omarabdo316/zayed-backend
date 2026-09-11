import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. التوزيع المعماري الدقيق (اليسار: 1-5 | الوسط: الخدمات والمسابح | اليمين: 3-6)
const INITIAL_ROOMS_DATA = {
  left_wing: [
    { id: 'l_g5_1', name: 'الصف الخامس 4', type: 'class', block: 'الخامس' },
    { id: 'l_g5_2', name: 'الصف الخامس 5', type: 'class', block: 'الخامس' },
    { id: 'l_g5_3', name: 'الصف الخامس 6', type: 'class', block: 'الخامس' },
    { id: 'l_g5_adm', name: 'إدارة الجناح', type: 'admin', block: 'الخامس' },
    { id: 'l_g5_sup', name: 'مشرف / مخزن', type: 'store', block: 'الخامس' },
    { id: 'l_g5_4', name: 'الصف الخامس 3', type: 'class', block: 'الخامس' },
    { id: 'l_g5_5', name: 'الصف الخامس 2', type: 'class', block: 'الخامس' },
    { id: 'l_g5_6', name: 'الصف الخامس 1', type: 'class', block: 'الخامس' },
    { id: 'l_g5_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الخامس' },
    { id: 'l_g5_wc', name: 'دورة مياه', type: 'wc', block: 'الخامس' },
    { id: 'l_yard_1', name: '⚽ ساحة ومضمار الأنشطة 1', type: 'yard', block: 'الساحات' },
    { id: 'l_g2_1', name: 'الصف الثاني 5', type: 'class', block: 'الثاني' },
    { id: 'l_g2_2', name: 'الصف الثاني 3', type: 'class', block: 'الثاني' },
    { id: 'l_g2_3', name: 'الصف الثاني 1', type: 'class', block: 'الثاني' },
    { id: 'l_g2_cls', name: 'قاعة دراسية', type: 'class', block: 'الثاني' },
    { id: 'l_g2_spe', name: 'قسم التربية الخاصة', type: 'special', block: 'الثاني' },
    { id: 'l_g2_4', name: 'الصف الثاني 4', type: 'class', block: 'الثاني' },
    { id: 'l_g2_5', name: 'الصف الثاني 2', type: 'class', block: 'الثاني' },
    { id: 'l_g2_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الثاني' },
    { id: 'l_g2_wc', name: 'دورة مياه', type: 'wc', block: 'الثاني' },
    { id: 'l_play_1', name: '👶 ساحة المظلات وألعاب الأطفال 1', type: 'yard', block: 'الساحات' },
    { id: 'l_g1_1', name: 'الصف الأول 5', type: 'class', block: 'الأول' },
    { id: 'l_g1_2', name: 'الصف الأول 3', type: 'class', block: 'الأول' },
    { id: 'l_g1_3', name: 'الصف الأول 1', type: 'class', block: 'الأول' },
    { id: 'l_g1_cls', name: 'قاعة دراسية', type: 'class', block: 'الأول' },
    { id: 'l_g1_4', name: 'الصف الأول 4', type: 'class', block: 'الأول' },
    { id: 'l_g1_5', name: 'الصف الأول 2', type: 'class', block: 'الأول' },
    { id: 'l_g1_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الأول' },
  ],
  center_wing: [
    { id: 'c_cafe_l', name: 'كافتيريا (يسار)', type: 'cafe' },
    { id: 'c_serv', name: 'خدمات الكافتيريا ومصلى', type: 'services' },
    { id: 'c_cafe_r', name: 'كافتيريا (يمين)', type: 'cafe' },
    { id: 'c_lec_l', name: 'غرفة المحاضرات 1', type: 'theater' },
    { id: 'c_wc_mid', name: 'دورات مياه مركزية', type: 'wc' },
    { id: 'c_lec_r', name: 'غرفة المحاضرات 2', type: 'theater' },
    { id: 'c_music_1', name: 'غرفة الموسيقى 1', type: 'special' },
    { id: 'c_music_2', name: 'غرفة الموسيقى 2', type: 'special' },
    { id: 'c_pool', name: '🏊 المسبح الرياضي والمدرجات', type: 'pool' },
    { id: 'c_gym', name: '🏋️ الصالة الرياضية والمدرجات', type: 'gym' },
    { id: 'c_sci_2', name: 'مختبر العلوم 2', type: 'lab' },
    { id: 'c_comp_2', name: 'مختبر الحاسوب 2', type: 'lab' },
    { id: 'c_comp_1', name: 'مختبر الحاسوب 1', type: 'lab' },
    { id: 'c_sci_1', name: 'مختبر العلوم 1', type: 'lab' },
    { id: 'c_admin_1', name: 'مكتب الإدارة العامة', type: 'admin' },
    { id: 'c_recept', name: 'الاستقبال الرئيسي', type: 'admin' },
    { id: 'c_admin_2', name: 'الإدارة وشؤون الطلاب', type: 'admin' },
  ],
  right_wing: [
    { id: 'r_g6_adm', name: 'إدارة الجناح', type: 'admin', block: 'السادس' },
    { id: 'r_g6_1', name: 'الصف السادس 6', type: 'class', block: 'السادس' },
    { id: 'r_g6_2', name: 'الصف السادس 5', type: 'class', block: 'السادس' },
    { id: 'r_g6_3', name: 'الصف السادس 4', type: 'class', block: 'السادس' },
    { id: 'r_g6_sup', name: 'مشرف ومخزن', type: 'store', block: 'السادس' },
    { id: 'r_g6_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'السادس' },
    { id: 'r_g6_4', name: 'الصف السادس 1', type: 'class', block: 'السادس' },
    { id: 'r_g6_5', name: 'الصف السادس 2', type: 'class', block: 'السادس' },
    { id: 'r_g6_6', name: 'الصف السادس 3', type: 'class', block: 'السادس' },
    { id: 'r_g6_wc', name: 'دورة مياه', type: 'wc', block: 'السادس' },
    { id: 'r_yard_2', name: '⚽ ساحة ومضمار الأنشطة 2', type: 'yard', block: 'الساحات' },
    { id: 'r_g4_cls', name: 'قاعة دراسية', type: 'class', block: 'الرابع' },
    { id: 'r_g4_1', name: 'الصف الرابع 3', type: 'class', block: 'الرابع' },
    { id: 'r_g4_2', name: 'الصف الرابع 4', type: 'class', block: 'الرابع' },
    { id: 'r_g4_3', name: 'الصف الرابع 5', type: 'class', block: 'الرابع' },
    { id: 'r_g4_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الرابع' },
    { id: 'r_g4_4', name: 'الصف الرابع 1', type: 'class', block: 'الرابع' },
    { id: 'r_g4_5', name: 'الصف الرابع 2', type: 'class', block: 'الرابع' },
    { id: 'r_g4_wc', name: 'دورة مياه', type: 'wc', block: 'الرابع' },
    { id: 'r_play_2', name: '👶 ساحة المظلات وألعاب الأطفال 2', type: 'yard', block: 'الساحات' },
    { id: 'r_g3_adm', name: 'غرفة الإدارة', type: 'admin', block: 'الثالث' },
    { id: 'r_g3_1', name: 'الصف الثالث 3', type: 'class', block: 'الثالث' },
    { id: 'r_g3_2', name: 'الصف الثالث 4', type: 'class', block: 'الثالث' },
    { id: 'r_g3_spe', name: 'قسم التربية الخاصة', type: 'special', block: 'الثالث' },
    { id: 'r_g3_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الثالث' },
    { id: 'r_g3_3', name: 'الصف الثالث 1', type: 'class', block: 'الثالث' },
    { id: 'r_g3_4', name: 'الصف الثالث 2', type: 'class', block: 'الثالث' },
  ],
};

// 2. أعطال شائعة باللمس السريع (تلغي الحاجة للكتابة للمستخدمين غير المؤهلين)
const EASY_FAULT_PRESETS = [
  { id: 'p1', title: 'المكيف لا يبرد / حار ❄️', category: 'تكييف', priority: 'عاجل', color: '#0284C7' },
  { id: 'p2', title: 'تسريب مياه أو ماسورة 💧', category: 'سباكة', priority: 'طوارئ', color: '#EF4444' },
  { id: 'p3', title: 'كشاف أو لمبة مطفأة 💡', category: 'كهرباء', priority: 'عادي', color: '#F59E0B' },
  { id: 'p4', title: 'مقبس كهربائي خطر ⚡', category: 'كهرباء', priority: 'طوارئ', color: '#EF4444' },
  { id: 'p5', title: 'قفل أو مقبض الباب مكسور 🔒', category: 'أبواب', priority: 'عاجل', color: '#0284C7' },
  { id: 'p6', title: 'كسر زجاج نافذة 🪟', category: 'سلامة', priority: 'طوارئ', color: '#EF4444' },
  { id: 'p7', title: 'طاولة أو كرسي مكسور 🪑', category: 'أثاث', priority: 'عادي', color: '#64748B' },
  { id: 'p8', title: 'انسداد تصريف الحمام 🚽', category: 'سباكة', priority: 'عاجل', color: '#F59E0B' },
];

export default function App() {
  const [roomsData, setRoomsData] = useState(INITIAL_ROOMS_DATA);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map'); // map, lifecycle, inspection, checklist
  const [zoomScale, setZoomScale] = useState(1.0);

  // إدارة الغرفة المحددة
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentWingKey, setCurrentWingKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  // نافذة التبليغ السريع
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(EASY_FAULT_PRESETS[0]);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // قاعدة بيانات دورة الصيانة
  const [faults, setFaults] = useState([
    {
      id: 'F-101',
      zone_id: 'l_g5_1',
      location: 'الصف الخامس 4',
      problem: 'تسريب مياه أو ماسورة 💧',
      category: 'سباكة',
      priority: 'طوارئ',
      status: 'new', // new (جديد) -> working (جاري) -> closed (تم الحل)
      technician: 'فني السباكة - راشد',
      time: '08:15 ص',
      hasVoice: false,
    },
    {
      id: 'F-102',
      zone_id: 'c_pool',
      location: 'المسبح الرياضي والمدرجات',
      problem: 'المكيف لا يبرد / حار ❄️',
      category: 'تكييف',
      priority: 'عاجل',
      status: 'working',
      technician: 'فني التكييف - كومار',
      time: '09:00 ص',
      hasVoice: true,
    },
    {
      id: 'F-103',
      zone_id: 'r_g6_1',
      location: 'الصف السادس 6',
      problem: 'كشاف أو لمبة مطفأة 💡',
      category: 'كهرباء',
      priority: 'عادي',
      status: 'closed',
      technician: 'فني الكهرباء - محمد',
      time: 'أمس',
      hasVoice: false,
    },
  ]);

  // قائمة الفحص المسائي
  const [dailyChecklist, setDailyChecklist] = useState({
    doors: false,
    ac: false,
    lights: false,
    windows: false,
  });

  const handleRoomClick = (room, wingKey) => {
    setCurrentRoom(room);
    setCurrentWingKey(wingKey);
    setDrawerVisible(true);
  };

  // تسجيل البلاغ بنقرة واحدة
  const handleCreateReport = () => {
    const newFault = {
      id: `F-${Date.now().toString().slice(-3)}`,
      zone_id: currentRoom ? currentRoom.id : 'general',
      location: currentRoom ? currentRoom.name : 'المجمع العام',
      problem: selectedPreset.title,
      category: selectedPreset.category,
      priority: selectedPreset.priority,
      status: 'new',
      technician: 'بانتظار التكليف',
      time: 'الآن',
      hasVoice: hasVoiceNote,
    };
    setFaults([newFault, ...faults]);
    setReportModalVisible(false);
    setDrawerVisible(false);
    setHasVoiceNote(false);
    Alert.alert('تم تسجيل البلاغ بنجاح 🚨', `الموقع: ${newFault.location}\nالمشكلة: ${newFault.problem}`);
  };

  // التبديل الدوري السهل لدورة حياة العطل (جديد ⬅️ جاري العمل ⬅️ تم الحل)
  const advanceFaultLifecycle = (faultId) => {
    setFaults(
      faults.map((f) => {
        if (f.id === faultId) {
          if (f.status === 'new') {
            return { ...f, status: 'working', technician: 'فريق الصيانة الميداني' };
          }
          if (f.status === 'working') {
            return { ...f, status: 'closed' };
          }
          return { ...f, status: 'new' };
        }
        return f;
      })
    );
  };

  // إرسال واتساب مباشر بدون كتابة
  const sendWhatsAppTicket = (f) => {
    const text = `*🚨 بلاغ صيانة عاجل - مجمع زايد التعليمي*\n• كود البلاغ: ${f.id}\n• الموقع: ${f.location}\n• المشكلة: ${f.problem}\n• الأولوية: ${f.priority}\n• الحالة: ${f.status === 'new' ? 'جديد ⏳' : f.status === 'working' ? 'جاري الإصلاح 🛠️' : 'تم الحل ✅'}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('تنبيه', 'تطبيق واتساب غير مثبت على هاتفك.');
    });
  };

  // حفظ التسمية المعدلة للقاعة
  const handleSaveRename = () => {
    if (!editedName.trim()) return;
    const updated = roomsData[currentWingKey].map((r) =>
      r.id === currentRoom.id ? { ...r, name: editedName.trim() } : r
    );
    setRoomsData({ ...roomsData, [currentWingKey]: updated });
    setCurrentRoom({ ...currentRoom, name: editedName.trim() });
    setRenameModalVisible(false);
    Alert.alert('تم التعديل بنجاح ✅', `المسمى المعتمد: "${editedName.trim()}"`);
  };

  const getActiveFaultsCount = (roomId) =>
    faults.filter((f) => f.zone_id === roomId && f.status !== 'closed').length;

  const renderRoomBox = (room, wingKey, isWide = false, customHeight = 65) => {
    const alertCount = getActiveFaultsCount(room.id);
    const hasActiveFault = alertCount > 0;

    let bg = '#FEF9C3';
    let border = '#EAB308';
    if (room.type === 'admin') { bg = '#F1F5F9'; border = '#94A3B8'; }
    else if (room.type === 'teachers') { bg = '#E0F2FE'; border = '#38BDF8'; }
    else if (room.type === 'special') { bg = '#FCE7F3'; border = '#EC4899'; }
    else if (room.type === 'lab') { bg = '#DCFCE7'; border = '#22C55E'; }
    else if (room.type === 'yard') { bg = '#F8FAFC'; border = '#CBD5E1'; customHeight = 120; }
    if (hasActiveFault) { bg = '#FEE2E2'; border = '#EF4444'; }

    return (
      <TouchableOpacity
        key={room.id}
        activeOpacity={0.75}
        style={[
          styles.roomItem,
          { backgroundColor: bg, borderColor: border, height: customHeight },
          isWide && { width: '100%' },
        ]}
        onPress={() => handleRoomClick(room, wingKey)}
      >
        <Text style={[styles.roomItemText, hasActiveFault && { color: '#EF4444' }]} numberOfLines={2}>
          {room.name}
        </Text>
        {hasActiveFault && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{alertCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. الشريط العلوي */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>نظام الصيانة الميداني المتكامل</Text>
          <Text style={styles.topBarSub}>مجمع زايد التعليمي - كود التشغيل السريع</Text>
        </View>
        <TouchableOpacity
          style={styles.btnFloor}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorTxt}>{selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. المحتوى بحسب التبويب النشط */}
      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          {/* شريط التحكم بالتكبير */}
          <View style={styles.controlsBar}>
            <Text style={styles.controlsTxt}>↔️ اسحب المخطط للتنقل بحرية كاملة</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.min(s + 0.2, 1.8))} style={styles.btnTool}>
                <Text style={styles.btnToolTxt}>➕ تكبير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.max(s - 0.2, 0.7))} style={styles.btnTool}>
                <Text style={styles.btnToolTxt}>➖ تصغير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1.0)} style={[styles.btnTool, { backgroundColor: '#475569' }]}>
                <Text style={styles.btnToolTxt}>🔄 100%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* مساحة المخطط المعماري الثلاثي (اليسار 1-5 | الوسط خدمات | اليمين 3-6) */}
          <View style={styles.canvasWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                <View style={[styles.blueprintCanvas, { width: 1080 * zoomScale, height: 1400 * zoomScale, transform: [{ scale: zoomScale }] }]}>
                  
                  {/* الجناح الأيسر: صفوف 1-5 */}
                  <View style={styles.wingColumn}>
                    <Text style={styles.wingHeaderTitle}>جناح الصفوف 1 - 5</Text>
                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف الخامس</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.left_wing.slice(0, 10).map((r) => renderRoomBox(r, 'left_wing'))}
                      </View>
                    </View>

                    {renderRoomBox(roomsData.left_wing[10], 'left_wing', true)}

                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف الثاني</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.left_wing.slice(11, 20).map((r) => renderRoomBox(r, 'left_wing'))}
                      </View>
                    </View>

                    {renderRoomBox(roomsData.left_wing[20], 'left_wing', true)}

                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف الأول</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.left_wing.slice(21).map((r) => renderRoomBox(r, 'left_wing'))}
                      </View>
                    </View>
                  </View>

                  {/* القطاع الأوسط: المرافق المركزية */}
                  <View style={[styles.wingColumn, { width: 350 }]}>
                    <Text style={styles.wingHeaderTitle}>الخدمات والمرافق المركزية</Text>
                    <View style={styles.gridRowWrap}>
                      {roomsData.center_wing.slice(0, 3).map((r) => renderRoomBox(r, 'center_wing', false, 80))}
                    </View>
                    <View style={styles.gridRowWrap}>
                      {roomsData.center_wing.slice(3, 6).map((r) => renderRoomBox(r, 'center_wing', false, 70))}
                    </View>
                    <View style={styles.gridRowWrap}>
                      {roomsData.center_wing.slice(6, 8).map((r) => renderRoomBox(r, 'center_wing', false, 70))}
                    </View>
                    {renderRoomBox(roomsData.center_wing[8], 'center_wing', true, 130)}
                    {renderRoomBox(roomsData.center_wing[9], 'center_wing', true, 140)}
                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>مجمع المختبرات العلمية والحاسوب</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.center_wing.slice(10, 14).map((r) => renderRoomBox(r, 'center_wing', false, 75))}
                      </View>
                    </View>
                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>الإدارة العامة والاستقبال</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.center_wing.slice(14).map((r) => renderRoomBox(r, 'center_wing', false, 75))}
                      </View>
                    </View>
                  </View>

                  {/* الجناح الأيمن: صفوف 3-6 */}
                  <View style={styles.wingColumn}>
                    <Text style={styles.wingHeaderTitle}>جناح الصفوف 3 - 6</Text>
                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف السادس</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.right_wing.slice(0, 10).map((r) => renderRoomBox(r, 'right_wing'))}
                      </View>
                    </View>

                    {renderRoomBox(roomsData.right_wing[10], 'right_wing', true)}

                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف الرابع</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.right_wing.slice(11, 19).map((r) => renderRoomBox(r, 'right_wing'))}
                      </View>
                    </View>

                    {renderRoomBox(roomsData.right_wing[19], 'right_wing', true)}

                    <View style={styles.wingSectionCard}>
                      <Text style={styles.blockTitle}>جناح الصف الثالث</Text>
                      <View style={styles.gridRowWrap}>
                        {roomsData.right_wing.slice(20).map((r) => renderRoomBox(r, 'right_wing'))}
                      </View>
                    </View>
                  </View>

                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </ScrollView>
      ) : activeTab === 'lifecycle' ? (
        /* 3. تبويب دورة حياة الصيانة (مبسط جداً للمستخدمين غير المؤهلين) */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          {/* مؤشرات الحالة الكبيرة */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: '#EF4444' }]}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                {faults.filter((f) => f.status === 'new').length}
              </Text>
              <Text style={styles.statLabel}>🔴 جديد ⏳</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#F59E0B' }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                {faults.filter((f) => f.status === 'working').length}
              </Text>
              <Text style={styles.statLabel}>🟡 جاري الإصلاح 🛠️</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#10B981' }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {faults.filter((f) => f.status === 'closed').length}
              </Text>
              <Text style={styles.statLabel}>🟢 تم الحل ✅</Text>
            </View>
          </View>

          <Text style={styles.sectionHeaderTxt}>إدارة دورة حياة الأعطال (انقر على الزر الملون لتغيير المرحلة مباشرة):</Text>

          {faults.map((f) => {
            const isNew = f.status === 'new';
            const isWorking = f.status === 'working';
            const isClosed = f.status === 'closed';

            return (
              <View key={f.id} style={[styles.faultCard, isClosed && { opacity: 0.6, borderColor: '#10B981' }]}>
                <View style={styles.faultCardTop}>
                  <Text style={styles.faultLocation}>📍 {f.location}</Text>
                  <Text style={[styles.badgeTag, { backgroundColor: isNew ? '#EF4444' : isWorking ? '#F59E0B' : '#10B981' }]}>
                    {isNew ? 'بلاغ جديد' : isWorking ? 'قيد العمل' : 'مغلق ومحلول'}
                  </Text>
                </View>

                <Text style={styles.faultIssueTxt}>{f.problem}</Text>
                <Text style={styles.faultMetaTxt}>الفني المكلف: {f.technician} | التوقيت: {f.time}</Text>

                {f.hasVoice && (
                  <View style={styles.voiceIndicator}>
                    <Ionicons name="mic" size={14} color="#38BDF8" />
                    <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold' }}>مرفق تسجيل صوتي للعطل</Text>
                  </View>
                )}

                {/* زر النقل السريع بين مراحل الصيانة */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnCycleStatus,
                      isNew && { backgroundColor: '#EF4444' },
                      isWorking && { backgroundColor: '#F59E0B' },
                      isClosed && { backgroundColor: '#10B981' },
                    ]}
                    onPress={() => advanceFaultLifecycle(f.id)}
                  >
                    <Text style={styles.btnCycleStatusTxt}>
                      {isNew && '⏳ انقر هنا لبدء العمل في الموقع'}
                      {isWorking && '🛠️ قيد الإصلاح.. انقر للتأكيد والإغلاق'}
                      {isClosed && '✅ تم إنجاز الصيانة بنجاح (مكتمل)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnWhatsApp} onPress={() => sendWhatsAppTicket(f)}>
                    <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : activeTab === 'inspection' ? (
        /* 4. تبويب التفتيش الأمني والـ QR */
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={styles.sectionHeaderTxt}>🛡️ نظام التفتيش الأمني والجولات الميدانية</Text>
          <TouchableOpacity
            style={styles.bigScanCard}
            onPress={() => Alert.alert('مسح QR 📷', 'تم فتح الكاميرا.. امسح ملصق القاعة لتوثيق الجولة فوراً')}
          >
            <Ionicons name="qr-code-outline" size={48} color="#FFF" />
            <Text style={styles.bigScanTitle}>مسح باركود القاعة وتوثيق المرور</Text>
            <Text style={styles.bigScanSub}>يسجل التاريخ والوقت والحالة بدون كتابة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pdfExportBtn}
            onPress={() => Alert.alert('تقرير PDF 📄', 'تم استخراج التقرير الأمني والفني المجمع بصيغة PDF جاهز للطباعة')}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFF" />
            <Text style={styles.pdfExportBtnTxt}>استخراج تقرير الصيانة الشامل (PDF)</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* 5. تبويب قائمة الفحص المسائي (Checklist) */
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={styles.sectionHeaderTxt}>📋 الفحص المسائي وإغلاق المجمع</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'right', marginBottom: 16 }}>
            تحقق من النقاط الأربع بنقرة واحدة عند نهاية كل يوم عمل:
          </Text>

          {[
            { key: 'doors', title: 'إغلاق وقفل كافة أبواب الأجنحة 🔒' },
            { key: 'ac', title: 'إطفاء كافة وحدات التكييف والتهوية ❄️' },
            { key: 'lights', title: 'إطفاء الإضاءة والممرات الداخلية 💡' },
            { key: 'windows', title: 'التأكد من إحكام إغلاق النوافذ 🪟' },
          ].map((item) => {
            const checked = dailyChecklist[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.checklistCard, checked && styles.checklistCardChecked]}
                onPress={() => setDailyChecklist({ ...dailyChecklist, [item.key]: !checked })}
              >
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={26}
                  color={checked ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checklistCardTxt, checked && { color: '#FFF' }]}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.btnSaveChecklist}
            onPress={() => Alert.alert('تم الاعتماد ✅', 'تم حفظ وتوثيق تقرير الإغلاق المسائي للمبنى.')}
          >
            <Text style={styles.btnSaveChecklistTxt}>حفظ واعتماد تقرير الإغلاق</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 3. شريط التبويبات السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'map' && styles.navTabTxtActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('lifecycle')}>
          <Ionicons name="sync-circle-outline" size={24} color={activeTab === 'lifecycle' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'lifecycle' && styles.navTabTxtActive]}>دورة الصيانة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('inspection')}>
          <Ionicons name="shield-checkmark-outline" size={22} color={activeTab === 'inspection' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'inspection' && styles.navTabTxtActive]}>التفتيش</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('checklist')}>
          <Ionicons name="checkbox-outline" size={22} color={activeTab === 'checklist' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'checklist' && styles.navTabTxtActive]}>الفحص اليومي</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة خيارات الغرفة (أزرار كبيرة تناسب الجميع) */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{currentRoom?.name}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnActionLarge, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                setDrawerVisible(false);
                setReportModalVisible(true);
              }}
            >
              <Ionicons name="warning-outline" size={24} color="#FFF" />
              <Text style={styles.btnActionLargeTxt}>🚨 تسجيل بلاغ عطل فوري</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnActionLarge, { backgroundColor: '#25D366', marginTop: 10 }]}
              onPress={() => {
                setDrawerVisible(false);
                sendWhatsAppTicket({
                  id: 'مباشر',
                  location: currentRoom?.name,
                  problem: 'طلب فحص ومعاينة فورية',
                  priority: 'عاجل',
                  status: 'new',
                });
              }}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
              <Text style={styles.btnActionLargeTxt}>إرسال بلاغ واتساب مباشر</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.btnActionLarge, { backgroundColor: '#0284C7', flex: 1 }]}
                onPress={() => {
                  setEditedName(currentRoom?.name || '');
                  setDrawerVisible(false);
                  setRenameModalVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFF" />
                <Text style={styles.btnActionLargeTxt}>تعديل الاسم ✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnActionLarge, { backgroundColor: '#334155', flex: 1 }]}
                onPress={() => Alert.alert('كاميرا المرفق 📷', `فتح الكاميرا لتوثيق حالة (${currentRoom?.name})`)}
              >
                <Ionicons name="camera-outline" size={20} color="#FFF" />
                <Text style={styles.btnActionLargeTxt}>صورة 📷</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة التبليغ السريعة (قائمة أزرار جاهزة + تسجيل صوتي) */}
      <Modal visible={reportModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModalCard}>
            <Text style={styles.drawerTitle}>تسجيل عطل في: {currentRoom?.name}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 12 }}>
              اختر المشكلة بلمسة واحدة بدون كتابة 👇
            </Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {EASY_FAULT_PRESETS.map((p) => {
                const isSelected = selectedPreset.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.presetItemBtn, isSelected && { backgroundColor: p.color, borderColor: p.color }]}
                    onPress={() => setSelectedPreset(p)}
                  >
                    <Text style={[styles.presetItemTxt, isSelected && { color: '#FFF' }]}>{p.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* تسجيل صوتي بلمسة واحدة */}
            <TouchableOpacity
              style={[styles.btnVoice, isRecording && { backgroundColor: '#EF4444' }]}
              onPress={() => {
                if (isRecording) {
                  setIsRecording(false);
                  setHasVoiceNote(true);
                  Alert.alert('تم الحفظ 🎤', 'تم تسجيل صوتك وإرفاقه بالبلاغ بنجاح.');
                } else {
                  setIsRecording(true);
                }
              }}
            >
              <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={22} color="#FFF" />
              <Text style={styles.btnVoiceTxt}>
                {isRecording ? 'جاري التسجيل.. انقر للحفظ ⏹️' : hasVoiceNote ? '✅ تم إرفاق تسجيلك الصوتي' : 'اضغط للتحدث وشرح المشكلة بصوتك 🎤'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#10B981', flex: 1.5 }]} onPress={handleCreateReport}>
                <Text style={styles.btnActionLargeTxt}>تأكيد وإرسال البلاغ 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#475569', flex: 1 }]} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.btnActionLargeTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة إعادة التسمية الميدانية */}
      <Modal visible={renameModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.renameBox}>
            <Text style={styles.drawerTitle}>تعديل مسمى الفراغ المعماري ✏️</Text>
            <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 10 }}>
              المسمى الحالي: {currentRoom?.name}
            </Text>
            <TextInput
              style={styles.renameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="اكتب الاسم الجديد للقاعة هنا..."
              placeholderTextColor="#94A3B8"
            />
            <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#10B981', flex: 1.5 }]} onPress={handleSaveRename}>
                <Text style={styles.btnActionLargeTxt}>اعتماد الاسم</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#475569', flex: 1 }]} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.btnActionLargeTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  topBarTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  topBarSub: { color: '#38BDF8', fontSize: 10, marginTop: 2 },
  btnFloor: { backgroundColor: '#0284C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  btnFloorTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  controlsBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginTop: 6, borderRadius: 8 },
  controlsTxt: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
  btnTool: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnToolTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  canvasWrapper: { height: 560, backgroundColor: '#0F172A', marginHorizontal: 8, marginTop: 6, borderRadius: 12, borderWidth: 2, borderColor: '#334155', overflow: 'hidden' },
  blueprintCanvas: { backgroundColor: '#0B132B', flexDirection: 'row', padding: 12, gap: 14 },

  wingColumn: { width: 340, gap: 8 },
  wingHeaderTitle: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#1E293B', paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#334155', marginBottom: 2 },
  wingSectionCard: { backgroundColor: '#131F37', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#1E293B', gap: 6 },
  blockTitle: { color: '#94A3B8', fontSize: 10.5, fontWeight: 'bold', textAlign: 'center' },
  gridRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between' },

  roomItem: { width: '31.5%', borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 4, position: 'relative' },
  roomItemText: { fontSize: 9.5, fontWeight: 'bold', textAlign: 'center', color: '#0F172A' },
  alertBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  alertBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  statsRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1E293B', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#F8FAFC', fontSize: 11, marginTop: 4, fontWeight: 'bold' },

  sectionHeaderTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 12 },
  faultCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#334155' },
  faultCardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  faultLocation: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  badgeTag: { color: '#FFF', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: 'bold' },
  faultIssueTxt: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginVertical: 6 },
  faultMetaTxt: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 8 },
  voiceIndicator: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 10 },

  cardActionsRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  btnCycleStatus: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCycleStatusTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  btnWhatsApp: { backgroundColor: '#25D366', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  bigScanCard: { backgroundColor: '#0284C7', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  bigScanTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bigScanSub: { color: '#E0F2FE', fontSize: 11 },
  pdfExportBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#38BDF8', padding: 14, borderRadius: 10, marginTop: 14 },
  pdfExportBtnTxt: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13 },

  checklistCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', padding: 16, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  checklistCardChecked: { borderColor: '#10B981', backgroundColor: '#132A38' },
  checklistCardTxt: { color: '#CBD5E1', fontSize: 13, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  btnSaveChecklist: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  btnSaveChecklistTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  bottomNav: { flexDirection: 'row', height: 56, backgroundColor: '#1E293B', borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  navTabBtn: { alignItems: 'center', justifyContent: 'center' },
  navTabTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navTabTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 2, borderColor: '#38BDF8' },
  reportModalCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 2, borderColor: '#EF4444' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  drawerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  btnActionLarge: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 },
  btnActionLargeTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  presetItemBtn: { backgroundColor: '#0F172A', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#334155', alignItems: 'flex-end' },
  presetItemTxt: { color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' },

  btnVoice: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
  btnVoiceTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  renameBox: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#38BDF8', alignSelf: 'center', width: '90%' },
  renameInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155' },
});
