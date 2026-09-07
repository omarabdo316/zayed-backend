import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RoomPlaque({ titleAr, titleEn, gradeNumber, roomNumber }) {
  return (
    <View style={styles.shadowBase}>
      {/* الطبقة الصفراء البارزة في الخلفية */}
      <View style={styles.yellowBacking} />

      {/* اللوحة البيضاوية البيضاء الرئيسية */}
      <View style={styles.whitePlate}>
        {/* المسمار المعدني الأيسر */}
        <View style={styles.screwOuter}>
          <View style={styles.screwInner} />
        </View>

        {/* محتوى اللوحة الداخلي */}
        <View style={styles.contentWrap}>
          {/* الصف العلوي: الصف ورقم المستوى */}
          <View style={styles.row}>
            <Text style={styles.textDark}>الصف </Text>
            <Text style={styles.textGold}>{gradeNumber || '03'} </Text>
            <Text style={styles.textDark}>Grade</Text>
          </View>

          {/* الصف الأوسط: اسم القاعة بالعربية ورقمها */}
          <View style={styles.rowCenter}>
            <Text style={styles.roomNameAr}>{titleAr || 'قاعة دراسية'}</Text>
            {roomNumber && <Text style={styles.largeRoomNumber}>{roomNumber}</Text>}
          </View>

          {/* الصف السفلي: اسم القاعة بالإنجليزية */}
          <Text style={styles.roomNameEn}>{titleEn || 'Classroom'}</Text>
        </View>

        {/* المسمار المعدني الأيمن */}
        <View style={styles.screwOuter}>
          <View style={styles.screwInner} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowBase: {
    width: 260,
    height: 140,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 10,
  },
  yellowBacking: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 260,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F59E0B',
  },
  whitePlate: {
    width: 260,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  screwOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  textDark: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  textGold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
  },
  roomNameAr: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  largeRoomNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#EAB308',
    lineHeight: 34,
  },
  roomNameEn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});
