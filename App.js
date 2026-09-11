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

export default function App() {
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map');
  const [activeFilter, setActiveFilter] = useState('all');
  const [zoomScale, setZoomScale] = useState(1.0);

  // إدارة الغرفة المحددة والنوافذ
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalNewFault, setModalNewFault] = useState(false);
  const [faultDesc, setFaultDesc] = useState('');
  const [faultType, setFaultType] = useState('كهرباء');

  // سجل الأعطال المفتوحة
  const [faults, setFaults] = useState([
    { id: 'f1', zone_id: 'g5_sup', location: 'إشراف ومخزن الخامس', type: 'كهرباء', desc: 'عطل في لوحة التوزيع الفرعية', status: 'pending' },
    { id: 'f2', zone_id: 'g5_4', location: 'صف الخامس 4', type: 'تكييف', desc: 'تسريب مياه من وحدة التكييف المركزية', status: 'pending' },
    { id: 'f3', zone_id: 'gym', location: 'الصالة الرياضية والمدرجات', type: 'إنارة', desc: 'استبدال كشافات السقف المرتفع', status: 'pending' },
    { id: 'f4', zone_id: 'cafe_serv', location: 'خدمات ومخزن الكافتيريا', type: 'سباكة', desc: 'انسداد في خط التصريف الرئيسي', status: 'pending' },
  ]);

  const handleRoomPress = (room) => {
    setSelectedRoom(room);
    setDrawerVisible(true);
  };

  const handleAddFault = () => {
    if (!faultDesc.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة وصف البلاغ أولاً.');
      return;
    }
    const newF = {
      id: 'f_' + Date.now(),
      zone_id: selectedRoom ? selectedRoom.id : 'gen',
      location: selectedRoom ? selectedRoom.name : 'المجمع العام',
      type: faultType,
      desc: faultDesc,
      status: 'pending',
    };
    setFaults([newF, ...faults]);
    setFaultDesc('');
    setModalNewFault(false);
    Alert.alert('تم بنجاح 🚨', `تم تسجيل البلاغ في (${selectedRoom ? selectedRoom.name : 'المجمع'}).`);
  };

  const getFaultCount = (roomId, roomName) => {
    return faults.filter(f => f.zone_id === roomId || f.location === roomName).length;
  };

  // تصفية الأعطال بحسب الفلتر الهندسي النشط
  const filteredFaults = faults.filter(f => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'elec') return f.type.includes('كهرباء') || f.type.includes('إنارة');
    if (activeFilter === 'plumb') return f.type.includes('سباكة') || f.type.includes('مياه');
    if (activeFilter === 'furn') return f.type.includes('أثاث') || f.type.includes('مقاعد');
    if (activeFilter === 'equip') return f.type.includes('تكييف') || f.type.includes('أجهزة');
    return true;
  });

  // رسم خلية الغرفة في المخطط الموسع
  const renderRoom = (id, name, icon, isWide = false, customHeight = 65, bg = '#FEF3C7', border = '#F59E0B') => {
    const fCount = getFaultCount(id, name);
    const hasFault = fCount > 0;
    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.7}
        style={[
          styles.roomBox,
          {
            backgroundColor: hasFault ? '#FEE2E2' : bg,
            borderColor: hasFault ? '#EF4444' : border,
            height: customHeight,
          },
          isWide && { width: '100%' }
        ]}
        onPress={() => handleRoomPress({ id, name })}
      >
        <Ionicons name={icon} size={18} color={hasFault ? '#EF4444' : '#1E293B'} />
        <Text style={[styles.roomText, hasFault && { color: '#EF4444', fontWeight: 'bold' }]} numberOfLines={2}>
          {name}
        </Text>
        {hasFault && (
          <View style={styles.badgeAlert}>
            <Text style={styles.badgeAlertText}>{fCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* الشريط العلوي للعنوان وتبديل الأدوار */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المخطط المتكامل لمجمع زايد التعليمي</Text>
        <TouchableOpacity
          style={styles.btnFloorToggle}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorToggleText}>
            {selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* شريط الفلاتر الهندسية التخصصية */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: 6 }}>
          {[
            { id: 'all', title: `الكل (${faults.length})` },
            { id: 'elec', title: '⚡ كهرباء وإنارة' },
            { id: 'plumb', title: '💧 سباكة ومياه' },
            { id: 'furn', title: '🪑 أثاث ومقاعد' },
            { id: 'equip', title: '📟 أجهزة ومعدات' },
          ].map(flt => (
            <TouchableOpacity
              key={flt.id}
              style={[styles.filterChip, activeFilter === flt.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(flt.id)}
            >
              <Text style={[styles.filterChipText, activeFilter === flt.id && styles.filterChipTextActive]}>
                {flt.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* التبويب الرئيسي المختار */}
      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          {/* شريط التحكم في التكبير والتصغير وتوجيه المستخدم */}
          <View style={styles.zoomControlBar}>
            <Text style={styles.zoomControlTitle}>🗺️ المخطط التفاعلي (اسحب للتنقل الكامل)</Text>
            <View style={styles.zoomButtonsRow}>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.min(s + 0.2, 1.8))} style={styles.btnZoom}>
                <Text style={styles.btnZoomText}>➕ تكبير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(s => Math.max(s - 0.2, 0.7))} style={styles.btnZoom}>
                <Text style={styles.btnZoomText}>➖ تصغير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1.0)} style={[styles.btnZoom, { backgroundColor: '#475569' }]}>
                <Text style={styles.btnZoomText}>🔄 100%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* حاوية المخطط الموسعة ثنائية التمرير (أفقي ورأسي) */}
          <View style={styles.mapViewport}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                <View style={[styles.canvas, { width: 1050 * zoomScale, height: 1350 * zoomScale, transform: [{ scale: zoomScale }] }]}>

                  {/* ================= الجناح الأيسر: جناح الصفوف 1-5 ================= */}
                  <View style={styles.wing}>
                    <Text style={styles.wingTitle}>جناح الصفوف 1 - 5</Text>

                    {/* الصف الخامس - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g5_sup', 'إشراف ومخزن', 'cube', false, 70, '#FEE2E2', '#EF4444')}
                      {renderRoom('g5_4', 'صف الخامس 4', 'school', false, 70)}
                      {renderRoom('g5_5', 'صف الخامس 5', 'school', false, 70)}
                      {renderRoom('g5_6', 'صف الخامس 6', 'school', false, 70)}
                      {renderRoom('g5_adm', 'إدارة جناح', 'business', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g5_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* الصف الخامس - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g5_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g5_3', 'صف الخامس 3', 'school', false, 70)}
                      {renderRoom('g5_2', 'صف الخامس 2', 'school', false, 70)}
                      {renderRoom('g5_1', 'صف الخامس 1', 'school', false, 70)}
                      {renderRoom('g5_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g5_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                    </View>

                    {/* ساحة ومضمار 1 */}
                    {renderRoom('yard_1', '⚽ ساحة ومضمار الأنشطة الرياضية 1', 'football', true, 130, '#F8FAFC', '#CBD5E1')}

                    {/* الصف الثاني - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g2_sup', 'مشرف ومخزن', 'cube', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g2_5', 'صف الثاني 5', 'school', false, 70)}
                      {renderRoom('g2_3', 'صف الثاني 3', 'school', false, 70)}
                      {renderRoom('g2_1', 'صف الثاني 1', 'school', false, 70)}
                      {renderRoom('g2_cls', 'قاعة دراسية', 'easel', false, 70)}
                      {renderRoom('g2_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* الصف الثاني - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g2_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g2_spe', 'قسم التربية الخاصة', 'heart', false, 70, '#FCE7F3', '#EC4899')}
                      {renderRoom('g2_4', 'صف الثاني 4', 'school', false, 70)}
                      {renderRoom('g2_2', 'صف الثاني 2', 'school', false, 70)}
                      {renderRoom('g2_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g2_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                    </View>

                    {/* ساحة ألعاب الأطفال 1 */}
                    {renderRoom('play_1', '👶 ساحة المظلات وألعاب الأطفال 1', 'happy', true, 120, '#F8FAFC', '#CBD5E1')}

                    {/* الصف الأول - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g1_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g1_5', 'صف الأول 5', 'school', false, 70)}
                      {renderRoom('g1_3', 'صف الأول 3', 'school', false, 70)}
                      {renderRoom('g1_1', 'صف الأول 1', 'school', false, 70)}
                      {renderRoom('g1_cls', 'قاعة دراسية', 'easel', false, 70)}
                      {renderRoom('g1_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                    </View>

                    {/* الصف الأول - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g1_sup', 'مشرف ومخزن', 'cube', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g1_6', 'صف الأول 6', 'school', false, 70)}
                      {renderRoom('g1_4', 'صف الأول 4', 'school', false, 70)}
                      {renderRoom('g1_2', 'صف الأول 2', 'school', false, 70)}
                      {renderRoom('g1_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g1_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>
                  </View>

                  {/* ================= الجناح الأوسط: الخدمات والمرافق المركزية ================= */}
                  <View style={[styles.wing, { width: 350 }]}>
                    <Text style={styles.wingTitle}>الخدمات والمرافق المركزية</Text>

                    {/* الكافتيريا والخدمات */}
                    <View style={styles.row}>
                      {renderRoom('cafe_1', 'كافتيريا 1', 'restaurant', false, 85, '#FEF9C3', '#EAB308')}
                      {renderRoom('cafe_serv', 'خدمات ومخزن الكافتيريا', 'fast-food', false, 85, '#FEE2E2', '#EF4444')}
                      {renderRoom('cafe_2', 'كافتيريا 2', 'restaurant', false, 85, '#FEF9C3', '#EAB308')}
                    </View>

                    {/* الفنون والمحاضرات والموسيقى */}
                    <View style={styles.row}>
                      {renderRoom('art_room', 'غرفة الفنية', 'color-palette', false, 70, '#FED7AA', '#F97316')}
                      {renderRoom('theater', 'غرفة المحاضرات والمسرح', 'tv', false, 70, '#FCE7F3', '#EC4899')}
                      {renderRoom('music_room', 'غرفة الموسيقى', 'musical-notes', false, 70, '#FED7AA', '#F97316')}
                    </View>

                    {/* المسبح والصالة الرياضية */}
                    {renderRoom('pool', '🏊 المسبح الرياضي والمدرجات الأولمبية', 'water', true, 130, '#E0F2FE', '#0284C7')}
                    {renderRoom('gym', '🏋️ الصالة الرياضية المغطاة والمدرجات', 'fitness', true, 140, '#EDE9FE', '#8B5CF6')}

                    {/* المختبرات العلمية والحاسوب */}
                    <View style={styles.row}>
                      {renderRoom('lab_sci_2', 'مختبر العلوم 2', 'flask', false, 80, '#FFE4E6', '#F43F5E')}
                      {renderRoom('lab_comp_2', 'مختبر الحاسوب 2', 'hardware-chip', false, 80, '#E0F2FE', '#0284C7')}
                      {renderRoom('lab_comp_1', 'مختبر الحاسوب 1', 'hardware-chip', false, 80, '#E0F2FE', '#0284C7')}
                      {renderRoom('lab_sci_1', 'مختبر العلوم 1', 'flask', false, 80, '#FFE4E6', '#F43F5E')}
                    </View>

                    {/* الإدارة العامة والأمن والاستقبال */}
                    <View style={styles.row}>
                      {renderRoom('adm_sec', 'مكتب الأمن', 'shield-checkmark', false, 75, '#E2E8F0', '#64748B')}
                      {renderRoom('admin_main', 'مكتب الإدارة العامة', 'business', false, 75, '#E2E8F0', '#64748B')}
                      {renderRoom('stu_affairs', 'شؤون الطلاب', 'id-card', false, 75, '#E2E8F0', '#64748B')}
                      {renderRoom('reception', 'الاستقبال الرئيسي', 'enter', false, 75, '#E0F2FE', '#0284C7')}
                    </View>
                  </View>

                  {/* ================= الجناح الأيمن: جناح الصفوف 3-6 ================= */}
                  <View style={styles.wing}>
                    <Text style={styles.wingTitle}>جناح الصفوف 3 - 6</Text>

                    {/* الصف السادس - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g6_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g6_adm', 'إدارة جناح', 'business', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g6_6', 'صف السادس 6', 'school', false, 70)}
                      {renderRoom('g6_5', 'صف السادس 5', 'school', false, 70)}
                      {renderRoom('g6_4', 'صف السادس 4', 'school', false, 70)}
                      {renderRoom('g6_sup', 'مشرف ومخزن', 'cube', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* الصف السادس - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g6_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g6_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g6_1', 'صف السادس 1', 'school', false, 70)}
                      {renderRoom('g6_2', 'صف السادس 2', 'school', false, 70)}
                      {renderRoom('g6_3', 'صف السادس 3', 'school', false, 70)}
                      {renderRoom('g6_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* ساحة ومضمار 2 */}
                    {renderRoom('yard_2', '⚽ ساحة ومضمار الأنشطة الرياضية 2', 'football', true, 130, '#F8FAFC', '#CBD5E1')}

                    {/* الصف الرابع - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g4_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g4_cls', 'قاعة دراسية', 'easel', false, 70)}
                      {renderRoom('g4_2', 'صف الرابع 2', 'school', false, 70)}
                      {renderRoom('g4_4', 'صف الرابع 4', 'school', false, 70)}
                      {renderRoom('g4_6', 'صف الرابع 6', 'school', false, 70)}
                      {renderRoom('g4_sup', 'مشرف ومخزن', 'cube', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* الصف الرابع - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g4_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g4_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g4_1', 'صف الرابع 1', 'school', false, 70)}
                      {renderRoom('g4_3', 'صف الرابع 3', 'school', false, 70)}
                      {renderRoom('g4_5', 'صف الرابع 5', 'school', false, 70)}
                      {renderRoom('g4_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* ساحة ألعاب الأطفال 2 */}
                    {renderRoom('play_2', '👶 ساحة المظلات وألعاب الأطفال 2', 'happy', true, 120, '#F8FAFC', '#CBD5E1')}

                    {/* الصف الثالث - كتلة 1 */}
                    <View style={styles.row}>
                      {renderRoom('g3_wc', 'دورة مياه', 'water', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g3_adm', 'إدارة جناح', 'business', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g3_2', 'صف الثالث 2', 'school', false, 70)}
                      {renderRoom('g3_4', 'صف الثالث 4', 'school', false, 70)}
                      {renderRoom('g3_spe', 'قسم التربية الخاصة', 'heart', false, 70, '#FCE7F3', '#EC4899')}
                      {renderRoom('g3_st1', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>

                    {/* الصف الثالث - كتلة 2 */}
                    <View style={styles.row}>
                      {renderRoom('g3_st2', 'درج', 'layers', false, 70, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g3_tea', 'غرفة معلمين', 'people', false, 70, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g3_1', 'صف الثالث 1', 'school', false, 70)}
                      {renderRoom('g3_3', 'صف الثالث 3', 'school', false, 70)}
                      {renderRoom('g3_5', 'صف الثالث 5', 'school', false, 70)}
                      {renderRoom('g3_sup', 'مشرف ومخزن', 'cube', false, 70, '#E2E8F0', '#94A3B8')}
                    </View>
                  </View>

                </View>
              </ScrollView>
            </ScrollView>
          </View>

          {/* قائمة الأجنحة والصفوف المباشرة بكامل بطاقاتها الأصلية */}
          <View style={styles.quickNavSection}>
            <Text style={styles.quickNavTitle}>الأجنحة والصفوف المباشرة:</Text>
            <View style={styles.quickNavGrid}>
              {[
                { id: 'g5_sup', name: 'إشراف ومخزن الخامس', icon: 'cube' },
                { id: 'g5_4', name: 'صف الخامس 4', icon: 'school' },
                { id: 'g5_5', name: 'صف الخامس 5', icon: 'school' },
                { id: 'g5_6', name: 'صف الخامس 6', icon: 'school' },
                { id: 'g5_adm', name: 'إدارة جناح الخامس', icon: 'business' },
                { id: 'g5_st1', name: 'درج جناح الخامس (شمال)', icon: 'layers' },
                { id: 'g5_st2', name: 'درج جناح الخامس (غرب)', icon: 'layers' },
                { id: 'g5_3', name: 'صف الخامس 3', icon: 'school' },
                { id: 'g5_2', name: 'صف الخامس 2', icon: 'school' },
                { id: 'g5_1', name: 'صف الخامس 1', icon: 'school' },
                { id: 'g5_tea', name: 'غرفة معلمين الخامس', icon: 'people' },
                { id: 'g5_wc', name: 'دورة مياه جناح الخامس', icon: 'water' },
                { id: 'pool', name: 'المسبح والمدرجات', icon: 'water' },
                { id: 'gym', name: 'الصالة الرياضية والمدرجات', icon: 'fitness' },
                { id: 'cafe_1', name: 'كافتيريا 1', icon: 'restaurant' },
                { id: 'cafe_serv', name: 'خدمات ومخزن الكافتيريا', icon: 'fast-food' },
                { id: 'theater', name: 'غرفة المحاضرات والمسرح', icon: 'tv' },
                { id: 'admin_main', name: 'مكتب الإدارة العامة', icon: 'business' },
                { id: 'g6_1', name: 'صف السادس 1', icon: 'school' },
                { id: 'g6_6', name: 'صف السادس 6', icon: 'school' },
                { id: 'g4_1', name: 'صف الرابع 1', icon: 'school' },
                { id: 'g3_1', name: 'صف الثالث 1', icon: 'school' },
              ].map(item => {
                const count = getFaultCount(item.id, item.name);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.quickCard, count > 0 && styles.quickCardAlert]}
                    onPress={() => handleRoomPress(item)}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={item.icon} size={16} color={count > 0 ? '#EF4444' : '#0284C7'} />
                      <Text style={[styles.quickCardText, count > 0 && { color: '#EF4444' }]}>
                        {item.name}
                      </Text>
                    </View>
                    {count > 0 && (
                      <View style={styles.badgeQuickAlert}>
                        <Text style={styles.badgeQuickAlertText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'home' ? (
        /* تبويب الرئيسية والإحصائيات */
        <ScrollView style={styles.homeContent}>
          <Text style={styles.sectionHeader}>📊 مؤشرات المجمع التعليمي العامة</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { borderColor: '#38BDF8' }]}>
              <Text style={styles.statNumber}>57</Text>
              <Text style={styles.statLabel}>إجمالي القاعات والمرافق</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#EF4444' }]}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>{faults.length}</Text>
              <Text style={styles.statLabel}>بلاغات نشطة</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#10B981' }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>3</Text>
              <Text style={styles.statLabel}>أجنحة رئيسية</Text>
            </View>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>ℹ️ تعليمات الاستخدام:</Text>
            <Text style={styles.instructionText}>
              • اضغط على أي قاعة في المخطط أو القائمة المباشرة لتسجيل بلاغ أو استخراج تقرير PDF رسمي.
              {'\n'}• يمكنك سحب المخطط في شاشة "المخطط" أفقياً ورأسياً واستخدام أزرار التكبير للتصفح الدقيق.
            </Text>
          </View>
        </ScrollView>
      ) : activeTab === 'faults' ? (
        /* تبويب سجل الأعطال */
        <ScrollView style={styles.faultsList}>
          <Text style={styles.sectionHeader}>سجل البلاغات المفتوحة ({filteredFaults.length})</Text>
          {filteredFaults.map(f => (
            <View key={f.id} style={styles.faultCard}>
              <View style={styles.faultCardHeader}>
                <Text style={styles.faultLoc}>📍 {f.location}</Text>
                <Text style={styles.faultTag}>{f.type}</Text>
              </View>
              <Text style={styles.faultDesc}>{f.desc}</Text>
              <View style={styles.faultCardFooter}>
                <Text style={styles.faultStatus}>قيد المعالجة ⏳</Text>
                <TouchableOpacity
                  style={styles.btnPdf}
                  onPress={() => Alert.alert('تقرير PDF 📄', `جاري تصدير التقرير الفني المعتمد لـ (${f.location})`)}
                >
                  <Text style={styles.btnPdfText}>📄 استخراج PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* تبويب المواقع */
        <ScrollView style={styles.faultsList}>
          <Text style={styles.sectionHeader}>📍 خريطة المواقع ونقاط التفتيش</Text>
          <Text style={{ color: '#94A3B8', textAlign: 'right', marginTop: 10, lineHeight: 22 }}>
            جميع أجنحة ومرافق مجمع زايد مهيأة للتفتيش الميداني وقراءة رموز الاستجابة السريعة (QR) وتوثيق الجولات.
          </Text>
        </ScrollView>
      )}

      {/* شريط التبويبات السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Ionicons name="home-outline" size={22} color={activeTab === 'home' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name="map" size={22} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={22} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'faults' && styles.navTextActive]}>الأعطال</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('locations')}>
          <Ionicons name="location-outline" size={22} color={activeTab === 'locations' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'locations' && styles.navTextActive]}>المواقع</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل الغرفة */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{selectedRoom?.name}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <View style={styles.drawerButtonsRow}>
              <TouchableOpacity
                style={[styles.btnDrawerAction, { backgroundColor: '#EF4444' }]}
                onPress={() => { setDrawerVisible(false); setModalNewFault(true); }}
              >
                <Text style={styles.btnDrawerActionText}>🚨 تسجيل بلاغ صيانة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDrawerAction, { backgroundColor: '#0284C7' }]}
                onPress={() => Alert.alert('تقرير PDF 📄', `تم استخراج التقرير الفني لـ (${selectedRoom?.name})`)}
              >
                <Text style={styles.btnDrawerActionText}>📑 سحب تقرير PDF</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.btnDrawerAction, { backgroundColor: '#334155', marginTop: 10 }]}
              onPress={() => Alert.alert('تحديث الصورة 📷', `فتح الكاميرا/الاستوديو لتحديث صورة (${selectedRoom?.name})`)}
            >
              <Text style={styles.btnDrawerActionText}>📷 تحديث وتغيير صورة القاعة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* نافذة كتابة بلاغ عطل جديد */}
      <Modal visible={modalNewFault} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.inputModal}>
            <Text style={styles.modalTitle}>تسجيل بلاغ صيانة جديد 🚨</Text>
            <Text style={styles.modalSub}>الموقع: {selectedRoom?.name}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="اكتب وصف العطل بالتفصيل..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={faultDesc}
              onChangeText={setFaultDesc}
            />
            <View style={styles.typeRow}>
              {['كهرباء', 'سباكة', 'تكييف', 'أثاث'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.btnType, faultType === t && styles.btnTypeActive]}
                  onPress={() => setFaultType(t)}
                >
                  <Text style={[styles.btnTypeText, faultType === t && styles.btnTypeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSave} onPress={handleAddFault}>
                <Text style={styles.btnSaveText}>حفظ البلاغ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalNewFault(false)}>
                <Text style={styles.btnCancelText}>إلغاء</Text>
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
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  btnFloorToggle: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  btnFloorToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  filterBar: { backgroundColor: '#0F172A', paddingVertical: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  filterChipTextActive: { color: '#0F172A' },

  zoomControlBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  zoomControlTitle: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
  zoomButtonsRow: { flexDirection: 'row-reverse', gap: 6 },
  btnZoom: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  btnZoomText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  mapViewport: {
    height: 560,
    backgroundColor: '#0F172A',
    marginHorizontal: 8,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  canvas: {
    backgroundColor: '#0B132B',
    flexDirection: 'row-reverse',
    padding: 12,
    gap: 14,
  },

  wing: { width: 330, gap: 8 },
  wingTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
  },

  row: { flexDirection: 'row-reverse', gap: 6, justifyContent: 'space-between' },

  roomBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  roomText: { fontSize: 10.5, fontWeight: 'bold', textAlign: 'center', color: '#1E293B', marginTop: 3 },

  badgeAlert: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeAlertText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  quickNavSection: { padding: 12, marginTop: 8 },
  quickNavTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  quickNavGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  quickCard: {
    width: (SCREEN_WIDTH - 32) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickCardAlert: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  quickCardText: { color: '#1E293B', fontSize: 11, fontWeight: 'bold' },
  badgeQuickAlert: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeQuickAlertText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  homeContent: { flex: 1, padding: 16 },
  sectionHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 12 },
  statsContainer: { flexDirection: 'row-reverse', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1 },
  statNumber: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 11, marginTop: 4, textAlign: 'center' },
  instructionCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#334155' },
  instructionTitle: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13, textAlign: 'right', marginBottom: 6 },
  instructionText: { color: '#CBD5E1', fontSize: 12, lineHeight: 20, textAlign: 'right' },

  faultsList: { flex: 1, padding: 12 },
  faultCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  faultCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  faultLoc: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 13 },
  faultTag: { color: '#38BDF8', fontSize: 11, backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  faultDesc: { color: '#CBD5E1', fontSize: 12, marginBottom: 8, textAlign: 'right' },
  faultCardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  faultStatus: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },
  btnPdf: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  btnPdfText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderColor: '#334155',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  navTextActive: { color: '#38BDF8', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: 2, borderColor: '#38BDF8' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  drawerButtonsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnDrawerAction: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnDrawerActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  inputModal: { backgroundColor: '#1E293B', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', alignSelf: 'center', width: '90%' },
  modalTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  modalSub: { color: '#38BDF8', fontSize: 12, marginTop: 2, marginBottom: 12, textAlign: 'right' },
  textInput: { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: 8, padding: 10, textAlign: 'right', borderWidth: 1, borderColor: '#334155', textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row-reverse', gap: 6, marginVertical: 12 },
  btnType: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0F172A', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  btnTypeActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  btnTypeText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  btnTypeTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 6 },
  btnSave: { flex: 1, backgroundColor: '#10B981', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnSaveText: { color: '#FFFFFF', fontWeight: 'bold' },
  btnCancel: { flex: 1, backgroundColor: '#475569', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnCancelText: { color: '#FFFFFF', fontWeight: 'bold' },
});
