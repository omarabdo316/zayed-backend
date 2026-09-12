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
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. التوزيع المعماري المعكوس الواقعي (اليسار: 1-5 | الوسط: الخدمات والمسابح | اليمين: 3-6)
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

export default function App() {
  const [roomsData, setRoomsData] = useState(INITIAL_ROOMS_DATA);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map'); // map, faults, patrol
  const [zoomScale, setZoomScale] = useState(1.0);

  // إدارة الغرفة المحددة
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentWingKey, setCurrentWingKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // نافذة تعديل التسمية
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  // نافذة التبليغ والتفسير اليدوي المفصل
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('سباكة');
  const [selectedPriority, setSelectedPriority] = useState('عاجل');
  const [attachedPhoto, setAttachedPhoto] = useState(null);

  // نافذة استعراض الصورة المكبرة
  const [previewPhotoModal, setPreviewPhotoModal] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(null);

  // سجل الأعطال المفصلة
  const [faults, setFaults] = useState([
    {
      id: 'F-101',
      zone_id: 'l_g5_1',
      location: 'الصف الخامس 4',
      description: 'تسريب مياه مستمر من وحدة التكييف الداخلية يسقط مباشرة على أرضية الفصل وبجوار القواطع الكهربائية.',
      category: 'تكييف وسباكة',
      priority: 'طوارئ',
      status: 'new', // new -> working -> closed
      time: '08:20 ص',
      hasPhoto: true,
      photoUri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    },
    {
      id: 'F-102',
      zone_id: 'c_pool',
      location: 'المسبح الرياضي والمدرجات',
      description: 'صوت اهتزاز عالي جداً يصدر من مضخة الفلترة رقم 2 في غرفة المعدات مع بطء في دوران المياه.',
      category: 'معدات ومسابح',
      priority: 'عاجل',
      status: 'working',
      time: '09:15 ص',
      hasPhoto: true,
      photoUri: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400',
    },
  ]);

  const handleRoomClick = (room, wingKey) => {
    setCurrentRoom(room);
    setCurrentWingKey(wingKey);
    setDrawerVisible(true);
  };

  // التقاط أو اختيار صورة لحالة العطل
  const handleAttachPhoto = () => {
    Alert.alert(
      'توثيق حالة العطل بالصورة 📸',
      'اختر طريقة توثيق حالة العطل في هذا الموقع:',
      [
        {
          text: 'التقاط صورة بالكاميرا 📷',
          onPress: () => {
            // صورة نموذجية واقعية للتوثيق الميداني الفوري
            setAttachedPhoto('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400');
            Alert.alert('تم التوثيق بنجاح ✅', 'تم التقاط صورة حالة العطل وربطها بالبلاغ.');
          },
        },
        {
          text: 'اختيار صورة من الاستوديو 🖼️',
          onPress: () => {
            setAttachedPhoto('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400');
            Alert.alert('تم الإرفاق بنجاح ✅', 'تم اختيار صورة العطل من الهاتف.');
          },
        },
        { text: 'إلغاء', style: 'cancel' },
      ]
    );
  };

  // حفظ بلاغ العطل مع التفسير اليدوي والصورة
  const handleSaveFaultReport = () => {
    if (!manualDescription.trim()) {
      Alert.alert('يرجى الانتباه ⚠️', 'يرجى كتابة تفسير وتوصيف للمشكلة لتسهيل عمل الفني.');
      return;
    }

    const newFault = {
      id: `F-${Date.now().toString().slice(-3)}`,
      zone_id: currentRoom ? currentRoom.id : 'gen',
      location: currentRoom ? currentRoom.name : 'المجمع العام',
      description: manualDescription.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      status: 'new',
      time: 'الآن',
      hasPhoto: attachedPhoto !== null,
      photoUri: attachedPhoto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
    };

    setFaults([newFault, ...faults]);
    setManualDescription('');
    setAttachedPhoto(null);
    setReportModalVisible(false);
    setDrawerVisible(false);

    Alert.alert(
      'تم تسجيل البلاغ والتفسير بنجاح 🚨',
      `الموقع: ${newFault.location}\nالتوصيف: ${newFault.description.slice(0, 50)}...`
    );
  };

  // دورة الصيانة (جديد -> جاري العمل -> تم الحل)
  const advanceFaultStatus = (id) => {
    setFaults(
      faults.map((f) => {
        if (f.id === id) {
          if (f.status === 'new') return { ...f, status: 'working' };
          if (f.status === 'working') return { ...f, status: 'closed' };
          return { ...f, status: 'new' };
        }
        return f;
      })
    );
  };

  // إرسال التفسير اليدوي المكتوب مباشرة عبر واتساب
  const sendWhatsAppWithDetails = (f) => {
    const text = `*🚨 بلاغ صيانة مع التفسير - مجمع زايد التعليمي*\n• الموقع: ${f.location}\n• التصنيف: ${f.category} (${f.priority})\n• تفسير المشكلة:\n"${f.description}"\n• الحالة: ${f.status === 'new' ? 'جديد ⏳' : f.status === 'working' ? 'جاري الإصلاح 🛠️' : 'تم الحل ✅'}\n• توثيق مصور: ${f.hasPhoto ? 'مرفق صورة للعطل 📸' : 'بدون صورة'}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('تنبيه', 'تطبيق واتساب غير مثبت على هذا الهاتف.');
    });
  };

  // حفظ اسم القاعة الجديد
  const handleSaveRename = () => {
    if (!editedName.trim()) return;
    const updated = roomsData[currentWingKey].map((r) =>
      r.id === currentRoom.id ? { ...r, name: editedName.trim() } : r
    );
    setRoomsData({ ...roomsData, [currentWingKey]: updated });
    setCurrentRoom({ ...currentRoom, name: editedName.trim() });
    setRenameModalVisible(false);
    Alert.alert('تم التعديل ✅', `الاسم المعتمد: "${editedName.trim()}"`);
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
          <Text style={styles.topBarTitle}>نظام التوثيق الميداني ورصد الأعطال</Text>
          <Text style={styles.topBarSub}>مجمع زايد التعليمي - توصيف يدوي وتوثيق بالصور</Text>
        </View>
        <TouchableOpacity
          style={styles.btnFloor}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorTxt}>{selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. المحتوى بحسب التبويب */}
      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          {/* شريط التحكم بالتكبير والتنقل */}
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

          {/* مساحة المخطط الثلاثي (اليسار: 1-5 | الوسط: الخدمات والمسابح | اليمين: 3-6) */}
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
        /* 3. تبويب سجل الأعطال المفصلة مع الصور والتفسير اليدوي */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTxt}>سجل التوصيف الميداني للأعطال ({faults.length})</Text>
            <TouchableOpacity
              style={styles.btnExportPdf}
              onPress={() => Alert.alert('تقرير PDF 📄', 'تم استخراج التقرير الفني المرفق بتفسير الأعطال وصورها')}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFF" />
              <Text style={styles.btnExportPdfTxt}>كشف PDF</Text>
            </TouchableOpacity>
          </View>

          {faults.map((f) => {
            const isNew = f.status === 'new';
            const isWorking = f.status === 'working';
            const isClosed = f.status === 'closed';

            return (
              <View key={f.id} style={[styles.detailedFaultCard, isClosed && { opacity: 0.6, borderColor: '#10B981' }]}>
                {/* رأس الكارت */}
                <View style={styles.detailedCardHeader}>
                  <Text style={styles.detailedLocation}>📍 {f.location}</Text>
                  <View style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'center' }}>
                    <Text style={styles.categoryBadge}>{f.category}</Text>
                    <Text
                      style={[
                        styles.priorityBadge,
                        f.priority === 'طوارئ' ? { backgroundColor: '#EF4444' } : { backgroundColor: '#F59E0B' },
                      ]}
                    >
                      {f.priority}
                    </Text>
                  </View>
                </View>

                {/* نص التفسير والتوصيف المكتوب باليد */}
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>📝 تفسير وتوصيف المشكلة الميداني:</Text>
                  <Text style={styles.descriptionText}>{f.description}</Text>
                </View>

                {/* قسم الصورة المرفقة لحالة العطل */}
                {f.hasPhoto && f.photoUri && (
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>📸 توثيق حالة العطل في الموقع:</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setActivePreviewImage(f.photoUri);
                        setPreviewPhotoModal(true);
                      }}
                    >
                      <Image source={{ uri: f.photoUri }} style={styles.faultThumbnail} />
                      <Text style={styles.photoClickHint}>🔍 انقر لتكبير الصورة وفحصها</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.timeMeta}>🕒 توقيت البلاغ: {f.time} | كود: {f.id}</Text>

                {/* أزرار الإجراءات والواتساب */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnCycleStatus,
                      isNew && { backgroundColor: '#EF4444' },
                      isWorking && { backgroundColor: '#F59E0B' },
                      isClosed && { backgroundColor: '#10B981' },
                    ]}
                    onPress={() => advanceFaultStatus(f.id)}
                  >
                    <Text style={styles.btnCycleStatusTxt}>
                      {isNew && '⏳ انقر لبدء الإصلاح (جديد)'}
                      {isWorking && '🛠️ جاري العمل.. انقر للإنهاء'}
                      {isClosed && '✅ تم الإصلاح وإغلاق العطل'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnWhatsApp} onPress={() => sendWhatsAppWithDetails(f)}>
                    <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* 4. تبويب الجولات الميدانية والـ QR */
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={styles.sectionHeaderTxt}>🛡️ التفتيش الأمني وتوثيق الجولات بالباركود</Text>
          <TouchableOpacity
            style={styles.bigScanCard}
            onPress={() => Alert.alert('مسح QR 📷', 'فتح الكاميرا لمسح باركود القاعة وتوثيق المرور في النظام.')}
          >
            <Ionicons name="qr-code-outline" size={44} color="#FFF" />
            <Text style={styles.bigScanTitle}>مسح باركود القاعة وتوثيق الجولة</Text>
            <Text style={styles.bigScanSub}>يسجل التاريخ والوقت تلقائياً لتقارير الأمن والسلامة</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 3. شريط التبويبات السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'map' && styles.navTabTxtActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'faults' && styles.navTabTxtActive]}>الأعطال والصور</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTabBtn} onPress={() => setActiveTab('patrol')}>
          <Ionicons name="shield-checkmark-outline" size={22} color={activeTab === 'patrol' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTabTxt, activeTab === 'patrol' && styles.navTabTxtActive]}>التفتيش</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة خيارات الغرفة عند النقر عليها من المخطط */}
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
              <Ionicons name="create-outline" size={22} color="#FFF" />
              <Text style={styles.btnActionLargeTxt}>📝 كتابة تفسير وتوثيق عطل بالصورة</Text>
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
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.btnActionLargeTxt}>تعديل الاسم ✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnActionLarge, { backgroundColor: '#25D366', flex: 1 }]}
                onPress={() => {
                  sendWhatsAppWithDetails({
                    location: currentRoom?.name,
                    category: 'معاينة فورية',
                    priority: 'عاجل',
                    description: 'طلب حضور لمعاينة الموقع',
                    status: 'new',
                    hasPhoto: false,
                  });
                }}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                <Text style={styles.btnActionLargeTxt}>واتساب</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة التوصيف والتفسير اليدوي وإرفاق صورة العطل */}
      <Modal visible={reportModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModalCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>تفسير وتوثيق العطل: {currentRoom?.name}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* تصنيف العطل بنقرة سريعة */}
            <Text style={styles.inputLabel}>تصنيف العطل:</Text>
            <View style={styles.categoryRow}>
              {['سباكة', 'تكييف', 'كهرباء', 'أثاث', 'أبواب', 'سلامة'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipTxt, selectedCategory === cat && { color: '#FFF' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* حقل الكتابة والتفسير اليدوي المفصل */}
            <Text style={styles.inputLabel}>اكتب تفسير وتوصيف المشكلة بيدك بالتفصيل ✍️:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="اكتب هنا ما هي المشكلة بالضبط، أسبابها الظاهرة، أو أي ملاحظات للمصلح..."
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={4}
              value={manualDescription}
              onChangeText={setManualDescription}
            />

            {/* قسم التقاط وإرفاق صورة حالة العطل */}
            <Text style={styles.inputLabel}>توثيق حالة العطل بصورة حية 📸:</Text>
            <TouchableOpacity style={styles.btnAttachPhoto} onPress={handleAttachPhoto}>
              <Ionicons name={attachedPhoto ? 'checkmark-circle' : 'camera'} size={22} color="#FFF" />
              <Text style={styles.btnAttachPhotoTxt}>
                {attachedPhoto ? '✅ تم إرفاق صورة العطل (انقر للتغيير)' : 'التقاط أو إرفاق صورة لحالة العطل 📷'}
              </Text>
            </TouchableOpacity>

            {/* معاينة الصورة المختارة */}
            {attachedPhoto && (
              <View style={styles.previewBox}>
                <Image source={{ uri: attachedPhoto }} style={styles.previewImage} />
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>جاهزة للإرسال مع البلاغ</Text>
              </View>
            )}

            {/* مستوى الأولوية */}
            <View style={styles.priorityRow}>
              {[
                { val: 'طوارئ', color: '#EF4444' },
                { val: 'عاجل', color: '#F59E0B' },
                { val: 'عادي', color: '#10B981' },
              ].map((pr) => (
                <TouchableOpacity
                  key={pr.val}
                  style={[
                    styles.priorityBtn,
                    selectedPriority === pr.val && { backgroundColor: pr.color, borderColor: pr.color },
                  ]}
                  onPress={() => setSelectedPriority(pr.val)}
                >
                  <Text style={[styles.priorityBtnTxt, selectedPriority === pr.val && { color: '#FFF' }]}>
                    {pr.val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* أزرار الحفظ والإلغاء */}
            <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#10B981', flex: 1.5 }]} onPress={handleSaveFaultReport}>
                <Text style={styles.btnActionLargeTxt}>اعتماد وحفظ البلاغ والصورة 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnActionLarge, { backgroundColor: '#475569', flex: 1 }]} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.btnActionLargeTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة معاينة الصورة بالحجم الكبير */}
      <Modal visible={previewPhotoModal} transparent={true} animationType="fade">
        <View style={styles.photoPreviewBackdrop}>
          <TouchableOpacity style={styles.btnClosePreview} onPress={() => setPreviewPhotoModal(false)}>
            <Ionicons name="close-circle" size={36} color="#FFF" />
          </TouchableOpacity>
          {activePreviewImage && (
            <Image source={{ uri: activePreviewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* نافذة تعديل التسمية */}
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
              placeholder="اكتب الاسم الجديد هنا..."
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

  sectionHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  btnExportPdf: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnExportPdfTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  detailedFaultCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#334155' },
  detailedCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailedLocation: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  categoryBadge: { color: '#38BDF8', backgroundColor: '#0B132B', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: 'bold' },
  priorityBadge: { color: '#FFF', fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: 'bold' },

  descriptionBox: { backgroundColor: '#0B132B', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  descriptionLabel: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 },
  descriptionText: { color: '#F8FAFC', fontSize: 13, lineHeight: 20, textAlign: 'right' },

  photoContainer: { backgroundColor: '#0B132B', padding: 8, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  photoLabel: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  faultThumbnail: { width: '100%', height: 140, borderRadius: 6 },
  photoClickHint: { color: '#94A3B8', fontSize: 10, marginTop: 4 },

  timeMeta: { color: '#94A3B8', fontSize: 10, textAlign: 'right', marginBottom: 10 },

  actionsRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center' },
  btnCycleStatus: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnCycleStatusTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  btnWhatsApp: { backgroundColor: '#25D366', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  bigScanCard: { backgroundColor: '#0284C7', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  bigScanTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bigScanSub: { color: '#E0F2FE', fontSize: 11 },

  bottomNav: { flexDirection: 'row', height: 56, backgroundColor: '#1E293B', borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  navTabBtn: { alignItems: 'center', justifyContent: 'center' },
  navTabTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navTabTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 2, borderColor: '#38BDF8' },
  reportModalCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 2, borderColor: '#EF4444', maxHeight: '90%' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drawerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  btnActionLarge: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 },
  btnActionLargeTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  inputLabel: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginTop: 8, marginBottom: 6 },
  categoryRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0B132B', borderWidth: 1, borderColor: '#334155' },
  categoryChipActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  categoryChipTxt: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  textArea: { backgroundColor: '#0B132B', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155', minHeight: 90, textAlignVertical: 'top', fontSize: 13 },

  btnAttachPhoto: { backgroundColor: '#0284C7', paddingVertical: 12, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 6 },
  btnAttachPhotoTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  previewBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#0B132B', padding: 8, borderRadius: 8, marginBottom: 8 },
  previewImage: { width: 50, height: 50, borderRadius: 6 },

  priorityRow: { flexDirection: 'row-reverse', gap: 8, marginVertical: 6 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0B132B', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  priorityBtnTxt: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  photoPreviewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  btnClosePreview: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  fullPreviewImage: { width: '92%', height: '75%', borderRadius: 10 },

  renameBox: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#38BDF8', alignSelf: 'center', width: '90%' },
  renameInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155' },
});
