import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
  orgName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#6B7280',
  },
  value: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  highlightBox: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    marginVertical: 15,
    borderRadius: 4,
  },
  highlightLabel: {
    fontSize: 10,
    color: '#3B82F6',
    marginBottom: 5,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  highlightSubtext: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 5,
  },
  savingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  savingsItem: {
    flex: 1,
    paddingRight: 10,
  },
  savingsLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  savingsValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
})

interface CalculationPDFProps {
  customerName: string
  orgName: string
  orgLogo?: string
  elomrade: string
  annualConsumptionKwh: number
  batteryName: string
  results: {
    totalIncVatSek: number
    costAfterGronTeknikSek: number
    totalAnnualSavingsSek: number
    paybackPeriodYears: number
    roi10YearPercent: number
    roi15YearPercent: number
    spotprisSavingsSek: number
    effectTariffSavingsSek: number
    gridServicesIncomeSek: number
  }
  createdAt: Date
}

export function CalculationPDF({
  customerName,
  orgName,
  orgLogo,
  elomrade,
  annualConsumptionKwh,
  batteryName,
  results,
  createdAt,
}: CalculationPDFProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatYears = (n: number) => {
    const years = Math.floor(n)
    const months = Math.round((n - years) * 12)
    if (months === 0) return `${years} ar`
    return `${years} ar ${months} man`
  }

  const formatPercent = (n: number) =>
    n.toFixed(1).replace('.', ',') + '%'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{orgName}</Text>
          {orgLogo && <Image src={orgLogo} style={styles.logo} />}
        </View>

        {/* Title */}
        <Text style={styles.title}>Batterikalkyl</Text>
        <Text style={styles.subtitle}>
          Skapad for {customerName} - {createdAt.toLocaleDateString('sv-SE')}
        </Text>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forutsattningar</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Elomrade</Text>
            <Text style={styles.value}>{elomrade}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Arlig forbrukning</Text>
            <Text style={styles.value}>{annualConsumptionKwh.toLocaleString('sv-SE')} kWh</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Batteri</Text>
            <Text style={styles.value}>{batteryName}</Text>
          </View>
        </View>

        {/* Cost section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investering</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Totalkostnad inkl. moms</Text>
            <Text style={styles.value}>{formatSek(results.totalIncVatSek)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gron Teknik-avdrag (48.5%)</Text>
            <Text style={styles.value}>-{formatSek(results.totalIncVatSek * 0.485)}</Text>
          </View>
          <View style={[styles.row, { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>Nettokostnad</Text>
            <Text style={[styles.value, { color: '#059669' }]}>{formatSek(results.costAfterGronTeknikSek)}</Text>
          </View>
        </View>

        {/* Highlight: Payback */}
        <View style={styles.highlightBox}>
          <Text style={styles.highlightLabel}>ATERBETALTNINGSTID</Text>
          <Text style={styles.highlightValue}>{formatYears(results.paybackPeriodYears)}</Text>
          <Text style={styles.highlightSubtext}>
            Baserat pa {formatSek(results.totalAnnualSavingsSek)} i arlig besparing
          </Text>
        </View>

        {/* Savings breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arlig besparing - {formatSek(results.totalAnnualSavingsSek)}</Text>
          <View style={styles.savingsGrid}>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Spotprisoptimering</Text>
              <Text style={styles.savingsValue}>{formatSek(results.spotprisSavingsSek)}</Text>
            </View>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Effekttariffbesparing</Text>
              <Text style={styles.savingsValue}>{formatSek(results.effectTariffSavingsSek)}</Text>
            </View>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Stodtjanster</Text>
              <Text style={styles.savingsValue}>{formatSek(results.gridServicesIncomeSek)}</Text>
            </View>
          </View>
        </View>

        {/* ROI section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avkastning (ROI)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ROI efter 10 ar</Text>
            <Text style={[styles.value, { color: results.roi10YearPercent >= 0 ? '#059669' : '#DC2626' }]}>
              {formatPercent(results.roi10YearPercent)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ROI efter 15 ar</Text>
            <Text style={[styles.value, { color: results.roi15YearPercent >= 0 ? '#059669' : '#DC2626' }]}>
              {formatPercent(results.roi15YearPercent)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Denna kalkyl ar en uppskattning baserad pa aktuella elpriser och forbrukningsmonster.
          {'\n'}Verkligt utfall kan variera. Genererad via Kalkyla.se
        </Text>
      </Page>
    </Document>
  )
}
