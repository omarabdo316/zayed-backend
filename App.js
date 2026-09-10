import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://igapdxtttqgtdpxajszy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ytpvGSPA2fv402Qo4lBuQg_M_-0oXD8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const storage = {
  async getItem(key, fallback) {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },
};

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&q=50';

const api = {
  getConfig: async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'app_pins')
        .maybeSingle();
      if (data && data.value) {
        const pins = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        await storage.setItem('APP_PINS', pins);
        return { pins };
      }
    } catch (e) {}
    const savedPins = await storage.getItem('APP_PINS', null);
    return savedPins ? { pins: savedPins } : {};
  },

  updatePins: async (pins) => {
    await storage.setItem('APP_PINS', pins);
    try {
      await supabase.from('system_config').upsert({
        key: 'app_pins',
        value: pins,
      });
      return true;
    } catch (e) {
      return true;
    }
  },

  heartbeat: async ({ device_id, role, device_type, device_name }) => {
    try {
      const { data: existing } = await supabase
        .from('device_presence')
        .select('is_kicked')
        .eq('device_id', device_id)
        .maybeSingle();

      if (existing?.is_kicked) {
        return { kicked: true };
      }

      await supabase.from('device_presence').upsert({
        device_id,
        role,
        device_type,
        device_name,
        last_seen: new Date().toISOString(),
        is_kicked: false,
      });

      return { success: true };
    } catch (e) {
      return { success: true };
    }
  },

  getPresence: async () => {
    try {
      const pastWindow = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('device_presence')
        .select('*')
        .gte('last_seen', pastWindow)
        .eq('is_kicked', false)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return { devices: data || [] };
    } catch (e) {
      return { devices: [] };
    }
  },

  kickDevice: async (targetDeviceId) => {
    try {
      const { error } = await supabase
        .from('device_presence')
        .update({ is_kicked: true })
        .eq('device_id', targetDeviceId);
      if (error) throw error;
      return true;
    } catch (e) {
      throw e;
    }
  },

  getFaults: async () => {
    const { data, error } = await supabase
      .from('faults')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createFault: async (body) => {
    const { data, error } = await supabase
      .from('faults')
      .insert([body])
      .select();
    if (error) {
      console.error('Insert error:', error);
      throw new Error(error.message || 'تعذر تسجيل البلاغ');
    }
    return data?.[0] || body;
  },

  startRepair: async (id, worker_name) => {
    const { data, error } = await supabase
      .from('faults')
      .update({ status: 'in_progress', worker_name })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || {};
  },

  completeRepair: async (id, worker_name, after_photo) => {
    const { data, error } = await supabase
      .from('faults')
      .update({ status: 'completed', worker_name, after_photo })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0] || {};
  },

  deleteFault: async (id) => {
    const { error } = await supabase.from('faults').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  seedZones: async (zones) => ({ zones }),
  addZone: async (floor, zone) => ({}),

  async getZoneImages() {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'zone_images')
        .maybeSingle();
      if (data && data.value) {
        return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      }
    } catch (e) {}
    return await storage.getItem('ZONE_IMAGES_V1', {});
  },

  async saveZoneImages(imgs) {
    await storage.setItem('ZONE_IMAGES_V1', imgs);
    try {
      await supabase.from('system_config').upsert({
        key: 'zone_images',
        value: imgs,
      });
    } catch (e) {}
  },

  async uploadImage(uri) {
    if (!uri) return DEFAULT_PHOTO;
    try {
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `fault_${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });

      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/fault-photos/${fileName}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        console.warn('Supabase storage upload failed with status:', res.status);
        return DEFAULT_PHOTO;
      }
      return `${SUPABASE_URL}/storage/v1/object/public/fault-photos/${fileName}`;
    } catch (e) {
      console.error('Upload exception:', e);
      return DEFAULT_PHOTO;
    }
  },
};

const colors = {
  primary: '#0F172A',
  primarySoft: '#0284C7',
  cadLine: '#0284C7',
  blueprintBg: '#0F172A',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#CBD5E1',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  success: '#10B981',
  successSoft: '#D1FAE5',
  info: '#0284C7',
  infoSoft: '#E0F2FE',
};

const PLAN_W = 400;
const PLAN_H = 460;
const LOCATIONS_SECRET_PIN = '01024217096';
const PIN_MANAGER_SECRET_PIN = '01127616961';

const STRINGS = {
  ar: {
    appTitle: 'مجمع زايد التعليمي',
    appSub: 'المخطط الهندسي الذكي وإدارة المرافق',
    choosePortal: 'اختر البوابة للدخول بالرمز السري:',
    inspectorTitle: 'مفتش صيانة',
    inspectorSub: 'تسجيل البلاغات وتصوير الأعطال المباشرة',
    workerTitle: 'بوابة تسوية الأعطال',
    workerSub: 'استلام المهام، وتصوير الإنجاز بعد تسوية العطل',
    supervisorTitle: 'مشرف / إدارة المجمع',
    supervisorSub: 'المتابعة الحية وسحب التقارير',
    pinControlTitle: 'التحكم في أرقام السر (سحابياً)',
    pinControlSub: 'تعديل ومزامنة الرموز السرية للإدارة، المفتشين، وتسوية الأعطال',
    enterPin: 'يرجى إدخال الرقم السري المعتمد للمتابعة',
    confirmLogin: 'تأكيد الدخول',
    cancel: 'إلغاء',
    close: 'إغلاق',
    back: 'رجوع للمخطط',
    welcome: 'مرحباً بك في المنظومة المعتمدة',
    roleInspectorTag: 'مفتش صيانة (إدخال وبلاغات)',
    roleWorkerTag: 'تسوية الأعطال (معالجة وإنجاز)',
    roleSupervisorTag: 'مشرف إدارة (وضع المشاهدة فقط)',
    statTotal: 'الإجمالي',
    statNew: 'مفتوحة',
    statProgress: 'قيد العمل',
    statCompleted: 'تمت التسوية',
    navHome: 'الرئيسية',
    navMap: 'المخطط',
    navFaults: 'الأعطال',
    navLocations: 'المواقع',
    actionMap: 'المخطط الهندسي التفاعلي',
    actionNewFault: 'تسجيل وتصوير بلاغ جديد',
    actionFaultsList: 'سجل الأعطال والتسويات',
    actionExportAll: 'تصدير تقرير شامل (PDF)',
    floorGround: 'الدور الأرضي',
    floorUpper: 'الدور العلوي',
    mapHeader: 'مخطط مجمع زايد التعليمي',
    mapGuide: 'اضغط على أي صف أو مرفق لفتح قائمة الإجراءات:',
    wingsQuickNav: 'الأجنحة والصفوف المباشرة:',
    locationsHeader: 'أجنحة ومرافق المجمع',
    addLocationBtn: 'إضافة مرفق',
    faultsHeader: 'سجل البلاغات والتسويات',
    beforeImgLabel: 'صورة العطل (قبل الإصلاح):',
    afterImgLabel: 'صورة الإنجاز (بعد التسوية):',
    startRepairBtn: 'بدء تسوية العطل',
    completeRepairBtn: 'تصوير الإنجاز وتأكيد تسوية العطل',
    exportPdfBtn: 'سحب ومشاركة تقرير (PDF)',
    newFaultTitle: 'تسجيل بلاغ وتصوير عطل',
    locSelectLabel: 'الموقع في المجمع:',
    photoLabel: 'صورة العطل المباشرة:',
    takeCamera: 'التقاط بالكاميرا',
    fromGallery: 'من المعرض',
    faultTypeLabel: 'تصنيف العطل:',
    prioLabel: 'مستوى الأولوية:',
    reporterNamePlaceholder: 'اسم المفتش / مقدم البلاغ',
    faultNotePlaceholder: 'ملاحظات تفصيلية حول العطل',
    saveFaultBtn: 'حفظ وإرسال البلاغ فوراً',
    prioHigh: 'طارئ',
    prioMedium: 'متوسط',
    prioLow: 'عادي',
    statusNew: 'جديد',
    statusProgress: 'قيد العمل',
    statusCompleted: 'تمت التسوية',
    typeAll: 'الكل',
    typeAc: 'تكييف وتبريد',
    typeElec: 'كهرباء وإنارة',
    typePlumb: 'سباكة ومياه',
    typeFurn: 'أثاث ومقاعد',
    typeEquip: 'أجهزة ومعدات',
    locAuthTitle: 'قفل إدارة المواقع والمرافق',
    locAuthSub: 'أدخل الرقم السري المصرح به للوصول لقائمة وتعديل المرافق',
    locAuthBtn: 'دخول إدارة المواقع',
    searchPlaceholder: 'بحث سريع في الصفوف أو الأعطال...',
    filterAll: 'الكل',
    deleteFault: 'حذف البلاغ',
    refreshData: 'مزامنة 🔄',
    langBtn: 'English',
    uploading: 'جارٍ الرفع والمعاينة...',
    actionPresence: 'المتصلين الآن',
    livePresenceTitle: 'المتصلين بالمنظومة',
    livePresenceSub: 'المستخدمون النشطون في المنظومة لحظياً',
    devicesConnected: 'أجهزة متصلة',
    noDevices: 'لا توجد أجهزة نشطة حالياً',
    deviceTypeLabel: 'نوع الجهاز',
    lastSeenNow: 'نشط الآن',
    kickBtn: 'فصل',
    thisDevice: 'هذا الجهاز',
    confirmKickTitle: 'فصل الجهاز',
    confirmKickSub: 'سيتم فصل هذا الجهاز من المنظومة فوراً.',
    kickConfirmBtn: 'فصل نهائي',
    deviceKicked: 'تم فصل الجهاز بنجاح.',
    kickedMsg: 'تم فصل جهازك بواسطة المشرف.',
    idleLogoutMsg: 'تم تسجيل الخروج بسبب عدم النشاط.',
    drawerActionViewFaults: 'الأمر 1: رؤية الأعطال الحالية لهذا المكان',
    drawerActionNewFault: 'الأمر 2: تسجيل عطل جديد',
    drawerActionExportPdf: 'الأمر 3: سحب ملف PDF لأعطال هذا المكان',
    drawerActionBack: 'الأمر 4: رجوع للمخطط الرئيسي',
    noActiveFaultsHere: 'المرفق سليم تماماً ولا توجد به أعطال نشطة حالياً.',
    specialtyFilterHeader: 'فرز مسؤولي الخدمات (التظليل والتركيز):',
  },
  en: {
    appTitle: 'Zayed Educational Complex',
    appSub: 'Smart Engineering Blueprint & CMMS',
    choosePortal: 'Select portal to enter PIN:',
    inspectorTitle: 'Maintenance Inspector',
    inspectorSub: 'Log faults and capture damage photos',
    workerTitle: 'Fault Settlement Portal',
    workerSub: 'Manage tasks and capture completion photos',
    supervisorTitle: 'Supervisor / Management',
    supervisorSub: 'Live monitoring and PDF reports',
    pinControlTitle: 'Cloud PIN Management',
    pinControlSub: 'Configure and sync PINs across all devices',
    enterPin: 'Please enter authorized PIN to proceed',
    confirmLogin: 'Confirm Login',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back to Map',
    welcome: 'Welcome to Facility System',
    roleInspectorTag: 'Inspector (Logging & Inspection)',
    roleWorkerTag: 'Fault Settlement (Repair & Action)',
    roleSupervisorTag: 'Supervisor (View Only Mode)',
    statTotal: 'Total',
    statNew: 'Open',
    statProgress: 'In Progress',
    statCompleted: 'Settled',
    navHome: 'Home',
    navMap: 'Map',
    navFaults: 'Reports',
    navLocations: 'Locations',
    actionMap: 'Interactive CAD Blueprint',
    actionNewFault: 'Log & Capture New Fault',
    actionFaultsList: 'Live Faults & Settlement Log',
    actionExportAll: 'Export Comprehensive PDF',
    floorGround: 'Ground Floor',
    floorUpper: 'Upper Floor',
    mapHeader: 'Zayed Complex Floor Plan',
    mapGuide: 'Tap any room or facility to open actions sidebar:',
    wingsQuickNav: 'Wings & Classrooms Fast Pick:',
    locationsHeader: 'Complex Wings & Facilities',
    addLocationBtn: 'Add Facility',
    faultsHeader: 'Faults & Settlement Record',
    beforeImgLabel: 'Fault Photo (Before):',
    afterImgLabel: 'Completion Photo (After):',
    startRepairBtn: 'Start Repair Process',
    completeRepairBtn: 'Capture & Settle Fault',
    exportPdfBtn: 'Export & Share PDF',
    newFaultTitle: 'Log Fault & Capture Photo',
    locSelectLabel: 'Facility Location:',
    photoLabel: 'Fault Photo:',
    takeCamera: 'Take Photo',
    fromGallery: 'From Gallery',
    faultTypeLabel: 'Fault Category:',
    prioLabel: 'Priority Level:',
    reporterNamePlaceholder: 'Inspector / Reporter Name',
    faultNotePlaceholder: 'Detailed maintenance notes...',
    saveFaultBtn: 'Save & Dispatch Report',
    prioHigh: 'Emergency',
    prioMedium: 'Medium',
    prioLow: 'Normal',
    statusNew: 'New',
    statusProgress: 'In Progress',
    statusCompleted: 'Settled Successfully',
    typeAll: 'All',
    typeAc: 'HVAC & Cooling',
    typeElec: 'Electrical & Lighting',
    typePlumb: 'Plumbing & Water',
    typeFurn: 'Furniture & Seating',
    typeEquip: 'Devices & Equipment',
    locAuthTitle: 'Facility Lock Protection',
    locAuthSub: 'Enter security PIN to manage facilities and zones',
    locAuthBtn: 'Access Facility Manager',
    searchPlaceholder: 'Quick search in rooms or faults...',
    filterAll: 'All',
    deleteFault: 'Delete Record',
    refreshData: 'Sync 🔄',
    langBtn: 'العربية',
    uploading: 'Uploading & Previewing...',
    actionPresence: 'Live Devices',
    livePresenceTitle: 'Connected Users',
    livePresenceSub: 'Users active in the system right now',
    devicesConnected: 'devices online',
    noDevices: 'No active devices right now',
    deviceTypeLabel: 'Device Type',
    lastSeenNow: 'Active now',
    kickBtn: 'Kick',
    thisDevice: 'This device',
    confirmKickTitle: 'Kick Device',
    confirmKickSub: 'This device will be disconnected immediately.',
    kickConfirmBtn: 'Kick Device',
    deviceKicked: 'Device kicked successfully.',
    kickedMsg: 'Your device was disconnected by the supervisor.',
    idleLogoutMsg: 'Logged out automatically due to inactivity.',
    drawerActionViewFaults: 'Command 1: View Active Faults for Room',
    drawerActionNewFault: 'Command 2: Log New Fault',
    drawerActionExportPdf: 'Command 3: Export PDF Report for Room',
    drawerActionBack: 'Command 4: Back to Floor Plan',
    noActiveFaultsHere: 'Facility is clear, no active issues found.',
    specialtyFilterHeader: 'Service Managers Filter (Focus Mode):',
  },
};

const DEFAULT_ZONES = {
  ground: [
    // ==========================================
    // 1. جناح الصف الخامس (Grade 5 Wing - Top Left)
    // ==========================================
    { key: 'g_c5_sup_top', name_ar: 'إشراف ومخزن الخامس', name_en: 'Grade 5 Supervisor & Store', wing: 'جناح الصف الخامس', x: 6, y: 14, w: 14, h: 32, icon: 'cube', color: '#E2E8F0' },
    { key: 'g_c5_4', name_ar: 'صف الخامس 4', name_en: 'Grade 5 - 4', wing: 'جناح الصف الخامس', x: 22, y: 14, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_5', name_ar: 'صف الخامس 5', name_en: 'Grade 5 - 5', wing: 'جناح الصف الخامس', x: 44, y: 14, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_6', name_ar: 'صف الخامس 6', name_en: 'Grade 5 - 6', wing: 'جناح الصف الخامس', x: 66, y: 14, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_admin', name_ar: 'إدارة جناح الخامس', name_en: 'Grade 5 Administration', wing: 'جناح الصف الخامس', x: 88, y: 14, w: 24, h: 32, icon: 'business', color: '#D1FAE5' },
    { key: 'g_c5_stair_top', name_ar: 'درج جناح الخامس (شمال)', name_en: 'Grade 5 Stairs (North)', wing: 'جناح الصف الخامس', x: 114, y: 14, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },

    { key: 'g_c5_stair_bot', name_ar: 'درج جناح الخامس (غرب)', name_en: 'Grade 5 Stairs (West)', wing: 'جناح الصف الخامس', x: 6, y: 50, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c5_3', name_ar: 'صف الخامس 3', name_en: 'Grade 5 - 3', wing: 'جناح الصف الخامس', x: 22, y: 50, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_2', name_ar: 'صف الخامس 2', name_en: 'Grade 5 - 2', wing: 'جناح الصف الخامس', x: 44, y: 50, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_1', name_ar: 'صف الخامس 1', name_en: 'Grade 5 - 1', wing: 'جناح الصف الخامس', x: 66, y: 50, w: 20, h: 32, icon: 'school', color: '#FEF08A' },
    { key: 'g_c5_teachers', name_ar: 'غرفة معلمين الخامس', name_en: 'Grade 5 Teachers Room', wing: 'جناح الصف الخامس', x: 88, y: 50, w: 24, h: 32, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c5_wc', name_ar: 'دورة مياه جناح الخامس', name_en: 'Grade 5 Restroom', wing: 'جناح الصف الخامس', x: 114, y: 50, w: 14, h: 32, icon: 'water', color: '#BAE6FD' },

    // ==========================================
    // 2. جناح الصف السادس (Grade 6 Wing - Top Right)
    // ==========================================
    { key: 'g_c6_stair_top', name_ar: 'درج جناح السادس (غرب)', name_en: 'Grade 6 Stairs (West)', wing: 'جناح الصف السادس', x: 272, y: 14, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c6_admin', name_ar: 'إدارة جناح السادس', name_en: 'Grade 6 Administration', wing: 'جناح الصف السادس', x: 288, y: 14, w: 24, h: 32, icon: 'business', color: '#D1FAE5' },
    { key: 'g_c6_6', name_ar: 'صف السادس 6', name_en: 'Grade 6 - 6', wing: 'جناح الصف السادس', x: 314, y: 14, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_3', name_ar: 'صف السادس 3', name_en: 'Grade 6 - 3', wing: 'جناح الصف السادس', x: 336, y: 14, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_5', name_ar: 'صف السادس 5', name_en: 'Grade 6 - 5', wing: 'جناح الصف السادس', x: 358, y: 14, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_sup_top', name_ar: 'إشراف ومخزن السادس', name_en: 'Grade 6 Supervisor & Store', wing: 'جناح الصف السادس', x: 380, y: 14, w: 14, h: 32, icon: 'cube', color: '#E2E8F0' },

    { key: 'g_c6_wc', name_ar: 'دورة مياه جناح السادس', name_en: 'Grade 6 Restroom', wing: 'جناح الصف السادس', x: 272, y: 50, w: 14, h: 32, icon: 'water', color: '#BAE6FD' },
    { key: 'g_c6_teachers', name_ar: 'غرفة معلمين السادس', name_en: 'Grade 6 Teachers Room', wing: 'جناح الصف السادس', x: 288, y: 50, w: 24, h: 32, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c6_1', name_ar: 'صف السادس 1', name_en: 'Grade 6 - 1', wing: 'جناح الصف السادس', x: 314, y: 50, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_2', name_ar: 'صف السادس 2', name_en: 'Grade 6 - 2', wing: 'جناح الصف السادس', x: 336, y: 50, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_4', name_ar: 'صف السادس 4', name_en: 'Grade 6 - 4', wing: 'جناح الصف السادس', x: 358, y: 50, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c6_stair_bot', name_ar: 'درج جناح السادس (شرق)', name_en: 'Grade 6 Stairs (East)', wing: 'جناح الصف السادس', x: 380, y: 50, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },

    // ==========================================
    // 3. ساحات المضمار العلوية (Track & Sports Yards)
    // ==========================================
    { key: 'g_yard_left', name_ar: 'ساحة ومضمار الأنشطة 1', name_en: 'Track & Sports Field 1', wing: 'الساحات والملاعب', x: 6, y: 88, w: 122, h: 126, icon: 'football', color: '#F8FAFC' },
    { key: 'g_yard_right', name_ar: 'ساحة ومضمار الأنشطة 2', name_en: 'Track & Sports Field 2', wing: 'الساحات والملاعب', x: 272, y: 88, w: 122, h: 126, icon: 'football', color: '#F8FAFC' },

    // ==========================================
    // 4. الخدمات المركزية العلوية (Cafeteria, Arts, Music, Pool, Gym)
    // ==========================================
    { key: 'g_cafe_1', name_ar: 'كافيتريا 1', name_en: 'Cafeteria 1', wing: 'الخدمات المركزية', x: 134, y: 14, w: 40, h: 120, icon: 'restaurant', color: '#FEF3C7' },
    { key: 'g_cafe_services', name_ar: 'خدمات ومخزن الكافيتريا', name_en: 'Cafeteria Services & Storage', wing: 'الخدمات المركزية', x: 176, y: 14, w: 48, h: 120, icon: 'fast-food', color: '#BAE6FD' },
    { key: 'g_cafe_2', name_ar: 'كافيتريا 2', name_en: 'Cafeteria 2', wing: 'الخدمات المركزية', x: 226, y: 14, w: 40, h: 120, icon: 'restaurant', color: '#FEF3C7' },

    { key: 'g_art_room', name_ar: 'غرفة الفنية', name_en: 'Art Room', wing: 'الأنشطة المركزية', x: 134, y: 138, w: 28, h: 30, icon: 'color-palette', color: '#FED7AA' },
    { key: 'g_lecture', name_ar: 'غرفة المحاضرات', name_en: 'Lecture Hall', wing: 'الأنشطة المركزية', x: 164, y: 138, w: 72, h: 30, icon: 'easel', color: '#FBCFE8' },
    { key: 'g_music_room', name_ar: 'غرفة الموسيقى', name_en: 'Music Room', wing: 'الأنشطة المركزية', x: 238, y: 138, w: 28, h: 30, icon: 'musical-notes', color: '#FED7AA' },

    { key: 'g_pool', name_ar: 'المسبح والمدرجات', name_en: 'Swimming Pool & Stands', wing: 'الخدمات الرياضية', x: 134, y: 172, w: 132, h: 44, icon: 'water', color: '#BAE6FD' },
    { key: 'g_gym', name_ar: 'الصالة الرياضية والمدرجات', name_en: 'Gymnasium & Stands', wing: 'الخدمات الرياضية', x: 134, y: 220, w: 132, h: 68, icon: 'fitness', color: '#DDD6FE' },

    // ==========================================
    // 5. جناح الصف الثاني (Grade 2 Wing - Middle Left)
    // ==========================================
    { key: 'g_c2_sup_top', name_ar: 'إشراف ومخزن الثاني', name_en: 'Grade 2 Supervisor & Store', wing: 'جناح الصف الثاني', x: 6, y: 220, w: 14, h: 32, icon: 'cube', color: '#E2E8F0' },
    { key: 'g_c2_5', name_ar: 'صف الثاني 5', name_en: 'Grade 2 - 5', wing: 'جناح الصف الثاني', x: 22, y: 220, w: 20, h: 32, icon: 'school', color: '#BBF7D0' },
    { key: 'g_c2_3', name_ar: 'صف الثاني 3', name_en: 'Grade 2 - 3', wing: 'جناح الصف الثاني', x: 44, y: 220, w: 20, h: 32, icon: 'school', color: '#BBF7D0' },
    { key: 'g_c2_1', name_ar: 'صف الثاني 1', name_en: 'Grade 2 - 1', wing: 'جناح الصف الثاني', x: 66, y: 220, w: 20, h: 32, icon: 'school', color: '#BBF7D0' },
    { key: 'g_c2_hall', name_ar: 'قاعة دراسية (جناح 2)', name_en: 'Study Hall (Grade 2)', wing: 'جناح الصف الثاني', x: 88, y: 220, w: 24, h: 32, icon: 'book', color: '#FEF3C7' },
    { key: 'g_c2_stair_top', name_ar: 'مخزن ودرج الثاني (شرق)', name_en: 'Grade 2 Store & Stairs', wing: 'جناح الصف الثاني', x: 114, y: 220, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },

    { key: 'g_c2_stair_bot', name_ar: 'درج جناح الثاني (غرب)', name_en: 'Grade 2 Stairs (West)', wing: 'جناح الصف الثاني', x: 6, y: 256, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c2_sen', name_ar: 'قسم التربية الخاصة (2)', name_en: 'Special Education (Grade 2)', wing: 'جناح الصف الثاني', x: 22, y: 256, w: 24, h: 32, icon: 'heart', color: '#BBF7D0' },
    { key: 'g_c2_4', name_ar: 'صف الثاني 4', name_en: 'Grade 2 - 4', wing: 'جناح الصف الثاني', x: 48, y: 256, w: 18, h: 32, icon: 'school', color: '#BBF7D0' },
    { key: 'g_c2_2', name_ar: 'صف الثاني 2', name_en: 'Grade 2 - 2', wing: 'جناح الصف الثاني', x: 68, y: 256, w: 18, h: 32, icon: 'school', color: '#BBF7D0' },
    { key: 'g_c2_teachers', name_ar: 'غرفة معلمين الثاني', name_en: 'Grade 2 Teachers Room', wing: 'جناح الصف الثاني', x: 88, y: 256, w: 24, h: 32, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c2_wc', name_ar: 'دورة مياه جناح الثاني', name_en: 'Grade 2 Restroom', wing: 'جناح الصف الثاني', x: 114, y: 256, w: 14, h: 32, icon: 'water', color: '#BAE6FD' },

    // ==========================================
    // 6. جناح الصف الرابع (Grade 4 Wing - Middle Right)
    // ==========================================
    { key: 'g_c4_stair_top', name_ar: 'مخزن ودرج الرابع (غرب)', name_en: 'Grade 4 Store & Stairs', wing: 'جناح الصف الرابع', x: 272, y: 220, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c4_hall', name_ar: 'قاعة دراسية (جناح 4)', name_en: 'Study Hall (Grade 4)', wing: 'جناح الصف الرابع', x: 288, y: 220, w: 24, h: 32, icon: 'book', color: '#BBF7D0' },
    { key: 'g_c4_2', name_ar: 'صف الرابع 2', name_en: 'Grade 4 - 2', wing: 'جناح الصف الرابع', x: 314, y: 220, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_4', name_ar: 'صف الرابع 4', name_en: 'Grade 4 - 4', wing: 'جناح الصف الرابع', x: 336, y: 220, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_6', name_ar: 'صف الرابع 6', name_en: 'Grade 4 - 6', wing: 'جناح الصف الرابع', x: 358, y: 220, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_sup_top', name_ar: 'إشراف ومخزن الرابع', name_en: 'Grade 4 Supervisor & Store', wing: 'جناح الصف الرابع', x: 380, y: 220, w: 14, h: 32, icon: 'cube', color: '#E2E8F0' },

    { key: 'g_c4_wc', name_ar: 'دورة مياه جناح الرابع', name_en: 'Grade 4 Restroom', wing: 'جناح الصف الرابع', x: 272, y: 256, w: 14, h: 32, icon: 'water', color: '#BAE6FD' },
    { key: 'g_c4_teachers', name_ar: 'غرفة معلمين الرابع', name_en: 'Grade 4 Teachers Room', wing: 'جناح الصف الرابع', x: 288, y: 256, w: 24, h: 32, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c4_1', name_ar: 'صف الرابع 1', name_en: 'Grade 4 - 1', wing: 'جناح الصف الرابع', x: 314, y: 256, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_3', name_ar: 'صف الرابع 3', name_en: 'Grade 4 - 3', wing: 'جناح الصف الرابع', x: 336, y: 256, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_5', name_ar: 'صف الرابع 5', name_en: 'Grade 4 - 5', wing: 'جناح الصف الرابع', x: 358, y: 256, w: 20, h: 32, icon: 'school', color: '#FED7AA' },
    { key: 'g_c4_stair_bot', name_ar: 'درج جناح الرابع (شرق)', name_en: 'Grade 4 Stairs (East)', wing: 'جناح الصف الرابع', x: 380, y: 256, w: 14, h: 32, icon: 'trail-sign', color: '#FED7AA' },

    // ==========================================
    // 7. ساحات ألعاب ومظلات الأطفال (Lower Play Yards)
    // ==========================================
    { key: 'g_play_left', name_ar: 'ساحة المظلات وألعاب الأطفال 1', name_en: 'Children Play Yard 1', wing: 'الساحات والملاعب', x: 6, y: 294, w: 122, h: 68, icon: 'happy', color: '#F8FAFC' },
    { key: 'g_play_right', name_ar: 'ساحة المظلات وألعاب الأطفال 2', name_en: 'Children Play Yard 2', wing: 'الساحات والملاعب', x: 272, y: 294, w: 122, h: 68, icon: 'happy', color: '#F8FAFC' },

    // ==========================================
    // 8. المختبرات العلمية والتقنية (Central Labs)
    // ==========================================
    { key: 'g_lab_sci_2', name_ar: 'مختبر العلوم 2', name_en: 'Science Lab 2', wing: 'المختبرات', x: 134, y: 294, w: 24, h: 68, icon: 'flask', color: '#FECDD3' },
    { key: 'g_lab_elec_1', name_ar: 'كهرباء ومخزن مختبرات 2', name_en: 'Lab Electrical/Store 2', wing: 'المختبرات', x: 160, y: 294, w: 12, h: 68, icon: 'flash', color: '#E2E8F0' },
    { key: 'g_lab_comp_2', name_ar: 'مختبر الحاسوب 2', name_en: 'Computer Lab 2', wing: 'المختبرات', x: 174, y: 294, w: 24, h: 68, icon: 'hardware-chip', color: '#FECDD3' },
    { key: 'g_lab_comp_1', name_ar: 'مختبر الحاسوب 1', name_en: 'Computer Lab 1', wing: 'المختبرات', x: 200, y: 294, w: 24, h: 68, icon: 'hardware-chip', color: '#FECDD3' },
    { key: 'g_lab_elec_2', name_ar: 'كهرباء ومخزن مختبرات 1', name_en: 'Lab Electrical/Store 1', wing: 'المختبرات', x: 226, y: 294, w: 12, h: 68, icon: 'flash', color: '#E2E8F0' },
    { key: 'g_lab_sci_1', name_ar: 'مختبر العلوم 1', name_en: 'Science Lab 1', wing: 'المختبرات', x: 240, y: 294, w: 26, h: 68, icon: 'flask', color: '#FECDD3' },

    // ==========================================
    // 9. جناح الصف الأول (Grade 1 Wing - Bottom Left)
    // ==========================================
    { key: 'g_c1_stair_top', name_ar: 'درج جناح الأول (غرب)', name_en: 'Grade 1 Stairs (West)', wing: 'جناح الصف الأول', x: 6, y: 368, w: 14, h: 34, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c1_5', name_ar: 'صف الأول 5', name_en: 'Grade 1 - 5', wing: 'جناح الصف الأول', x: 22, y: 368, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_3', name_ar: 'صف الأول 3', name_en: 'Grade 1 - 3', wing: 'جناح الصف الأول', x: 44, y: 368, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_1', name_ar: 'صف الأول 1', name_en: 'Grade 1 - 1', wing: 'جناح الصف الأول', x: 66, y: 368, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_hall', name_ar: 'قاعة دراسية (جناح 1)', name_en: 'Study Hall (Grade 1)', wing: 'جناح الصف الأول', x: 88, y: 368, w: 24, h: 34, icon: 'book', color: '#BBF7D0' },
    { key: 'g_c1_wc', name_ar: 'دورة مياه جناح الأول', name_en: 'Grade 1 Restroom', wing: 'جناح الصف الأول', x: 114, y: 368, w: 14, h: 34, icon: 'water', color: '#BAE6FD' },

    { key: 'g_c1_sup_bot', name_ar: 'إشراف ومخزن الأول', name_en: 'Grade 1 Supervisor & Store', wing: 'جناح الصف الأول', x: 6, y: 406, w: 14, h: 34, icon: 'cube', color: '#E2E8F0' },
    { key: 'g_c1_6', name_ar: 'صف الأول 6', name_en: 'Grade 1 - 6', wing: 'جناح الصف الأول', x: 22, y: 406, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_4', name_ar: 'صف الأول 4', name_en: 'Grade 1 - 4', wing: 'جناح الصف الأول', x: 44, y: 406, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_2', name_ar: 'صف الأول 2', name_en: 'Grade 1 - 2', wing: 'جناح الصف الأول', x: 66, y: 406, w: 20, h: 34, icon: 'school', color: '#FEF08A' },
    { key: 'g_c1_teachers', name_ar: 'غرفة معلمين الأول', name_en: 'Grade 1 Teachers Room', wing: 'جناح الصف الأول', x: 88, y: 406, w: 24, h: 34, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c1_stair_bot', name_ar: 'درج جناح الأول (شرق)', name_en: 'Grade 1 Stairs (East)', wing: 'جناح الصف الأول', x: 114, y: 406, w: 14, h: 34, icon: 'trail-sign', color: '#FED7AA' },

    // ==========================================
    // 10. جناح الصف الثالث (Grade 3 Wing - Bottom Right)
    // ==========================================
    { key: 'g_c3_wc', name_ar: 'دورة مياه جناح الثالث', name_en: 'Grade 3 Restroom', wing: 'جناح الصف الثالث', x: 272, y: 368, w: 14, h: 34, icon: 'water', color: '#BAE6FD' },
    { key: 'g_c3_admin_room', name_ar: 'غرفة إدارة الثالث', name_en: 'Grade 3 Administration', wing: 'جناح الصف الثالث', x: 288, y: 368, w: 24, h: 34, icon: 'business', color: '#BBF7D0' },
    { key: 'g_c3_2', name_ar: 'صف الثالث 2', name_en: 'Grade 3 - 2', wing: 'جناح الصف الثالث', x: 314, y: 368, w: 20, h: 34, icon: 'school', color: '#FED7AA' },
    { key: 'g_c3_4', name_ar: 'صف الثالث 4', name_en: 'Grade 3 - 4', wing: 'جناح الصف الثالث', x: 336, y: 368, w: 20, h: 34, icon: 'school', color: '#FED7AA' },
    { key: 'g_c3_sen', name_ar: 'قسم التربية الخاصة (3)', name_en: 'Special Education (Grade 3)', wing: 'جناح الصف الثالث', x: 358, y: 368, w: 20, h: 34, icon: 'heart', color: '#FEF08A' },
    { key: 'g_c3_stair_top', name_ar: 'درج جناح الثالث (شرق)', name_en: 'Grade 3 Stairs (East)', wing: 'جناح الصف الثالث', x: 380, y: 368, w: 14, h: 34, icon: 'trail-sign', color: '#FED7AA' },

    { key: 'g_c3_sup_admin', name_ar: 'مشرف إدارة ودرج الثالث', name_en: 'Grade 3 Admin & Stairs', wing: 'جناح الصف الثالث', x: 272, y: 406, w: 14, h: 34, icon: 'trail-sign', color: '#FED7AA' },
    { key: 'g_c3_teachers', name_ar: 'غرفة معلمين الثالث', name_en: 'Grade 3 Teachers Room', wing: 'جناح الصف الثالث', x: 288, y: 406, w: 24, h: 34, icon: 'people', color: '#BBF7D0' },
    { key: 'g_c3_1', name_ar: 'صف الثالث 1', name_en: 'Grade 3 - 1', wing: 'جناح الصف الثالث', x: 314, y: 406, w: 20, h: 34, icon: 'school', color: '#FED7AA' },
    { key: 'g_c3_3', name_ar: 'صف الثالث 3', name_en: 'Grade 3 - 3', wing: 'جناح الصف الثالث', x: 336, y: 406, w: 20, h: 34, icon: 'school', color: '#FED7AA' },
    { key: 'g_c3_5', name_ar: 'صف الثالث 5', name_en: 'Grade 3 - 5', wing: 'جناح الصف الثالث', x: 358, y: 406, w: 20, h: 34, icon: 'school', color: '#FED7AA' },
    { key: 'g_c3_sup_bot', name_ar: 'إشراف ومخزن الثالث', name_en: 'Grade 3 Supervisor & Store', wing: 'جناح الصف الثالث', x: 380, y: 406, w: 14, h: 34, icon: 'cube', color: '#E2E8F0' },

    // ==========================================
    // 11. الإدارة المركزية والمدخل الرئيسي (Central Admin & Reception)
    // ==========================================
    { key: 'g_clinic', name_ar: 'العيادة الصحية', name_en: 'Clinic', wing: 'الإدارة', x: 134, y: 368, w: 22, h: 34, icon: 'medkit', color: '#D1FAE5' },
    { key: 'g_admin_center', name_ar: 'إدارة المجمع', name_en: 'Central Administration', wing: 'الإدارة', x: 158, y: 368, w: 20, h: 34, icon: 'business', color: '#FEE2E2' },
    { key: 'g_principal', name_ar: 'غرفة المدير', name_en: 'Principal Office', wing: 'الإدارة', x: 180, y: 368, w: 20, h: 34, icon: 'person', color: '#FEE2E2' },
    { key: 'g_meeting', name_ar: 'غرفة الاجتماعات', name_en: 'Meeting Room', wing: 'الإدارة', x: 202, y: 368, w: 22, h: 34, icon: 'people', color: '#FEE2E2' },
    { key: 'g_server', name_ar: 'غرفة السيرفر', name_en: 'Server Room', wing: 'الإدارة', x: 226, y: 368, w: 20, h: 34, icon: 'server', color: '#DDD6FE' },
    { key: 'g_admin_elec', name_ar: 'كهرباء ودرج الإدارة', name_en: 'Admin Electricity & Stairs', wing: 'الإدارة', x: 248, y: 368, w: 18, h: 34, icon: 'flash', color: '#FED7AA' },

    { key: 'g_admin_affairs', name_ar: 'إدارة الشؤون الإدارية', name_en: 'Admin Affairs Office', wing: 'الإدارة', x: 134, y: 406, w: 24, h: 34, icon: 'briefcase', color: '#FEE2E2' },
    { key: 'g_finance', name_ar: 'الإدارة المالية', name_en: 'Finance Office', wing: 'الإدارة', x: 160, y: 406, w: 22, h: 34, icon: 'wallet', color: '#FEE2E2' },
    { key: 'g_prayer', name_ar: 'مصلى الدور الأرضي', name_en: 'Ground Floor Prayer Room', wing: 'الإدارة', x: 184, y: 406, w: 22, h: 34, icon: 'business', color: '#D1FAE5' },
    { key: 'g_reception', name_ar: 'الاستقبال الرئيسي', name_en: 'Main Reception', wing: 'الإدارة', x: 208, y: 406, w: 34, h: 34, icon: 'log-in', color: '#BAE6FD' },
    { key: 'g_security', name_ar: 'مكتب الأمن والاستعلامات', name_en: 'Security & Help Desk', wing: 'الإدارة', x: 244, y: 406, w: 22, h: 34, icon: 'shield-checkmark', color: '#E2E8F0' },
  ],
  upper: [
    { key: 'u_lib_boys', name_ar: 'مكتبة الطلاب', name_en: 'Boys Library', wing: 'المكتبات والمصليات', x: 145, y: 100, w: 110, h: 32, icon: 'book', color: '#BAE6FD' },
    { key: 'u_lib_girls', name_ar: 'مكتبة الطالبات', name_en: 'Girls Library', wing: 'المكتبات والمصليات', x: 145, y: 138, w: 110, h: 32, icon: 'book', color: '#BAE6FD' },
    { key: 'u_pray_men', name_ar: 'مصلى الرجال', name_en: 'Men Prayer Hall', wing: 'المكتبات والمصليات', x: 255, y: 175, w: 42, h: 58, icon: 'business', color: '#D1FAE5' },
    { key: 'u_pray_women', name_ar: 'مصلى النساء', name_en: 'Women Prayer Hall', wing: 'المكتبات والمصليات', x: 104, y: 175, w: 42, h: 58, icon: 'business', color: '#D1FAE5' },
    { key: 'u_c11_g1', name_ar: 'صف 11 G1', name_en: 'Grade 11 G1', wing: 'جناح الصف 11', x: 80, y: 114, w: 38, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c11_g2', name_ar: 'صف 11 G2', name_en: 'Grade 11 G2', wing: 'جناح الصف 11', x: 42, y: 114, w: 36, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c11_g3', name_ar: 'صف 11 G3', name_en: 'Grade 11 G3', wing: 'جناح الصف 11', x: 4, y: 114, w: 36, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c11_a1', name_ar: 'صف 11 A1', name_en: 'Grade 11 A1', wing: 'جناح الصف 11', x: 80, y: 146, w: 38, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c11_a2', name_ar: 'صف 11 A2', name_en: 'Grade 11 A2', wing: 'جناح الصف 11', x: 42, y: 146, w: 36, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c11_a3', name_ar: 'صف 11 A3', name_en: 'Grade 11 A3', wing: 'جناح الصف 11', x: 4, y: 146, w: 36, h: 28, icon: 'school', color: '#FEF08A' },
    { key: 'u_c12_a1', name_ar: 'صف 12 A1', name_en: 'Grade 12 A1', wing: 'جناح الصف 12', x: 282, y: 114, w: 38, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c12_a2', name_ar: 'صف 12 A2', name_en: 'Grade 12 A2', wing: 'جناح الصف 12', x: 322, y: 114, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c12_a3', name_ar: 'صف 12 A3', name_en: 'Grade 12 A3', wing: 'جناح الصف 12', x: 360, y: 114, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c12_g1', name_ar: 'صف 12 G1', name_en: 'Grade 12 G1', wing: 'جناح الصف 12', x: 282, y: 146, w: 38, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c12_g2', name_ar: 'صف 12 G2', name_en: 'Grade 12 G2', wing: 'جناح الصف 12', x: 322, y: 146, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c12_g3', name_ar: 'صف 12 G3', name_en: 'Grade 12 G3', wing: 'جناح الصف 12', x: 360, y: 146, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c9_1', name_ar: 'صف التاسع G1', name_en: 'Grade 9 G1', wing: 'جناح الصف التاسع', x: 80, y: 260, w: 38, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c9_2', name_ar: 'صف التاسع G2', name_en: 'Grade 9 G2', wing: 'جناح الصف التاسع', x: 42, y: 260, w: 36, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c9_3', name_ar: 'صف التاسع G3', name_en: 'Grade 9 G3', wing: 'جناح الصف التاسع', x: 4, y: 260, w: 36, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c9_4', name_ar: 'صف التاسع A1', name_en: 'Grade 9 A1', wing: 'جناح الصف التاسع', x: 80, y: 292, w: 38, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c9_5', name_ar: 'صف التاسع A2', name_en: 'Grade 9 A2', wing: 'جناح الصف التاسع', x: 42, y: 292, w: 36, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c9_6', name_ar: 'صف التاسع A3', name_en: 'Grade 9 A3', wing: 'جناح الصف التاسع', x: 4, y: 292, w: 36, h: 28, icon: 'school', color: '#BBF7D0' },
    { key: 'u_c10_1', name_ar: 'صف العاشر A1', name_en: 'Grade 10 A1', wing: 'جناح الصف العاشر', x: 282, y: 260, w: 38, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c10_2', name_ar: 'صف العاشر A2', name_en: 'Grade 10 A2', wing: 'جناح الصف العاشر', x: 322, y: 260, w: 36, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c10_3', name_ar: 'صف العاشر A3', name_en: 'Grade 10 A3', wing: 'جناح الصف العاشر', x: 360, y: 260, w: 36, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c10_4', name_ar: 'صف العاشر G1', name_en: 'Grade 10 G1', wing: 'جناح الصف العاشر', x: 282, y: 292, w: 38, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c10_5', name_ar: 'صف العاشر G2', name_en: 'Grade 10 G2', wing: 'جناح الصف العاشر', x: 322, y: 292, w: 36, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c10_6', name_ar: 'صف العاشر G3', name_en: 'Grade 10 G3', wing: 'جناح الصف العاشر', x: 360, y: 292, w: 36, h: 28, icon: 'school', color: '#E9D5FF' },
    { key: 'u_c7_1', name_ar: 'صف السابع 1', name_en: 'Grade 7 - 1', wing: 'جناح الصف السابع', x: 4, y: 365, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c7_2', name_ar: 'صف السابع 2', name_en: 'Grade 7 - 2', wing: 'جناح الصف السابع', x: 42, y: 365, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c7_3', name_ar: 'صف السابع 3', name_en: 'Grade 7 - 3', wing: 'جناح الصف السابع', x: 80, y: 365, w: 38, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c7_4', name_ar: 'صف السابع 4', name_en: 'Grade 7 - 4', wing: 'جناح الصف السابع', x: 80, y: 398, w: 38, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c7_5', name_ar: 'صف السابع 5', name_en: 'Grade 7 - 5', wing: 'جناح الصف السابع', x: 42, y: 398, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c7_6', name_ar: 'صف السابع 6', name_en: 'Grade 7 - 6', wing: 'جناح الصف السابع', x: 4, y: 398, w: 36, h: 28, icon: 'school', color: '#FED7AA' },
    { key: 'u_c8_1', name_ar: 'صف الثامن 1', name_en: 'Grade 8 - 1', wing: 'جناح الصف الثامن', x: 360, y: 365, w: 36, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_c8_2', name_ar: 'صف الثامن 2', name_en: 'Grade 8 - 2', wing: 'جناح الصف الثامن', x: 322, y: 365, w: 36, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_c8_3', name_ar: 'صف الثامن 3', name_en: 'Grade 8 - 3', wing: 'جناح الصف الثامن', x: 282, y: 365, w: 38, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_c8_4', name_ar: 'صف الثامن 4', name_en: 'Grade 8 - 4', wing: 'جناح الصف الثامن', x: 282, y: 398, w: 38, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_c8_5', name_ar: 'صف الثامن 5', name_en: 'Grade 8 - 5', wing: 'جناح الصف الثامن', x: 322, y: 398, w: 36, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_c8_6', name_ar: 'صف الثامن 6', name_en: 'Grade 8 - 6', wing: 'جناح الصف الثامن', x: 360, y: 398, w: 36, h: 28, icon: 'school', color: '#BAE6FD' },
    { key: 'u_lab_phys_1', name_ar: 'مختبر الفيزياء 1', name_en: 'Physics Lab 1', wing: 'المختبرات', x: 114, y: 310, w: 38, h: 32, icon: 'flash', color: '#FECDD3' },
    { key: 'u_lab_chem_1', name_ar: 'مختبر الكيمياء 1', name_en: 'Chemistry Lab 1', wing: 'المختبرات', x: 154, y: 310, w: 38, h: 32, icon: 'flask', color: '#FECDD3' },
    { key: 'u_lab_chem_2', name_ar: 'مختبر الكيمياء 2', name_en: 'Chemistry Lab 2', wing: 'المختبرات', x: 208, y: 310, w: 38, h: 32, icon: 'flask', color: '#FECDD3' },
    { key: 'u_lab_phys_2', name_ar: 'مختبر الفيزياء 2', name_en: 'Physics Lab 2', wing: 'المختبرات', x: 248, y: 310, w: 38, h: 32, icon: 'flash', color: '#FECDD3' },
    { key: 'u_lab_robot', name_ar: 'مختبر روبوتات', name_en: 'Robotics Lab', wing: 'المختبرات', x: 208, y: 395, w: 38, h: 32, icon: 'hardware-chip', color: '#DDD6FE' },
    { key: 'u_lab_health', name_ar: 'مختبر علوم صحية', name_en: 'Health Science Lab', wing: 'المختبرات', x: 154, y: 395, w: 38, h: 32, icon: 'medkit', color: '#D1FAE5' },
  ],
};

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = STRINGS[lang];
  const isRTL = lang === 'ar';

  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [faults, setFaults] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('ground');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [urgentBanner, setUrgentBanner] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activeDevices, setActiveDevices] = useState([]);
  const [presenceModal, setPresenceModal] = useState(false);
  const [confirmKickId, setConfirmKickId] = useState(null);
  const deviceIdRef = useRef('');
  const lastActivityRef = useRef(Date.now());
  const IDLE_MS = 5 * 60 * 1000;

  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sideDrawerVisible, setSideDrawerVisible] = useState(false);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneImages, setZoneImages] = useState({});

  const isFetchingRef = useRef(false);
  const faultsRef = useRef([]);

  const [passwords, setPasswords] = useState({
    inspector: '1111',
    worker: '2222',
    supervisor: '3333',
  });

  const [locationsAuthModal, setLocationsAuthModal] = useState(false);
  const [locationsPinInput, setLocationsPinInput] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [selectedRoleToLogin, setSelectedRoleToLogin] = useState(null);
  const [inputPassword, setInputPassword] = useState('');

  const [managePinsModal, setManagePinsModal] = useState(false);
  const [adminAuthForPins, setAdminAuthForPins] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [newInspectorPin, setNewInspectorPin] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [newSupervisorPin, setNewSupervisorPin] = useState('');

  const [addLocationModal, setAddLocationModal] = useState(false);
  const [newLocNameAr, setNewLocNameAr] = useState('');
  const [newLocNameEn, setNewLocNameEn] = useState('');
  const [newLocFloor, setNewLocFloor] = useState('ground');
  const [newLocX, setNewLocX] = useState('50');
  const [newLocY, setNewLocY] = useState('380');
  const [newLocW, setNewLocW] = useState('38');
  const [newLocH, setNewLocH] = useState('28');

  const locationsList = [
    ...zones.ground.map((z) => ({
      id: z.key,
      name_ar: z.name_ar,
      name_en: z.name_en,
      floor: 'ground',
      wing: z.wing,
      zone_key: z.key,
    })),
    ...zones.upper.map((z) => ({
      id: z.key,
      name_ar: z.name_ar,
      name_en: z.name_en,
      floor: 'upper',
      wing: z.wing,
      zone_key: z.key,
    })),
  ];

  const faultTypes = [
    t.typeAc,
    t.typeElec,
    t.typePlumb,
    t.typeFurn,
    t.typeEquip,
  ];
  const priorities = [
    { id: 'high', label: t.prioHigh, color: colors.danger, bg: colors.dangerSoft },
    { id: 'medium', label: t.prioMedium, color: colors.warning, bg: colors.warningSoft },
    { id: 'low', label: t.prioLow, color: colors.info, bg: colors.infoSoft },
  ];

  const [activeFault, setActiveFault] = useState(null);
  const [newFaultModal, setNewFaultModal] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [selectedType, setSelectedType] = useState(t.typeAc);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [reporterName, setReporterName] = useState('');
  const [faultNote, setFaultNote] = useState('');
  const [capturedBeforePhoto, setCapturedBeforePhoto] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      const savedLang = await storage.getItem('APP_LANG_G_V3', 'ar');
      if (savedLang) setLang(savedLang);

      const savedZones = await storage.getItem('SAVED_ZONES_V2', null);
      if (savedZones) setZones(savedZones);

      const cloudZoneImgs = await api.getZoneImages();
      if (cloudZoneImgs) setZoneImages(cloudZoneImgs);

      await bootstrap();
    })();

    // مزامنة لحظية عبر Supabase Realtime مع الإبقاء على الفحص الدوري كاحتياط
    const channel = supabase
      .channel('faults_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faults' },
        () => {
          fetchFaults();
        }
      )
      .subscribe();

    const interval = setInterval(fetchFaults, 10000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (locationsList.length > 0 && !selectedLocId) {
      setSelectedLocId(locationsList[0].id);
    }
  }, [locationsList]);

  useEffect(() => {
    setSelectedType(t.typeAc);
  }, [lang]);

  useEffect(() => {
    (async () => {
      let id = await storage.getItem('DEVICE_ID_V1', '');
      if (!id) {
        id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await storage.setItem('DEVICE_ID_V1', id);
      }
      deviceIdRef.current = id;
    })();
  }, []);

  const deviceInfo = () => {
    const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
    const model = Device.modelName || (Platform.OS === 'web' ? 'Browser' : 'Device');
    const ver = Device.osVersion ? ` ${Device.osVersion}` : '';
    return { device_type: os, device_name: `${model} · ${os}${ver}` };
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const beat = async () => {
      if (!deviceIdRef.current) return;
      try {
        const res = await api.heartbeat({
          device_id: deviceIdRef.current,
          role: user.role,
          ...deviceInfo(),
        });
        if (res?.kicked) {
          if (mounted) {
            handleLogout();
            showToast(t.kickedMsg, 'error');
          }
          return;
        }
        const p = await api.getPresence();
        if (mounted && p?.devices) setActiveDevices(p.devices);
      } catch (e) {}
    };
    beat();
    const iv = setInterval(beat, 8000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [user]);

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (!user) return;
    lastActivityRef.current = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_MS) {
        handleLogout();
        showToast(t.idleLogoutMsg, 'error');
      }
    }, 20000);
    return () => clearInterval(iv);
  }, [user]);

  const handleKickDevice = async () => {
    if (!confirmKickId) return;
    try {
      await api.kickDevice(confirmKickId);
      setActiveDevices((prev) => prev.filter((d) => d.device_id !== confirmKickId));
      setConfirmKickId(null);
      showToast(t.deviceKicked, 'success');
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر فصل الجهاز.' : 'Failed to kick device.', 'error');
    }
  };

  const deviceIcon = (type) =>
    type === 'iOS'
      ? 'logo-apple'
      : type === 'Android'
      ? 'logo-android'
      : type === 'Web'
      ? 'globe-outline'
      : 'phone-portrait-outline';

  const roleLabel = (role) =>
    role === 'inspector'
      ? t.inspectorTitle
      : role === 'worker'
      ? t.workerTitle
      : t.supervisorTitle;

  const bootstrap = async () => {
    try {
      const cfg = await api.getConfig();
      if (cfg.pins) setPasswords(cfg.pins);
    } catch (e) {}
    await fetchFaults();
  };

  const fetchFaults = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const list = await api.getFaults();
      if (Array.isArray(list)) {
        faultsRef.current = list;
        setFaults(list);
      }
    } catch (e) {
    } finally {
      isFetchingRef.current = false;
    }
  };

  const toggleLanguage = async () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    await storage.setItem('APP_LANG_G_V3', nextLang);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchFaults();
    try {
      const cfg = await api.getConfig();
      if (cfg.pins) setPasswords(cfg.pins);
      const p = await api.getPresence();
      if (p?.devices) setActiveDevices(p.devices);
    } catch (e) {}
    const imgs = await api.getZoneImages();
    if (imgs) setZoneImages(imgs);
    setRefreshing(false);
    showToast(lang === 'ar' ? 'تمت المزامنة بنجاح.' : 'Sync completed.', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setTab('home');
  };

  const handlePressLocationsTab = () => {
    setLocationsPinInput('');
    setLocationsAuthModal(true);
  };

  const handleVerifyLocationsPin = () => {
    if (locationsPinInput.trim() === LOCATIONS_SECRET_PIN) {
      setLocationsAuthModal(false);
      setTab('locations');
    } else {
      showToast(lang === 'ar' ? 'الرقم السري غير صحيح.' : 'Invalid PIN code.', 'error');
    }
  };

  const handleAddNewLocation = async () => {
    if (!newLocNameAr.trim()) {
      showToast(lang === 'ar' ? 'يرجى كتابة اسم الموقع.' : 'Please enter location name.', 'error');
      return;
    }
    const newKey = `loc_${Date.now()}`;
    const newZoneObj = {
      key: newKey,
      name_ar: newLocNameAr.trim(),
      name_en: newLocNameEn.trim() || newLocNameAr.trim(),
      wing: 'مرافق مضافة',
      x: parseInt(newLocX) || 50,
      y: parseInt(newLocY) || 380,
      w: parseInt(newLocW) || 38,
      h: parseInt(newLocH) || 28,
      icon: 'school',
      color: '#E2E8F0',
    };
    try {
      const updatedZones = {
        ...zones,
        [newLocFloor]: [...zones[newLocFloor], newZoneObj],
      };
      setZones(updatedZones);
      await storage.setItem('SAVED_ZONES_V2', updatedZones);
      setAddLocationModal(false);
      setNewLocNameAr('');
      setNewLocNameEn('');
      showToast(lang === 'ar' ? 'تمت إضافة الموقع بنجاح.' : 'Location added successfully.', 'success');
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر إضافة الموقع.' : 'Failed to add location.', 'error');
    }
  };

  const handlePressZone = (zone) => {
    setSelectedZoneInfo(zone);
    setSideDrawerVisible(true);
  };

  const buildFaultHtml = (fault) => {
    const locName = lang === 'ar' ? fault.location_name_ar : fault.location_name_en || fault.location_name_ar;
    return `
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head><meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; padding: 25px; background: #fff; color: #0F172A; }
          .header { text-align: center; border-bottom: 2px solid #0284C7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; margin: 0; }
          .subtitle { font-size: 14px; color: #64748B; margin-top: 5px; }
          .box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .label { font-weight: bold; color: #475569; }
          .photos-container { display: flex; justify-content: space-between; gap: 15px; margin-top: 20px; }
          .photo-card { width: 48%; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; text-align: center; }
          .photo-title { background: #F1F5F9; font-weight: bold; padding: 6px; font-size: 13px; }
          .img { width: 100%; height: 180px; object-fit: cover; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px; }
        </style></head>
        <body>
          <div class="header">
            <h1 class="title">${lang === 'ar' ? 'مجمع زايد التعليمي' : 'Zayed Educational Complex'}</h1>
            <p class="subtitle">${lang === 'ar' ? 'تقرير حالة بلاغ صيانة معتمد' : 'Certified Maintenance Status Report'}</p>
          </div>
          <div class="box">
            <div class="row"><span class="label">${lang === 'ar' ? 'رقم البلاغ:' : 'Fault ID:'}</span><span>#${fault.display_id || fault.id?.slice(-4) || '1'}</span></div>
            <div class="row"><span class="label">${lang === 'ar' ? 'الموقع بالمجمع:' : 'Location:'}</span><span>${locName} (${fault.floor === 'ground' ? t.floorGround : t.floorUpper})</span></div>
            <div class="row"><span class="label">${lang === 'ar' ? 'تصنيف العطل:' : 'Category:'}</span><span>${fault.type}</span></div>
            <div class="row"><span class="label">${lang === 'ar' ? 'مستوى الأهمية:' : 'Priority:'}</span><span>${fault.priority === 'high' ? t.prioHigh : fault.priority === 'medium' ? t.prioMedium : t.prioLow}</span></div>
            <div class="row"><span class="label">${lang === 'ar' ? 'حالة البلاغ:' : 'Status:'}</span><span>${fault.status === 'completed' ? t.statusCompleted : fault.status === 'in_progress' ? t.statusProgress : t.statusNew}</span></div>
            <div class="row"><span class="label">${lang === 'ar' ? 'مقدم البلاغ:' : 'Reporter:'}</span><span>${fault.reporter_name} (${fault.created_at || ''})</span></div>
            ${fault.worker_name ? `<div class="row"><span class="label">${lang === 'ar' ? 'مسؤول التسوية:' : 'Settled By:'}</span><span>${fault.worker_name}</span></div>` : ''}
            <div class="row"><span class="label">${lang === 'ar' ? 'ملاحظات العطل:' : 'Notes:'}</span><span>${fault.note}</span></div>
          </div>
          <div class="photos-container">
            <div class="photo-card">
              <div class="photo-title">${lang === 'ar' ? 'صورة العطل (قبل)' : 'Fault Photo (Before)'}</div>
              <img src="${fault.before_photo}" class="img" />
            </div>
            ${fault.after_photo ? `<div class="photo-card"><div class="photo-title">${lang === 'ar' ? 'صورة الإنجاز (بعد)' : 'Settlement Photo (After)'}</div><img src="${fault.after_photo}" class="img" /></div>` : `<div class="photo-card" style="display:flex;align-items:center;justify-content:center;height:180px;"><span style="color:#94A3B8;">${lang === 'ar' ? 'بانتظار صورة بعد التسوية' : 'Awaiting completion photo'}</span></div>`}
          </div>
          <div class="footer">${lang === 'ar' ? 'تم استخراج هذا التقرير إلكترونياً من منظومة مجمع زايد التعليمي' : 'Electronically generated by Zayed Educational Complex'}</div>
        </body>
      </html>`;
  };

  const exportFaultPDF = async (fault) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: buildFaultHtml(fault) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر استخراج ملف الـ PDF.' : 'Failed to export PDF.', 'error');
    }
  };

  const exportAllFaultsPDF = async () => {
    if (faults.length === 0) {
      showToast(lang === 'ar' ? 'لا توجد بلاغات مسجلة.' : 'No faults registered.', 'error');
      return;
    }
    const rowsHtml = faults
      .map(
        (f, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 12px;">
        <td style="padding: 8px;">#${f.display_id || idx + 1}</td>
        <td style="padding: 8px;">${lang === 'ar' ? f.location_name_ar : f.location_name_en || f.location_name_ar}</td>
        <td style="padding: 8px;">${f.type}</td>
        <td style="padding: 8px;">${f.priority === 'high' ? t.prioHigh : f.priority === 'medium' ? t.prioMedium : t.prioLow}</td>
        <td style="padding: 8px;">${f.status === 'completed' ? t.statusCompleted : f.status === 'in_progress' ? t.statusProgress : t.statusNew}</td>
        <td style="padding: 8px;">${f.reporter_name}</td>
        <td style="padding: 8px;">${f.created_at || ''}</td>
      </tr>`
      )
      .join('');
    const html = `
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head><meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; padding: 20px; color: #0F172A; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0284C7; padding-bottom: 10px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0F172A; color: #fff; padding: 8px; font-size: 12px; }
        </style></head>
        <body>
          <div class="header">
            <h2>${lang === 'ar' ? 'مجمع زايد التعليمي - سجل البلاغات العام' : 'Zayed Complex - Comprehensive Faults Record'}</h2>
            <p style="color: #64748B; font-size: 13px;">${lang === 'ar' ? 'تاريخ الاستخراج:' : 'Generated Date:'} ${new Date().toLocaleDateString()}</p>
          </div>
          <table><thead><tr>
            <th>#</th><th>${lang === 'ar' ? 'المرفق' : 'Facility'}</th><th>${lang === 'ar' ? 'النوع' : 'Type'}</th>
            <th>${lang === 'ar' ? 'الأولوية' : 'Priority'}</th><th>${lang === 'ar' ? 'الحالة' : 'Status'}</th>
            <th>${lang === 'ar' ? 'المفتش' : 'Reporter'}</th><th>${lang === 'ar' ? 'الوقت' : 'Time'}</th>
          </tr></thead><tbody>${rowsHtml}</tbody></table>
        </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر استخراج ملف الـ PDF.' : 'Failed to export PDF.', 'error');
    }
  };

  const handleExportZoneFaultsPDF = async (zone) => {
    const zoneFaults = faults.filter((f) => f.location_id === zone.key);
    if (zoneFaults.length === 0) {
      showToast(lang === 'ar' ? 'المرفق سليم، لا توجد أعطال مسجلة لسحبها.' : 'No faults registered for this facility.', 'info');
      return;
    }

    const zoneName = lang === 'ar' ? zone.name_ar : zone.name_en || zone.name_ar;
    const rowsHtml = zoneFaults
      .map(
        (f, idx) => `
      <div style="border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #F8FAFC;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
          <span>بلاغ #${f.display_id || idx + 1} - ${f.type}</span>
          <span style="color: ${f.status === 'completed' ? '#10B981' : '#EF4444'}">${f.status === 'completed' ? 'تمت التسوية' : 'قيد العمل'}</span>
        </div>
        <p style="margin: 4px 0; font-size: 13px; color: #475569;">المفتش: ${f.reporter_name} | التاريخ: ${f.created_at || ''}</p>
        ${f.note ? `<p style="margin: 4px 0; font-size: 13px;">ملاحظات: ${f.note}</p>` : ''}
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <div style="width: 48%; text-align: center;">
            <p style="font-size: 11px; margin: 2px;">صورة العطل</p>
            <img src="${f.before_photo}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px;" />
          </div>
          ${f.after_photo ? `
          <div style="width: 48%; text-align: center;">
            <p style="font-size: 11px; margin: 2px;">صورة الإنجاز</p>
            <img src="${f.after_photo}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 6px;" />
          </div>` : ''}
        </div>
      </div>`
      )
      .join('');

    const html = `
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head><meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; padding: 20px; color: #0F172A; }
          .header { text-align: center; border-bottom: 2px solid #0284C7; padding-bottom: 10px; margin-bottom: 15px; }
        </style></head>
        <body>
          <div class="header">
            <h2>مجمع زايد التعليمي - ملف أعطال المرفق</h2>
            <h3>المرفق: ${zoneName} (${zone.wing})</h3>
            <p style="color: #64748B; font-size: 12px;">تاريخ الاستخراج: ${new Date().toLocaleDateString()}</p>
          </div>
          ${rowsHtml}
        </body>
      </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر استخراج ملف الـ PDF.' : 'Failed to export PDF.', 'error');
    }
  };

  const promptPasswordLogin = (role) => {
    setSelectedRoleToLogin(role);
    setInputPassword('');
    setAuthModalVisible(true);
  };

  const handleVerifyPassword = () => {
    if (!selectedRoleToLogin) return;
    if (inputPassword === passwords[selectedRoleToLogin]) {
      setUser({
        role: selectedRoleToLogin,
        name:
          selectedRoleToLogin === 'inspector'
            ? lang === 'ar'
              ? 'مفتش صيانة مجمع زايد'
              : 'Zayed Complex Inspector'
            : selectedRoleToLogin === 'worker'
            ? lang === 'ar'
              ? 'مسؤول تسوية الأعطال'
              : 'Fault Settlement Officer'
            : lang === 'ar'
            ? 'مشرف إدارة المجمع (مشاهدة)'
            : 'Complex Supervisor (Viewer)',
      });
      setAuthModalVisible(false);
      setInputPassword('');
    } else {
      showToast(lang === 'ar' ? 'الرقم السري غير صحيح.' : 'Invalid PIN code.', 'error');
    }
  };

  const handleOpenPinManager = () => {
    setAdminPinInput('');
    setAdminAuthForPins(false);
    setNewInspectorPin(passwords.inspector);
    setNewWorkerPin(passwords.worker);
    setNewSupervisorPin(passwords.supervisor);
    setManagePinsModal(true);
  };

  const handleVerifyAdminForPins = () => {
    if (adminPinInput.trim() === PIN_MANAGER_SECRET_PIN) {
      setAdminAuthForPins(true);
    } else {
      showToast(lang === 'ar' ? 'الرقم السري غير صحيح.' : 'Invalid PIN.', 'error');
    }
  };

  const handleSaveNewPins = async () => {
    if (!newInspectorPin || !newWorkerPin || !newSupervisorPin) {
      showToast(lang === 'ar' ? 'يرجى ملء كافة الأرقام.' : 'Please fill all PINs.', 'error');
      return;
    }
    const updatedPins = {
      inspector: newInspectorPin.trim(),
      worker: newWorkerPin.trim(),
      supervisor: newSupervisorPin.trim(),
    };
    try {
      await api.updatePins(updatedPins);
      setPasswords(updatedPins);
      setManagePinsModal(false);
      showToast(lang === 'ar' ? 'تم تحديث ومزامنة الأرقام السرية سحابياً.' : 'PINs synced to cloud.', 'success');
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر حفظ الأرقام.' : 'Failed to save PINs.', 'error');
    }
  };

  // التقاط الصور مع حماية ضد توقف الكاميرا
  const pickImage = async (useCamera = true, isAfter = false) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        showToast(lang === 'ar' ? 'يرجى تفعيل إذن الكاميرا/الصور من الإعدادات.' : 'Camera permission required.', 'error');
        return;
      }

      // إلغاء القص التلقائي الذي يسبب تعليق الكاميرا
      const options = {
        allowsEditing: false,
        quality: 0.35,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;

        // إظهار الصورة فوراً على الشاشة
        if (!isAfter) {
          setCapturedBeforePhoto(localUri);
        }

        setUploadingPhoto(true);
        try {
          const photoUrl = await api.uploadImage(localUri);
          if (isAfter) {
            await handleCompleteRepair(activeFault.id, photoUrl);
          } else {
            setCapturedBeforePhoto(photoUrl);
          }
        } catch (e) {
          if (!isAfter) {
            setCapturedBeforePhoto(DEFAULT_PHOTO);
          }
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (err) {
      console.error('Camera open error:', err);
      showToast(lang === 'ar' ? 'تعذر فتح الكاميرا.' : 'Error opening camera.', 'error');
    }
  };

  const handleLongPressZone = async (zone) => {
    if (!user || user.role === 'worker') return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast(lang === 'ar' ? 'يرجى السماح بالوصول للصور.' : 'Permission required.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const cloudUrl = await api.uploadImage(result.assets[0].uri);
        const newImages = { ...zoneImages, [zone.key]: cloudUrl };
        setZoneImages(newImages);
        await api.saveZoneImages(newImages);
        showToast(lang === 'ar' ? 'تم حفظ ومزامنة لافتة المرفق سحابياً.' : 'Signboard photo synced.', 'success');
      } catch (e) {
        showToast(lang === 'ar' ? 'تعذر رفع الصورة.' : 'Failed to upload.', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleCreateFault = async () => {
    const loc = locationsList.find((l) => l.id === selectedLocId) || locationsList[0];
    if (!loc) {
      showToast(lang === 'ar' ? 'يرجى تحديد الموقع أولاً.' : 'Please select location.', 'error');
      return;
    }
    setLoading(true);
    try {
      const faultPayload = {
        location_id: loc.id,
        location_name_ar: loc.name_ar,
        location_name_en: loc.name_en,
        floor: loc.floor,
        type: selectedType,
        priority: selectedPriority,
        reporter_name: reporterName.trim() || user?.name || (lang === 'ar' ? 'مفتش' : 'Inspector'),
        note: faultNote.trim() || '',
        before_photo: capturedBeforePhoto || DEFAULT_PHOTO,
      };

      const created = await api.createFault(faultPayload);
      await fetchFaults();
      setNewFaultModal(false);
      setFaultNote('');
      setCapturedBeforePhoto(null);
      showToast(
        `${lang === 'ar' ? 'تم تسجيل البلاغ بنجاح' : 'Logged report successfully'} #${created?.display_id || ''}`,
        'success'
      );
    } catch (e) {
      console.error('Create fault error details:', e);
      const msg = e?.message || (lang === 'ar' ? 'تعذر إرسال البلاغ.' : 'Failed to send report.');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRepair = async (faultId) => {
    try {
      const updated = await api.startRepair(faultId, user?.name || '');
      setActiveFault(updated);
      await fetchFaults();
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر بدء المهمة.' : 'Failed to start.', 'error');
    }
  };

  const handleCompleteRepair = async (faultId, afterPhotoUri) => {
    try {
      const updated = await api.completeRepair(faultId, user?.name || '', afterPhotoUri || DEFAULT_PHOTO);
      setActiveFault(updated);
      await fetchFaults();
      showToast(lang === 'ar' ? 'تم تأكيد تسوية العطل.' : 'Fault settled successfully.', 'success');
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر تأكيد التسوية.' : 'Failed to settle.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.deleteFault(confirmDeleteId);
      setConfirmDeleteId(null);
      setActiveFault(null);
      await fetchFaults();
      showToast(lang === 'ar' ? 'تم حذف البلاغ.' : 'Record deleted.', 'success');
    } catch (e) {
      showToast(lang === 'ar' ? 'تعذر الحذف.' : 'Failed to delete.', 'error');
    }
  };

  const filteredFaults = faults.filter((f) => {
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    const name = (lang === 'ar' ? f.location_name_ar : f.location_name_en || f.location_name_ar).toLowerCase();
    const type = f.type.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return matchStatus && (query === '' || name.includes(query) || type.includes(query));
  });

  const filteredLocations = locationsList.filter((l) => {
    const name = (lang === 'ar' ? l.name_ar : l.name_en || l.name_ar).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return query === '' || name.includes(query);
  });

  const BackButton = ({ onPress, style }) => (
    <Pressable
      style={[styles.universalBackBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }, style]}
      onPress={onPress}>
      <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={16} color="#fff" />
      <Text style={styles.universalBackBtnTxt}>{t.back}</Text>
    </Pressable>
  );

  const Toast = () =>
    toast ? (
      <View
        testID="app-toast"
        style={[
          styles.toast,
          {
            backgroundColor:
              toast.type === 'error'
                ? colors.danger
                : toast.type === 'success'
                ? colors.success
                : colors.primary,
          },
        ]}>
        <Ionicons
          name={toast.type === 'error' ? 'alert-circle' : toast.type === 'success' ? 'checkmark-circle' : 'information-circle'}
          size={18}
          color="#fff"
        />
        <Text style={styles.toastTxt} numberOfLines={2}>{toast.msg}</Text>
      </View>
    ) : null;

  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loginHeader}>
            <Pressable testID="lang-toggle-login" style={styles.langSwitchBtn} onPress={toggleLanguage}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.langSwitchTxt}>{t.langBtn}</Text>
            </Pressable>
            <Ionicons name="business" size={40} color="#fff" />
            <Text style={styles.loginTitle}>{t.appTitle}</Text>
            <Text style={styles.loginSub}>{t.appSub}</Text>
          </View>

          <ScrollView style={styles.loginBody} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.loginPrompt, { textAlign: isRTL ? 'right' : 'left' }]}>{t.choosePortal}</Text>

            <Pressable testID="login-inspector-btn" style={[styles.roleBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => promptPasswordLogin('inspector')}>
              <Ionicons name="search" size={22} color={colors.primarySoft} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.roleBtnTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.inspectorTitle}</Text>
                  <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
                </View>
                <Text style={[styles.roleBtnSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t.inspectorSub}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
            </Pressable>

            <Pressable testID="login-worker-btn" style={[styles.roleBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => promptPasswordLogin('worker')}>
              <Ionicons name="construct" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.roleBtnTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.workerTitle}</Text>
                  <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
                </View>
                <Text style={[styles.roleBtnSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t.workerSub}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
            </Pressable>

            <Pressable testID="login-supervisor-btn" style={[styles.roleBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => promptPasswordLogin('supervisor')}>
              <Ionicons name="eye" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.roleBtnTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.supervisorTitle}</Text>
                  <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
                </View>
                <Text style={[styles.roleBtnSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t.supervisorSub}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
            </Pressable>

            <Pressable testID="pin-manager-btn" style={[styles.pinControlBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleOpenPinManager}>
              <Ionicons name="keypad" size={20} color={colors.primarySoft} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pinControlTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.pinControlTitle}</Text>
                <Text style={[styles.pinControlSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t.pinControlSub}</Text>
              </View>
              <Ionicons name="settings-outline" size={18} color={colors.primarySoft} />
            </Pressable>
          </ScrollView>

          <Modal visible={authModalVisible} animationType="fade" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
              <View style={styles.authDialog}>
                <View style={styles.authIconWrap}>
                  <Ionicons name="lock-closed" size={26} color={colors.primarySoft} />
                </View>
                <Text style={styles.authTitle}>
                  {selectedRoleToLogin === 'inspector' ? t.inspectorTitle : selectedRoleToLogin === 'worker' ? t.workerTitle : t.supervisorTitle}
                </Text>
                <Text style={styles.authSub}>{t.enterPin}</Text>
                <TextInput
                  testID="login-pin-input"
                  style={styles.pinInput}
                  placeholder="••••"
                  placeholderTextColor={colors.slate400}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  autoFocus
                />
                <Pressable testID="login-confirm-btn" style={styles.btnPrimary} onPress={handleVerifyPassword}>
                  <Text style={styles.btnTxt}>{t.confirmLogin}</Text>
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setAuthModalVisible(false)}>
                  <Text style={styles.btnCloseTxt}>{t.cancel}</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          <Modal visible={managePinsModal} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={[styles.modalTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.pinControlTitle}</Text>
                  {!adminAuthForPins ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <Text style={[styles.authSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {lang === 'ar' ? 'يرجى إدخال الرقم السري المصرح به للتحكم في أرقام السر:' : 'Enter authorized PIN Manager security code:'}
                      </Text>
                      <TextInput
                        testID="admin-pin-input"
                        style={styles.pinInput}
                        placeholder="•••••••••••"
                        placeholderTextColor={colors.slate400}
                        keyboardType="numeric"
                        secureTextEntry
                        value={adminPinInput}
                        onChangeText={setAdminPinInput}
                        autoFocus
                      />
                      <Pressable testID="admin-verify-btn" style={styles.btnPrimary} onPress={handleVerifyAdminForPins}>
                        <Text style={styles.btnTxt}>{lang === 'ar' ? 'التحقق والدخول' : 'Verify & Access'}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ gap: 12, marginTop: 10 }}>
                      <View>
                        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.inspectorTitle} PIN:</Text>
                        <TextInput testID="new-inspector-pin" style={styles.input} keyboardType="numeric" value={newInspectorPin} onChangeText={setNewInspectorPin} />
                      </View>
                      <View>
                        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.workerTitle} PIN:</Text>
                        <TextInput testID="new-worker-pin" style={styles.input} keyboardType="numeric" value={newWorkerPin} onChangeText={setNewWorkerPin} />
                      </View>
                      <View>
                        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.supervisorTitle} PIN:</Text>
                        <TextInput testID="new-supervisor-pin" style={styles.input} keyboardType="numeric" value={newSupervisorPin} onChangeText={setNewSupervisorPin} />
                      </View>
                      <Pressable testID="save-pins-btn" style={styles.btnSuccess} onPress={handleSaveNewPins}>
                        <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnTxt}>{lang === 'ar' ? 'حفظ ومزامنة الأرقام سحابياً' : 'Save & Sync PINs (Cloud)'}</Text>
                      </Pressable>
                    </View>
                  )}
                  <Pressable style={styles.btnClose} onPress={() => setManagePinsModal(false)}>
                    <Text style={styles.btnCloseTxt}>{t.close}</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>
          <Toast />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const stats = {
    total: faults.length,
    new: faults.filter((f) => f.status === 'new').length,
    in_progress: faults.filter((f) => f.status === 'in_progress').length,
    completed: faults.filter((f) => f.status === 'completed').length,
  };

  const specialtyOptions = [
    { key: 'all', label: t.typeAll, icon: 'grid-outline' },
    { key: t.typeAc, label: t.typeAc, icon: 'snow-outline' },
    { key: t.typeElec, label: t.typeElec, icon: 'flash-outline' },
    { key: t.typePlumb, label: t.typePlumb, icon: 'water-outline' },
    { key: t.typeFurn, label: t.typeFurn, icon: 'bed-outline' },
    { key: t.typeEquip, label: t.typeEquip, icon: 'hardware-chip-outline' },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} onStartShouldSetResponderCapture={() => { resetActivity(); return false; }}>
        {urgentBanner && (
          <View testID="urgent-banner" style={[styles.urgentAlertBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.urgentAlertTxt} numberOfLines={1}>{urgentBanner}</Text>
          </View>
        )}

        {/* 1. الشاشة الرئيسية */}
        {tab === 'home' && (
          <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 70 }}>
            <View style={styles.dashHeader}>
              <View style={[styles.dashRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View>
                  <Text style={[styles.dashSub, { textAlign: isRTL ? 'right' : 'left' }]}>{t.welcome}</Text>
                  <Text style={[styles.dashName, { textAlign: isRTL ? 'right' : 'left' }]}>{user.name}</Text>
                  <View style={styles.roleTagWrap}>
                    <Text style={[styles.dashRole, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {user.role === 'inspector' ? t.roleInspectorTag : user.role === 'worker' ? t.roleWorkerTag : t.roleSupervisorTag}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable testID="presence-pill" style={styles.presencePill} onPress={() => setPresenceModal(true)}>
                    <View style={styles.liveDot} />
                    <Ionicons name="phone-portrait-outline" size={12} color="#fff" />
                    <Text style={styles.presencePillTxt}>{activeDevices.length}</Text>
                  </Pressable>
                  <Pressable testID="refresh-btn" style={styles.refreshHeaderBtn} onPress={handleManualRefresh}>
                    {refreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sync-outline" size={16} color="#fff" />}
                  </Pressable>
                  <Pressable testID="lang-toggle-home" style={styles.langSwitchHeaderBtn} onPress={toggleLanguage}>
                    <Text style={styles.langSwitchTxt}>{t.langBtn}</Text>
                  </Pressable>
                  <Pressable testID="logout-btn" onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.statBox, { backgroundColor: colors.infoSoft }]}>
                <Ionicons name="layers" size={18} color={colors.info} />
                <Text style={styles.statVal}>{stats.total}</Text>
                <Text style={styles.statLbl}>{t.statTotal}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.statVal}>{stats.new}</Text>
                <Text style={styles.statLbl}>{t.statNew}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="hammer" size={18} color="#B45309" />
                <Text style={styles.statVal}>{stats.in_progress}</Text>
                <Text style={styles.statLbl}>{t.statProgress}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="checkmark-done-circle" size={18} color={colors.success} />
                <Text style={styles.statVal}>{stats.completed}</Text>
                <Text style={styles.statLbl}>{t.statCompleted}</Text>
              </View>
            </View>

            <View style={styles.actionsList}>
              <Pressable testID="action-map" style={[styles.actionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setTab('map')}>
                <Ionicons name="map" size={20} color={colors.primarySoft} />
                <Text style={[styles.actionTxt, { textAlign: isRTL ? 'right' : 'left' }]}>{t.actionMap}</Text>
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
              </Pressable>

              <Pressable testID="action-faults" style={[styles.actionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setTab('faults')}>
                <Ionicons name="clipboard" size={20} color={colors.primary} />
                <Text style={[styles.actionTxt, { textAlign: isRTL ? 'right' : 'left' }]}>{t.actionFaultsList}</Text>
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
              </Pressable>

              <Pressable testID="action-presence" style={[styles.actionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setPresenceModal(true)}>
                <Ionicons name="pulse" size={20} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTxt, { textAlign: isRTL ? 'right' : 'left' }]}>{t.actionPresence}</Text>
                </View>
                <View style={styles.presenceCountBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.presenceCountTxt}>{activeDevices.length}</Text>
                </View>
              </Pressable>

              <Pressable
                testID="action-export-all"
                style={[styles.actionItem, { backgroundColor: '#F8FAFC', borderColor: colors.primarySoft, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={exportAllFaultsPDF}>
                <Ionicons name="document-text" size={20} color={colors.primarySoft} />
                <Text style={[styles.actionTxt, { color: colors.primarySoft, textAlign: isRTL ? 'right' : 'left' }]}>{t.actionExportAll}</Text>
                <Ionicons name="download-outline" size={18} color={colors.primarySoft} />
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* 2. شاشة المخطط الهندسي */}
        {tab === 'map' && (
          <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
            <View style={[styles.tabHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
              <BackButton onPress={() => setTab('home')} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.tabTitle}>{t.mapHeader}</Text>
              </View>
              <View style={{ width: 65 }} />
            </View>

            <View style={styles.floorPillContainer}>
              <View style={[styles.floorPill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable
                  style={[styles.floorPillBtn, selectedFloor === 'ground' && styles.floorPillBtnActive]}
                  onPress={() => setSelectedFloor('ground')}>
                  <Text style={[styles.floorPillTxt, selectedFloor === 'ground' && { color: '#fff' }]}>{t.floorGround}</Text>
                </Pressable>
                <Pressable
                  style={[styles.floorPillBtn, selectedFloor === 'upper' && styles.floorPillBtnActive]}
                  onPress={() => setSelectedFloor('upper')}>
                  <Text style={[styles.floorPillTxt, selectedFloor === 'upper' && { color: '#fff' }]}>{t.floorUpper}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.specialtyBarContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.specialtyScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {specialtyOptions.map((opt) => {
                  const isSelected = selectedSpecialty === opt.key;
                  const countInFloor = faults.filter((f) => {
                    const matchFloor = f.floor === selectedFloor;
                    const isOpen = f.status !== 'completed';
                    const matchSpec = opt.key === 'all' || f.type === opt.key;
                    return matchFloor && isOpen && matchSpec;
                  }).length;

                  return (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.specialtyChip,
                        isSelected && styles.specialtyChipActive,
                      ]}
                      onPress={() => setSelectedSpecialty(opt.key)}>
                      <Ionicons
                        name={opt.icon}
                        size={14}
                        color={isSelected ? '#fff' : colors.primarySoft}
                      />
                      <Text style={[styles.specialtyChipTxt, isSelected && { color: '#fff', fontWeight: 'bold' }]}>
                        {opt.label}
                      </Text>
                      {countInFloor > 0 && (
                        <View style={[styles.specialtyBadge, isSelected && { backgroundColor: '#fff' }]}>
                          <Text style={[styles.specialtyBadgeTxt, isSelected && { color: colors.danger }]}>
                            {countInFloor}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.blueprintCanvas}>
              {zones[selectedFloor].map((z) => {
                const zoneFaults = faults.filter((f) => f.location_id === z.key && f.status !== 'completed');
                const hasAnyFault = zoneFaults.length > 0;
                const name = lang === 'ar' ? z.name_ar : z.name_en || z.name_ar;
                const signImage = zoneImages[z.key];

                const hasSpecialtyFault =
                  selectedSpecialty === 'all'
                    ? hasAnyFault
                    : zoneFaults.some((f) => f.type === selectedSpecialty);

                const isDimmed = selectedSpecialty !== 'all' && !hasSpecialtyFault;

                return (
                  <Pressable
                    key={z.key}
                    style={[
                      styles.zoneItem,
                      {
                        left: `${(z.x / PLAN_W) * 100}%`,
                        top: `${(z.y / PLAN_H) * 100}%`,
                        width: `${(z.w / PLAN_W) * 100}%`,
                        height: `${(z.h / PLAN_H) * 100}%`,
                        backgroundColor: hasSpecialtyFault
                          ? '#FEE2E2'
                          : signImage
                          ? '#FFFFFF'
                          : z.color || '#EFF6FF',
                        borderColor: hasSpecialtyFault ? colors.danger : colors.cadLine,
                        borderWidth: hasSpecialtyFault ? 2 : 1,
                        opacity: isDimmed ? 0.22 : 1,
                      },
                    ]}
                    onPress={() => handlePressZone(z)}
                    onLongPress={() => handleLongPressZone(z)}
                    delayLongPress={500}>
                    {signImage ? (
                      <Image source={{ uri: signImage }} style={styles.zoneSignImage} contentFit="contain" />
                    ) : (
                      <>
                        <Ionicons name={z.icon || 'business'} size={11} color={colors.primary} />
                        <Text
                          style={[
                            styles.zoneTxt,
                            hasSpecialtyFault && { color: colors.danger, fontWeight: 'bold' },
                          ]}
                          numberOfLines={2}>
                          {name}
                        </Text>
                      </>
                    )}
                    {hasSpecialtyFault && (
                      <View style={styles.zoneBadge}>
                        <Text style={styles.zoneBadgeTxt}>
                          {selectedSpecialty === 'all'
                            ? zoneFaults.length
                            : zoneFaults.filter((f) => f.type === selectedSpecialty).length}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.quickNavContainer}>
              <Text style={[styles.quickNavTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.wingsQuickNav}</Text>
              <View style={[styles.quickGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {zones[selectedFloor].map((z) => {
                  const zoneFaults = faults.filter((f) => f.location_id === z.key && f.status !== 'completed');
                  const hasAnyFault = zoneFaults.length > 0;
                  const name = lang === 'ar' ? z.name_ar : z.name_en || z.name_ar;
                  const signImage = zoneImages[z.key];

                  const hasSpecialtyFault =
                    selectedSpecialty === 'all'
                      ? hasAnyFault
                      : zoneFaults.some((f) => f.type === selectedSpecialty);

                  const isDimmed = selectedSpecialty !== 'all' && !hasSpecialtyFault;

                  return (
                    <Pressable
                      key={`quick_${z.key}`}
                      style={[
                        styles.quickCard,
                        { borderColor: hasSpecialtyFault ? colors.danger : colors.border },
                        hasSpecialtyFault && { backgroundColor: '#FEF2F2' },
                        { opacity: isDimmed ? 0.35 : 1 },
                      ]}
                      onPress={() => handlePressZone(z)}
                      onLongPress={() => handleLongPressZone(z)}
                      delayLongPress={500}>
                      {signImage ? (
                        <Image source={{ uri: signImage }} style={{ width: 26, height: 18, borderRadius: 4 }} contentFit="contain" />
                      ) : (
                        <Ionicons name={z.icon || 'school'} size={15} color={hasSpecialtyFault ? colors.danger : colors.primarySoft} />
                      )}
                      <Text style={[styles.quickCardTxt, hasSpecialtyFault && { color: colors.danger, fontWeight: 'bold' }]} numberOfLines={1}>{name}</Text>
                      {hasSpecialtyFault && (
                        <View style={[styles.zoneBadge, { position: 'relative', top: 0, right: 0 }]}>
                          <Text style={styles.zoneBadgeTxt}>
                            {selectedSpecialty === 'all'
                              ? zoneFaults.length
                              : zoneFaults.filter((f) => f.type === selectedSpecialty).length}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* 3. الشريط الجانبي التفاعلي للغرفة / المرفق */}
        <Modal visible={sideDrawerVisible} animationType="fade" transparent>
          <View style={[styles.sideDrawerBackdrop, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
            <View style={styles.sideDrawerContent}>
              {selectedZoneInfo &&
                (() => {
                  const zoneName = lang === 'ar' ? selectedZoneInfo.name_ar : selectedZoneInfo.name_en || selectedZoneInfo.name_ar;
                  const activeZoneFaults = faults.filter((f) => f.location_id === selectedZoneInfo.key && f.status !== 'completed');
                  const hasActiveFaults = activeZoneFaults.length > 0;
                  const zoneImageUrl = zoneImages[selectedZoneInfo.key];

                  return (
                    <View style={{ flex: 1 }}>
                      <View style={[styles.sideDrawerHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons name={selectedZoneInfo.icon || 'business'} size={24} color={colors.primarySoft} />
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.sideDrawerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{zoneName}</Text>
                          <Text style={[styles.sideDrawerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {selectedZoneInfo.wing} · {selectedFloor === 'ground' ? t.floorGround : t.floorUpper}
                          </Text>
                        </View>
                        <Pressable style={styles.drawerCloseBtn} onPress={() => setSideDrawerVisible(false)}>
                          <Ionicons name="close" size={20} color={colors.text} />
                        </Pressable>
                      </View>

                      {zoneImageUrl && (
                        <Image source={{ uri: zoneImageUrl }} style={styles.sideDrawerSignImg} contentFit="contain" />
                      )}

                      <View style={styles.drawerSectionHeader}>
                        <Ionicons name="eye-outline" size={16} color={colors.primarySoft} />
                        <Text style={styles.drawerSectionTitle}>{t.drawerActionViewFaults}</Text>
                      </View>
                      <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
                        {!hasActiveFaults ? (
                          <View style={styles.zoneCleanBox}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                            <Text style={styles.zoneCleanTxt}>{t.noActiveFaultsHere}</Text>
                          </View>
                        ) : (
                          activeZoneFaults.map((f) => (
                            <Pressable
                              key={f.id}
                              style={[styles.drawerFaultCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                              onPress={() => {
                                setSideDrawerVisible(false);
                                setActiveFault(f);
                              }}>
                              <Image source={{ uri: f.before_photo }} style={{ width: 38, height: 38, borderRadius: 4 }} contentFit="cover" />
                              <View style={{ flex: 1, marginHorizontal: 6 }}>
                                <Text style={[styles.drawerFaultType, { textAlign: isRTL ? 'right' : 'left' }]}>{f.type}</Text>
                                <Text style={[styles.drawerFaultReporter, { textAlign: isRTL ? 'right' : 'left' }]}>
                                  {f.reporter_name} · #{f.display_id || f.id?.slice(-4) || ''}
                                </Text>
                              </View>
                              <View style={[styles.statusTag, { backgroundColor: colors.dangerSoft }]}>
                                <Text style={{ fontSize: 9, color: colors.danger, fontWeight: 'bold' }}>{t.statusNew}</Text>
                              </View>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>

                      {user?.role === 'inspector' && (
                        <Pressable
                          style={[styles.sideActionBtnPrimary, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                          onPress={() => {
                            setSideDrawerVisible(false);
                            setSelectedLocId(selectedZoneInfo.key);
                            setTimeout(() => setNewFaultModal(true), 300);
                          }}>
                          <Ionicons name="add-circle" size={20} color="#fff" />
                          <Text style={styles.sideActionBtnTxt}>{t.drawerActionNewFault}</Text>
                        </Pressable>
                      )}

                      <Pressable
                        style={[styles.sideActionBtnSecondary, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        onPress={() => handleExportZoneFaultsPDF(selectedZoneInfo)}>
                        <Ionicons name="document-text" size={18} color="#fff" />
                        <Text style={styles.sideActionBtnTxt}>{t.drawerActionExportPdf}</Text>
                      </Pressable>

                      <View style={{ flex: 1 }} />

                      <Pressable style={styles.sideActionBtnBack} onPress={() => setSideDrawerVisible(false)}>
                        <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={colors.textMuted} />
                        <Text style={styles.sideActionBtnBackTxt}>{t.drawerActionBack}</Text>
                      </Pressable>
                    </View>
                  );
                })()}
            </View>
          </View>
        </Modal>

        {/* 4. شاشة الأعطال */}
        {tab === 'faults' && (
          <View style={styles.container}>
            <View style={[styles.tabHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
              <BackButton onPress={() => setTab('home')} />
              <Text style={styles.tabTitle}>{t.faultsHeader}</Text>
              <View style={{ width: 65 }} />
            </View>

            <View style={[styles.searchWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="search" size={16} color={colors.slate400} />
              <TextInput testID="faults-search" style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]} placeholder={t.searchPlaceholder} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.slate400} />
                </Pressable>
              )}
            </View>

            <View style={{ height: 44 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, paddingHorizontal: 12, alignItems: 'center' }}>
                {[
                  { id: 'all', label: t.filterAll },
                  { id: 'new', label: t.statusNew },
                  { id: 'in_progress', label: t.statusProgress },
                  { id: 'completed', label: t.statusCompleted },
                ].map((st) => (
                  <Pressable key={st.id} testID={`filter-${st.id}`} style={[styles.filterChip, statusFilter === st.id && styles.filterChipActive]} onPress={() => setStatusFilter(st.id)}>
                    <Text style={[styles.filterChipTxt, statusFilter === st.id && { color: '#fff' }]}>{st.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filteredFaults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
              renderItem={({ item }) => {
                const pInfo = priorities.find((p) => p.id === item.priority) || priorities[1];
                const locName = lang === 'ar' ? item.location_name_ar : item.location_name_en || item.location_name_ar;
                return (
                  <Pressable testID={`fault-card-${item.display_id}`} style={[styles.faultCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setActiveFault(item)}>
                    <Image source={{ uri: item.before_photo }} style={styles.faultThumb} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.faultLoc, { textAlign: isRTL ? 'right' : 'left' }]}>#{item.display_id || item.id?.slice(-4) || ''} - {locName}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: pInfo.bg }]}>
                          <Text style={[styles.priorityTxt, { color: pInfo.color }]}>{pInfo.label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.faultSub, { textAlign: isRTL ? 'right' : 'left' }]}>{item.type} · {item.floor === 'ground' ? t.floorGround : t.floorUpper}</Text>
                      <View style={[styles.statusTag, { alignSelf: isRTL ? 'flex-end' : 'flex-start', backgroundColor: item.status === 'completed' ? colors.successSoft : item.status === 'in_progress' ? colors.warningSoft : colors.dangerSoft }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: item.status === 'completed' ? colors.success : item.status === 'in_progress' ? '#B45309' : colors.danger }}>
                          {item.status === 'completed' ? t.statusCompleted : item.status === 'in_progress' ? t.statusProgress : t.statusNew}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.slate400} />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="clipboard-outline" size={40} color={colors.slate300} />
                  <Text style={styles.emptyTxt}>{lang === 'ar' ? 'لا توجد بلاغات مطابقة.' : 'No matching reports.'}</Text>
                </View>
              }
            />
          </View>
        )}

        {/* 5. شاشة المواقع */}
        {tab === 'locations' && (
          <View style={styles.container}>
            <View style={[styles.tabHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
              <BackButton onPress={() => setTab('home')} />
              <Text style={styles.tabTitle}>{t.locationsHeader}</Text>
              <Pressable testID="add-location-btn" style={[styles.addLocBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setAddLocationModal(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addLocBtnTxt}>{t.addLocationBtn}</Text>
              </Pressable>
            </View>

            <View style={[styles.searchWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="search" size={16} color={colors.slate400} />
              <TextInput testID="locations-search" style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]} placeholder={t.searchPlaceholder} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.slate400} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
              renderItem={({ item }) => {
                const name = lang === 'ar' ? item.name_ar : item.name_en || item.name_ar;
                const subName = lang === 'ar' ? item.name_en : item.name_ar;
                return (
                  <View style={[styles.locCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Ionicons name={item.floor === 'ground' ? 'business' : 'layers'} size={20} color={colors.primary} />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={[styles.faultLoc, { textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>
                      <Text style={[styles.faultSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {subName} · {item.wing || ''} · {item.floor === 'ground' ? t.floorGround : t.floorUpper}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* الشريط السفلي للتنقل */}
        <View style={styles.bottomNav}>
          <Pressable testID="nav-home" style={styles.navBtn} onPress={() => setTab('home')}>
            <Ionicons name="home" size={20} color={tab === 'home' ? colors.primarySoft : colors.slate400} />
            <Text style={[styles.navTxt, tab === 'home' && styles.navTxtActive]}>{t.navHome}</Text>
          </Pressable>
          <Pressable testID="nav-map" style={styles.navBtn} onPress={() => setTab('map')}>
            <Ionicons name="map" size={20} color={tab === 'map' ? colors.primarySoft : colors.slate400} />
            <Text style={[styles.navTxt, tab === 'map' && styles.navTxtActive]}>{t.navMap}</Text>
          </Pressable>
          <Pressable testID="nav-faults" style={styles.navBtn} onPress={() => setTab('faults')}>
            <Ionicons name="clipboard" size={20} color={tab === 'faults' ? colors.primarySoft : colors.slate400} />
            <Text style={[styles.navTxt, tab === 'faults' && styles.navTxtActive]}>{t.navFaults}</Text>
          </Pressable>
          <Pressable testID="nav-locations" style={styles.navBtn} onPress={handlePressLocationsTab}>
            <Ionicons name="location" size={20} color={tab === 'locations' ? colors.primarySoft : colors.slate400} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={[styles.navTxt, tab === 'locations' && styles.navTxtActive]}>{t.navLocations}</Text>
              <Ionicons name="lock-closed" size={10} color={colors.slate400} />
            </View>
          </Pressable>
        </View>

        {/* النوافذ المنبثقة */}
        <Modal visible={newFaultModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.newFaultTitle}</Text>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.locSelectLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }} contentContainerStyle={{ alignItems: 'center' }}>
                  {locationsList.map((l) => {
                    const name = lang === 'ar' ? l.name_ar : l.name_en || l.name_ar;
                    return (
                      <Pressable key={l.id} style={[styles.chip, selectedLocId === l.id && styles.chipActive]} onPress={() => setSelectedLocId(l.id)}>
                        <Text style={[styles.chipTxt, selectedLocId === l.id && { color: '#fff' }]}>{name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.photoLabel}</Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginVertical: 4 }}>
                  <Pressable testID="pick-camera-btn" style={[styles.photoActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => pickImage(true, false)} disabled={uploadingPhoto}>
                    <Ionicons name="camera" size={16} color={colors.primarySoft} />
                    <Text style={styles.photoActionTxt}>{t.takeCamera}</Text>
                  </Pressable>
                  <Pressable testID="pick-gallery-btn" style={[styles.photoActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => pickImage(false, false)} disabled={uploadingPhoto}>
                    <Ionicons name="images" size={16} color={colors.primarySoft} />
                    <Text style={styles.photoActionTxt}>{t.fromGallery}</Text>
                  </Pressable>
                </View>

                {capturedBeforePhoto && (
                  <View style={{ marginVertical: 6, position: 'relative' }}>
                    <Image source={{ uri: capturedBeforePhoto }} style={styles.previewThumb} contentFit="cover" />
                    {uploadingPhoto && (
                      <View style={styles.previewUploadingOverlay}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.previewUploadingTxt}>{t.uploading}</Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.faultTypeLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }} contentContainerStyle={{ alignItems: 'center' }}>
                  {faultTypes.map((typeName) => (
                    <Pressable key={typeName} style={[styles.chip, selectedType === typeName && styles.chipActive]} onPress={() => setSelectedType(typeName)}>
                      <Text style={[styles.chipTxt, selectedType === typeName && { color: '#fff' }]}>{typeName}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.prioLabel}</Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginVertical: 4 }}>
                  {priorities.map((p) => (
                    <Pressable key={p.id} testID={`prio-${p.id}`} style={[styles.prioBtn, selectedPriority === p.id && { backgroundColor: p.color, borderColor: p.color }]} onPress={() => setSelectedPriority(p.id)}>
                      <Text style={[styles.prioBtnTxt, selectedPriority === p.id && { color: '#fff' }]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput testID="reporter-name-input" style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} placeholder={t.reporterNamePlaceholder} value={reporterName} onChangeText={setReporterName} />
                <TextInput testID="fault-note-input" style={[styles.input, { height: 60, textAlign: isRTL ? 'right' : 'left' }]} placeholder={t.faultNotePlaceholder} multiline value={faultNote} onChangeText={setFaultNote} />
                <Pressable testID="save-fault-btn" style={styles.btnPrimary} onPress={handleCreateFault} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{t.saveFaultBtn}</Text>}
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setNewFaultModal(false)}>
                  <Text style={styles.btnCloseTxt}>{t.back}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={!!activeFault} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              {activeFault && (
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={[styles.modalTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    #{activeFault.display_id || activeFault.id?.slice(-4) || ''} - {lang === 'ar' ? activeFault.location_name_ar : activeFault.location_name_en || activeFault.location_name_ar}
                  </Text>
                  <Text style={[styles.faultSub, { textAlign: isRTL ? 'right' : 'left' }]}>{activeFault.type} · {activeFault.created_at || ''}</Text>
                  <Text style={[styles.imgLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.beforeImgLabel}</Text>
                  <Image source={{ uri: activeFault.before_photo }} style={styles.modalImg} contentFit="cover" />
                  {activeFault.after_photo && (
                    <>
                      <Text style={[styles.imgLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.afterImgLabel}</Text>
                      <Image source={{ uri: activeFault.after_photo }} style={styles.modalImg} contentFit="cover" />
                    </>
                  )}
                  {uploadingPhoto && (
                    <View style={styles.uploadingRow}>
                      <ActivityIndicator color={colors.primarySoft} />
                      <Text style={styles.uploadingTxt}>{t.uploading}</Text>
                    </View>
                  )}
                  {user.role === 'worker' && activeFault.status === 'new' && (
                    <Pressable testID="start-repair-btn" style={styles.btnPrimary} onPress={() => handleStartRepair(activeFault.id)}>
                      <Text style={styles.btnTxt}>{t.startRepairBtn}</Text>
                    </Pressable>
                  )}
                  {user.role === 'worker' && activeFault.status === 'in_progress' && (
                    <Pressable testID="complete-repair-btn" style={styles.btnSuccess} onPress={() => pickImage(true, true)} disabled={uploadingPhoto}>
                      <Ionicons name="camera" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnTxt}>{t.completeRepairBtn}</Text>
                    </Pressable>
                  )}
                  {user.role === 'supervisor' && (
                    <Pressable testID="delete-fault-btn" style={styles.btnDanger} onPress={() => setConfirmDeleteId(activeFault.id)}>
                      <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.btnTxt}>{t.deleteFault}</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.btnClose} onPress={() => setActiveFault(null)}>
                    <Text style={styles.btnCloseTxt}>{t.back}</Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={!!confirmDeleteId} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.authDialog}>
              <View style={[styles.authIconWrap, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="trash" size={26} color={colors.danger} />
              </View>
              <Text style={styles.authTitle}>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</Text>
              <Text style={styles.authSub}>{lang === 'ar' ? 'هل أنت متأكد من حذف هذا البلاغ نهائياً؟' : 'Delete this record permanently?'}</Text>
              <Pressable testID="confirm-delete-btn" style={styles.btnDanger} onPress={confirmDelete}>
                <Text style={styles.btnTxt}>{lang === 'ar' ? 'حذف نهائي' : 'Delete'}</Text>
              </Pressable>
              <Pressable style={styles.btnClose} onPress={() => setConfirmDeleteId(null)}>
                <Text style={styles.btnCloseTxt}>{t.back}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={locationsAuthModal} animationType="fade" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
            <View style={styles.authDialog}>
              <View style={[styles.authIconWrap, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="shield-half" size={26} color={colors.warning} />
              </View>
              <Text style={styles.authTitle}>{t.locAuthTitle}</Text>
              <Text style={styles.authSub}>{t.locAuthSub}</Text>
              <TextInput
                testID="locations-pin-input"
                style={styles.pinInput}
                placeholder="PIN"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
                secureTextEntry
                value={locationsPinInput}
                onChangeText={setLocationsPinInput}
                autoFocus
              />
              <Pressable testID="locations-verify-btn" style={styles.btnPrimary} onPress={handleVerifyLocationsPin}>
                <Text style={styles.btnTxt}>{t.locAuthBtn}</Text>
              </Pressable>
              <Pressable style={styles.btnClose} onPress={() => setLocationsAuthModal(false)}>
                <Text style={styles.btnCloseTxt}>{t.back}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={addLocationModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.addLocationBtn}</Text>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{lang === 'ar' ? 'اسم الموقع بالعربية:' : 'Location Name (Arabic):'}</Text>
                <TextInput testID="loc-name-ar-input" style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} placeholder="مثال: صف العاشر 4" value={newLocNameAr} onChangeText={setNewLocNameAr} />
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{lang === 'ar' ? 'اسم الموقع بالإنجليزية:' : 'Location Name (English):'}</Text>
                <TextInput testID="loc-name-en-input" style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} placeholder="e.g. Grade 10 - 4" value={newLocNameEn} onChangeText={setNewLocNameEn} />
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{lang === 'ar' ? 'الطابق:' : 'Floor:'}</Text>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginVertical: 4 }}>
                  <Pressable style={[styles.prioBtn, newLocFloor === 'ground' && { backgroundColor: colors.primarySoft }]} onPress={() => setNewLocFloor('ground')}>
                    <Text style={[styles.prioBtnTxt, newLocFloor === 'ground' && { color: '#fff' }]}>{t.floorGround}</Text>
                  </Pressable>
                  <Pressable style={[styles.prioBtn, newLocFloor === 'upper' && { backgroundColor: colors.primarySoft }]} onPress={() => setNewLocFloor('upper')}>
                    <Text style={[styles.prioBtnTxt, newLocFloor === 'upper' && { color: '#fff' }]}>{t.floorUpper}</Text>
                  </Pressable>
                </View>
                <Pressable testID="save-location-btn" style={styles.btnSuccess} onPress={handleAddNewLocation}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTxt}>{lang === 'ar' ? 'تثبيت وحفظ الموقع' : 'Save Location'}</Text>
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setAddLocationModal(false)}>
                  <Text style={styles.btnCloseTxt}>{t.back}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* نافذة المتصلين الحية */}
        <Modal visible={presenceModal} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={styles.liveDotBig} />
                <Text style={styles.modalTitle}>{t.livePresenceTitle}</Text>
              </View>
              <Text style={[styles.authSub, { textAlign: isRTL ? 'right' : 'left', marginBottom: 6 }]}>{t.livePresenceSub}</Text>
              <ScrollView style={{ maxHeight: 300, marginTop: 6 }} contentContainerStyle={{ paddingBottom: 10 }}>
                {activeDevices.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Ionicons name="cloud-offline-outline" size={36} color={colors.slate300} />
                    <Text style={styles.emptyTxt}>{t.noDevices}</Text>
                  </View>
                ) : (
                  activeDevices.map((d, i) => (
                    <View key={d.device_id || i} style={[styles.deviceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.deviceIconWrap}>
                        <Ionicons name={deviceIcon(d.device_type)} size={18} color={colors.primarySoft} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deviceName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{d.device_name || d.device_type || 'Device'}</Text>
                        <Text style={[styles.deviceRole, { textAlign: isRTL ? 'right' : 'left' }]}>{roleLabel(d.role)}</Text>
                      </View>
                      {user.role === 'supervisor' && d.device_id !== deviceIdRef.current && (
                        <Pressable style={styles.kickBtn} onPress={() => setConfirmKickId(d.device_id)}>
                          <Ionicons name="close-circle" size={14} color="#fff" />
                          <Text style={styles.kickBtnTxt}>{t.kickBtn}</Text>
                        </Pressable>
                      )}
                      {d.device_id === deviceIdRef.current && (
                        <View style={styles.thisDeviceTag}>
                          <Text style={styles.thisDeviceTxt}>{t.thisDevice}</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
              <Pressable style={styles.btnClose} onPress={() => setPresenceModal(false)}>
                <Text style={styles.btnCloseTxt}>{t.back}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* تأكيد فصل الجهاز */}
        <Modal visible={!!confirmKickId} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.authDialog}>
              <View style={[styles.authIconWrap, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="power" size={26} color={colors.danger} />
              </View>
              <Text style={styles.authTitle}>{t.confirmKickTitle}</Text>
              <Text style={styles.authSub}>{t.confirmKickSub}</Text>
              <Pressable testID="confirm-kick-btn" style={styles.btnDanger} onPress={handleKickDevice}>
                <Text style={styles.btnTxt}>{t.kickConfirmBtn}</Text>
              </Pressable>
              <Pressable style={styles.btnClose} onPress={() => setConfirmKickId(null)}>
                <Text style={styles.btnCloseTxt}>{t.cancel}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  urgentAlertBar: { backgroundColor: colors.danger, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  urgentAlertTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  loginHeader: { padding: 20, alignItems: 'center', backgroundColor: colors.primary, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, position: 'relative' },
  langSwitchBtn: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, gap: 4 },
  langSwitchHeaderBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  refreshHeaderBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 6 },
  langSwitchTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  loginTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  loginSub: { color: '#CBD5E1', fontSize: 11, textAlign: 'center', marginTop: 2 },
  loginBody: { padding: 14 },
  loginPrompt: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  roleBtn: { alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 10, marginBottom: 8 },
  roleBtnTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  roleBtnSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  pinControlBtn: { alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.primarySoft, borderStyle: 'dashed', gap: 10, marginTop: 4 },
  pinControlTitle: { fontSize: 13, fontWeight: 'bold', color: colors.primarySoft },
  pinControlSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  authDialog: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginHorizontal: 16, alignItems: 'center', gap: 8 },
  authIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  authTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  authSub: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 4 },
  pinInput: { width: '85%', height: 42, backgroundColor: colors.slate100, borderRadius: 8, borderWidth: 1, borderColor: colors.border, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: colors.text },
  dashHeader: { padding: 14, backgroundColor: colors.primary, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  dashRow: { justifyContent: 'space-between', alignItems: 'center' },
  dashSub: { color: '#94A3B8', fontSize: 11 },
  dashName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  roleTagWrap: { marginTop: 2 },
  dashRole: { color: colors.accent, fontSize: 11, fontWeight: 'bold' },
  logoutBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  statsGrid: { flexWrap: 'wrap', padding: 10, gap: 8 },
  statBox: { width: '48%', padding: 8, borderRadius: 8, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  statLbl: { fontSize: 10, color: colors.textMuted },
  actionsList: { padding: 10, gap: 8 },
  actionItem: { alignItems: 'center', backgroundColor: '#fff', padding: 11, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 8 },
  actionTxt: { flex: 1, fontSize: 12, fontWeight: 'bold', color: colors.text },
  tabHeader: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  tabTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  universalBackBtn: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 4 },
  universalBackBtnTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  floorPillContainer: { alignItems: 'center', marginVertical: 4 },
  floorPill: { backgroundColor: colors.slate200, borderRadius: 20, padding: 3, gap: 4 },
  floorPillBtn: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 16 },
  floorPillBtnActive: { backgroundColor: colors.primarySoft },
  floorPillTxt: { fontSize: 11, fontWeight: 'bold', color: colors.textMuted },
  specialtyBarContainer: { paddingHorizontal: 10, marginVertical: 4 },
  specialtyScroll: { gap: 6, alignItems: 'center' },
  specialtyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  specialtyChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  specialtyChipTxt: { fontSize: 10.5, color: colors.text, fontWeight: '600' },
  specialtyBadge: { backgroundColor: colors.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center', justifyContent: 'center' },
  specialtyBadgeTxt: { color: '#fff', fontSize: 8.5, fontWeight: 'bold' },
  blueprintCanvas: { width: '96%', alignSelf: 'center', aspectRatio: PLAN_W / PLAN_H, backgroundColor: colors.blueprintBg, borderRadius: 8, borderWidth: 1.5, borderColor: colors.cadLine, overflow: 'hidden', position: 'relative', marginVertical: 8 },
  zoneItem: { position: 'absolute', borderRadius: 4, alignItems: 'center', justifyContent: 'center', padding: 1, overflow: 'hidden' },
  zoneSignImage: { width: '100%', height: '100%', borderRadius: 3 },
  zoneTxt: { fontSize: 6.5, fontWeight: 'bold', color: colors.primary, textAlign: 'center', lineHeight: 7.5 },
  zoneBadge: { position: 'absolute', top: 1, right: 1, backgroundColor: colors.danger, borderRadius: 5, minWidth: 11, height: 11, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  zoneBadgeTxt: { color: '#fff', fontSize: 6.8, fontWeight: 'bold' },
  quickNavContainer: { paddingHorizontal: 10, marginTop: 6 },
  quickNavTitle: { fontSize: 11, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  quickGrid: { flexWrap: 'wrap', gap: 5 },
  quickCard: { width: '48%', backgroundColor: '#fff', padding: 6, borderRadius: 6, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  quickCardTxt: { flex: 1, fontSize: 9.5, color: colors.text, textAlign: 'right' },
  sideDrawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', flexDirection: 'row' },
  sideDrawerContent: { width: '82%', maxWidth: 330, height: '100%', backgroundColor: '#fff', padding: 14, elevation: 12, shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5 },
  sideDrawerHeader: { alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 8 },
  sideDrawerTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  sideDrawerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  sideDrawerSignImg: { width: '100%', height: 90, borderRadius: 6, marginBottom: 8, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.border },
  drawerCloseBtn: { padding: 4, borderRadius: 6, backgroundColor: colors.slate200 },
  drawerSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 6 },
  drawerSectionTitle: { fontSize: 12, fontWeight: 'bold', color: colors.primarySoft },
  zoneCleanBox: { padding: 10, alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: 6, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  zoneCleanTxt: { color: colors.success, fontWeight: 'bold', fontSize: 11 },
  drawerFaultCard: { backgroundColor: '#FFF1F2', padding: 6, borderRadius: 6, marginBottom: 4, alignItems: 'center', borderWidth: 1, borderColor: colors.dangerSoft },
  drawerFaultType: { fontSize: 11, fontWeight: 'bold', color: colors.text },
  drawerFaultReporter: { fontSize: 9.5, color: colors.textMuted },
  sideActionBtnPrimary: { backgroundColor: colors.primarySoft, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  sideActionBtnSecondary: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  sideActionBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  sideActionBtnBack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: colors.slate100, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: colors.border },
  sideActionBtnBackTxt: { color: colors.textMuted, fontWeight: 'bold', fontSize: 12 },
  searchWrap: { backgroundColor: colors.slate100, marginHorizontal: 10, marginVertical: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 11, color: colors.text },
  filterChip: { flexShrink: 0, height: 30, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 15, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  filterChipTxt: { fontSize: 10.5, fontWeight: 'bold', color: colors.textMuted },
  faultCard: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8 },
  faultThumb: { width: 50, height: 50, borderRadius: 6, backgroundColor: colors.slate100 },
  faultLoc: { fontSize: 12, fontWeight: 'bold', color: colors.text },
  faultSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  priorityBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  priorityTxt: { fontSize: 8.5, fontWeight: 'bold' },
  statusTag: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  locCard: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginBottom: 5, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  addLocBtn: { backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', gap: 2 },
  addLocBtnTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, height: 50, alignItems: 'center' },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: 9.5, color: colors.slate400, marginTop: 1 },
  navTxtActive: { color: colors.primarySoft, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '85%' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  modalImg: { width: '100%', height: 130, borderRadius: 6, marginVertical: 4, backgroundColor: colors.slate100 },
  imgLabel: { fontSize: 10.5, fontWeight: 'bold', color: colors.textMuted, marginTop: 4 },
  btnPrimary: { width: '100%', backgroundColor: colors.primarySoft, padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  btnSuccess: { backgroundColor: colors.success, padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 6, flexDirection: 'row', justifyContent: 'center' },
  btnDanger: { backgroundColor: colors.danger, padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 6, flexDirection: 'row', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnClose: { padding: 6, alignItems: 'center', marginTop: 2 },
  btnCloseTxt: { color: colors.textMuted, fontWeight: 'bold', fontSize: 11 },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: colors.slate100, marginHorizontal: 2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  chipTxt: { fontSize: 10, color: colors.text },
  prioBtn: { flex: 1, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.slate100 },
  prioBtnTxt: { fontSize: 10, fontWeight: 'bold', color: colors.text },
  input: { backgroundColor: colors.slate100, borderRadius: 6, padding: 8, fontSize: 11, marginTop: 3, color: colors.text },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  photoActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.border, gap: 4 },
  photoActionTxt: { fontSize: 10, fontWeight: 'bold', color: colors.primarySoft },
  previewThumb: { width: '100%', height: 95, borderRadius: 6, backgroundColor: colors.slate100 },
  previewUploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  previewUploadingTxt: { color: '#fff', fontSize: 10.5, fontWeight: 'bold' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 4 },
  uploadingTxt: { color: colors.primarySoft, fontWeight: 'bold', fontSize: 11 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 6 },
  emptyTxt: { color: colors.textMuted, fontSize: 12 },
  toast: { position: 'absolute', bottom: 58, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, elevation: 6 },
  toastTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11, flex: 1 },
  presencePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.success },
  presencePillTxt: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveDotBig: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  presenceCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  presenceCountTxt: { color: colors.success, fontWeight: 'bold', fontSize: 11 },
  deviceRow: { alignItems: 'center', gap: 6, backgroundColor: '#fff', padding: 8, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: colors.border },
  deviceIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontSize: 11, fontWeight: 'bold', color: colors.text },
  deviceRole: { fontSize: 9.5, color: colors.textMuted, marginTop: 1 },
  kickBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.danger, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  kickBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 9.5 },
  thisDeviceTag: { backgroundColor: colors.infoSoft, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  thisDeviceTxt: { color: colors.info, fontWeight: 'bold', fontSize: 8.5 },
});
