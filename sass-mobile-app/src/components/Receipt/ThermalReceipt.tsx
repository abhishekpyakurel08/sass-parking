import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ReceiptData {
  ticketNo: string;
  plate: string;
  vehType: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  totalDue: number;
  paymentMethod: string;
  changeGiven?: number;
}

export const generateThermalReceiptHtml = (data: ReceiptData) => `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Optimized for 58mm / 80mm Thermal Printers */
      body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; color: #000; background: #fff; }
      .receipt { width: 100%; max-width: 380px; margin: 0 auto; padding: 10px; box-sizing: border-box; }
      .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #000; }
      .header p { margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; }
      .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #000; }
      .row span:last-child { text-align: right; }
      .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
      .total-box { margin: 15px 0; padding: 10px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000; }
      .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #000; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; font-weight: 700; color: #000; }
      .footer strong { font-size: 14px; display: block; margin-bottom: 4px; }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <h1>PARKSAAS</h1>
        <p>Official Parking Receipt</p>
      </div>
      
      <div class="row"><span>TICKET</span><span>#${data.ticketNo}</span></div>
      <div class="row"><span>PLATE</span><span>${data.plate}</span></div>
      <div class="row"><span>TYPE</span><span>${data.vehType}</span></div>
      
      <div class="divider"></div>
      
      <div class="row"><span>IN</span><span>${data.checkIn}</span></div>
      <div class="row"><span>OUT</span><span>${data.checkOut}</span></div>
      <div class="row"><span>DUR.</span><span>${data.duration}</span></div>
      
      <div class="total-box">
        <div class="total-row"><span>TOTAL</span><span>Rs. ${data.totalDue.toFixed(2)}</span></div>
      </div>
      
      <div class="row"><span>PAYMENT</span><span>${data.paymentMethod}</span></div>
      ${data.changeGiven ? `<div class="row"><span>CHANGE</span><span>Rs. ${data.changeGiven.toFixed(2)}</span></div>` : ''}
      
      <div class="footer">
        <strong>THANK YOU!</strong>
        <p>Powered by ParkSaaS</p>
      </div>
    </div>
  </body>
</html>
`;

export const ThermalReceipt = ({ data }: { data: ReceiptData }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PARKSAAS</Text>
        <Text style={styles.subtitle}>Official Parking Receipt</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.text}>TICKET</Text>
        <Text style={styles.textRight}>#{data.ticketNo}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>PLATE</Text>
        <Text style={styles.textRight}>{data.plate}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>TYPE</Text>
        <Text style={styles.textRight}>{data.vehType}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.text}>IN</Text>
        <Text style={styles.textRight}>{data.checkIn}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>OUT</Text>
        <Text style={styles.textRight}>{data.checkOut}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>DUR.</Text>
        <Text style={styles.textRight}>{data.duration}</Text>
      </View>

      <View style={styles.totalBox}>
        <View style={styles.row}>
          <Text style={styles.totalText}>TOTAL</Text>
          <Text style={styles.totalText}>Rs. {data.totalDue.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.text}>PAYMENT</Text>
        <Text style={styles.textRight}>{data.paymentMethod}</Text>
      </View>
      {!!data.changeGiven && (
        <View style={styles.row}>
          <Text style={styles.text}>CHANGE</Text>
          <Text style={styles.textRight}>Rs. {data.changeGiven.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerStrong}>THANK YOU!</Text>
        <Text style={styles.text}>Powered by ParkSaaS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    width: '100%',
    maxWidth: 340, // emulate narrow thermal paper
    alignSelf: 'center',
    // Shadow for realism
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'dashed',
    paddingBottom: 10,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  textRight: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    textAlign: 'right',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  totalBox: {
    marginVertical: 15,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderStyle: 'dashed',
  },
  totalText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerStrong: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
});
