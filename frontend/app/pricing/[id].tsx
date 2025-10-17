import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = 'article_registry';
const PRICING_HISTORY_KEY = 'pricing_history';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      const filePath = `${FileSystemLegacy.documentDirectory}${key}.json`;
      const fileInfo = await FileSystemLegacy.getInfoAsync(filePath);
      if (fileInfo.exists) {
        return await FileSystemLegacy.readAsStringAsync(filePath);
      }
      return null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      try {
        const filePath = `${FileSystemLegacy.documentDirectory}${key}.json`;
        await FileSystemLegacy.writeAsStringAsync(filePath, value);
      } catch (error) {
        console.error('Error writing to storage:', error);
      }
    }
  },
};

interface Article {
  id: string;
  articleCode: string;
  articleName: string;
  basePriceEUR: string;
  colorCode: string;
  colorName: string;
  season: string;
  section: string;
  supplier: string;
  composition: string;
  weightGSM: string;
  widthCM: string;
  [key: string]: any;
}

interface PricingCalculation {
  id: string;
  timestamp: string;
  articleId: string;
  articleCode: string;
  articleName: string;
  market: string;
  marketLabel: string;
  profitMargin: string;
  useTransport: boolean;
  transportType?: 'truck' | 'air';
  transportCost?: string;
  useSampling: boolean;
  samplingRate?: string;
  fxRate?: string;
  finalPrice: number;
  basePrice: number;
  commission: number;
}

interface PricingHistory {
  [articleId: string]: PricingCalculation[];
}

const MARKETS = [
  { label: 'Italy', value: 'italy', commission: 0.05, region: 'europe' },
  { label: 'Spain', value: 'spain', commission: 0.06, region: 'europe' },
  { label: 'France', value: 'france', commission: 0.05, region: 'europe' },
  { label: 'USA', value: 'usa', commission: 0.10, region: 'usa' },
  { label: 'Other Countries', value: 'other', commission: 0.05, region: 'other' },
];

export default function PricingCalculatorScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingHistory, setPricingHistory] = useState<PricingCalculation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Market selection
  const [selectedMarket, setSelectedMarket] = useState('italy');
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const [customCommission, setCustomCommission] = useState('5');
  
  // Profit margins (EUR/mt)
  const [profitMarginEurope, setProfitMarginEurope] = useState('0.80');
  const [profitMarginUSA, setProfitMarginUSA] = useState('1.20');
  const [profitMarginOther, setProfitMarginOther] = useState('1.00');
  
  // Transport costs (EUR/mt)
  const [transportTruck, setTransportTruck] = useState('0.30');
  const [transportAir, setTransportAir] = useState('1.00');
  const [useTransport, setUseTransport] = useState(false);
  const [transportType, setTransportType] = useState<'truck' | 'air'>('truck');
  
  // Sampling surcharge
  const [useSampling, setUseSampling] = useState(false);
  const [samplingRate, setSamplingRate] = useState('30');
  
  // USD Exchange rate
  const [fxRate, setFxRate] = useState('1.10');
  
  // Calculated price
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  useEffect(() => {
    // Update custom commission when market changes
    const market = MARKETS.find(m => m.value === selectedMarket);
    if (market) {
      setCustomCommission((market.commission * 100).toFixed(0));
    }
  }, [selectedMarket]);

  useEffect(() => {
    calculatePrice();
  }, [
    article,
    selectedMarket,
    customCommission,
    profitMarginEurope,
    profitMarginUSA,
    profitMarginOther,
    transportTruck,
    transportAir,
    useTransport,
    transportType,
    useSampling,
    samplingRate,
    fxRate,
  ]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const articles: Article[] = JSON.parse(stored);
        const found = articles.find((a) => a.id === id);
        if (found) {
          setArticle(found);
          // Load pricing history for this article
          await loadPricingHistory();
        } else {
          Alert.alert('Error', 'Article not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading article:', error);
      Alert.alert('Error', 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingHistory = async () => {
    try {
      const historyStr = await storage.getItem(PRICING_HISTORY_KEY);
      if (historyStr) {
        const allHistory: PricingHistory = JSON.parse(historyStr);
        const articleHistory = allHistory[id as string] || [];
        // Sort by timestamp descending (newest first)
        setPricingHistory(articleHistory.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading pricing history:', error);
    }
  };

  const savePricingCalculation = async () => {
    if (!article || finalPrice === null) return;

    const market = MARKETS.find(m => m.value === selectedMarket);
    if (!market) return;

    const calculation: PricingCalculation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      articleId: article.id,
      articleCode: article.articleCode,
      articleName: article.articleName || 'N/A',
      market: selectedMarket,
      marketLabel: market.label,
      profitMargin: market.region === 'europe' ? profitMarginEurope : 
                    market.region === 'usa' ? profitMarginUSA : profitMarginOther,
      useTransport,
      transportType: useTransport ? transportType : undefined,
      transportCost: useTransport ? (transportType === 'truck' ? transportTruck : transportAir) : undefined,
      useSampling,
      samplingRate: useSampling ? samplingRate : undefined,
      fxRate: market.region === 'usa' ? fxRate : undefined,
      finalPrice,
      basePrice: parseFloat(article.basePriceEUR) || 0,
      commission: parseFloat(customCommission) / 100,
    };

    try {
      const historyStr = await storage.getItem(PRICING_HISTORY_KEY);
      let allHistory: PricingHistory = historyStr ? JSON.parse(historyStr) : {};
      
      if (!allHistory[article.id]) {
        allHistory[article.id] = [];
      }
      
      allHistory[article.id].unshift(calculation);
      
      // Keep only last 20 calculations per article
      if (allHistory[article.id].length > 20) {
        allHistory[article.id] = allHistory[article.id].slice(0, 20);
      }
      
      await storage.setItem(PRICING_HISTORY_KEY, JSON.stringify(allHistory));
      setPricingHistory(allHistory[article.id]);
      
      Alert.alert('Success', 'Pricing calculation saved to history');
    } catch (error) {
      console.error('Error saving pricing calculation:', error);
      Alert.alert('Error', 'Failed to save calculation');
    }
  };

  const loadHistoryItem = (item: PricingCalculation) => {
    setSelectedMarket(item.market);
    
    const market = MARKETS.find(m => m.value === item.market);
    if (!market) return;
    
    if (market.region === 'europe') {
      setProfitMarginEurope(item.profitMargin);
    } else if (market.region === 'usa') {
      setProfitMarginUSA(item.profitMargin);
      if (item.fxRate) setFxRate(item.fxRate);
    } else {
      setProfitMarginOther(item.profitMargin);
    }
    
    setUseTransport(item.useTransport);
    if (item.useTransport && item.transportType && item.transportCost) {
      setTransportType(item.transportType);
      if (item.transportType === 'truck') {
        setTransportTruck(item.transportCost);
      } else {
        setTransportAir(item.transportCost);
      }
    }
    
    setUseSampling(item.useSampling);
    if (item.useSampling && item.samplingRate) {
      setSamplingRate(item.samplingRate);
    }
    
    // Load custom commission rate
    setCustomCommission((item.commission * 100).toFixed(0));
    
    setShowHistory(false);
    Alert.alert('Loaded', 'Previous calculation loaded successfully');
  };

  const deleteHistoryItem = async (itemId: string) => {
    if (!article) return;

    try {
      const historyStr = await storage.getItem(PRICING_HISTORY_KEY);
      if (!historyStr) return;
      
      let allHistory: PricingHistory = JSON.parse(historyStr);
      
      if (allHistory[article.id]) {
        allHistory[article.id] = allHistory[article.id].filter(item => item.id !== itemId);
        await storage.setItem(PRICING_HISTORY_KEY, JSON.stringify(allHistory));
        setPricingHistory(allHistory[article.id]);
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
      Alert.alert('Error', 'Failed to delete history item');
    }
  };

  const calculatePrice = () => {
    if (!article || !article.basePriceEUR) return;

    const basePrice = parseFloat(article.basePriceEUR) || 0;
    const market = MARKETS.find(m => m.value === selectedMarket);
    if (!market) return;

    let profitMargin = 0;
    if (market.region === 'europe') {
      profitMargin = parseFloat(profitMarginEurope) || 0;
    } else if (market.region === 'usa') {
      profitMargin = parseFloat(profitMarginUSA) || 0;
    } else {
      profitMargin = parseFloat(profitMarginOther) || 0;
    }

    let price = basePrice + profitMargin;

    // Apply commission (use custom commission rate)
    const commissionRate = parseFloat(customCommission) / 100 || 0;
    price = price * (1 + commissionRate);

    // Apply transport if enabled
    if (useTransport) {
      const transport = transportType === 'truck' 
        ? parseFloat(transportTruck) || 0 
        : parseFloat(transportAir) || 0;
      price += transport;
    }

    // Apply sampling surcharge if enabled
    if (useSampling) {
      const surcharge = parseFloat(samplingRate) || 0;
      price = price * (1 + surcharge / 100);
    }

    // Apply USD conversion and /yrd conversion if USA
    if (market.region === 'usa') {
      const fx = parseFloat(fxRate) || 1;
      // Convert EUR/mt to USD/yrd: multiply by FX rate, then divide by 1.09361 (mt to yrd conversion)
      price = (price * fx) / 1.09361;
    }

    setFinalPrice(price);
  };

  const generatePricingReport = async () => {
    if (!article || finalPrice === null) return;

    const market = MARKETS.find(m => m.value === selectedMarket);
    if (!market) return;

    const basePrice = parseFloat(article.basePriceEUR) || 0;
    const date = new Date().toLocaleDateString();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: white;
            color: #333;
          }
          h1 {
            color: #007AFF;
            border-bottom: 3px solid #007AFF;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          .header-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .label {
            font-weight: 600;
            color: #555;
          }
          .value {
            color: #333;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #007AFF;
            margin-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
          }
          .final-price {
            background: #007AFF;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-top: 30px;
          }
          .final-price h2 {
            margin: 0;
            font-size: 36px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>AISA & CO. - Pricing Calculation</h1>
        
        <div class="header-info">
          <div class="row">
            <span class="label">Article Name:</span>
            <span class="value">${article.articleName || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Article Code:</span>
            <span class="value">${article.articleCode}</span>
          </div>
          <div class="row">
            <span class="label">Market:</span>
            <span class="value">${market.label}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${date}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Base Information</div>
          <div class="row">
            <span class="label">Base Price:</span>
            <span class="value">€${basePrice.toFixed(2)}/mt</span>
          </div>
          <div class="row">
            <span class="label">Profit Margin:</span>
            <span class="value">€${market.region === 'europe' ? profitMarginEurope : market.region === 'usa' ? profitMarginUSA : profitMarginOther}/mt</span>
          </div>
          <div class="row">
            <span class="label">Commission (${market.label}):</span>
            <span class="value">${customCommission}%</span>
          </div>
        </div>

        ${market.region === 'usa' ? `
        <div class="section">
          <div class="section-title">USD Conversion</div>
          <div class="row">
            <span class="label">Exchange Rate:</span>
            <span class="value">${fxRate}</span>
          </div>
        </div>
        ` : ''}

        ${useTransport ? `
        <div class="section">
          <div class="section-title">Transport Cost</div>
          <div class="row">
            <span class="label">Type:</span>
            <span class="value">${transportType === 'truck' ? 'Truck' : 'Air Freight'}</span>
          </div>
          <div class="row">
            <span class="label">Cost:</span>
            <span class="value">€${transportType === 'truck' ? transportTruck : transportAir}/mt</span>
          </div>
        </div>
        ` : ''}

        ${useSampling ? `
        <div class="section">
          <div class="section-title">Sampling Surcharge</div>
          <div class="row">
            <span class="label">Surcharge Rate:</span>
            <span class="value">${samplingRate}%</span>
          </div>
        </div>
        ` : ''}

        <div class="final-price">
          <p style="margin: 0; font-size: 14px;">Final Selling Price</p>
          <h2>€${finalPrice.toFixed(2)}/mt</h2>
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleString()}<br>
          AISA & CO. - Pricing Calculator
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${article.articleName} - Pricing - ${date}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate pricing report');
    }
  };

  const sendEmail = async () => {
    if (!article || finalPrice === null) return;

    const market = MARKETS.find(m => m.value === selectedMarket);
    if (!market) return;

    const date = new Date().toLocaleDateString();
    const basePrice = parseFloat(article.basePriceEUR) || 0;

    const emailBody = `
AISA & CO. - Pricing Calculation

Article: ${article.articleName || 'N/A'}
Code: ${article.articleCode}
Market: ${market.label}
Date: ${date}

--- Base Information ---
Base Price: €${basePrice.toFixed(2)}/mt
Profit Margin: €${market.region === 'europe' ? profitMarginEurope : market.region === 'usa' ? profitMarginUSA : profitMarginOther}/mt
Commission: ${customCommission}%

${market.region === 'usa' ? `--- USD Conversion ---
Exchange Rate: ${fxRate}
` : ''}
${useTransport ? `--- Transport Cost ---
Type: ${transportType === 'truck' ? 'Truck' : 'Air Freight'}
Cost: €${transportType === 'truck' ? transportTruck : transportAir}/mt
` : ''}
${useSampling ? `--- Sampling Surcharge ---
Surcharge Rate: ${samplingRate}%
` : ''}

=========================
FINAL SELLING PRICE: €${finalPrice.toFixed(2)}/mt
=========================

Generated by AISA & CO. Pricing Calculator
${new Date().toLocaleString()}
    `.trim();

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['sales@aisatrade.com'],
          subject: `${article.articleName} - Pricing - ${date}`,
          body: emailBody,
        });
      } else {
        Alert.alert('Email Not Available', 'Please configure email on your device');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to open email composer');
    }
  };

  const market = MARKETS.find(m => m.value === selectedMarket);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pricing Calculator</Text>
          <Text style={styles.headerSubtitle}>{article.articleCode}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Market Selection Dropdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Market</Text>
          
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowMarketPicker(true)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                {MARKETS.find(m => m.value === selectedMarket)?.label || 'Select Market'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {/* Commission Rate Input */}
          <View style={styles.commissionSection}>
            <Text style={styles.inputLabel}>Commission Rate (%):</Text>
            <TextInput
              style={styles.input}
              value={customCommission}
              onChangeText={setCustomCommission}
              keyboardType="decimal-pad"
              placeholder="5"
            />
          </View>
        </View>

        {/* Market Picker Modal */}
        <Modal
          visible={showMarketPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMarketPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMarketPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Market</Text>
                <TouchableOpacity onPress={() => setShowMarketPicker(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {MARKETS.map((market) => (
                <TouchableOpacity
                  key={market.value}
                  style={[
                    styles.modalItem,
                    selectedMarket === market.value && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedMarket(market.value);
                    setShowMarketPicker(false);
                  }}
                >
                  <View>
                    <Text style={[
                      styles.modalItemText,
                      selectedMarket === market.value && styles.modalItemTextActive,
                    ]}>
                      {market.label}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      Default: {(market.commission * 100).toFixed(0)}% commission
                    </Text>
                  </View>
                  {selectedMarket === market.value && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Base Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Base Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Price:</Text>
            <Text style={styles.infoValue}>€{parseFloat(article.basePriceEUR || '0').toFixed(2)}/mt</Text>
          </View>
        </View>

        {/* Profit Margin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profit Margin (EUR/mt)</Text>
          {market?.region === 'europe' && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Europe:</Text>
              <TextInput
                style={styles.input}
                value={profitMarginEurope}
                onChangeText={setProfitMarginEurope}
                keyboardType="decimal-pad"
                placeholder="0.80"
              />
            </View>
          )}
          {market?.region === 'usa' && (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>USA:</Text>
                <TextInput
                  style={styles.input}
                  value={profitMarginUSA}
                  onChangeText={setProfitMarginUSA}
                  keyboardType="decimal-pad"
                  placeholder="1.20"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>USD Exchange Rate:</Text>
                <TextInput
                  style={styles.input}
                  value={fxRate}
                  onChangeText={setFxRate}
                  keyboardType="decimal-pad"
                  placeholder="1.10"
                />
              </View>
            </>
          )}
          {market?.region === 'other' && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Other Countries:</Text>
              <TextInput
                style={styles.input}
                value={profitMarginOther}
                onChangeText={setProfitMarginOther}
                keyboardType="decimal-pad"
                placeholder="1.00"
              />
            </View>
          )}
        </View>

        {/* Transport Cost (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transport Cost (Optional)</Text>
            <TouchableOpacity
              style={styles.toggle}
              onPress={() => setUseTransport(!useTransport)}
            >
              <Ionicons
                name={useTransport ? 'checkbox' : 'square-outline'}
                size={24}
                color={useTransport ? '#007AFF' : '#999'}
              />
            </TouchableOpacity>
          </View>
          {useTransport && (
            <>
              <View style={styles.transportButtons}>
                <TouchableOpacity
                  style={[
                    styles.transportButton,
                    transportType === 'truck' && styles.transportButtonActive,
                  ]}
                  onPress={() => setTransportType('truck')}
                >
                  <Ionicons
                    name="car"
                    size={20}
                    color={transportType === 'truck' ? '#fff' : '#007AFF'}
                  />
                  <Text
                    style={[
                      styles.transportButtonText,
                      transportType === 'truck' && styles.transportButtonTextActive,
                    ]}
                  >
                    Truck
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.transportButton,
                    transportType === 'air' && styles.transportButtonActive,
                  ]}
                  onPress={() => setTransportType('air')}
                >
                  <Ionicons
                    name="airplane"
                    size={20}
                    color={transportType === 'air' ? '#fff' : '#007AFF'}
                  />
                  <Text
                    style={[
                      styles.transportButtonText,
                      transportType === 'air' && styles.transportButtonTextActive,
                    ]}
                  >
                    Air Freight
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  {transportType === 'truck' ? 'Truck' : 'Air'} Cost (EUR/mt):
                </Text>
                <TextInput
                  style={styles.input}
                  value={transportType === 'truck' ? transportTruck : transportAir}
                  onChangeText={transportType === 'truck' ? setTransportTruck : setTransportAir}
                  keyboardType="decimal-pad"
                  placeholder={transportType === 'truck' ? '0.30' : '1.00'}
                />
              </View>
            </>
          )}
        </View>

        {/* Sampling Surcharge (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sampling Surcharge (Optional)</Text>
            <TouchableOpacity
              style={styles.toggle}
              onPress={() => setUseSampling(!useSampling)}
            >
              <Ionicons
                name={useSampling ? 'checkbox' : 'square-outline'}
                size={24}
                color={useSampling ? '#007AFF' : '#999'}
              />
            </TouchableOpacity>
          </View>
          {useSampling && (
            <>
              <View style={styles.presetButtons}>
                {['30', '50', '100'].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.presetButton,
                      samplingRate === rate && styles.presetButtonActive,
                    ]}
                    onPress={() => setSamplingRate(rate)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        samplingRate === rate && styles.presetButtonTextActive,
                      ]}
                    >
                      {rate}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Custom Rate (%):</Text>
                <TextInput
                  style={styles.input}
                  value={samplingRate}
                  onChangeText={setSamplingRate}
                  keyboardType="decimal-pad"
                  placeholder="30"
                />
              </View>
            </>
          )}
        </View>

        {/* Final Price */}
        {finalPrice !== null && (
          <View style={styles.finalPriceCard}>
            <Text style={styles.finalPriceLabel}>Final Selling Price</Text>
            <Text style={styles.finalPriceValue}>€{finalPrice.toFixed(2)}/mt</Text>
            <Text style={styles.finalPriceMarket}>{market?.label}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={savePricingCalculation}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={generatePricingReport}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={sendEmail}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing History Section */}
        {pricingHistory.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity 
              style={styles.historyHeader}
              onPress={() => setShowHistory(!showHistory)}
            >
              <View style={styles.historyHeaderLeft}>
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={styles.historyTitle}>
                  Pricing History ({pricingHistory.length})
                </Text>
              </View>
              <Ionicons 
                name={showHistory ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#007AFF" 
              />
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyList}>
                {pricingHistory.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyItemInfo}>
                        <Text style={styles.historyItemMarket}>{item.marketLabel}</Text>
                        <Text style={styles.historyItemDate}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.historyItemPrice}>
                        €{item.finalPrice.toFixed(2)}/mt
                      </Text>
                    </View>
                    
                    <View style={styles.historyItemDetails}>
                      <Text style={styles.historyItemDetail}>
                        Base: €{item.basePrice.toFixed(2)} + Profit: €{item.profitMargin}
                      </Text>
                      {item.useTransport && (
                        <Text style={styles.historyItemDetail}>
                          Transport: {item.transportType} (€{item.transportCost})
                        </Text>
                      )}
                      {item.useSampling && (
                        <Text style={styles.historyItemDetail}>
                          Sampling: {item.samplingRate}%
                        </Text>
                      )}
                    </View>

                    <View style={styles.historyItemActions}>
                      <TouchableOpacity 
                        style={styles.historyItemButton}
                        onPress={() => loadHistoryItem(item)}
                      >
                        <Ionicons name="refresh" size={16} color="#007AFF" />
                        <Text style={styles.historyItemButtonText}>Load</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.historyItemButton, styles.historyItemButtonDanger]}
                        onPress={() => {
                          Alert.alert(
                            'Delete Calculation',
                            'Are you sure you want to delete this calculation?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                onPress: () => deleteHistoryItem(item.id),
                                style: 'destructive'
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={16} color="#FF3B30" />
                        <Text style={styles.historyItemButtonTextDanger}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  toggle: {
    padding: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  commissionSection: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemActive: {
    backgroundColor: '#F0F8FF',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalItemSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  marketButtons: {
    gap: 8,
  },
  marketButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  marketButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  marketButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  marketButtonTextActive: {
    color: '#007AFF',
  },
  marketCommission: {
    fontSize: 14,
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  transportButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  transportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    gap: 8,
  },
  transportButtonActive: {
    backgroundColor: '#007AFF',
  },
  transportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transportButtonTextActive: {
    color: '#fff',
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  presetButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  presetButtonTextActive: {
    color: '#007AFF',
  },
  finalPriceCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  finalPriceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  finalPriceValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 8,
  },
  finalPriceMarket: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyList: {
    padding: 12,
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemMarket: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  historyItemDetails: {
    marginBottom: 8,
  },
  historyItemDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  historyItemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  historyItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    gap: 4,
  },
  historyItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  historyItemButtonDanger: {
    borderColor: '#FF3B30',
  },
  historyItemButtonTextDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  bottomPadding: {
    height: 32,
  },
});
