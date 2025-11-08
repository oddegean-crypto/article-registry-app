import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = 'article_registry';
const SALES_HISTORY_KEY = 'sales_history';

// Platform-specific storage helper
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

interface Sale {
  id: string;
  timestamp: string;
  articleId: string;
  articleCode: string;
  customer: string;
  color: string;
  quantity: string;
  price: string;
  currency: 'EUR' | 'USD';
  unit: 'mt' | 'yrd';
}

interface SalesHistory {
  [articleId: string]: Sale[];
}

interface Article {
  id: string;
  articleCode: string;
  colorCode: string;
  colorHex?: string;
  treatmentName: string;
  articleName: string;
  colorName: string;
  supplier: string;
  supplierCode: string;
  section: string;
  season: string;
  suppArtCode: string;
  composition: string;
  weave: string;
  stretch: string;
  construction: string;
  weightGSM: string;
  widthCM: string;
  dyeType: string;
  careLabel: string;
  barcodeQR: string;
  basePriceEUR: string;
  [key: string]: any;
}

export default function ArticleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Sales tracking
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleColor, setSaleColor] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleCurrency, setSaleCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [saleUnit, setSaleUnit] = useState<'mt' | 'yrd'>('mt');

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const articles: Article[] = JSON.parse(stored);
        const found = articles.find((a) => a.id === id);
        if (found) {
          setArticle(found);
          // Load sales history for this article by ID
          await loadSalesHistory(found.id);
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

  const loadSalesHistory = async (articleId: string) => {
    try {
      const historyStr = await storage.getItem(SALES_HISTORY_KEY);
      if (historyStr) {
        const allHistory: SalesHistory = JSON.parse(historyStr);
        const articleSales = allHistory[articleId] || [];
        // Sort by timestamp descending (newest first)
        setSalesHistory(articleSales.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading sales history:', error);
    }
  };

  const saveSale = async () => {
    if (!article) return;

    if (!saleCustomer.trim() || !saleColor.trim() || !saleQuantity.trim() || !salePrice.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const historyStr = await storage.getItem(SALES_HISTORY_KEY);
      let allHistory: SalesHistory = historyStr ? JSON.parse(historyStr) : {};
      
      if (!allHistory[article.id]) {
        allHistory[article.id] = [];
      }

      if (editingSale) {
        // Update existing sale
        const updatedSale: Sale = {
          ...editingSale,
          customer: saleCustomer.trim(),
          color: saleColor.trim(),
          quantity: saleQuantity.trim(),
          price: salePrice.trim(),
          currency: saleCurrency,
          unit: saleUnit,
        };

        allHistory[article.id] = allHistory[article.id].map(sale =>
          sale.id === editingSale.id ? updatedSale : sale
        );

        Alert.alert('Success', 'Sale updated successfully');
      } else {
        // Add new sale
        const sale: Sale = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          articleId: article.id,
          articleCode: article.articleCode,
          customer: saleCustomer.trim(),
          color: saleColor.trim(),
          quantity: saleQuantity.trim(),
          price: salePrice.trim(),
          currency: saleCurrency,
          unit: saleUnit,
        };

        allHistory[article.id].unshift(sale);
        Alert.alert('Success', 'Sale recorded successfully');
      }
      
      await storage.setItem(SALES_HISTORY_KEY, JSON.stringify(allHistory));
      setSalesHistory(allHistory[article.id]);
      
      // Reset form
      setShowAddSaleModal(false);
      setEditingSale(null);
      setSaleCustomer('');
      setSaleColor('');
      setSaleQuantity('');
      setSalePrice('');
      setSaleCurrency('EUR');
      setSaleUnit('mt');
    } catch (error) {
      console.error('Error saving sale:', error);
      Alert.alert('Error', 'Failed to save sale');
    }
  };

  const startEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleCustomer(sale.customer);
    setSaleColor(sale.color);
    setSaleQuantity(sale.quantity);
    setSalePrice(sale.price);
    setSaleCurrency(sale.currency);
    setSaleUnit(sale.unit);
    setShowSalesModal(false);
    setShowAddSaleModal(true);
  };

  const deleteSale = async (saleId: string) => {
    if (!article) return;

    try {
      const historyStr = await storage.getItem(SALES_HISTORY_KEY);
      if (!historyStr) return;
      
      let allHistory: SalesHistory = JSON.parse(historyStr);
      
      if (allHistory[article.id]) {
        allHistory[article.id] = allHistory[article.id].filter(
          sale => sale.id !== saleId
        );
        await storage.setItem(SALES_HISTORY_KEY, JSON.stringify(allHistory));
        setSalesHistory(allHistory[article.id]);
        Alert.alert('Success', 'Sale deleted');
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      Alert.alert('Error', 'Failed to delete sale');
    }
  };

  const getTotalQuantitySold = () => {
    return salesHistory.reduce((total, sale) => {
      const qty = parseFloat(sale.quantity) || 0;
      return total + qty;
    }, 0);
  };

  const generatePDF = async () => {
    if (!article) return;

    // Show alert to choose PDF type
    if (Platform.OS === 'web') {
      const choice = window.confirm('Choose PDF type:\n\nClick OK for WSMAIN (With Supplier Info)\nClick Cancel for WOMAIN (Without Supplier Info)');
      await createPDF(choice ? 'WSMAIN' : 'WOMAIN');
    } else {
      Alert.alert(
        'Choose PDF Type',
        'Select the type of PDF you want to export:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'WOMAIN',
            onPress: () => createPDF('WOMAIN'),
            style: 'default',
          },
          {
            text: 'WSMAIN',
            onPress: () => createPDF('WSMAIN'),
            style: 'default',
          },
        ]
      );
    }
  };

  const createPDF = async (pdfType: 'WSMAIN' | 'WOMAIN') => {
    if (!article) return;

    try {
      setExporting(true);

      const includeSupplier = pdfType === 'WSMAIN';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
            .header {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .header-left h2 {
              margin: 0 0 8px 0;
              font-size: 28px;
            }
            .header-left p {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
              color: #007AFF;
            }
            .header-right {
              text-align: right;
            }
            .header-right p {
              margin: 0 0 6px 0;
              font-size: 15px;
              font-weight: 600;
            }
            .season {
              color: #8B0000;
            }
            .section {
              color: #B8860B;
            }
            .tags {
              margin-top: 15px;
              display: flex;
              gap: 10px;
            }
            .tag {
              background: #e0e0e0;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              color: #666;
            }
            .section-box {
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
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .detail-label {
              font-weight: 600;
              color: #555;
              width: 180px;
              flex-shrink: 0;
            }
            .detail-value {
              color: #333;
              flex: 1;
            }
            .empty-value {
              color: #999;
              font-style: italic;
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
          <h1>AISA & CO. - Article Data Sheet</h1>
          
          <div class="header">
            <div class="header-row">
              <div class="header-left">
                <h2>${article.articleName || 'No name'}</h2>
              </div>
              <div class="header-right">
                <p class="season">${article.season || '-'}</p>
              </div>
            </div>
            <div class="header-row">
              <div class="header-left">
                <p>${article.articleCode}</p>
              </div>
              <div class="header-right">
                <p class="section">${article.section || '-'}</p>
              </div>
            </div>
            ${article.colorCode || article.treatmentName ? `
              <div class="tags">
                ${article.colorCode ? `<span class="tag">Color: ${article.colorCode}</span>` : ''}
                ${article.treatmentName ? `<span class="tag">Treatment: ${article.treatmentName}</span>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="section-box">
            <div class="section-title">Fabric Specifications</div>
            ${renderDetailRow('Composition', article.composition)}
            ${renderDetailRow('Weight GSM', article.weightGSM)}
            ${renderDetailRow('Width CM', article.widthCM)}
            ${renderDetailRow('Stretch', article.stretch)}
            ${renderDetailRow('Weave', article.weave)}
            ${renderDetailRow('Dye Type', article.dyeType)}
            ${renderDetailRow('Care Label', article.careLabel)}
          </div>

          <div class="section-box">
            <div class="section-title">Color & Treatment</div>
            ${renderDetailRow('Color Code', article.colorCode)}
            ${renderDetailRow('Color Name', article.colorName)}
            ${renderDetailRow('Treatment Code', article.treatmentCode)}
            ${renderDetailRow('Treatment Name', article.treatmentName)}
          </div>

          ${includeSupplier ? `
          <div class="section-box">
            <div class="section-title">Supplier Information</div>
            ${renderDetailRow('Supplier', article.supplier)}
            ${renderDetailRow('Supp. Art. Code', article.suppArtCode)}
            ${renderDetailRow('Base Price EUR', article.basePriceEUR)}
          </div>
          ` : ''}

          <div class="section-box">
            <div class="section-title">Additional Information</div>
            ${renderDetailRow('Barcode/QR', article.barcodeQR)}
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleString()}<br>
            AISA & CO. Mobile App - Article Data Sheet
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Article ${article.articleCode} - ${pdfType}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const renderDetailRow = (label: string, value: any) => {
    const displayValue = value || '';
    const isEmpty = !displayValue || displayValue === '';
    return `
      <div class="detail-row">
        <div class="detail-label">${label}:</div>
        <div class="detail-value ${isEmpty ? 'empty-value' : ''}">${isEmpty ? '-' : displayValue}</div>
      </div>
    `;
  };

  const shareAsText = async () => {
    if (!article) return;

    const text = `
📋 ARTICLE DETAILS

Article Code: ${article.articleCode}
Article Name: ${article.articleName || '-'}

COLOR & TREATMENT
Color Code: ${article.colorCode || '-'}
Color Name: ${article.colorName || '-'}
Treatment: ${article.treatmentName || '-'}

FABRIC SPECS
Composition: ${article.composition || '-'}
Weight: ${article.weightGSM || '-'} GSM
Width: ${article.widthCM || '-'} CM
Weave: ${article.weave || '-'}
Stretch: ${article.stretch || '-'}

SUPPLIER
Supplier: ${article.supplier || '-'}
Section: ${article.section || '-'}
Season: ${article.season || '-'}

PRICING
Base Price: ${article.basePriceEUR || '-'} EUR

---
Generated from Article Registry App
${new Date().toLocaleString()}
    `.trim();

    try {
      if (await Sharing.isAvailableAsync()) {
        // Create a text file
        const { uri } = await Print.printToFileAsync({
          html: `<pre>${text}</pre>`,
        });
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share Article ${article.articleCode}`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share article');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Article Details</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareAsText} style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          {/* First Row: Article Name & Season */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.articleName}>{article.articleName || 'No name'}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.seasonValue}>{article.season || '-'}</Text>
            </View>
          </View>
          
          {/* Second Row: Article Code & Section */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.articleCode}>{article.articleCode}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.sectionValue}>{article.section || '-'}</Text>
            </View>
          </View>
          
          {/* Color & Treatment Tags - Smaller */}
          {(article.colorCode || article.treatmentName) && (
            <View style={styles.tagsContainer}>
              {article.colorCode && (
                <View style={styles.tag}>
                  <View style={styles.tagContentRow}>
                    {article.colorHex && (
                      <View style={[styles.colorSwatchTag, { backgroundColor: article.colorHex }]} />
                    )}
                    <Text style={styles.tagText}>Color: {article.colorCode}</Text>
                  </View>
                </View>
              )}
              {article.treatmentName && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Treatment: {article.treatmentName}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Fabric Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fabric Specifications</Text>
          {renderDetail('Composition', article.composition)}
          {renderDetail('Weight GSM', article.weightGSM)}
          {renderDetail('Width CM', article.widthCM)}
          {renderDetail('Stretch', article.stretch)}
          {renderDetail('Weave', article.weave)}
          {renderDetail('Dye Type', article.dyeType)}
          {renderDetail('Care Label', article.careLabel)}
        </View>

        {/* Color & Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color & Treatment</Text>
          {renderDetail('Color Code', article.colorCode)}
          {renderDetail('Color Name', article.colorName)}
          {renderDetail('Treatment Code', article.treatmentCode)}
          {renderDetail('Treatment Name', article.treatmentName)}
        </View>

        {/* Supplier Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>
          {renderDetail('Supplier', article.supplier)}
          {renderDetail('Supp. Art. Code', article.suppArtCode)}
          {renderDetail('Base Price EUR', article.basePriceEUR)}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {renderDetail('Barcode/QR', article.barcodeQR)}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => router.push(`/pricing/${encodeURIComponent(article.id)}`)}
        >
          <Ionicons name="calculator" size={24} color="#007AFF" />
          <Text style={styles.fabTextSecondary}>PRICING</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabSold]}
          onPress={() => setShowSalesModal(true)}
        >
          <Ionicons name="cart" size={24} color="#10B981" />
          <Text style={styles.fabTextSold}>SOLD</Text>
          {salesHistory.length > 0 && (
            <View style={styles.salesBadge}>
              <Text style={styles.salesBadgeText}>{salesHistory.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={generatePDF}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.fabText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sales Modal */}
      <Modal
        visible={showSalesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSalesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.salesModalContent}>
            <View style={styles.salesModalHeader}>
              <Text style={styles.salesModalTitle}>Sales History</Text>
              <TouchableOpacity onPress={() => setShowSalesModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.salesSummary}>
              <Text style={styles.salesSummaryText}>
                Total Sold: {getTotalQuantitySold().toFixed(2)} units
              </Text>
              <Text style={styles.salesSummarySubtext}>
                {salesHistory.length} {salesHistory.length === 1 ? 'sale' : 'sales'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addSaleButton}
              onPress={() => {
                setShowSalesModal(false);
                setShowAddSaleModal(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addSaleButtonText}>Record New Sale</Text>
            </TouchableOpacity>

            <ScrollView style={styles.salesList}>
              {salesHistory.length === 0 ? (
                <Text style={styles.noSalesText}>No sales recorded yet</Text>
              ) : (
                salesHistory.map((sale) => {
                  console.log('Rendering sale:', sale);
                  return (
                  <View key={sale.id} style={styles.saleItem}>
                    <View style={styles.saleItemHeader}>
                      <View style={styles.saleItemHeaderLeft}>
                        <Text style={styles.saleCustomer}>{sale.customer}</Text>
                        <Text style={styles.saleDate}>
                          {new Date(sale.timestamp).toLocaleDateString()} {new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </View>
                      <View style={styles.saleItemActions}>
                        <TouchableOpacity
                          style={styles.editSaleButton}
                          onPress={() => startEditSale(sale)}
                        >
                          <Ionicons name="pencil" size={18} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteSaleButton}
                          onPress={() => {
                            Alert.alert(
                              'Delete Sale',
                              'Are you sure you want to delete this sale record?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  onPress: () => deleteSale(sale.id),
                                  style: 'destructive',
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.saleDetailRow}>
                      <View style={styles.saleDetailItem}>
                        <Ionicons name="color-palette" size={16} color="#666" />
                        <Text style={styles.saleDetailLabel}>Color:</Text>
                        <Text style={styles.saleDetailValue}>{sale.color}</Text>
                      </View>
                    </View>

                    <View style={styles.saleDetailRow}>
                      <View style={styles.saleDetailItem}>
                        <Ionicons name="cube" size={16} color="#666" />
                        <Text style={styles.saleDetailLabel}>Quantity:</Text>
                        <Text style={styles.saleDetailValue}>
                          {sale.quantity} {sale.unit}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.saleDetailRow}>
                      <View style={styles.saleDetailItem}>
                        <Ionicons name="cash" size={16} color="#666" />
                        <Text style={styles.saleDetailLabel}>Price:</Text>
                        <Text style={styles.saleDetailValue}>
                          {sale.currency === 'EUR' ? '€' : '$'}{sale.price}/{sale.unit}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.saleTotalRow}>
                      <Text style={styles.saleTotalLabel}>Total Amount:</Text>
                      <Text style={styles.saleTotalValue}>
                        {sale.currency === 'EUR' ? '€' : '$'}
                        {(parseFloat(sale.quantity) * parseFloat(sale.price)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Sale Modal */}
      <Modal
        visible={showAddSaleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddSaleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddSaleModal(false)}
          >
            <View style={styles.addSaleModalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.salesModalHeader}>
                <Text style={styles.salesModalTitle}>
                  {editingSale ? 'Edit Sale' : 'Record Sale'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowAddSaleModal(false);
                  setEditingSale(null);
                  setSaleCustomer('');
                  setSaleColor('');
                  setSaleQuantity('');
                  setSalePrice('');
                  setSaleCurrency('EUR');
                  setSaleUnit('mt');
                }}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.addSaleForm}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  value={saleCustomer}
                  onChangeText={setSaleCustomer}
                  placeholder="Enter customer name"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Color/Variant *</Text>
                <TextInput
                  style={styles.input}
                  value={saleColor}
                  onChangeText={setSaleColor}
                  placeholder="Enter color or variant"
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Quantity *</Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={saleQuantity}
                    onChangeText={setSaleQuantity}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                  <View style={styles.unitSelector}>
                    <TouchableOpacity
                      style={[styles.unitButton, saleUnit === 'mt' && styles.unitButtonActive]}
                      onPress={() => setSaleUnit('mt')}
                    >
                      <Text style={[styles.unitButtonText, saleUnit === 'mt' && styles.unitButtonTextActive]}>
                        mt
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitButton, saleUnit === 'yrd' && styles.unitButtonActive]}
                      onPress={() => setSaleUnit('yrd')}
                    >
                      <Text style={[styles.unitButtonText, saleUnit === 'yrd' && styles.unitButtonTextActive]}>
                        yrd
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Price *</Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={salePrice}
                    onChangeText={setSalePrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                  <View style={styles.unitSelector}>
                    <TouchableOpacity
                      style={[styles.unitButton, saleCurrency === 'EUR' && styles.unitButtonActive]}
                      onPress={() => setSaleCurrency('EUR')}
                    >
                      <Text style={[styles.unitButtonText, saleCurrency === 'EUR' && styles.unitButtonTextActive]}>
                        EUR
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitButton, saleCurrency === 'USD' && styles.unitButtonActive]}
                      onPress={() => setSaleCurrency('USD')}
                    >
                      <Text style={[styles.unitButtonText, saleCurrency === 'USD' && styles.unitButtonTextActive]}>
                        USD
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.addSaleButtons}>
                  <TouchableOpacity
                    style={[styles.addSaleModalButton, styles.addSaleModalButtonCancel]}
                    onPress={() => setShowAddSaleModal(false)}
                  >
                    <Text style={styles.addSaleModalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addSaleModalButton, styles.addSaleModalButtonSave]}
                    onPress={saveSale}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.addSaleModalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );

  function renderDetail(label: string, value: any) {
    if (!value) return null;
    
    // Special rendering for Color Code with hex swatch
    if (label === 'Color Code' && article?.colorHex) {
      return (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          <View style={styles.detailValueWithSwatch}>
            <View style={[styles.colorSwatchDetail, { backgroundColor: article.colorHex }]} />
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  }
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  articleHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  articleName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  articleCode: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  seasonValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B0000',
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B8860B',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 140,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomPadding: {
    height: 80,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  fabSold: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10B981',
    position: 'relative',
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fabTextSold: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  salesBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  salesBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  salesModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 32,
  },
  salesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  salesModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  salesSummary: {
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  salesSummaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  salesSummarySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  addSaleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  salesList: {
    flex: 1,
    paddingHorizontal: 16,
    minHeight: 200,
  },
  noSalesText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  saleItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  saleItemHeaderLeft: {
    flex: 1,
  },
  saleItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editSaleButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  deleteSaleButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  saleCustomer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#999',
  },
  saleDetailRow: {
    marginBottom: 8,
  },
  saleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saleDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  saleTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saleTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saleTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  saleColor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  addSaleModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  addSaleForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  addSaleButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  addSaleModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addSaleModalButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addSaleModalButtonSave: {
    backgroundColor: '#10B981',
  },
  addSaleModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addSaleModalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
