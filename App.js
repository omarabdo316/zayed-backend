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

// البيانات الهندسية المحدثة وفق التوزيع الواقعي للمخطط المعماري
const INITIAL_BLUEPRINT_ROOMS = {
  // 1. الجناح الأيسر (صفوف 1 - 5)
  left_wing: [
    { id: 'l_g5_1', name: 'الصف الخامس 4', type: 'class', block: 'الخامس', fireExt: true },
    { id: 'l_g5_2', name: 'الصف الخامس 5', type: 'class', block: 'الخامس' },
    { id: 'l_g5_3', name: 'الصف الخامس 6', type: 'class', block: 'الخامس' },
    { id: 'l_g5_adm', name: 'الإدارة', type: 'admin', block: 'الخامس' },
    { id: 'l_g5_sup', name: 'مشرف / مخزن', type: 'store', block: 'الخامس' },
    { id: 'l_g5_4', name: 'الصف الخامس 3', type: 'class', block: 'الخامس' },
    { id: 'l_g5_5', name: 'الصف الخامس 2', type: 'class', block: 'الخامس' },
    { id: 'l_g5_6', name: 'الصف الخامس 1', type: 'class', block: 'الخامس' },
    { id: 'l_g5_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الخامس' },
    { id: 'l_g5_wc', name: 'دورة مياه', type: 'wc', block: 'الخامس' },
    { id: 'l_yard_1', name: '⚽ ساحة ومضمار الأنشطة 1', type: 'yard', block: 'الساحات', isEmergencyExit: true },
    { id: 'l_g2_1', name: 'الصف الثاني 5', type: 'class', block: 'الثاني' },
    { id: 'l_g2_2', name: 'الصف الثاني 3', type: 'class', block: 'الثاني' },
    { id: 'l_g2_3', name: 'الصف الثاني 1', type: 'class', block: 'الثاني' },
    { id: 'l_g2_cls', name: 'قاعة دراسية', type: 'class', block: 'الثاني' },
    { id: 'l_g2_spe', name: 'قسم التربية الخاصة', type: 'special', block: 'الثاني' },
    { id: 'l_g2_4', name: 'الصف الثاني 4', type: 'class', block: 'الثاني' },
    { id: 'l_g2_5', name: 'الصف الثاني 2', type: 'class', block: 'الثاني' },
    { id: 'l_g2_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الثاني', fireExt: true },
    { id: 'l_g2_wc', name: 'دورة مياه', type: 'wc', block: 'الثاني' },
    { id: 'l_play_1', name: '👶 ساحة المظلات وألعاب الأطفال 1', type: 'yard', block: 'الساحات', isEmergencyExit: true },
    { id: 'l_g1_1', name: 'الصف الأول 5', type: 'class', block: 'الأول' },
    { id: 'l_g1_2', name: 'الصف الأول 3', type: 'class', block: 'الأول' },
    { id: 'l_g1_3', name: 'الصف الأول 1', type: 'class', block: 'الأول' },
    { id: 'l_g1_cls', name: 'قاعة دراسية', type: 'class', block: 'الأول' },
    { id: 'l_g1_4', name: 'الصف الأول 4', type: 'class', block: 'الأول' },
    { id: 'l_g1_5', name: 'الصف الأول 2', type: 'class', block: 'الأول' },
    { id: 'l_g1_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الأول' },
  ],

  // 2. القطاع الأوسط (الخدمات والمرافق المركزية)
  center_wing: [
    { id: 'c_cafe_l', name: 'كافتيريا (يسار)', type: 'cafe', fireExt: true },
    { id: 'c_serv', name: 'خدمات الكافتيريا ومصلى', type: 'services' },
    { id: 'c_cafe_r', name: 'كافتيريا (يمين)', type: 'cafe', fireExt: true },
    { id: 'c_lec_l', name: 'غرفة المحاضرات 1', type: 'theater' },
    { id: 'c_wc_mid', name: 'دورات مياه مركزية', type: 'wc' },
    { id: 'c_lec_r', name: 'غرفة المحاضرات 2', type: 'theater' },
    { id: 'c_music_1', name: 'غرفة الموسيقى 1', type: 'special' },
    { id: 'c_music_2', name: 'غرفة الموسيقى 2', type: 'special' },
    { id: 'c_pool', name: '🏊 المسبح الرياضي والمدرجات', type: 'pool', isEmergencyExit: true },
    { id: 'c_gym', name: '🏋️ الصالة الرياضية والمدرجات', type: 'gym', isEmergencyExit: true, fireExt: true },
    { id: 'c_sci_2', name: 'مختبر العلوم 2', type: 'lab', fireExt: true },
    { id: 'c_comp_2', name: 'مختبر الحاسوب 2', type: 'lab', fireExt: true },
    { id: 'c_comp_1', name: 'مختبر الحاسوب 1', type: 'lab' },
    { id: 'c_sci_1', name: 'مختبر العلوم 1', type: 'lab', fireExt: true },
    { id: 'c_admin_1', name: 'مكتب الإدارة العامة', type: 'admin' },
    { id: 'c_recept', name: 'الاستقبال الرئيسي', type: 'admin', isEmergencyExit: true },
    { id: 'c_admin_2', name: 'الإدارة وشؤون الطلاب', type: 'admin' },
  ],

  // 3. الجناح الأيمن (صفوف 3 - 6)
  right_wing: [
    { id: 'r_g6_adm', name: 'الإدارة', type: 'admin', block: 'السادس' },
    { id: 'r_g6_1', name: 'الصف السادس 6', type: 'class', block: 'السادس' },
    { id: 'r_g6_2', name: 'الصف السادس 5', type: 'class', block: 'السادس' },
    { id: 'r_g6_3', name: 'الصف السادس 4', type: 'class', block: 'السادس' },
    { id: 'r_g6_sup', name: 'مشرف ومخزن', type: 'store', block: 'السادس' },
    { id: 'r_g6_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'السادس', fireExt: true },
    { id: 'r_g6_4', name: 'الصف السادس 1', type: 'class', block: 'السادس' },
    { id: 'r_g6_5', name: 'الصف السادس 2', type: 'class', block: 'السادس' },
    { id: 'r_g6_6', name: 'الصف السادس 3', type: 'class', block: 'السادس' },
    { id: 'r_g6_wc', name: 'دورة مياه', type: 'wc', block: 'السادس' },
    { id: 'r_yard_2', name: '⚽ ساحة ومضمار الأنشطة 2', type: 'yard', block: 'الساحات', isEmergencyExit: true },
    { id: 'r_g4_cls', name: 'قاعة دراسية', type: 'class', block: 'الرابع' },
    { id: 'r_g4_1', name: 'الصف الرابع 3', type: 'class', block: 'الرابع' },
    { id: 'r_g4_2', name: 'الصف الرابع 4', type: 'class', block: 'الرابع' },
    { id: 'r_g4_3', name: 'الصف الرابع 5', type: 'class', block: 'الرابع' },
    { id: 'r_g4_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الرابع' },
    { id: 'r_g4_4', name: 'الصف الرابع 1', type: 'class', block: 'الرابع' },
    { id: 'r_g4_5', name: 'الصف الرابع 2', type: 'class', block: 'الرابع' },
    { id: 'r_g4_wc', name: 'دورة مياه', type: 'wc', block: 'الرابع' },
    { id: 'r_play_2', name: '👶 ساحة المظلات وألعاب الأطفال 2', type: 'yard', block: 'الساحات', isEmergencyExit: true },
    { id: 'r_g3_adm', name: 'غرفة الإدارة', type: 'admin', block: 'الثالث' },
    { id: 'r_g3_1', name: 'الصف الثالث 3', type: 'class', block: 'الثالث' },
    { id: 'r_g3_2', name: 'الصف الثالث 4', type: 'class', block: 'الثالث' },
    { id: 'r_g3_spe', name: 'قسم التربية الخاصة', type: 'special', block: 'الثالث' },
    { id: 'r_g3_tea', name: 'غرفة المعلمين', type: 'teachers', block: 'الثالث', fireExt: true },
    { id: 'r_g3_3', name: 'الصف الثالث 1', type: 'class', block: 'الثالث' },
    { id: 'r_g3_4', name: 'الصف الثالث 2', type: 'class', block: 'الثالث' },
  ],
};

// قوالب الأعطال الشائعة بلمسة واحدة
const QUICK_ISSUES = [
  { id: 'i1', label: 'المكيف معطل / حار ❄️', type: 'تكييف', priority: 'عاجل' },
  { id: 'i2', label: 'تسريب مياه في الموقع 💧', type: 'سباكة', priority: 'عاجل' },
  { id: 'i3', label: 'إنارة أو كشاف لا يعمل 💡', type: 'كهرباء', priority: 'متوسط' },
  { id: 'i4', label: 'قفل أو مقبض باب مكسور 🔒', type: 'أبواب وأقفال', priority: 'عاجل' },
  { id: 'i5', label: 'مقبس كهربائي خطر ⚡', type: 'كهرباء', priority: 'طوارئ' },
  { id: 'i6', label: 'كسر زجاج أو نافذة 🪟', type: 'سلامة عامة', priority: 'طوارئ' },
];

export default function App() {
  const [roomsData, setRoomsData] = useState(INITIAL_BLUEPRINT_ROOMS);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map');
  const [zoomScale, setZoomScale] = useState(1.0);

  // أوضاع العرض الذكية
  const [safetyMode, setSafetyMode] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);

  // إدارة الغرفة المحددة
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentWingKey, setCurrentWingKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  // تسجيل البلاغات والملاحظات الصوتية
  const [faultModalVisible, setFaultModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(QUICK_ISSUES[0]);
  const [selectedPriority, setSelectedPriority] = useState('عاجل');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceAttached, setVoiceAttached] = useState(false);

  // البلاغات النشطة
  const [faults, setFaults] = useState([
    {
      id: 'f1',
      zone_id: 'l_g5_1',
      location: 'الصف الخامس 4',
      problem: 'تسريب مياه من التكييف',
      type: 'تكييف',
      priority: 'عاجل',
      status: 'new',
      time: '08:15 ص',
      hasVoice: false,
    },
    {
      id: 'f2',
      zone_id: 'c_pool',
      location: 'المسبح الرياضي والمدرجات',
      problem: 'مضخة الفلتر بحاجة صيانة',
      type: 'سباكة',
      priority: 'طوارئ',
      status: 'in_progress',
      time: '09:30 ص',
      hasVoice: true,
    },
  ]);

  // سجل الجولات التفتيشية ونقاط الـ QR
  const [patrolLogs, setPatrolLogs] = useState([
    { id: 'p1', point: 'جناح الصف الخامس (شمال)', time: '07:45 ص', status: 'سليم ✅' },
    { id: 'p2', point: 'مجمع الصالات والمسبح', time: '08:30 ص', status: 'سليم ✅' },
  ]);

  // قائمة الفحص المسائي
  const [checklist, setChecklist] = useState({
    doorsLocked: true,
    acTurnedOff: false,
    lightsOff: false,
    windowsClosed: true,
  });

  const handleRoomClick = (room, wingKey) => {
    setCurrentRoom(room);
    setCurrentWingKey(wingKey);
    setDrawerVisible(true);
  };

  const handleSaveRename = () => {
    if (!editedName.trim()) return;
    const updatedWing = roomsData[currentWingKey].map((rm) =>
      rm.id === currentRoom.id ? { ...rm, name: editedName.trim() } : rm
    );
    setRoomsData({ ...roomsData, [currentWingKey]: updatedWing });
    setCurrentRoom({ ...currentRoom, name: editedName.trim() });
    setRenameModalVisible(false);
    Alert.alert('تم الحفظ بنجاح ✅', `تم اعتماد المسمى الجديد: "${editedName.trim()}"`);
  };

  const handleAddFault = () => {
    const newF = {
      id: 'f_' + Date.now(),
      zone_id: currentRoom ? currentRoom.id : 'gen',
      location: currentRoom ? currentRoom.name : 'المجمع العام',
      problem: selectedIssue.label,
      type: selectedIssue.type,
      priority: selectedPriority,
      status: 'new',
      time: 'الآن',
      hasVoice: voiceAttached,
    };
    setFaults([newF, ...faults]);
    setFaultModalVisible(false);
    setDrawerVisible(false);
    setVoiceAttached(false);
    Alert.alert('تم تسجيل البلاغ 🚨', `الموقع: ${newF.location}\nالمشكلة: ${newF.problem}`);
  };

  const cycleStatus = (id) => {
    setFaults(
      faults.map((f) => {
        if (f.id === id) {
          if (f.status === 'new') return { ...f, status: 'in_progress' };
          if (f.status === 'in_progress') return { ...f, status: 'resolved' };
          return { ...f, status: 'new' };
        }
        return f;
      })
    );
  };

  // إرسال تقرير العطل المباشر عبر واتساب
  const sendWhatsAppAlert = (room, faultText) => {
    const msg = `*بلاغ صيانة مجمع زايد التعليمي*\n📍 الموقع: ${room?.name || 'غير محدد'}\n⚠️ الحالة: ${faultText || 'طلب فحص عاجل'}\n🕒 التوقيت: ${new Date().toLocaleTimeString('ar-AE')}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('تنبيه', 'تطبيق واتساب غير مثبت على هذا الهاتف.');
    });
  };

  // محاكاة مسح باركود نقطة التفتيش
  const handleScanQR = () => {
    Alert.alert('مسح نقطة تفتيش 📷', 'اختر نقطة التفتيش الممسوحة:', [
      {
        text: 'جناح الصفوف 1-5',
        onPress: () => {
          const newLog = {
            id: 'p_' + Date.now(),
            point: 'جناح الصفوف 1-5',
            time: new Date().toLocaleTimeString('ar-AE'),
            status: 'تم التحقق ✅',
          };
          setPatrolLogs([newLog, ...patrolLogs]);
          Alert.alert('تم التوثيق ✅', 'تم تسجيل نقطة التفتيش بنجاح مع التوقيت.');
        },
      },
      {
        text: 'مجمع الخدمات والمسبح',
        onPress: () => {
          const newLog = {
            id: 'p_' + Date.now(),
            point: 'مجمع الخدمات والمسبح',
            time: new Date().toLocaleTimeString('ar-AE'),
            status: 'تم التحقق ✅',
          };
          setPatrolLogs([newLog, ...patrolLogs]);
          Alert.alert('تم التوثيق ✅', 'تم تسجيل نقطة التفتيش بنجاح.');
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const getFaultCount = (roomId) => faults.filter((f) => f.zone_id === roomId && f.status !== 'resolved').length;

  const renderRoomBox = (room, wingKey, isWide = false, customHeight = 65) => {
    const fCount = getFaultCount(room.id);
    const hasFault = fCount > 0;

    let bg = '#FEF9C3';
    let border = '#EAB308';

    if (heatmapMode) {
      if (fCount === 0) { bg = '#DCFCE7'; border = '#22C55E'; }
      else if (fCount === 1) { bg = '#FEF08A'; border = '#EAB308'; }
      else { bg = '#FEE2E2'; border = '#EF4444'; }
    } else {
      if (room.type === 'admin') { bg = '#F1F5F9'; border = '#94A3B8'; }
      else if (room.type === 'teachers') { bg = '#E0F2FE'; border = '#38BDF8'; }
      else if (room.type === 'special') { bg = '#FCE7F3'; border = '#EC4899'; }
      else if (room.type === 'lab') { bg = '#DCFCE7'; border = '#22C55E'; }
      else if (room.type === 'yard') { bg = '#F8FAFC'; border = '#CBD5E1'; customHeight = 120; }
      if (hasFault) { bg = '#FEE2E2'; border = '#EF4444'; }
    }

    return (
      <TouchableOpacity
        key={room.id}
        activeOpacity={0.75}
        style={[
          styles.roomItem,
          {
            backgroundColor: bg,
            borderColor: border,
            height: customHeight,
          },
          isWide && { width: '100%' },
        ]}
        onPress={() => handleRoomClick(room, wingKey)}
      >
        <Text style={[styles.roomItemText, hasFault && !heatmapMode && { color: '#EF4444' }]} numberOfLines={2}>
          {room.name}
        </Text>

        {/* مؤشر البلاغات */}
        {hasFault && !heatmapMode && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{fCount}</Text>
          </View>
        )}

        {/* شارات طبقة السلامة ومخارج الطوارئ */}
        {safetyMode && (
          <View style={styles.safetyOverlayRow}>
            {room.fireExt && <Text style={styles.safetyIcon}>🧯</Text>}
            {room.isEmergencyExit && <Text style={styles.safetyIcon}>🟢🚪</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* الشريط العلوي */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>نظام مجمع زايد الذكي للمرافق والأمن</Text>
        <TouchableOpacity
          style={styles.btnFloor}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorTxt}>{selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}</Text>
        </TouchableOpacity>
      </View>

      {/* شريط الأدوات الذكية المتقدمة */}
      <View style={styles.smartToolsBar}>
        <TouchableOpacity
          style={[styles.smartToggleBtn, safetyMode && styles.smartToggleBtnActive]}
          onPress={() => setSafetyMode(!safetyMode)}
        >
          <Ionicons name="shield-outline" size={14} color={safetyMode ? '#FFF' : '#38BDF8'} />
          <Text style={[styles.smartToggleTxt, safetyMode && { color: '#FFF' }]}>
            {safetyMode ? 'مخطط السلامة: نشط 🧯' : 'مخطط السلامة والطوارئ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smartToggleBtn, heatmapMode && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
          onPress={() => setHeatmapMode(!heatmapMode)}
        >
          <Ionicons name="flame-outline" size={14} color={heatmapMode ? '#FFF' : '#F59E0B'} />
          <Text style={[styles.smartToggleTxt, heatmapMode && { color: '#FFF' }]}>
            {heatmapMode ? 'الخريطة الحرارية: تعمل' : 'الخريطة الحرارية للأعطال'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* المحتوى الرئيسي */}
      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.controlsBar}>
            <Text style={styles.controlsTxt}>↔️ اسحب للتنقل الكامل عبر المخطط</Text>
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

          {/* مساحة المخطط المعماري الكامل المعكوس هندسياً */}
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

                  {/* القطاع الأوسط: الخدمات والمرافق المركزية */}
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
      ) : activeTab === 'faults' ? (
        /* تبويب الأعطال الشامل */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          <View style={styles.tabSectionHeaderRow}>
            <Text style={styles.tabSectionTitle}>سجل بلاغات الصيانة الميدانية ({faults.length})</Text>
            <TouchableOpacity
              style={styles.btnPdfExport}
              onPress={() => Alert.alert('تصدير PDF 📄', 'تم استخراج كشف تقرير الصيانة الدوري لكافة أجنحة المجمع.')}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFF" />
              <Text style={styles.btnPdfExportTxt}>كشف PDF</Text>
            </TouchableOpacity>
          </View>

          {faults.map((f) => {
            const isDone = f.status === 'resolved';
            const isWorking = f.status === 'in_progress';

            return (
              <View key={f.id} style={[styles.faultCardItem, isDone && { opacity: 0.7, borderColor: '#10B981' }]}>
                <View style={styles.faultCardHeader}>
                  <Text style={styles.faultCardLoc}>📍 {f.location}</Text>
                  <Text
                    style={[
                      styles.priorityBadge,
                      f.priority === 'طوارئ' && { backgroundColor: '#EF4444' },
                      f.priority === 'عاجل' && { backgroundColor: '#F97316' },
                      f.priority === 'متوسط' && { backgroundColor: '#F59E0B' },
                    ]}
                  >
                    {f.priority}
                  </Text>
                </View>

                <Text style={styles.faultCardDesc}>⚠️ {f.problem}</Text>
                <View style={styles.faultCardMetaRow}>
                  <Text style={styles.faultCardMetaTxt}>التوقيت: {f.time} | النوع: {f.type}</Text>
                  {f.hasVoice && <Text style={styles.voiceAttachedTag}>🎤 مرفق تسجيل صوتي</Text>}
                </View>

                <View style={styles.faultActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnStatusCycle,
                      isDone ? { backgroundColor: '#10B981' } : isWorking ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#EF4444' },
                    ]}
                    onPress={() => cycleStatus(f.id)}
                  >
                    <Text style={styles.btnStatusCycleTxt}>
                      {isDone ? '✅ تم الحل بنجاح' : isWorking ? '🛠️ قيد المعالجة الآن' : '⏳ بلاغ جديد (انقر للبدء)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnWhatsappQuick}
                    onPress={() => sendWhatsAppAlert({ name: f.location }, f.problem)}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : activeTab === 'patrol' ? (
        /* تبويب التفتيش الأمني ونقاط الـ QR */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          <Text style={styles.tabSectionTitle}>🛡️ سجل الجولات الأمنية والتفتيش الميداني</Text>
          <TouchableOpacity style={styles.btnScanBig} onPress={handleScanQR}>
            <Ionicons name="qr-code-outline" size={32} color="#FFF" />
            <Text style={styles.btnScanBigTxt}>مسح باركود نقطة التفتيش (QR)</Text>
          </TouchableOpacity>

          <Text style={[styles.blockTitle, { marginTop: 20, textAlign: 'right' }]}>سجل التحقق اليومي:</Text>
          {patrolLogs.map((p) => (
            <View key={p.id} style={styles.logCard}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.logCardPoint}>📍 {p.point}</Text>
                <Text style={styles.logCardStatus}>{p.status}</Text>
              </View>
              <Text style={styles.logCardTime}>🕒 وقت المسح: {p.time}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* تبويب قائمة الفحص المسائي (Checklist) */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          <Text style={styles.tabSectionTitle}>📋 قائمة الفحص المسائي وإغلاق المجمع</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'right', marginBottom: 14 }}>
            يتم فحص هذه النقاط يومياً عند نهاية الدوام لضمان سلامة وأمن المبنى:
          </Text>

          {[
            { key: 'doorsLocked', label: 'إحكام إغلاق أبواب الأجنحة والقاعات 🔒' },
            { key: 'acTurnedOff', label: 'إطفاء جميع وحدات التكييف والتهوية ❄️' },
            { key: 'lightsOff', label: 'إطفاء الإنارة الداخلية والممرات 💡' },
            { key: 'windowsClosed', label: 'التأكد من إغلاق النوافذ والستائر 🪟' },
          ].map((item) => {
            const isChecked = checklist[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.checklistItem, isChecked && styles.checklistItemActive]}
                onPress={() => setChecklist({ ...checklist, [item.key]: !isChecked })}
              >
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isChecked ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checklistItemTxt, isChecked && { color: '#FFF' }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.btnSaveChecklist}
            onPress={() => Alert.alert('تم الحفظ بنجاح ✅', 'تم توثيق تقرير إغلاق المجمع لليوم.')}
          >
            <Text style={styles.btnSaveChecklistTxt}>اعتماد تقرير الإغلاق المسائي</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* شريط التبويبات السفلي */}
      <View style={styles.navBottom}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'map' && styles.navBtnTxtActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'faults' && styles.navBtnTxtActive]}>الأعطال</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('patrol')}>
          <Ionicons name="shield-checkmark-outline" size={22} color={activeTab === 'patrol' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'patrol' && styles.navBtnTxtActive]}>التفتيش</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('checklist')}>
          <Ionicons name="checkbox-outline" size={22} color={activeTab === 'checklist' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'checklist' && styles.navBtnTxtActive]}>الفحص</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل الغرفة الذكية */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{currentRoom?.name}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  setDrawerVisible(false);
                  setFaultModalVisible(true);
                }}
              >
                <Ionicons name="warning-outline" size={18} color="#FFF" />
                <Text style={styles.btnActionTxt}>تسجيل عطل 🚨</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#25D366' }]}
                onPress={() => sendWhatsAppAlert(currentRoom, 'طلب فحص ميداني ومعاينة')}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                <Text style={styles.btnActionTxt}>واتساب فوراً</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionButtonsRow, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#0284C7' }]}
                onPress={() => {
                  setEditedName(currentRoom?.name || '');
                  setDrawerVisible(false);
                  setRenameModalVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.btnActionTxt}>تعديل اسم القاعة ✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#334155' }]}
                onPress={() => Alert.alert('كاميرا المرفق 📷', `فتح الكاميرا لتوثيق حالة (${currentRoom?.name})`)}
              >
                <Ionicons name="camera-outline" size={18} color="#FFF" />
                <Text style={styles.btnActionTxt}>التقاط صورة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة تسجيل البلاغ السريعة (بدون كتابة مع ميزة التسجيل الصوتي) */}
      <Modal visible={faultModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.faultFastCard}>
            <Text style={styles.sheetTitle}>تسجيل بلاغ في: {currentRoom?.name}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 10 }}>
              اختر المشكلة بلمسة واحدة أو سجّل صوتك مباشرة 👇
            </Text>

            <ScrollView style={{ maxHeight: 200 }}>
              {QUICK_ISSUES.map((q) => {
                const isSelected = selectedIssue.id === q.id;
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.quickIssueBtn, isSelected && styles.quickIssueBtnActive]}
                    onPress={() => {
                      setSelectedIssue(q);
                      setSelectedPriority(q.priority);
                    }}
                  >
                    <Text style={[styles.quickIssueBtnTxt, isSelected && { color: '#FFF' }]}>{q.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* زر الملاحظة الصوتية المباشرة */}
            <View style={styles.voiceSection}>
              <TouchableOpacity
                style={[styles.btnVoiceRecord, isVoiceRecording && { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  if (isVoiceRecording) {
                    setIsVoiceRecording(false);
                    setVoiceAttached(true);
                    Alert.alert('تم التسجيل 🎤', 'تم حفظ التسجيل الصوتي وإرفاقه بالبلاغ.');
                  } else {
                    setIsVoiceRecording(true);
                  }
                }}
              >
                <Ionicons name={isVoiceRecording ? 'stop-circle' : 'mic'} size={20} color="#FFF" />
                <Text style={styles.btnVoiceRecordTxt}>
                  {isVoiceRecording ? 'إيقاف وحفظ التسجيل (جاري التسجيل...)' : voiceAttached ? '✅ تم إرفاق تسجيل صوتي' : 'اضغط لتسجيل المشكلة بصوتك 🎤'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#10B981', flex: 1.5 }]} onPress={handleAddFault}>
                <Text style={styles.btnActionTxt}>تأكيد وإرسال البلاغ 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#475569' }]} onPress={() => setFaultModalVisible(false)}>
                <Text style={styles.btnActionTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة تعديل التسمية الميدانية */}
      <Modal visible={renameModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.renameBox}>
            <Text style={styles.sheetTitle}>تعديل مسمى الفراغ المعماري ✏️</Text>
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
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#10B981', flex: 1.5 }]} onPress={handleSaveRename}>
                <Text style={styles.btnActionTxt}>اعتماد الاسم الجديد</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#475569' }]} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.btnActionTxt}>إلغاء</Text>
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
  btnFloor: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  btnFloorTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  smartToolsBar: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0B132B' },
  smartToggleBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#38BDF8', backgroundColor: '#1E293B' },
  smartToggleBtnActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  smartToggleTxt: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },

  controlsBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginTop: 4, borderRadius: 8 },
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
  safetyOverlayRow: { position: 'absolute', bottom: 2, left: 2, flexDirection: 'row', gap: 2 },
  safetyIcon: { fontSize: 10 },

  tabSectionHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tabSectionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  btnPdfExport: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnPdfExportTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  faultCardItem: { backgroundColor: '#1E293B', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  faultCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  faultCardLoc: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  priorityBadge: { color: '#FFF', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  faultCardDesc: { color: '#CBD5E1', fontSize: 12, textAlign: 'right', marginVertical: 4 },
  faultCardMetaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  faultCardMetaTxt: { color: '#94A3B8', fontSize: 10 },
  voiceAttachedTag: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },

  faultActionsRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  btnStatusCycle: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnStatusCycleTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  btnWhatsappQuick: { backgroundColor: '#25D366', padding: 8, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  btnScanBig: { backgroundColor: '#0284C7', borderRadius: 14, padding: 22, alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 6 },
  btnScanBigTxt: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  logCard: { backgroundColor: '#1E293B', padding: 12, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#334155' },
  logCardPoint: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  logCardStatus: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
  logCardTime: { color: '#94A3B8', fontSize: 10, textAlign: 'right', marginTop: 4 },

  checklistItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#1E293B', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  checklistItemActive: { borderColor: '#10B981', backgroundColor: '#132A38' },
  checklistItemTxt: { color: '#CBD5E1', fontSize: 12, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  btnSaveChecklist: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  btnSaveChecklistTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  navBottom: { flexDirection: 'row', height: 54, backgroundColor: '#1E293B', borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  navBtn: { alignItems: 'center', justifyContent: 'center' },
  navBtnTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navBtnTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, borderTopWidth: 2, borderColor: '#38BDF8' },
  faultFastCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: 2, borderColor: '#EF4444' },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  actionButtonsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  btnAction: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 6 },
  btnActionTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },

  quickIssueBtn: { backgroundColor: '#0F172A', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#334155', alignItems: 'flex-end' },
  quickIssueBtnActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  quickIssueBtnTxt: { color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' },

  voiceSection: { marginVertical: 10 },
  btnVoiceRecord: { backgroundColor: '#334155', paddingVertical: 10, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnVoiceRecordTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  renameBox: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#38BDF8', alignSelf: 'center', width: '90%' },
  renameInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155' },
});
