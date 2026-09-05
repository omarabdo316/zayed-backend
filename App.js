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
  Dimensions,
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
const SUPABASE_ANON_KEY = 'sb_secret_3Sk9SGLodKBjbEqsmACN3w_G8GDgIfr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  async getGroundPlanImage() {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'ground_plan_complete')
        .maybeSingle();
      if (data && data.value) {
        return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      }
    } catch (e) {}
    return await storage.getItem('GROUND_PLAN_IMG_V1', null);
  },

  async saveGroundPlanImage(url) {
    await storage.setItem('GROUND_PLAN_IMG_V1', url);
    try {
      await supabase.from('system_config').upsert({
        key: 'ground_plan_complete',
        value: url,
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

      if (!res.ok) return uri;
      return `${SUPABASE_URL}/storage/v1/object/public/fault-photos/${fileName}`;
    } catch (e) {
      return uri || DEFAULT_PHOTO;
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

const LOCATIONS_SECRET_PIN = '01024217096';
const PIN_MANAGER_SECRET_PIN = '01127616961';

// مصفوفة كافة مرافق وغرف الدور الأرضي المتطابقة تماماً مع المخطط المعماري
const GROUND_FLOOR_ZONES = [
  // ==================== 1. الجناح الأيسر (جناح الصفوف 1-5) ====================
  // جناح الصف الخامس
  { key: 'g_c5_4', name_ar: 'الصف الخامس 4', wing: 'جناح 1-5', px: 10, py: 13, icon: 'school' },
  { key: 'g_c5_5', name_ar: 'الصف الخامس 5', wing: 'جناح 1-5', px: 16, py: 13, icon: 'school' },
  { key: 'g_c5_6', name_ar: 'الصف الخامس 6', wing: 'جناح 1-5', px: 22, py: 13, icon: 'school' },
  { key: 'g_c5_admin', name_ar: 'إدارة جناح الخامس', wing: 'جناح 1-5', px: 28, py: 13, icon: 'briefcase' },
  { key: 'g_c5_3', name_ar: 'الصف الخامس 3', wing: 'جناح 1-5', px: 8, py: 18, icon: 'school' },
  { key: 'g_c5_2', name_ar: 'الصف الخامس 2', wing: 'جناح 1-5', px: 14, py: 18, icon: 'school' },
  { key: 'g_c5_1', name_ar: 'الصف الخامس 1', wing: 'جناح 1-5', px: 20, py: 18, icon: 'school' },
  { key: 'g_c5_teachers', name_ar: 'غرفة معلمين (خامس)', wing: 'جناح 1-5', px: 26, py: 18, icon: 'people' },
  { key: 'g_c5_wc', name_ar: 'دورة مياه (خامس)', wing: 'جناح 1-5', px: 31, py: 18, icon: 'water' },

  // ساحة المضمار الأيسر
  { key: 'g_yard_left', name_ar: 'ساحة المضمار (أيسر)', wing: 'جناح 1-5', px: 18, py: 36, icon: 'football' },

  // جناح الصف الثاني
  { key: 'g_c2_5', name_ar: 'الصف الثاني 5', wing: 'جناح 1-5', px: 8, py: 54, icon: 'school' },
  { key: 'g_c2_3', name_ar: 'الصف الثاني 3', wing: 'جناح 1-5', px: 15, py: 54, icon: 'school' },
  { key: 'g_c2_1', name_ar: 'الصف الثاني 1', wing: 'جناح 1-5', px: 22, py: 54, icon: 'school' },
  { key: 'g_c2_hall', name_ar: 'قاعة دراسية (ثاني)', wing: 'جناح 1-5', px: 28, py: 54, icon: 'easel' },
  { key: 'g_c2_special', name_ar: 'قسم التربية الخاصة', wing: 'جناح 1-5', px: 8, py: 63, icon: 'heart' },
  { key: 'g_c2_4', name_ar: 'الصف الثاني 4', wing: 'جناح 1-5', px: 15, py: 63, icon: 'school' },
  { key: 'g_c2_2', name_ar: 'الصف الثاني 2', wing: 'جناح 1-5', px: 22, py: 63, icon: 'school' },
  { key: 'g_c2_teachers', name_ar: 'غرفة معلمين (ثاني)', wing: 'جناح 1-5', px: 28, py: 63, icon: 'people' },
  { key: 'g_c2_wc', name_ar: 'دورة مياه (ثاني)', wing: 'جناح 1-5', px: 32, py: 63, icon: 'water' },

  // جناح الصف الأول
  { key: 'g_c1_5', name_ar: 'الصف الأول 5', wing: 'جناح 1-5', px: 8, py: 84, icon: 'school' },
  { key: 'g_c1_3', name_ar: 'الصف الأول 3', wing: 'جناح 1-5', px: 15, py: 84, icon: 'school' },
  { key: 'g_c1_1', name_ar: 'الصف الأول 1', wing: 'جناح 1-5', px: 22, py: 84, icon: 'school' },
  { key: 'g_c1_hall', name_ar: 'قاعة دراسية (أول)', wing: 'جناح 1-5', px: 28, py: 84, icon: 'easel' },
  { key: 'g_c1_wc', name_ar: 'دورة مياه (أول)', wing: 'جناح 1-5', px: 32, py: 84, icon: 'water' },
  { key: 'g_c1_6', name_ar: 'الصف الأول 6', wing: 'جناح 1-5', px: 8, py: 94, icon: 'school' },
  { key: 'g_c1_4', name_ar: 'الصف الأول 4', wing: 'جناح 1-5', px: 15, py: 94, icon: 'school' },
  { key: 'g_c1_2', name_ar: 'الصف الأول 2', wing: 'جناح 1-5', px: 22, py: 94, icon: 'school' },
  { key: 'g_c1_teachers', name_ar: 'غرفة معلمين (أول)', wing: 'جناح 1-5', px: 28, py: 94, icon: 'people' },

  // ==================== 2. الخدمات المركزية والمرافق ====================
  // الكافتيريا والخدمات
  { key: 'g_cafe_left', name_ar: 'كافتريا (يسار)', wing: 'الخدمات المركزية', px: 42, py: 18, icon: 'restaurant' },
  { key: 'g_cafe_mid', name_ar: 'خدمات الكافتيريا', wing: 'الخدمات المركزية', px: 50, py: 18, icon: 'construct' },
  { key: 'g_cafe_right', name_ar: 'كافتريا (يمين)', wing: 'الخدمات المركزية', px: 58, py: 18, icon: 'restaurant' },

  // القاعات
  { key: 'g_art_room', name_ar: 'غرفة الفنية', wing: 'الخدمات المركزية', px: 39, py: 38, icon: 'color-palette' },
  { key: 'g_lecture', name_ar: 'غرفة المحاضرات', wing: 'الخدمات المركزية', px: 50, py: 38, icon: 'easel' },
  { key: 'g_music_room', name_ar: 'غرفة الموسيقى', wing: 'الخدمات المركزية', px: 61, py: 38, icon: 'musical-notes' },

  // المسبح
  { key: 'g_pool_main', name_ar: 'المسبح المركزي', wing: 'الخدمات المركزية', px: 50, py: 47, icon: 'water' },

  // الصالة الرياضية
  { key: 'g_gym_main', name_ar: 'الصالة الرياضية', wing: 'الخدمات المركزية', px: 50, py: 59, icon: 'fitness' },

  // المختبرات
  { key: 'g_lab_sci_2', name_ar: 'مختبر العلوم 2', wing: 'الخدمات المركزية', px: 40, py: 73, icon: 'flask' },
  { key: 'g_lab_comp_2', name_ar: 'مختبر الحاسوب 2', wing: 'الخدمات المركزية', px: 47, py: 73, icon: 'hardware-chip' },
  { key: 'g_lab_comp_1', name_ar: 'مختبر الحاسوب 1', wing: 'الخدمات المركزية', px: 53, py: 73, icon: 'hardware-chip' },
  { key: 'g_lab_sci_1', name_ar: 'مختبر العلوم 1', wing: 'الخدمات المركزية', px: 60, py: 73, icon: 'flask' },

  // الإدارة والعيادة والاستقبال
  { key: 'g_clinic_l', name_ar: 'العيادة (يسار)', wing: 'الخدمات المركزية', px: 40, py: 85, icon: 'medkit' },
  { key: 'g_admin_center_1', name_ar: 'الإدارة المركزية (1)', wing: 'الخدمات المركزية', px: 47, py: 85, icon: 'business' },
  { key: 'g_admin_center_2', name_ar: 'الإدارة المركزية (2)', wing: 'الخدمات المركزية', px: 53, py: 85, icon: 'business' },
  { key: 'g_clinic_r', name_ar: 'العيادة (يمين)', wing: 'الخدمات المركزية', px: 60, py: 85, icon: 'medkit' },
  { key: 'g_reception', name_ar: 'الاستقبال الرئيسي', wing: 'الخدمات المركزية', px: 50, py: 94, icon: 'log-in' },

  // ==================== 3. الجناح الأيمن (جناح الصفوف 3-6) ====================
  // جناح الصف السادس
  { key: 'g_c6_admin', name_ar: 'إدارة جناح السادس', wing: 'جناح 3-6', px: 71, py: 13, icon: 'briefcase' },
  { key: 'g_c6_6', name_ar: 'الصف السادس 6', wing: 'جناح 3-6', px: 78, py: 13, icon: 'school' },
  { key: 'g_c6_5', name_ar: 'الصف السادس 5', wing: 'جناح 3-6', px: 84, py: 13, icon: 'school' },
  { key: 'g_c6_4', name_ar: 'الصف السادس 4', wing: 'جناح 3-6', px: 90, py: 13, icon: 'school' },
  { key: 'g_c6_wc', name_ar: 'دورة مياه (سادس)', wing: 'جناح 3-6', px: 68, py: 18, icon: 'water' },
  { key: 'g_c6_teachers', name_ar: 'غرفة معلمين (سادس)', wing: 'جناح 3-6', px: 74, py: 18, icon: 'people' },
  { key: 'g_c6_1', name_ar: 'الصف السادس 1', wing: 'جناح 3-6', px: 80, py: 18, icon: 'school' },
  { key: 'g_c6_2', name_ar: 'الصف السادس 2', wing: 'جناح 3-6', px: 86, py: 18, icon: 'school' },
  { key: 'g_c6_3', name_ar: 'الصف السادس 3', wing: 'جناح 3-6', px: 92, py: 18, icon: 'school' },

  // ساحة المضمار الأيمن
  { key: 'g_yard_right', name_ar: 'ساحة المضمار (أيمن)', wing: 'جناح 3-6', px: 82, py: 36, icon: 'football' },

  // جناح الصف الرابع
  { key: 'g_c4_hall', name_ar: 'قاعة دراسية (رابع)', wing: 'جناح 3-6', px: 71, py: 54, icon: 'easel' },
  { key: 'g_c4_2', name_ar: 'الصف الرابع 2', wing: 'جناح 3-6', px: 78, py: 54, icon: 'school' },
  { key: 'g_c4_4', name_ar: 'الصف الرابع 4', wing: 'جناح 3-6', px: 85, py: 54, icon: 'school' },
  { key: 'g_c4_6', name_ar: 'الصف الرابع 6', wing: 'جناح 3-6', px: 92, py: 54, icon: 'school' },
  { key: 'g_c4_wc', name_ar: 'دورة مياه (رابع)', wing: 'جناح 3-6', px: 68, py: 63, icon: 'water' },
  { key: 'g_c4_teachers', name_ar: 'غرفة معلمين (رابع)', wing: 'جناح 3-6', px: 74, py: 63, icon: 'people' },
  { key: 'g_c4_1', name_ar: 'الصف الرابع 1', wing: 'جناح 3-6', px: 80, py: 63, icon: 'school' },
  { key: 'g_c4_3', name_ar: 'الصف الرابع 3', wing: 'جناح 3-6', px: 86, py: 63, icon: 'school' },
  { key: 'g_c4_5', name_ar: 'الصف الرابع 5', wing: 'جناح 3-6', px: 92, py: 63, icon: 'school' },

  // جناح الصف الثالث
  { key: 'g_c3_wc', name_ar: 'دورة مياه (ثالث)', wing: 'جناح 3-6', px: 68, py: 84, icon: 'water' },
  { key: 'g_c3_admin', name_ar: 'غرفة الإدارة (ثالث)', wing: 'جناح 3-6', px: 74, py: 84, icon: 'briefcase' },
  { key: 'g_c3_2', name_ar: 'الصف الثالث 2', wing: 'جناح 3-6', px: 80, py: 84, icon: 'school' },
  { key: 'g_c3_4', name_ar: 'الصف الثالث 4', wing: 'جناح 3-6', px: 86, py: 84, icon: 'school' },
  { key: 'g_c3_special', name_ar: 'قسم التربية الخاصة (ثالث)', wing: 'جناح 3-6', px: 92, py: 84, icon: 'heart' },
  { key: 'g_c3_teachers', name_ar: 'غرفة معلمين (ثالث)', wing: 'جناح 3-6', px: 74, py: 94, icon: 'people' },
  { key: 'g_c3_1', name_ar: 'الصف الثالث 1', wing: 'جناح 3-6', px: 80, py: 94, icon: 'school' },
  { key: 'g_c3_3', name_ar: 'الصف الثالث 3', wing: 'جناح 3-6', px: 86, py: 94, icon: 'school' },
  { key: 'g_c3_5', name_ar: 'الصف الثالث 5', wing: 'جناح 3-6', px: 92, py: 94, icon: 'school' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeDevices, setActiveDevices] = useState([]);
  const [presenceModal, setPresenceModal] = useState(false);
  const deviceIdRef = useRef('');

  // إعدادات صورة المخطط المتكامل
  const [planImageUri, setPlanImageUri] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedWingFocus, setSelectedWingFocus] = useState('all');

  // الشريط الجانبي
  const [sideDrawerVisible, setSideDrawerVisible] = useState(false);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);

  // نافذة تسجيل البلاغ
  const [newFaultModal, setNewFaultModal] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState(GROUND_FLOOR_ZONES[0].key);
  const [selectedType, setSelectedType] = useState('تكييف وتبريد');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [reporterName, setReporterName] = useState('');
  const [faultNote, setFaultNote] = useState('');
  const [capturedBeforePhoto, setCapturedBeforePhoto] = useState(null);
  const [activeFault, setActiveFault] = useState(null);

  // تسجيل الدخول
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [selectedRoleToLogin, setSelectedRoleToLogin] = useState(null);
  const [inputPassword, setInputPassword] = useState('');
  const [passwords, setPasswords] = useState({
    inspector: '1111',
    worker: '2222',
    supervisor: '3333',
  });

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      const cloudPlan = await api.getGroundPlanImage();
      if (cloudPlan) setPlanImageUri(cloudPlan);
      await fetchFaults();
    })();
    const iv = setInterval(fetchFaults, 6000);
    return () => clearInterval(iv);
  }, []);

  const fetchFaults = async () => {
    try {
      const list = await api.getFaults();
      if (Array.isArray(list)) setFaults(list);
    } catch (e) {}
  };

  // رفع وتعيين صورة المخطط المعماري الكامل من المعرض
  const handleUploadGroundPlanImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast('يرجى السماح بالوصول لمعرض الصور.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const cloudUrl = await api.uploadImage(result.assets[0].uri);
        setPlanImageUri(cloudUrl);
        await api.saveGroundPlanImage(cloudUrl);
        showToast('تم تعيين وحفظ صورة المخطط المتكامل بنجاح.', 'success');
      } catch (e) {
        showToast('تعذر رفع صورة المخطط.', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handlePressZone = (zone) => {
    setSelectedZoneInfo(zone);
    setSideDrawerVisible(true);
  };

  const pickImage = async (useCamera = true) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        showToast('يرجى تفعيل صلاحية الكاميرا/الصور.', 'error');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.35 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.35 });

      if (!result.canceled && result.assets && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setCapturedBeforePhoto(localUri);
        setUploadingPhoto(true);
        try {
          const photoUrl = await api.uploadImage(localUri);
          setCapturedBeforePhoto(photoUrl);
        } catch (e) {
          setCapturedBeforePhoto(localUri);
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (e) {
      showToast('تعذر فتح الكاميرا.', 'error');
    }
  };

  const handleCreateFault = async () => {
    const loc = GROUND_FLOOR_ZONES.find((z) => z.key === selectedLocId) || GROUND_FLOOR_ZONES[0];
    setLoading(true);
    try {
      const payload = {
        location_id: loc.key,
        location_name_ar: loc.name_ar,
        floor: 'ground',
        type: selectedType,
        priority: selectedPriority,
        reporter_name: reporterName.trim() || user?.name || 'مفتش',
        note: faultNote.trim() || '',
        before_photo: capturedBeforePhoto || DEFAULT_PHOTO,
      };

      const created = await api.createFault(payload);
      await fetchFaults();
      setNewFaultModal(false);
      setFaultNote('');
      setCapturedBeforePhoto(null);
      showToast(`تم تسجيل البلاغ بنجاح #${created?.display_id || ''}`, 'success');
    } catch (e) {
      showToast(e?.message || 'تعذر إرسال البلاغ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = () => {
    if (inputPassword === passwords[selectedRoleToLogin]) {
      setUser({
        role: selectedRoleToLogin,
        name:
          selectedRoleToLogin === 'inspector'
            ? 'مفتش صيانة مجمع زايد'
            : selectedRoleToLogin === 'worker'
            ? 'مسؤول تسوية الأعطال'
            : 'مشرف إدارة المجمع (مشاهدة)',
      });
      setAuthModalVisible(false);
      setInputPassword('');
    } else {
      showToast('الرقم السري غير صحيح.', 'error');
    }
  };

  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loginHeader}>
            <Ionicons name="business" size={42} color="#fff" />
            <Text style={styles.loginTitle}>مجمع زايد التعليمي</Text>
            <Text style={styles.loginSub}>المخطط المعماري المتكامل وإدارة المرافق الذكية</Text>
          </View>

          <View style={{ padding: 16 }}>
            <Text style={styles.loginPrompt}>اختر البوابة للدخول بالرمز السري:</Text>

            <Pressable style={styles.roleBtn} onPress={() => { setSelectedRoleToLogin('inspector'); setAuthModalVisible(true); }}>
              <Ionicons name="search" size={24} color={colors.primarySoft} />
              <View style={{ flex: 1 }}>
                <Text style={styles.roleBtnTitle}>مفتش صيانة</Text>
                <Text style={styles.roleBtnSub}>تسجيل البلاغات وتصوير الأعطال المباشرة</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.slate400} />
            </Pressable>

            <Pressable style={styles.roleBtn} onPress={() => { setSelectedRoleToLogin('worker'); setAuthModalVisible(true); }}>
              <Ionicons name="construct" size={24} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.roleBtnTitle}>بوابة تسوية الأعطال</Text>
                <Text style={styles.roleBtnSub}>استلام المهام، وتصوير الإنجاز بعد تسوية العطل</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.slate400} />
            </Pressable>

            <Pressable style={styles.roleBtn} onPress={() => { setSelectedRoleToLogin('supervisor'); setAuthModalVisible(true); }}>
              <Ionicons name="eye" size={24} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.roleBtnTitle}>مشرف / إدارة المجمع</Text>
                <Text style={styles.roleBtnSub}>المتابعة الحية وسحب التقارير المعتمدة</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.slate400} />
            </Pressable>
          </View>

          <Modal visible={authModalVisible} animationType="fade" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
              <View style={styles.authDialog}>
                <Ionicons name="lock-closed" size={28} color={colors.primarySoft} />
                <Text style={styles.authTitle}>إدخال الرمز السري</Text>
                <TextInput
                  style={styles.pinInput}
                  placeholder="••••"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  autoFocus
                />
                <Pressable style={styles.btnPrimary} onPress={handleVerifyPassword}>
                  <Text style={styles.btnTxt}>تأكيد الدخول</Text>
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setAuthModalVisible(false)}>
                  <Text style={styles.btnCloseTxt}>إلغاء</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        {/* الشريط العلوي */}
        <View style={styles.topHeaderBar}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <Ionicons name="business" size={20} color="#fff" />
            <Text style={styles.topHeaderTitle}>المخطط المتكامل لمجمع زايد</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable style={styles.headerActionBtn} onPress={handleUploadGroundPlanImage}>
              <Ionicons name="image-outline" size={16} color="#fff" />
              <Text style={styles.headerActionBtnTxt}>تعيين المخطط</Text>
            </Pressable>
            <Pressable style={styles.headerLogoutBtn} onPress={() => setUser(null)}>
              <Ionicons name="log-out-outline" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* أزرار التركيز السريع والزووم */}
        <View style={styles.controlsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'center' }}>
            {[
              { id: 'all', label: 'كامل المجمع' },
              { id: 'جناح 1-5', label: 'جناح الصفوف 1-5' },
              { id: 'الخدمات المركزية', label: 'الخدمات والمرافق' },
              { id: 'جناح 3-6', label: 'جناح الصفوف 3-6' },
            ].map((w) => (
              <Pressable
                key={w.id}
                style={[styles.focusChip, selectedWingFocus === w.id && styles.focusChipActive]}
                onPress={() => setSelectedWingFocus(w.id)}>
                <Text style={[styles.focusChipTxt, selectedWingFocus === w.id && { color: '#fff' }]}>{w.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.zoomButtonsWrap}>
            <Pressable style={styles.zoomBtn} onPress={() => setZoomScale((prev) => Math.min(prev + 0.25, 2.5))}>
              <Ionicons name="add" size={16} color={colors.text} />
            </Pressable>
            <Pressable style={styles.zoomBtn} onPress={() => setZoomScale(1)}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>100%</Text>
            </Pressable>
            <Pressable style={styles.zoomBtn} onPress={() => setZoomScale((prev) => Math.max(prev - 0.25, 0.75))}>
              <Ionicons name="remove" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* واجهة المخطط البانورامي التفاعلي بملء الشاشة */}
        <ScrollView
          style={styles.mapScrollView}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 60 }}
          maximumZoomScale={3}
          minimumZoomScale={1}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            <View
              style={[
                styles.mapCanvasContainer,
                {
                  width: SCREEN_WIDTH * 1.35 * zoomScale,
                  height: SCREEN_WIDTH * 1.35 * zoomScale,
                },
              ]}>
              {/* صورة المخطط الخلفية */}
              {planImageUri ? (
                <Image
                  source={{ uri: planImageUri }}
                  style={styles.fullMapImage}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.placeholderMap}>
                  <Ionicons name="map-outline" size={48} color={colors.slate400} />
                  <Text style={styles.placeholderTxt}>اضغط "تعيين المخطط" بالأعلى لاختيار الصورة من معرض هاتفك</Text>
                </View>
              )}

              {/* الأيقونات الدائرية التفاعلية للغرف والمرافق */}
              {GROUND_FLOOR_ZONES.map((zone) => {
                const zoneFaults = faults.filter((f) => f.location_id === zone.key && f.status !== 'completed');
                const hasFault = zoneFaults.length > 0;
                const isSelectedWing = selectedWingFocus === 'all' || zone.wing === selectedWingFocus;

                return (
                  <Pressable
                    key={zone.key}
                    style={[
                      styles.circularHotspot,
                      {
                        left: `${zone.px}%`,
                        top: `${zone.py}%`,
                        opacity: isSelectedWing ? 1 : 0.25,
                        backgroundColor: hasFault ? colors.danger : '#FFFFFF',
                        borderColor: hasFault ? '#FFFFFF' : colors.primarySoft,
                        transform: hasFault ? [{ scale: 1.2 }] : [{ scale: 1 }],
                      },
                    ]}
                    onPress={() => handlePressZone(zone)}>
                    {hasFault ? (
                      <Text style={styles.hotspotFaultCount}>{zoneFaults.length}</Text>
                    ) : (
                      <Ionicons name={zone.icon || 'school'} size={11} color={colors.primarySoft} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>

        {/* الشريط السفلي لإضافة بلاغ فوري ومعاينة الحالة */}
        <View style={styles.bottomBarAction}>
          <Pressable style={styles.quickAddFaultBtn} onPress={() => setNewFaultModal(true)}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.quickAddFaultTxt}>تسجيل بلاغ صيانة مباشر</Text>
          </Pressable>
        </View>

        {/* الشريط الجانبي لتفاصيل المكان والأعطال */}
        <Modal visible={sideDrawerVisible} animationType="fade" transparent>
          <View style={styles.drawerBackdrop}>
            <View style={styles.drawerCard}>
              {selectedZoneInfo && (
                <>
                  <View style={styles.drawerHeaderRow}>
                    <Ionicons name={selectedZoneInfo.icon || 'business'} size={24} color={colors.primarySoft} />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.drawerTitle}>{selectedZoneInfo.name_ar}</Text>
                      <Text style={styles.drawerSub}>{selectedZoneInfo.wing} · الدور الأرضي</Text>
                    </View>
                    <Pressable style={styles.drawerCloseBtn} onPress={() => setSideDrawerVisible(false)}>
                      <Ionicons name="close" size={20} color={colors.text} />
                    </Pressable>
                  </View>

                  <Text style={styles.drawerSectionLabel}>الأعطال المسجلة بهذا المرفق:</Text>
                  {(() => {
                    const zFaults = faults.filter((f) => f.location_id === selectedZoneInfo.key && f.status !== 'completed');
                    if (zFaults.length === 0) {
                      return (
                        <View style={styles.cleanFacilityBox}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                          <Text style={styles.cleanFacilityTxt}>المرفق سليم تماماً ولا توجد أعطال مسجلة.</Text>
                        </View>
                      );
                    }
                    return (
                      <ScrollView style={{ maxHeight: 160 }}>
                        {zFaults.map((f) => (
                          <View key={f.id} style={styles.miniFaultRow}>
                            <Image source={{ uri: f.before_photo }} style={styles.miniFaultThumb} contentFit="cover" />
                            <View style={{ flex: 1, marginHorizontal: 6 }}>
                              <Text style={styles.miniFaultType}>{f.type}</Text>
                              <Text style={styles.miniFaultReporter}>{f.reporter_name} · #{f.display_id || ''}</Text>
                            </View>
                            <View style={styles.miniFaultTag}>
                              <Text style={{ fontSize: 9, color: colors.danger, fontWeight: 'bold' }}>مفتوح</Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    );
                  })()}

                  <Pressable
                    style={styles.drawerAddFaultBtn}
                    onPress={() => {
                      setSideDrawerVisible(false);
                      setSelectedLocId(selectedZoneInfo.key);
                      setTimeout(() => setNewFaultModal(true), 300);
                    }}>
                    <Ionicons name="camera" size={16} color="#fff" />
                    <Text style={styles.drawerAddFaultTxt}>تسجيل وتصوير عطل هنا</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* نافذة تسجيل البلاغ المباشرة */}
        <Modal visible={newFaultModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.modalTitle}>تسجيل بلاغ وتصوير عطل</Text>

                <Text style={styles.inputLabel}>المرفق المحدد:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', marginVertical: 4 }}>
                  {GROUND_FLOOR_ZONES.map((z) => (
                    <Pressable
                      key={z.key}
                      style={[styles.chip, selectedLocId === z.key && styles.chipActive]}
                      onPress={() => setSelectedLocId(z.key)}>
                      <Text style={[styles.chipTxt, selectedLocId === z.key && { color: '#fff' }]}>{z.name_ar}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>صورة العطل:</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 8, marginVertical: 4 }}>
                  <Pressable style={styles.photoActionBtn} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={16} color={colors.primarySoft} />
                    <Text style={styles.photoActionTxt}>التقاط بالكاميرا</Text>
                  </Pressable>
                  <Pressable style={styles.photoActionBtn} onPress={() => pickImage(false)}>
                    <Ionicons name="images" size={16} color={colors.primarySoft} />
                    <Text style={styles.photoActionTxt}>من المعرض</Text>
                  </Pressable>
                </View>

                {capturedBeforePhoto && (
                  <Image source={{ uri: capturedBeforePhoto }} style={styles.previewThumb} contentFit="cover" />
                )}

                <Text style={styles.inputLabel}>تصنيف العطل:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', marginVertical: 4 }}>
                  {['تكييف وتبريد', 'كهرباء وإنارة', 'سباكة ومياه', 'أثاث ومقاعد', 'أجهزة ومعدات'].map((tName) => (
                    <Pressable
                      key={tName}
                      style={[styles.chip, selectedType === tName && styles.chipActive]}
                      onPress={() => setSelectedType(tName)}>
                      <Text style={[styles.chipTxt, selectedType === tName && { color: '#fff' }]}>{tName}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.input}
                  placeholder="اسم المفتش / مقدم البلاغ"
                  value={reporterName}
                  onChangeText={setReporterName}
                />
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="ملاحظات العطل التفصيلية..."
                  multiline
                  value={faultNote}
                  onChangeText={setFaultNote}
                />

                <Pressable style={styles.btnPrimary} onPress={handleCreateFault} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>حفظ وإرسال البلاغ فوراً</Text>}
                </Pressable>
                <Pressable style={styles.btnClose} onPress={() => setNewFaultModal(false)}>
                  <Text style={styles.btnCloseTxt}>إلغاء</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* التنبيه المنبثق */}
        {toast && (
          <View style={[styles.toast, { backgroundColor: toast.type === 'error' ? colors.danger : colors.success }]}>
            <Text style={styles.toastTxt}>{toast.msg}</Text>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topHeaderBar: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  topHeaderTitle: { color: '#fff', fontSize: 13.5, fontWeight: 'bold' },
  headerActionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  headerActionBtnTxt: { color: '#fff', fontSize: 10.5, fontWeight: 'bold' },
  headerLogoutBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6 },
  controlsBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border },
  focusChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.border },
  focusChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  focusChipTxt: { fontSize: 10, fontWeight: 'bold', color: colors.textMuted },
  zoomButtonsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  zoomBtn: { width: 28, height: 28, borderRadius: 4, backgroundColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  mapScrollView: { flex: 1, backgroundColor: '#F1F5F9' },
  mapCanvasContainer: { backgroundColor: '#fff', position: 'relative', elevation: 4, borderRadius: 8, overflow: 'hidden', marginVertical: 10 },
  fullMapImage: { width: '100%', height: '100%' },
  placeholderMap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 },
  placeholderTxt: { marginTop: 8, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  circularHotspot: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, marginLeft: -12, marginTop: -12 },
  hotspotFaultCount: { color: '#fff', fontSize: 9.5, fontWeight: 'bold' },
  bottomBarAction: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border },
  quickAddFaultBtn: { backgroundColor: colors.primarySoft, paddingVertical: 10, borderRadius: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickAddFaultTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  drawerCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  drawerHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderColor: colors.border },
  drawerTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  drawerSub: { fontSize: 10.5, color: colors.textMuted, textAlign: 'right' },
  drawerCloseBtn: { padding: 4, backgroundColor: colors.slate100, borderRadius: 6 },
  drawerSectionLabel: { fontSize: 11, fontWeight: 'bold', color: colors.textMuted, marginBottom: 6, textAlign: 'right' },
  cleanFacilityBox: { padding: 12, backgroundColor: colors.successSoft, borderRadius: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cleanFacilityTxt: { color: colors.success, fontSize: 11, fontWeight: 'bold' },
  miniFaultRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF1F2', padding: 6, borderRadius: 6, marginBottom: 4 },
  miniFaultThumb: { width: 34, height: 34, borderRadius: 4 },
  miniFaultType: { fontSize: 11, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  miniFaultReporter: { fontSize: 9.5, color: colors.textMuted, textAlign: 'right' },
  miniFaultTag: { backgroundColor: colors.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  drawerAddFaultBtn: { backgroundColor: colors.primarySoft, paddingVertical: 10, borderRadius: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  drawerAddFaultTxt: { color: '#fff', fontSize: 11.5, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '85%' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 6 },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: colors.text, marginTop: 6, textAlign: 'right' },
  chip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.slate100, marginHorizontal: 2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  chipTxt: { fontSize: 10, color: colors.text },
  photoActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 7, borderRadius: 6, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.border, gap: 4 },
  photoActionTxt: { fontSize: 10, fontWeight: 'bold', color: colors.primarySoft },
  previewThumb: { width: '100%', height: 100, borderRadius: 6, marginVertical: 6 },
  input: { backgroundColor: colors.slate100, borderRadius: 6, padding: 8, fontSize: 11, marginTop: 6, color: colors.text, textAlign: 'right' },
  btnPrimary: { backgroundColor: colors.primarySoft, padding: 11, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnClose: { padding: 8, alignItems: 'center' },
  btnCloseTxt: { color: colors.textMuted, fontSize: 11, fontWeight: 'bold' },
  loginHeader: { padding: 22, alignItems: 'center', backgroundColor: colors.primary, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  loginTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  loginSub: { color: '#CBD5E1', fontSize: 11, textAlign: 'center', marginTop: 2 },
  loginPrompt: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: 10, textAlign: 'right' },
  roleBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 10, marginBottom: 8 },
  roleBtnTitle: { fontSize: 13.5, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  roleBtnSub: { fontSize: 10, color: colors.textMuted, marginTop: 1, textAlign: 'right' },
  authDialog: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginHorizontal: 20, alignItems: 'center', gap: 8 },
  authTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  pinInput: { width: '80%', height: 42, backgroundColor: colors.slate100, borderRadius: 8, borderWidth: 1, borderColor: colors.border, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  toast: { position: 'absolute', bottom: 65, left: 14, right: 14, padding: 10, borderRadius: 8, elevation: 6, alignItems: 'center' },
  toastTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
});
