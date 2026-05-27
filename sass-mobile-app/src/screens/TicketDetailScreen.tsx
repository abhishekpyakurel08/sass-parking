import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ChevronLeft, Car, Bike, Truck, Clock, CreditCard,
  Banknote, Hash, CalendarDays, Timer, CircleDollarSign,
  Tag, User, RefreshCcw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { Ticket } from '../types/api.types';
import QRCode from 'react-native-qrcode-svg';
import RNPrint from 'react-native-print';
import { Alert } from 'react-native';
import { parkingService } from '../services/parking.service';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:          colors.success,
  PENDING_PAYMENT: '#FDBA74',
  PAID:            colors.textSecondary,
  EXPIRED:         colors.danger,
  LOST:            colors.danger,
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDuration = (checkIn: string, checkOut?: string) => {
  const end = checkOut ? new Date(checkOut) : new Date();
  const ms  = end.getTime() - new Date(checkIn).getTime();
  const h   = Math.floor(ms / 3_600_000);
  const m   = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const VehicleIcon = ({ type }: { type: string }) => {
  const props = { color: colors.primary, size: 28 };
  if (type === 'BIKE') return <Bike {...props} />;
  if (type === 'VAN')  return <Truck {...props} />;
  return <Car {...props} />;
};

const InfoRow = ({
  icon, label, value, valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  </View>
);

const TicketDetailScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const ticket     = (route.params as any)?.ticket as Ticket;
  const navigation2 = useNavigation();

  const [isPrinting, setIsPrinting] = React.useState(false);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No ticket data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLOR[ticket.status] ?? colors.textSecondary;
  const totalDue    = ticket.fare_amount + ticket.penalty_amount - ticket.discount_amount;

  const handleAction = () => {
    if (ticket.status === 'ACTIVE' || ticket.status === 'PENDING_PAYMENT') {
      (navigation2 as any).navigate('Payment', { ticket_id: ticket._id });
    }
  };

  const handlePrintReceipt = async () => {
    try {
      setIsPrinting(true);
      const res = await parkingService.getReceipt(ticket._id);
      if (res.success && res.printable_text) {
        // Convert ASCII to HTML for the print service
        const html = `
          <html>
            <head>
              <style>
                body { font-family: monospace; font-size: 16px; margin: 20px; white-space: pre-wrap; }
              </style>
            </head>
            <body>${res.printable_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
          </html>
        `;
        await RNPrint.print({ html });
      }
    } catch (err: any) {
      Alert.alert('Print Error', err?.response?.data?.message ?? 'Failed to fetch receipt');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <RefreshCcw color={colors.primary} size={18} />
          <Text style={styles.logoText}>PARKSAAS</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {ticket.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Vehicle banner */}
        <View style={styles.vehicleBanner}>
          <View style={styles.vehicleIconCircle}>
            <VehicleIcon type={ticket.vehicle_type} />
          </View>
          <View style={styles.plateWrap}>
            <Text style={styles.plateText}>{ticket.license_plate}</Text>
          </View>
          <Text style={styles.vehicleTypeLabel}>{ticket.vehicle_type}</Text>
        </View>

        {/* Ticket Number */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Hash color={colors.primary} size={16} />
            <Text style={styles.ticketLabel}>TICKET QR & NUMBER</Text>
          </View>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <View style={{ padding: 12, backgroundColor: '#FFF', borderRadius: 8 }}>
              <QRCode value={ticket.ticket_number} size={140} />
            </View>
          </View>
          <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
        </View>

        {/* Time Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIME DETAILS</Text>
          <View style={styles.card}>
            <InfoRow
              icon={<CalendarDays color={colors.primary} size={18} />}
              label="Entry Time"
              value={fmtDateTime(ticket.check_in_time)}
            />
            <View style={styles.divider} />
            <InfoRow
              icon={<CalendarDays color={colors.textSecondary} size={18} />}
              label="Exit Time"
              value={ticket.check_out_time ? fmtDateTime(ticket.check_out_time) : 'Still Parked'}
              valueColor={ticket.check_out_time ? undefined : colors.success}
            />
            <View style={styles.divider} />
            <InfoRow
              icon={<Timer color={colors.secondary} size={18} />}
              label="Duration"
              value={fmtDuration(ticket.check_in_time, ticket.check_out_time)}
            />
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.card}>
            <InfoRow
              icon={<CircleDollarSign color={colors.success} size={18} />}
              label="Fare Amount"
              value={`Rs. ${ticket.fare_amount.toFixed(2)}`}
              valueColor={colors.success}
            />
            {ticket.penalty_amount > 0 && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon={<Tag color={colors.danger} size={18} />}
                  label="Penalty"
                  value={`+ Rs. ${ticket.penalty_amount.toFixed(2)}`}
                  valueColor={colors.danger}
                />
              </>
            )}
            {ticket.discount_amount > 0 && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon={<Tag color={colors.primary} size={18} />}
                  label="Discount"
                  value={`- Rs. ${ticket.discount_amount.toFixed(2)}`}
                  valueColor={colors.primary}
                />
              </>
            )}
            <View style={[styles.divider, { borderColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TOTAL DUE</Text>
              <Text style={[styles.totalValue, { color: ticket.status === 'PAID' ? colors.success : '#FDBA74' }]}>
                Rs. {totalDue.toFixed(2)}
              </Text>
            </View>

            {/* Payment Method */}
            {ticket.payment_method && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon={ticket.payment_method === 'CASH'
                    ? <Banknote color={colors.success} size={18} />
                    : <CreditCard color={colors.primary} size={18} />}
                  label="Payment Method"
                  value={ticket.payment_method}
                />
              </>
            )}
            {ticket.amount_received != null && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon={<Banknote color={colors.textSecondary} size={18} />}
                  label="Amount Received"
                  value={`Rs. ${ticket.amount_received.toFixed(2)}`}
                />
              </>
            )}
            {ticket.change_given != null && ticket.change_given > 0 && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon={<CircleDollarSign color="#FDBA74" size={18} />}
                  label="Change Given"
                  value={`Rs. ${ticket.change_given.toFixed(2)}`}
                  valueColor="#FDBA74"
                />
              </>
            )}
          </View>
        </View>

        {/* Customer Info */}
        {ticket.customer_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
            <View style={styles.card}>
              <InfoRow
                icon={<User color={colors.primary} size={18} />}
                label="Name"
                value={(ticket.customer_id as any).name}
              />
              <View style={styles.divider} />
              <InfoRow
                icon={<Hash color={colors.textSecondary} size={18} />}
                label="Customer Code"
                value={(ticket.customer_id as any).customer_code}
              />
              <View style={styles.divider} />
              <InfoRow
                icon={<Tag color={colors.success} size={18} />}
                label="Discount"
                value={`${(ticket.customer_id as any).discount_percentage}%`}
                valueColor={colors.success}
              />
            </View>
          </View>
        )}

        {/* Action Button */}
        {(ticket.status === 'ACTIVE' || ticket.status === 'PENDING_PAYMENT') && (
          <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
            <Clock color="#FFF" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>
              {ticket.status === 'ACTIVE' ? 'CHECKOUT & PAY' : 'PROCESS PAYMENT'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.printButton, isPrinting && { opacity: 0.6 }]} 
          onPress={handlePrintReceipt}
          disabled={isPrinting}
        >
          <Text style={styles.printButtonText}>PRINT RECEIPT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText:        { color: colors.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  content:         { padding: 20, paddingBottom: 60 },

  vehicleBanner:    { alignItems: 'center', marginBottom: 24 },
  vehicleIconCircle:{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  plateWrap:        { backgroundColor: '#FFF', borderRadius: 6, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 6 },
  plateText:        { color: '#000', fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 4 },
  vehicleTypeLabel: { color: colors.textSecondary, fontSize: 12, letterSpacing: 1 },

  ticketCard:     { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 },
  ticketHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ticketLabel:    { color: colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  ticketNumber:   { color: colors.textSecondary, fontSize: 12, fontFamily: 'monospace' },

  section:        { marginBottom: 20 },
  sectionTitle:   { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  card:           { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  divider:        { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  infoIcon:       { width: 28, alignItems: 'center' },
  infoLabel:      { color: colors.textSecondary, fontSize: 10, marginBottom: 2 },
  infoValue:      { color: colors.text, fontSize: 14, fontWeight: '600' },
  totalRow:       { justifyContent: 'space-between' },
  totalLabel:     { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  totalValue:     { fontSize: 22, fontWeight: 'bold' },

  actionButton:     { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 8, marginTop: 8 },
  actionButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  printButton:      { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  printButtonText:  { color: colors.text, fontSize: 14, fontWeight: 'bold' },
});

export default TicketDetailScreen;
