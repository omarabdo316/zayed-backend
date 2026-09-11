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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// البيانات الهندسية المحدثة وفق الاتجاه المعماري الصحيح
const INITIAL_BLUEPRINT_ROOMS = {
  // 1. الجناح الأيسر (صفوف 1 - 5)
  left_wing: [
    { id: 'l_g5_1', name: 'الصف الخامس 4', type: 'class', block: 'الخامس' },
    { id: 'l_g5_2', name: 'الصف الخامس 5', type: 'class', block: 'الخامس' },
    { id: 'l_g5_3', name: 'الصف الخامس 6', type: 'class', block: 'الخامس' },
    { id: 'l_g5_adm', name: 'الإدارة', type: 'admin', block: 'الخامس' },
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

  // 2. القطاع الأوسط (الخدمات والمرافق المركزية)
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

  // 3. الجناح الأيمن (صفوف 3 - 6)
  right_wing: [
    { id: 'r_g6_adm', name: 'الإدارة', type: 'admin', block: 'السادس' },
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
  const [roomsData, setRoomsData] = useState(INITIAL_BLUEPRINT_ROOMS);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map');
  const [zoomScale, setZoomScale] = useState(1.0);

  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentWingKey, setCurrentWingKey] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [faults, setFaults] = useState([
    { id: 'f1', zone_id: 'l_g5_1', location: 'الصف الخامس 4', problem: 'تسريب مياه', status: 'new' },
    { id: 'f2', zone_id: 'c_pool', location: 'المسبح الرياضي والمدرجات', problem: 'مضخة الفلتر معطلة', status: 'in_progress' },
  ]);

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

  const getFaultCount = (roomId) => faults.filter((f) => f.zone_id === roomId && f.status !== 'resolved').length;

  const renderRoomBox = (room, wingKey, isWide = false, customHeight = 65) => {
    const fCount = getFaultCount(room.id);
    const hasFault = fCount > 0;

    let bg = '#FEF9C3';
    let border = '#EAB308';
    if (room.type === 'admin') { bg = '#F1F5F9'; border = '#94A3B8'; }
    else if (room.type === 'teachers') { bg = '#E0F2FE'; border = '#38BDF8'; }
    else if (room.type === 'special') { bg = '#FCE7F3'; border = '#EC4899'; }
    else if (room.type === 'lab') { bg = '#DCFCE7'; border = '#22C55E'; }
    else if (room.type === 'yard') { bg = '#F8FAFC'; border = '#CBD5E1'; customHeight = 120; }

    return (
      <TouchableOpacity
        key={room.id}
        activeOpacity={0.75}
        style={[
          styles.roomItem,
          {
            backgroundColor: hasFault ? '#FEE2E2' : bg,
            borderColor: hasFault ? '#EF4444' : border,
            height: customHeight,
          },
          isWide && { width: '100%' },
        ]}
        onPress={() => handleRoomClick(room, wingKey)}
      >
        <Text style={[styles.roomItemText, hasFault && { color: '#EF4444' }]} numberOfLines={2}>
          {room.name}
        </Text>
        {hasFault && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{fCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* شريط العنوان */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>المخطط الهندسي التفاعلي لمجمع زايد التعليمي</Text>
        <TouchableOpacity
          style={styles.btnFloor}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorTxt}>{selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.controlsBar}>
            <Text style={styles.controlsTxt}>↔️ اسحب الشاشة للتنقل الكامل عبر المخطط</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.min(s + 0.2, 1.8))} style={styles.btnTool}>
                <Text style={styles.btnToolTxt}>➕ تكبير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.max(s - 0.2, 0.7))} style={styles.btnTool}>
                <Text style={styles.btnToolTxt}>➖ تصغير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1.0)} style={[styles.btnTool, { backgroundColor: '#475569' }]}>
                <Text style={styles.btnToolTxt}>🔄 ضبط</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* مساحة المخطط: تم ضبط flexDirection: 'row' لعكس الاتجاه بالكامل */}
          <View style={styles.canvasWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                <View style={[styles.blueprintCanvas, { width: 1080 * zoomScale, height: 1400 * zoomScale, transform: [{ scale: zoomScale }] }]}>
                  
                  {/* الجناح الأيسر الآن: جناح الصفوف 1-5 */}
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

                  {/* الجناح الأيمن الآن: جناح الصفوف 3-6 */}
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
      ) : (
        /* تبويب الأعطال */
        <ScrollView style={{ flex: 1, padding: 14 }}>
          <Text style={styles.tabSectionTitle}>سجل البلاغات المفتوحة ({faults.length})</Text>
          {faults.map((f) => (
            <View key={f.id} style={styles.faultCardItem}>
              <Text style={styles.faultCardLoc}>📍 {f.location}</Text>
              <Text style={styles.faultCardDesc}>المشكلة: {f.problem}</Text>
              <Text style={styles.faultCardStatus}>الحالة: {f.status === 'new' ? 'جديد ⏳' : 'قيد الإصلاح 🛠️'}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* التبويبات السفلية */}
      <View style={styles.navBottom}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'map' && styles.navBtnTxtActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navBtnTxt, activeTab === 'faults' && styles.navBtnTxtActive]}>الأعطال</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل الغرفة */}
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
                style={[styles.btnAction, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  Alert.alert('تسجيل بلاغ 🚨', `تم فتح تذكرة صيانة لـ (${currentRoom?.name})`);
                  setDrawerVisible(false);
                }}
              >
                <Ionicons name="warning-outline" size={18} color="#FFF" />
                <Text style={styles.btnActionTxt}>تسجيل عطل 🚨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نافذة إعادة التسمية الميدانية */}
      <Modal visible={renameModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.renameBox}>
            <Text style={styles.renameTitle}>تعديل مسمى الفراغ المعماري ✏️</Text>
            <Text style={styles.renameSub}>المسمى الحالي: {currentRoom?.name}</Text>
            <TextInput
              style={styles.renameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="اكتب الاسم الجديد للقاعة هنا..."
              placeholderTextColor="#94A3B8"
            />
            <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.btnConfirmRename} onPress={handleSaveRename}>
                <Text style={styles.btnConfirmRenameTxt}>اعتماد الاسم الجديد</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancelRename} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.btnCancelRenameTxt}>إلغاء</Text>
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

  controlsBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginTop: 4, borderRadius: 8 },
  controlsTxt: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
  btnTool: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnToolTxt: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  canvasWrapper: { height: 570, backgroundColor: '#0F172A', marginHorizontal: 8, marginTop: 6, borderRadius: 12, borderWidth: 2, borderColor: '#334155', overflow: 'hidden' },
  // التعديل الأساسي: flexDirection: 'row' لعرض الجناح الأيسر يساراً والأيمن يميناً
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

  tabSectionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 12 },
  faultCardItem: { backgroundColor: '#1E293B', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  faultCardLoc: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13, textAlign: 'right' },
  faultCardDesc: { color: '#CBD5E1', fontSize: 12, textAlign: 'right', marginVertical: 4 },
  faultCardStatus: { color: '#F59E0B', fontSize: 11, textAlign: 'right', fontWeight: 'bold' },

  navBottom: { flexDirection: 'row', height: 54, backgroundColor: '#1E293B', borderTopWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  navBtn: { alignItems: 'center', justifyContent: 'center' },
  navBtnTxt: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navBtnTxtActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, borderTopWidth: 2, borderColor: '#38BDF8' },
  sheetHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  actionButtonsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 6 },
  btnActionTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  renameBox: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#38BDF8', alignSelf: 'center', width: '90%' },
  renameTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  renameSub: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  renameInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155' },
  btnConfirmRename: { flex: 1.5, backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnConfirmRenameTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  btnCancelRename: { flex: 1, backgroundColor: '#475569', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnCancelRenameTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});
