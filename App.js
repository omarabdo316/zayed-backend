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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ترتيب القاعات الهندسي المتطابق تماماً مع المخطط المعماري الحقيقي
const CAMPUS_SECTIONS = [
  {
    title: '🏢 جناح الصفوف 1 - 5 (الجناح الأيسر)',
    color: '#0284C7',
    rooms: [
      { id: 'g5_1', name: 'الصف الخامس 1' }, { id: 'g5_2', name: 'الصف الخامس 2' },
      { id: 'g5_3', name: 'الصف الخامس 3' }, { id: 'g5_4', name: 'الصف الخامس 4' },
      { id: 'g5_5', name: 'الصف الخامس 5' }, { id: 'g5_6', name: 'الصف الخامس 6' },
      { id: 'g5_admin', name: 'إدارة جناح الخامس' }, { id: 'g5_teachers', name: 'غرفة معلمين الخامس' },
      { id: 'g2_1', name: 'الصف الثاني 1' }, { id: 'g2_2', name: 'الصف الثاني 2' },
      { id: 'g2_3', name: 'الصف الثاني 3' }, { id: 'g2_4', name: 'الصف الثاني 4' },
      { id: 'g2_5', name: 'الصف الثاني 5' }, { id: 'g2_special', name: 'قسم التربية الخاصة' },
      { id: 'g1_1', name: 'الصف الأول 1' }, { id: 'g1_2', name: 'الصف الأول 2' },
      { id: 'g1_3', name: 'الصف الأول 3' }, { id: 'g1_4', name: 'الصف الأول 4' },
      { id: 'g1_5', name: 'الصف الأول 5' }, { id: 'g1_6', name: 'الصف الأول 6' },
      { id: 'yard_1', name: 'ساحة ومضمار الأنشطة 1' }, { id: 'play_yard_1', name: 'ساحة المظلات وألعاب الأطفال 1' }
    ]
  },
  {
    title: '🏊 الخدمات والمرافق المركزية (الوسط)',
    color: '#10B981',
    rooms: [
      { id: 'pool', name: 'المسبح الرياضي والمدرجات' },
      { id: 'gym', name: 'الصالة الرياضية والمدرجات' },
      { id: 'cafe_a', name: 'كافتيريا 1' }, { id: 'cafe_b', name: 'كافتيريا 2' },
      { id: 'theater', name: 'قاعة المحاضرات والمسرح' },
      { id: 'music_room', name: 'غرفة الموسيقى' }, { id: 'art_room', name: 'غرفة الفنية' },
      { id: 'lab_sci_1', name: 'مختبر العلوم 1' }, { id: 'lab_sci_2', name: 'مختبر العلوم 2' },
      { id: 'lab_comp_1', name: 'مختبر الحاسوب 1' }, { id: 'lab_comp_2', name: 'مختبر الحاسوب 2' },
      { id: 'admin_main', name: 'الإدارة العامة' }, { id: 'reception', name: 'الاستقبال الرئيسي' }
    ]
  },
  {
    title: '🏫 جناح الصفوف 3 - 6 (الجناح الأيمن)',
    color: '#F59E0B',
    rooms: [
      { id: 'g6_1', name: 'الصف السادس 1' }, { id: 'g6_2', name: 'الصف السادس 2' },
      { id: 'g6_3', name: 'الصف السادس 3' }, { id: 'g6_4', name: 'الصف السادس 4' },
      { id: 'g6_5', name: 'الصف السادس 5' }, { id: 'g6_6', name: 'الصف السادس 6' },
      { id: 'g6_admin', name: 'إدارة جناح السادس' }, { id: 'g6_teachers', name: 'غرفة معلمين السادس' },
      { id: 'g4_1', name: 'الصف الرابع 1' }, { id: 'g4_2', name: 'الصف الرابع 2' },
      { id: 'g4_3', name: 'الصف الرابع 3' }, { id: 'g4_4', name: 'الصف الرابع 4' },
      { id: 'g4_5', name: 'الصف الرابع 5' }, { id: 'g4_6', name: 'الصف الرابع 6' },
      { id: 'g3_1', name: 'الصف الثالث 1' }, { id: 'g3_2', name: 'الصف الثالث 2' },
      { id: 'g3_3', name: 'الصف الثالث 3' }, { id: 'g3_4', name: 'الصف الثالث 4' },
      { id: 'g3_5', name: 'الصف الثالث 5' }, { id: 'g3_admin', name: 'إدارة جناح الثالث' },
      { id: 'yard_2', name: 'ساحة ومضمار الأنشطة 2' }, { id: 'play_yard_2', name: 'ساحة المظلات وألعاب الأطفال 2' }
    ]
  }
];

export default function App() {
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map');
  const [zoomScale, setZoomScale] = useState(1.1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // إدارة الغرف والبلاغات
  const [selectedZone, setSelectedZone] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalNewFault, setModalNewFault] = useState(false);
  const [faultDesc, setFaultDesc] = useState('');
  const [faultType, setFaultType] = useState('كهرباء');

  const [faults, setFaults] = useState([
    { id: 'f1', zone_id: 'g5_4', location: 'الصف الخامس 4', type: 'تكييف', desc: 'عطل في التكييف', status: 'pending' },
    { id: 'f2', zone_id: 'gym', location: 'الصالة الرياضية والمدرجات', type: 'إضاءة', desc: 'صيانة كشافات الإضاءة', status: 'pending' },
  ]);

  const handleRoomPress = (room) => {
    setSelectedZone(room);
    setDrawerVisible(true);
  };

  const handleRoomLongPress = (room) => {
    Alert.alert(
      'تحديث صورة المرفق 📷',
      `هل ترغب في تغيير وتحديث صورة (${room.name})؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اختيار من الاستوديو', onPress: () => Alert.alert('تم بنجاح', `تم تحديث صورة ${room.name}`) }
      ]
    );
  };

  const handleAddFault = () => {
    if (!faultDesc.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة وصف العطل أولاً.');
      return;
    }
    const newF = {
      id: 'f_' + Date.now(),
      zone_id: selectedZone ? selectedZone.id : 'gen',
      location: selectedZone ? selectedZone.name : 'المجمع العام',
      type: faultType,
      desc: faultDesc,
      status: 'pending'
    };
    setFaults([newF, ...faults]);
    setFaultDesc('');
    setModalNewFault(false);
    Alert.alert('تم بنجاح 🚨', 'تم تسجيل بلاغ العطل بنجاح في النظام.');
  };

  // عرض المخطط المعماري
  const renderArchitecturalCanvas = (scaleVal) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true} style={{ flex: 1 }}>
        <View style={{ width: 1250 * scaleVal, height: 1250 * scaleVal, backgroundColor: '#FFFFFF' }}>
          <Image
            source={require('./assets/ground_plan.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* الشريط العلوي */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>المخطط المتكامل لمجمع زايد التعليمي</Text>
        <TouchableOpacity style={styles.btnFloorToggle} onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}>
          <Text style={styles.btnFloorTxt}>{selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          {/* شريط التحكم والتوسعة */}
          <View style={styles.mapControlsBar}>
            <Text style={styles.mapControlsTitle}>🗺️ المخطط المعماري الموسع</Text>
            <View style={styles.zoomRow}>
              <TouchableOpacity onPress={() => setIsFullscreen(true)} style={styles.btnFullscreen}>
                <Text style={styles.btnFullscreenTxt}>⛶ ملء الشاشة</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.min(s + 0.25, 2.5))} style={styles.btnZoom}>
                <Text style={styles.btnZoomTxt}>➕</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.max(s - 0.25, 0.7))} style={styles.btnZoom}>
                <Text style={styles.btnZoomTxt}>➖</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1.1)} style={[styles.btnZoom, { backgroundColor: '#475569' }]}>
                <Text style={styles.btnZoomTxt}>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* مساحة عرض المخطط الواسعة بحجم الهاتف */}
          <View style={styles.mainCanvasContainer}>
            {renderArchitecturalCanvas(zoomScale)}
          </View>

          {/* تصفح وإدارة قاعات المجمع مرتبة هندسياً */}
          <View style={styles.sectionsContainer}>
            <Text style={styles.sectionsHeaderTxt}>📍 تصفح قاعات وأجنحة المجمع (بدون مربعات مشوهة):</Text>
            {CAMPUS_SECTIONS.map((sec, sIdx) => (
              <View key={sIdx} style={styles.sectionCard}>
                <Text style={[styles.sectionCardTitle, { color: sec.color }]}>{sec.title}</Text>
                <View style={styles.roomBadgeContainer}>
                  {sec.rooms.map((rm) => {
                    const roomFaults = faults.filter(f => f.zone_id === rm.id || f.location === rm.name);
                    const hasFault = roomFaults.length > 0;
                    return (
                      <Pressable
                        key={rm.id}
                        onPress={() => handleRoomPress(rm)}
                        onLongPress={() => handleRoomLongPress(rm)}
                        style={({ pressed }) => [
                          styles.roomBadge,
                          hasFault && styles.roomBadgeFault,
                          pressed && styles.roomBadgePressed
                        ]}
                      >
                        <Text style={[styles.roomBadgeTxt, hasFault && { color: '#EF4444' }]}>{rm.name}</Text>
                        {hasFault && <Text style={styles.alertCountTxt}>🚨 {roomFaults.length}</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* تبويب قائمة الأعطال */
        <ScrollView style={styles.faultsListScroll}>
          <Text style={styles.sectionTitle}>سجل البلاغات والأعطال المفتوحة ({faults.length})</Text>
          {faults.map((item) => (
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
                  onPress={() => Alert.alert('تقرير PDF 📄', `جاري استخراج تقرير: ${item.location}`)}
                >
                  <Text style={styles.btnCardActionTxt}>📄 استخراج PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* نافذة وضع ملء الشاشة الكامل 100% */}
      <Modal visible={isFullscreen} animationType="fade" statusBarTranslucent={true}>
        <View style={{ flex: 1, backgroundColor: '#0B132B' }}>
          <View style={styles.floatingFullscreenBar}>
            <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13 }}>⛶ وضع ملء الشاشة المعماري</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.min(s + 0.3, 3.0))} style={styles.btnZoomModal}><Text style={{ color: '#FFF' }}>➕</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.max(s - 0.3, 0.6))} style={styles.btnZoomModal}><Text style={{ color: '#FFF' }}>➖</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.btnCloseModal}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>❌ خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderArchitecturalCanvas(zoomScale)}
        </View>
      </Modal>

      {/* التبويبات السفلية */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'map' && styles.navTxtActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navTxt, activeTab === 'faults' && styles.navTxtActive]}>الأعطال</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل الغرفة */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{selectedZone?.name || 'تفاصيل المرفق'}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <View style={styles.drawerActionsRow}>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#EF4444' }]} onPress={() => setModalNewFault(true)}>
                <Text style={styles.btnActionTxt}>🚨 تسجيل عطل جديد</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#0284C7' }]} onPress={() => Alert.alert('تقرير PDF 📄', `تم استخراج التقرير لـ (${selectedZone?.name})`)}>
                <Text style={styles.btnActionTxt}>📑 سحب ملف PDF</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#334155', marginTop: 10 }]} onPress={() => handleRoomLongPress(selectedZone)}>
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
            <Text style={styles.modalSubtitle}>المكان: {selectedZone?.name}</Text>
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
              <TouchableOpacity style={styles.btnConfirm} onPress={handleAddFault}><Text style={styles.btnConfirmTxt}>حفظ البلاغ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalNewFault(false)}><Text style={styles.btnCancelTxt}>إلغاء</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  btnFloorToggle: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  btnFloorTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  mapControlsBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1E293B', marginHorizontal: 8, marginTop: 6, borderRadius: 8 },
  mapControlsTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  zoomRow: { flexDirection: 'row-reverse', gap: 6 },
  btnFullscreen: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  btnFullscreenTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  btnZoom: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  btnZoomTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  mainCanvasContainer: { height: SCREEN_HEIGHT * 0.58, backgroundColor: '#FFFFFF', marginHorizontal: 8, marginTop: 6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },

  sectionsContainer: { paddingHorizontal: 10, marginTop: 12, marginBottom: 20 },
  sectionsHeaderTxt: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  sectionCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  sectionCardTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  roomBadgeContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  roomBadge: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155', flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  roomBadgeFault: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  roomBadgePressed: { backgroundColor: '#0284C7' },
  roomBadgeTxt: { color: '#F1F5F9', fontSize: 11, fontWeight: 'bold' },
  alertCountTxt: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },

  floatingFullscreenBar: { position: 'absolute', top: 38, left: 15, right: 15, zIndex: 999, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.94)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: '#38BDF8' },
  btnZoomModal: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  btnCloseModal: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },

  bottomNav: { flexDirection: 'row', height: 54, backgroundColor: '#1E293B', borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  faultsListScroll: { flex: 1, padding: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  faultCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  faultCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  faultLocTxt: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  faultTypeTag: { color: '#38BDF8', fontSize: 11, backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  faultDescTxt: { color: '#CBD5E1', fontSize: 12, marginBottom: 8, textAlign: 'right' },
  faultCardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  faultStatusPending: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },
  btnCardAction: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  btnCardActionTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: 2, borderColor: '#38BDF8' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  drawerActionsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnAction: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnActionTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  inputModalCard: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', alignSelf: 'center', width: '90%' },
  modalTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  modalSubtitle: { color: '#38BDF8', fontSize: 12, marginTop: 2, marginBottom: 12, textAlign: 'right' },
  textInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155', textAlignVertical: 'top' },
  typeSelectorRow: { flexDirection: 'row-reverse', gap: 6, marginVertical: 12 },
  typeBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0F172A', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  typeBtnActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  typeBtnTxt: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  typeBtnTxtActive: { color: '#FFFFFF' },
  modalBtnRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 6 },
  btnConfirm: { flex: 1, backgroundColor: '#10B981', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnConfirmTxt: { color: '#FFFFFF', fontWeight: 'bold' },
  btnCancel: { flex: 1, backgroundColor: '#475569', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnCancelTxt: { color: '#FFFFFF', fontWeight: 'bold' },
});
