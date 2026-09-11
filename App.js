import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// قائمة المشاكل الشائعة الجاهزة (تغني عن الكتابة نهائياً)
const COMMON_PROBLEMS = [
  { id: 'ac_hot', label: 'المكيف لا يبرد ❄️', type: 'تكييف', priority: 'عالي' },
  { id: 'water_leak', label: 'تسريب مياه 💧', type: 'سباكة', priority: 'عالي' },
  { id: 'light_off', label: 'لمبة أو كشاف مطفأ 💡', type: 'كهرباء', priority: 'متوسط' },
  { id: 'door_lock', label: 'قفل أو مقبض باب معطل 🔒', type: 'أبواب وأقفال', priority: 'عالي' },
  { id: 'plug_spark', label: 'مقبس كهرباء خطير ⚡', type: 'كهرباء', priority: 'طوارئ' },
  { id: 'broken_glass', label: 'زجاج أو نافذة مكسورة 🪟', type: 'سلامة عامة', priority: 'طوارئ' },
  { id: 'chair_break', label: 'كرسي أو طاولة مكسورة 🪑', type: 'أثاث ومقاعد', priority: 'بسيط' },
  { id: 'clean_req', label: 'يحتاج تنظيف عاجل 🧹', type: 'نظافة وخدمات', priority: 'بسيط' },
];

export default function App() {
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [activeTab, setActiveTab] = useState('map');
  const [activeFilter, setActiveFilter] = useState('all');
  const [zoomScale, setZoomScale] = useState(1.0);

  // إدارة الغرف والنوافذ
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalNewFault, setModalNewFault] = useState(false);

  // اختيار البلاغ السريع
  const [selectedPreset, setSelectedPreset] = useState(COMMON_PROBLEMS[0]);
  const [selectedPriority, setSelectedPriority] = useState('طوارئ');

  // قاعدة بيانات البلاغات
  const [faults, setFaults] = useState([
    {
      id: 'f101',
      zone_id: 'g5_sup',
      location: 'إشراف ومخزن الخامس',
      problem: 'مقبس كهرباء خطير ⚡',
      type: 'كهرباء',
      priority: 'طوارئ',
      status: 'new', // new, in_progress, resolved
      time: '08:30 ص',
    },
    {
      id: 'f102',
      zone_id: 'g5_4',
      location: 'صف الخامس 4',
      problem: 'المكيف لا يبرد ❄️',
      type: 'تكييف',
      priority: 'عالي',
      status: 'in_progress',
      time: '09:15 ص',
    },
    {
      id: 'f103',
      zone_id: 'pool',
      location: 'المسبح والمدرجات',
      problem: 'تسريب مياه 💧',
      type: 'سباكة',
      priority: 'عالي',
      status: 'resolved',
      time: 'أمس',
    },
  ]);

  const handleRoomPress = (room) => {
    setSelectedRoom(room);
    setDrawerVisible(true);
  };

  // تسجيل البلاغ بنقرة واحدة
  const handleCreateFastFault = () => {
    const newFault = {
      id: 'f_' + Date.now(),
      zone_id: selectedRoom ? selectedRoom.id : 'gen',
      location: selectedRoom ? selectedRoom.name : 'المجمع العام',
      problem: selectedPreset.label,
      type: selectedPreset.type,
      priority: selectedPriority,
      status: 'new',
      time: 'الآن',
    };
    setFaults([newFault, ...faults]);
    setModalNewFault(false);
    setDrawerVisible(false);
    Alert.alert('تم تسجيل البلاغ بنجاح 🚨', `الموقع: ${newFault.location}\nالمشكلة: ${newFault.problem}`);
  };

  // تبديل حالة البلاغ بلمسة واحدة (جديد -> جاري العمل -> تم الحل)
  const cycleFaultStatus = (faultId) => {
    setFaults(
      faults.map((item) => {
        if (item.id === faultId) {
          if (item.status === 'new') return { ...item, status: 'in_progress' };
          if (item.status === 'in_progress') return { ...item, status: 'resolved' };
          return { ...item, status: 'new' };
        }
        return item;
      })
    );
  };

  const getActiveFaultsForRoom = (roomId, roomName) => {
    return faults.filter(
      (f) => (f.zone_id === roomId || f.location === roomName) && f.status !== 'resolved'
    );
  };

  // تصفية البلاغات
  const filteredFaults = faults.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return f.priority === 'طوارئ' || f.priority === 'عالي';
    if (activeFilter === 'open') return f.status !== 'resolved';
    if (activeFilter === 'done') return f.status === 'resolved';
    return true;
  });

  // رسم مربع القاعة داخل المخطط
  const renderRoom = (id, name, icon, isWide = false, customHeight = 68, bg = '#FEF3C7', border = '#F59E0B') => {
    const activeAlerts = getActiveFaultsForRoom(id, name);
    const hasFault = activeAlerts.length > 0;
    const isUrgent = activeAlerts.some((a) => a.priority === 'طوارئ');

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.7}
        style={[
          styles.roomBox,
          {
            backgroundColor: hasFault ? (isUrgent ? '#FEE2E2' : '#FEF9C3') : bg,
            borderColor: hasFault ? (isUrgent ? '#EF4444' : '#F59E0B') : border,
            height: customHeight,
          },
          isWide && { width: '100%' },
        ]}
        onPress={() => handleRoomPress({ id, name })}
      >
        <Ionicons name={icon} size={20} color={hasFault ? (isUrgent ? '#EF4444' : '#D97706') : '#1E293B'} />
        <Text
          style={[styles.roomText, hasFault && { color: isUrgent ? '#EF4444' : '#B45309', fontWeight: 'bold' }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        {hasFault && (
          <View style={[styles.badgeAlert, isUrgent && { backgroundColor: '#EF4444' }]}>
            <Text style={styles.badgeAlertText}>{activeAlerts.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* الشريط العلوي المبسط */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>نظام صيانة مجمع زايد الميداني</Text>
        <TouchableOpacity
          style={styles.btnFloorToggle}
          onPress={() => setSelectedFloor(selectedFloor === 'ground' ? 'upper' : 'ground')}
        >
          <Text style={styles.btnFloorToggleText}>
            {selectedFloor === 'ground' ? 'الدور الأرضي 🏢' : 'الدور العلوي 🔝'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* شريط الفلاتر السريعة بالألوان */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}>
          {[
            { id: 'all', title: `كافة البلاغات (${faults.length})`, icon: 'apps-outline' },
            { id: 'open', title: `تحت المعالجة (${faults.filter(f => f.status !== 'resolved').length})`, icon: 'time-outline' },
            { id: 'urgent', title: '🔴 طوارئ وعاجل', icon: 'warning-outline' },
            { id: 'done', title: `✅ تم إصلاحه (${faults.filter(f => f.status === 'resolved').length})`, icon: 'checkmark-circle-outline' },
          ].map((flt) => (
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

      {/* التبويب النشط */}
      {activeTab === 'map' ? (
        <ScrollView style={{ flex: 1 }}>
          {/* إرشادات وأدوات التكبير */}
          <View style={styles.zoomControlBar}>
            <Text style={styles.zoomControlTitle}>👈 اسحب الشاشة يميناً ويساراً للتصفح</Text>
            <View style={styles.zoomButtonsRow}>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.min(s + 0.2, 1.8))} style={styles.btnZoom}>
                <Text style={styles.btnZoomText}>➕ تكبير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale((s) => Math.max(s - 0.2, 0.7))} style={styles.btnZoom}>
                <Text style={styles.btnZoomText}>➖ تصغير</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setZoomScale(1.0)} style={[styles.btnZoom, { backgroundColor: '#475569' }]}>
                <Text style={styles.btnZoomText}>🔄 إعادة ضبط</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* مساحة المخطط التفاعلي ثنائي الأبعاد */}
          <View style={styles.mapViewport}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true}>
              <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                <View style={[styles.canvas, { width: 1060 * zoomScale, height: 1380 * zoomScale, transform: [{ scale: zoomScale }] }]}>
                  
                  {/* الجناح 1-5 */}
                  <View style={styles.wing}>
                    <Text style={styles.wingTitle}>جناح الصفوف 1 - 5</Text>
                    <View style={styles.row}>
                      {renderRoom('g5_sup', 'إشراف ومخزن 5', 'cube', false, 72, '#FEE2E2', '#EF4444')}
                      {renderRoom('g5_4', 'صف الخامس 4', 'school', false, 72)}
                      {renderRoom('g5_5', 'صف الخامس 5', 'school', false, 72)}
                      {renderRoom('g5_6', 'صف الخامس 6', 'school', false, 72)}
                      {renderRoom('g5_adm', 'إدارة جناح', 'business', false, 72, '#E2E8F0', '#94A3B8')}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('g5_st2', 'درج', 'layers', false, 72, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g5_3', 'صف الخامس 3', 'school', false, 72)}
                      {renderRoom('g5_2', 'صف الخامس 2', 'school', false, 72)}
                      {renderRoom('g5_1', 'صف الخامس 1', 'school', false, 72)}
                      {renderRoom('g5_tea', 'غرفة معلمين', 'people', false, 72, '#E0F2FE', '#38BDF8')}
                    </View>
                    {renderRoom('yard_1', '⚽ ساحة ومضمار الأنشطة 1', 'football', true, 130, '#F8FAFC', '#CBD5E1')}
                    <View style={styles.row}>
                      {renderRoom('g2_5', 'صف الثاني 5', 'school', false, 72)}
                      {renderRoom('g2_3', 'صف الثاني 3', 'school', false, 72)}
                      {renderRoom('g2_1', 'صف الثاني 1', 'school', false, 72)}
                      {renderRoom('g2_cls', 'قاعة دراسية', 'easel', false, 72)}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('g2_spe', 'تربية خاصة', 'heart', false, 72, '#FCE7F3', '#EC4899')}
                      {renderRoom('g2_4', 'صف الثاني 4', 'school', false, 72)}
                      {renderRoom('g2_2', 'صف الثاني 2', 'school', false, 72)}
                      {renderRoom('g2_tea', 'غرفة معلمين', 'people', false, 72, '#E0F2FE', '#38BDF8')}
                    </View>
                    {renderRoom('play_1', '👶 ساحة المظلات وألعاب الأطفال 1', 'happy', true, 120, '#F8FAFC', '#CBD5E1')}
                    <View style={styles.row}>
                      {renderRoom('g1_5', 'صف الأول 5', 'school', false, 72)}
                      {renderRoom('g1_3', 'صف الأول 3', 'school', false, 72)}
                      {renderRoom('g1_1', 'صف الأول 1', 'school', false, 72)}
                      {renderRoom('g1_cls', 'قاعة دراسية', 'easel', false, 72)}
                    </View>
                  </View>

                  {/* الخدمات المركزية */}
                  <View style={[styles.wing, { width: 350 }]}>
                    <Text style={styles.wingTitle}>الخدمات والمرافق المركزية</Text>
                    <View style={styles.row}>
                      {renderRoom('cafe_1', 'كافتيريا 1', 'restaurant', false, 85, '#FEF9C3', '#EAB308')}
                      {renderRoom('cafe_serv', 'خدمات الكافتيريا', 'fast-food', false, 85, '#FEE2E2', '#EF4444')}
                      {renderRoom('cafe_2', 'كافتيريا 2', 'restaurant', false, 85, '#FEF9C3', '#EAB308')}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('art_room', 'الفنية', 'color-palette', false, 72, '#FED7AA', '#F97316')}
                      {renderRoom('theater', 'المسرح والمحاضرات', 'tv', false, 72, '#FCE7F3', '#EC4899')}
                      {renderRoom('music_room', 'الموسيقى', 'musical-notes', false, 72, '#FED7AA', '#F97316')}
                    </View>
                    {renderRoom('pool', '🏊 المسبح والمدرجات', 'water', true, 130, '#E0F2FE', '#0284C7')}
                    {renderRoom('gym', '🏋️ الصالة الرياضية والمدرجات', 'fitness', true, 140, '#EDE9FE', '#8B5CF6')}
                    <View style={styles.row}>
                      {renderRoom('lab_sci_2', 'مختبر علوم 2', 'flask', false, 80, '#FFE4E6', '#F43F5E')}
                      {renderRoom('lab_comp_2', 'حاسوب 2', 'hardware-chip', false, 80, '#E0F2FE', '#0284C7')}
                      {renderRoom('lab_comp_1', 'حاسوب 1', 'hardware-chip', false, 80, '#E0F2FE', '#0284C7')}
                      {renderRoom('lab_sci_1', 'مختبر علوم 1', 'flask', false, 80, '#FFE4E6', '#F43F5E')}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('admin_main', 'مكتب الإدارة العامة', 'business', false, 75, '#E2E8F0', '#64748B')}
                      {renderRoom('reception', 'الاستقبال الرئيسي', 'enter', false, 75, '#E0F2FE', '#0284C7')}
                    </View>
                  </View>

                  {/* الجناح 3-6 */}
                  <View style={styles.wing}>
                    <Text style={styles.wingTitle}>جناح الصفوف 3 - 6</Text>
                    <View style={styles.row}>
                      {renderRoom('g6_adm', 'إدارة جناح', 'business', false, 72, '#E2E8F0', '#94A3B8')}
                      {renderRoom('g6_6', 'صف السادس 6', 'school', false, 72)}
                      {renderRoom('g6_5', 'صف السادس 5', 'school', false, 72)}
                      {renderRoom('g6_4', 'صف السادس 4', 'school', false, 72)}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('g6_tea', 'غرفة معلمين', 'people', false, 72, '#E0F2FE', '#38BDF8')}
                      {renderRoom('g6_1', 'صف السادس 1', 'school', false, 72)}
                      {renderRoom('g6_2', 'صف السادس 2', 'school', false, 72)}
                      {renderRoom('g6_3', 'صف السادس 3', 'school', false, 72)}
                    </View>
                    {renderRoom('yard_2', '⚽ ساحة ومضمار الأنشطة 2', 'football', true, 130, '#F8FAFC', '#CBD5E1')}
                    <View style={styles.row}>
                      {renderRoom('g4_2', 'صف الرابع 2', 'school', false, 72)}
                      {renderRoom('g4_4', 'صف الرابع 4', 'school', false, 72)}
                      {renderRoom('g4_6', 'صف الرابع 6', 'school', false, 72)}
                    </View>
                    <View style={styles.row}>
                      {renderRoom('g4_1', 'صف الرابع 1', 'school', false, 72)}
                      {renderRoom('g4_3', 'صف الرابع 3', 'school', false, 72)}
                      {renderRoom('g4_5', 'صف الرابع 5', 'school', false, 72)}
                    </View>
                    {renderRoom('play_2', '👶 ساحة المظلات وألعاب الأطفال 2', 'happy', true, 120, '#F8FAFC', '#CBD5E1')}
                    <View style={styles.row}>
                      {renderRoom('g3_2', 'صف الثالث 2', 'school', false, 72)}
                      {renderRoom('g3_4', 'صف الثالث 4', 'school', false, 72)}
                      {renderRoom('g3_1', 'صف الثالث 1', 'school', false, 72)}
                      {renderRoom('g3_3', 'صف الثالث 3', 'school', false, 72)}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </ScrollView>
          </View>

          {/* القائمة السريعة المباشرة بالأسفل للأماكن */}
          <View style={styles.quickNavSection}>
            <Text style={styles.quickNavTitle}>الأجنحة والصفوف المباشرة (انقر للإبلاغ فوراً):</Text>
            <View style={styles.quickNavGrid}>
              {[
                { id: 'g5_sup', name: 'إشراف ومخزن الخامس', icon: 'cube' },
                { id: 'g5_4', name: 'صف الخامس 4', icon: 'school' },
                { id: 'g5_5', name: 'صف الخامس 5', icon: 'school' },
                { id: 'g5_6', name: 'صف الخامس 6', icon: 'school' },
                { id: 'pool', name: 'المسبح والمدرجات', icon: 'water' },
                { id: 'gym', name: 'الصالة الرياضية والمدرجات', icon: 'fitness' },
                { id: 'cafe_1', name: 'كافتيريا 1', icon: 'restaurant' },
                { id: 'cafe_serv', name: 'خدمات الكافتيريا', icon: 'fast-food' },
                { id: 'g6_1', name: 'صف السادس 1', icon: 'school' },
                { id: 'g4_1', name: 'صف الرابع 1', icon: 'school' },
              ].map((item) => {
                const alerts = getActiveFaultsForRoom(item.id, item.name);
                const hasAlert = alerts.length > 0;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.quickCard, hasAlert && styles.quickCardAlert]}
                    onPress={() => handleRoomPress(item)}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={item.icon} size={18} color={hasAlert ? '#EF4444' : '#0284C7'} />
                      <Text style={[styles.quickCardText, hasAlert && { color: '#EF4444' }]}>{item.name}</Text>
                    </View>
                    {hasAlert && (
                      <View style={styles.badgeQuickAlert}>
                        <Text style={styles.badgeQuickAlertText}>{alerts.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'home' ? (
        /* تبويب الرئيسية: شاشة بسيطة جداً للإحصائيات */
        <ScrollView style={styles.homeContent}>
          <Text style={styles.sectionHeader}>📊 حالة المجمع اليوم</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { borderColor: '#EF4444' }]}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                {faults.filter((f) => f.status === 'new').length}
              </Text>
              <Text style={styles.statLabel}>🔴 بلاغات جديدة</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                {faults.filter((f) => f.status === 'in_progress').length}
              </Text>
              <Text style={styles.statLabel}>🛠️ قيد الإصلاح</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#10B981' }]}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {faults.filter((f) => f.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>✅ تم إنجازها</Text>
            </View>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>👮 تعليمات سريعة لفريق العمل:</Text>
            <Text style={styles.instructionText}>
              1. عند رؤية أي عطل، اضغط على مكان الغرفة في "المخطط" واختر نوع المشكلة بلمسة واحدة.
              {'\n'}2. لتأكيد البدء في الإصلاح أو إغلاقه، افتح تبويب "الأعطال" واضغط زر الحالة الملون.
            </Text>
          </View>
        </ScrollView>
      ) : activeTab === 'faults' ? (
        /* تبويب إدارة الأعطال بنقرة واحدة */
        <ScrollView style={styles.faultsList}>
          <Text style={styles.sectionHeader}>قائمة البلاغات الميدانية ({filteredFaults.length})</Text>
          <Text style={styles.subHintText}>💡 انقر على زر الحالة الملون بالأسفل لتغيير حالة العطل مباشرة</Text>

          {filteredFaults.map((f) => {
            const isDone = f.status === 'resolved';
            const isWorking = f.status === 'in_progress';
            return (
              <View key={f.id} style={[styles.faultCard, isDone && { opacity: 0.7, borderColor: '#10B981' }]}>
                <View style={styles.faultCardHeader}>
                  <Text style={styles.faultLoc}>📍 {f.location}</Text>
                  <Text
                    style={[
                      styles.priorityTag,
                      f.priority === 'طوارئ' && { backgroundColor: '#EF4444', color: '#FFF' },
                      f.priority === 'عالي' && { backgroundColor: '#F97316', color: '#FFF' },
                      f.priority === 'متوسط' && { backgroundColor: '#FBBF24', color: '#000' },
                    ]}
                  >
                    {f.priority}
                  </Text>
                </View>

                <Text style={styles.faultProblemText}>{f.problem}</Text>
                <Text style={styles.faultTimeText}>التوقيت: {f.time} | النوع: {f.type}</Text>

                <View style={styles.faultCardFooter}>
                  {/* زر التغيير السريع للحالة باللمس */}
                  <TouchableOpacity
                    style={[
                      styles.btnStatusToggle,
                      isDone
                        ? { backgroundColor: '#10B981' }
                        : isWorking
                        ? { backgroundColor: '#F59E0B' }
                        : { backgroundColor: '#EF4444' },
                    ]}
                    onPress={() => cycleFaultStatus(f.id)}
                  >
                    <Text style={styles.btnStatusToggleText}>
                      {isDone ? '✅ تم الإصلاح بنجاح' : isWorking ? '🛠️ جاري العمل الآن...' : '⏳ بلاغ جديد (انقر للبدء)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnPdfSmall}
                    onPress={() => Alert.alert('تقرير رسمي 📄', `تم استخراج أمر العمل لـ (${f.location})`)}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* تبويب المواقع والتفتيش */
        <ScrollView style={styles.faultsList}>
          <Text style={styles.sectionHeader}>📍 نقاط التفتيش الأمني والخدمي</Text>
          <TouchableOpacity
            style={styles.btnBigScan}
            onPress={() => Alert.alert('المسح الميداني 📷', 'فتح الكاميرا لقراءة باركود القاعة وتوثيق الجولة فوراً')}
          >
            <Ionicons name="qr-code-outline" size={32} color="#FFF" />
            <Text style={styles.btnBigScanText}>مسح باركود القاعة (QR)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* الشريط السفلي بأيقونات واضحة وكبيرة */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Ionicons name="home-outline" size={24} color={activeTab === 'home' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name="map-outline" size={24} color={activeTab === 'map' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>المخطط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('faults')}>
          <Ionicons name="alert-circle-outline" size={24} color={activeTab === 'faults' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'faults' && styles.navTextActive]}>الأعطال</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('locations')}>
          <Ionicons name="shield-checkmark-outline" size={24} color={activeTab === 'locations' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.navText, activeTab === 'locations' && styles.navTextActive]}>الجولات</Text>
        </TouchableOpacity>
      </View>

      {/* نافذة تفاصيل القاعة: أزرار ضخمة تناسب أي شخص */}
      <Modal visible={drawerVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{selectedRoom?.name}</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerButtonsRow}>
              <TouchableOpacity
                style={[styles.btnDrawerAction, { backgroundColor: '#EF4444' }]}
                onPress={() => setModalNewFault(true)}
              >
                <Ionicons name="warning-outline" size={20} color="#FFF" />
                <Text style={styles.btnDrawerActionText}>الإبلاغ عن عطل هنا 🚨</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnDrawerAction, { backgroundColor: '#0284C7' }]}
                onPress={() => Alert.alert('تقرير الغرفة 📄', `جاري إصدار التقرير الفني لـ (${selectedRoom?.name})`)}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFF" />
                <Text style={styles.btnDrawerActionText}>سحب تقرير PDF</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnDrawerAction, { backgroundColor: '#334155', marginTop: 10 }]}
              onPress={() => Alert.alert('الكاميرا 📷', `فتح الكاميرا لتصوير عطل في (${selectedRoom?.name})`)}
            >
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.btnDrawerActionText}>التقاط صورة للغرفة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* نافذة الإبلاغ الذكية: اختيار بلمسة واحدة بدون كتابة */}
      <Modal visible={modalNewFault} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.easyInputCard}>
            <Text style={styles.easyModalTitle}>ما هي المشكلة في {selectedRoom?.name}؟</Text>
            <Text style={styles.easyModalSub}>اختر المشكلة بلمسة واحدة فقط 👇</Text>

            {/* أزرار المشاكل الشائعة الجاهزة */}
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              <View style={styles.presetGrid}>
                {COMMON_PROBLEMS.map((pr) => {
                  const isSelected = selectedPreset.id === pr.id;
                  return (
                    <TouchableOpacity
                      key={pr.id}
                      style={[styles.presetButton, isSelected && styles.presetButtonActive]}
                      onPress={() => {
                        setSelectedPreset(pr);
                        setSelectedPriority(pr.priority);
                      }}
                    >
                      <Text style={[styles.presetButtonText, isSelected && styles.presetButtonTextActive]}>
                        {pr.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* اختيار مستوى الخطورة بلمسة واحدة */}
            <Text style={styles.priorityLabel}>مستوى الأهمية والخطورة:</Text>
            <View style={styles.prioritySelectorRow}>
              {[
                { label: '🔴 طارئ', val: 'طوارئ', color: '#EF4444' },
                { label: '🟡 متوسط', val: 'عالي', color: '#F59E0B' },
                { label: '🟢 بسيط', val: 'بسيط', color: '#10B981' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.val}
                  style={[
                    styles.priorityBtn,
                    selectedPriority === p.val && { backgroundColor: p.color, borderColor: p.color },
                  ]}
                  onPress={() => setSelectedPriority(p.val)}
                >
                  <Text style={[styles.priorityBtnText, selectedPriority === p.val && { color: '#FFF' }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* أزرار التأكيد والإلغاء الضخمة */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.btnConfirmBig} onPress={handleCreateFastFault}>
                <Text style={styles.btnConfirmBigText}>تأكيد وإرسال البلاغ 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancelBig} onPress={() => setModalNewFault(false)}>
                <Text style={styles.btnCancelBigText}>إلغاء</Text>
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
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  btnFloorToggle: { backgroundColor: '#0284C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  btnFloorToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  filterBar: { backgroundColor: '#0F172A', paddingVertical: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  btnZoom: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
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
  wing: { width: 335, gap: 8 },
  wingTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
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
  roomText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#1E293B', marginTop: 3 },

  badgeAlert: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeAlertText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

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
  sectionHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: 8 },
  subHintText: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 12 },
  statsContainer: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5 },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#F8FAFC', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
  instructionCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#334155' },
  instructionTitle: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13, textAlign: 'right', marginBottom: 6 },
  instructionText: { color: '#CBD5E1', fontSize: 12, lineHeight: 20, textAlign: 'right' },

  faultsList: { flex: 1, padding: 12 },
  faultCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#334155' },
  faultCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  faultLoc: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  priorityTag: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: 'bold' },
  faultProblemText: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginVertical: 4 },
  faultTimeText: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 10 },
  faultCardFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  btnStatusToggle: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnStatusToggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  btnPdfSmall: { backgroundColor: '#0284C7', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  btnBigScan: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  btnBigScanText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  bottomNav: {
    flexDirection: 'row',
    height: 56,
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
  drawerCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, borderTopWidth: 2, borderColor: '#38BDF8' },
  drawerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  drawerButtonsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnDrawerAction: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 6 },
  btnDrawerActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  easyInputCard: {
    backgroundColor: '#1E293B',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignSelf: 'center',
    width: '92%',
  },
  easyModalTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  easyModalSub: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  presetGrid: { gap: 6 },
  presetButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'flex-end',
  },
  presetButtonActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  presetButtonText: { color: '#CBD5E1', fontSize: 12, fontWeight: 'bold' },
  presetButtonTextActive: { color: '#FFFFFF' },

  priorityLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginTop: 14, marginBottom: 8 },
  prioritySelectorRow: { flexDirection: 'row-reverse', gap: 8 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  priorityBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  modalActionsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  btnConfirmBig: { flex: 1.5, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnConfirmBigText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  btnCancelBig: { flex: 1, backgroundColor: '#475569', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnCancelBigText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});
