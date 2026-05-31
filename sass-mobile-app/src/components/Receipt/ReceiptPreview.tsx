import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Share, Alert, ActivityIndicator } from 'react-native';
import { Printer, Share as ShareIcon, Download, RotateCcw } from 'lucide-react-native';
import RNPrint from 'react-native-print';
import { ThermalReceipt, ReceiptData, generateThermalReceiptHtml } from './ThermalReceipt';
import { colors } from '../../theme/colors';

interface ReceiptPreviewProps {
  data: ReceiptData;
  onNextVehicle: () => void;
}

export const ReceiptPreview = ({ data, onNextVehicle }: ReceiptPreviewProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const html = generateThermalReceiptHtml(data);
      await RNPrint.print({ html });
    } catch (err: any) {
      Alert.alert('Print Error', err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      const text = `PARKSAAS RECEIPT\nTicket: #${data.ticketNo}\nPlate: ${data.plate}\nIn: ${data.checkIn}\nOut: ${data.checkOut}\nTotal: Rs. ${data.totalDue.toFixed(2)}`;
      await Share.share({
        message: text,
        title: 'Parking Receipt',
      });
    } catch (err: any) {
      Alert.alert('Share Error', err.message);
    }
  };

  return (
    <View style={styles.container}>


      {/* The Visual Receipt */}
      <View style={styles.receiptWrapper}>
        <ThermalReceipt data={data} />
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary} onPress={handleShare}>
          <ShareIcon color={colors.primary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabSecondary} onPress={handlePrint}>
          <Download color={colors.primary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary} onPress={handlePrint} disabled={isPrinting}>
          {isPrinting ? <ActivityIndicator color="#fff" /> : <Printer color="#fff" size={24} />}
        </TouchableOpacity>
      </View>

      {/* Next Vehicle Button */}
      <TouchableOpacity style={styles.nextButton} onPress={onNextVehicle}>
        <Text style={styles.nextButtonText}>NEXT VEHICLE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  receiptWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 80, // space for FABs
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabPrimary: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButton: {
    backgroundColor: colors.text,
    width: '90%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
