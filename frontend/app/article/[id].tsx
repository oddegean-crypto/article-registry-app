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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@article_registry';

interface Article {
  id: string;
  articleCode: string;
  colorCode: string;
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

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const articles: Article[] = JSON.parse(stored);
        const found = articles.find((a) => a.id === id);
        if (found) {
          setArticle(found);
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

  const generatePDF = async () => {
    if (!article) return;

    try {
      setExporting(true);

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
            .header h2 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
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
          <h1>Article Registry - Detail Report</h1>
          
          <div class="header">
            <h2>${article.articleCode}</h2>
            <p><strong>${article.articleName || 'No name'}</strong></p>
            ${article.colorCode ? `<p>Color Code: ${article.colorCode} ${article.colorName ? '- ' + article.colorName : ''}</p>` : ''}
            ${article.treatmentName ? `<p>Treatment: ${article.treatmentName}</p>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Basic Information</div>
            ${renderDetailRow('Article Code', article.articleCode)}
            ${renderDetailRow('Article Name', article.articleName)}
            ${renderDetailRow('Supplier', article.supplier)}
            ${renderDetailRow('Supplier Code', article.supplierCode)}
            ${renderDetailRow('Supp. Art. Code', article.suppArtCode)}
            ${renderDetailRow('Section', article.section)}
            ${renderDetailRow('Season', article.season)}
          </div>

          <div class="section">
            <div class="section-title">Color & Treatment</div>
            ${renderDetailRow('Color Code', article.colorCode)}
            ${renderDetailRow('Color Name', article.colorName)}
            ${renderDetailRow('Treatment Code', article.treatmentCode)}
            ${renderDetailRow('Treatment Name', article.treatmentName)}
          </div>

          <div class="section">
            <div class="section-title">Fabric Specifications</div>
            ${renderDetailRow('Composition', article.composition)}
            ${renderDetailRow('Weave', article.weave)}
            ${renderDetailRow('Stretch', article.stretch)}
            ${renderDetailRow('Construction', article.construction)}
            ${renderDetailRow('Weight GSM', article.weightGSM)}
            ${renderDetailRow('Width CM', article.widthCM)}
            ${renderDetailRow('Dye Type', article.dyeType)}
          </div>

          <div class="section">
            <div class="section-title">Additional Information</div>
            ${renderDetailRow('Care Label', article.careLabel)}
            ${renderDetailRow('Barcode/QR', article.barcodeQR)}
            ${renderDetailRow('Base Price EUR', article.basePriceEUR)}
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleString()}<br>
            Article Registry Mobile App
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Article ${article.articleCode}`,
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
          <Text style={styles.articleCode}>{article.articleCode}</Text>
          <Text style={styles.articleName}>{article.articleName || 'No name'}</Text>
          {(article.colorCode || article.treatmentName) && (
            <View style={styles.tagsContainer}>
              {article.colorCode && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Color: {article.colorCode}</Text>
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

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderDetail('Article Code', article.articleCode)}
          {renderDetail('Article Name', article.articleName)}
          {renderDetail('Supplier', article.supplier)}
          {renderDetail('Supplier Code', article.supplierCode)}
          {renderDetail('Supp. Art. Code', article.suppArtCode)}
          {renderDetail('Section', article.section)}
          {renderDetail('Season', article.season)}
        </View>

        {/* Color & Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color & Treatment</Text>
          {renderDetail('Color Code', article.colorCode)}
          {renderDetail('Color Name', article.colorName)}
          {renderDetail('Treatment Code', article.treatmentCode)}
          {renderDetail('Treatment Name', article.treatmentName)}
        </View>

        {/* Fabric Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fabric Specifications</Text>
          {renderDetail('Composition', article.composition)}
          {renderDetail('Weave', article.weave)}
          {renderDetail('Stretch', article.stretch)}
          {renderDetail('Construction', article.construction)}
          {renderDetail('Weight GSM', article.weightGSM)}
          {renderDetail('Width CM', article.widthCM)}
          {renderDetail('Dye Type', article.dyeType)}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {renderDetail('Care Label', article.careLabel)}
          {renderDetail('Barcode/QR', article.barcodeQR)}
          {renderDetail('Base Price EUR', article.basePriceEUR)}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
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
    </SafeAreaView>
  );

  function renderDetail(label: string, value: any) {
    if (!value) return null;
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
  articleCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  articleName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
