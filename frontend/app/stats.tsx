import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystemLegacy from 'expo-file-system/legacy';

const STORAGE_KEY = 'article_registry';
const FAVORITES_KEY = 'article_favorites';
const RECENT_KEY = 'article_recent';
const SALES_HISTORY_KEY = 'sales_history';

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
};

interface SalesStats {
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: {
    EUR: number;
    USD: number;
  };
  topSellingArticles: Array<{
    articleCode: string;
    articleName: string;
    quantity: number;
    orders: number;
  }>;
  recentSales: Array<{
    customer: string;
    articleCode: string;
    quantity: string;
    price: string;
    currency: string;
    timestamp: string;
  }>;
}

interface Stats {
  total: number;
  bySeason: { [key: string]: number };
  bySection: { [key: string]: number };
  bySupplier: { [key: string]: number };
  priceRange: { min: number; max: number; avg: number };
  favoritesCount: number;
  recentCount: number;
  sales: SalesStats;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    bySeason: {},
    bySection: {},
    bySupplier: {},
    priceRange: { min: 0, max: 0, avg: 0 },
    favoritesCount: 0,
    recentCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      const favStored = await storage.getItem(FAVORITES_KEY);
      const recentStored = await storage.getItem(RECENT_KEY);

      if (stored) {
        const articles = JSON.parse(stored);
        const favorites = favStored ? JSON.parse(favStored) : [];
        const recent = recentStored ? JSON.parse(recentStored) : [];

        const total = articles.length;
        const bySeason: { [key: string]: number } = {};
        const bySection: { [key: string]: number } = {};
        const bySupplier: { [key: string]: number } = {};
        let minPrice = Infinity;
        let maxPrice = 0;
        let totalPrice = 0;
        let priceCount = 0;

        articles.forEach((article: any) => {
          if (article.season) {
            bySeason[article.season] = (bySeason[article.season] || 0) + 1;
          }
          if (article.section) {
            bySection[article.section] = (bySection[article.section] || 0) + 1;
          }
          if (article.supplier) {
            bySupplier[article.supplier] = (bySupplier[article.supplier] || 0) + 1;
          }
          const price = parseFloat(article.basePriceEUR || '0');
          if (price > 0) {
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
            totalPrice += price;
            priceCount++;
          }
        });

        setStats({
          total,
          bySeason,
          bySection,
          bySupplier,
          priceRange: {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice,
            avg: priceCount > 0 ? totalPrice / priceCount : 0,
          },
          favoritesCount: favorites.length,
          recentCount: recent.length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderCategorySection = (
    title: string,
    data: { [key: string]: number },
    icon: string,
    color: string
  ) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const maxValue = Math.max(...entries.map(([, v]) => v));

    if (entries.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Ionicons name={icon as any} size={24} color={color} />
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        <View style={styles.categoryList}>
          {entries.map(([key, value]) => {
            const percentage = (value / maxValue) * 100;
            return (
              <View key={key} style={styles.categoryItem}>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {key}
                  </Text>
                  <Text style={styles.categoryValue}>{value}</Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.cardsGrid}>
            {renderStatCard('Total Articles', stats.total, 'albums', '#007AFF')}
            {renderStatCard('Favorites', stats.favoritesCount, 'heart', '#FF6B6B')}
            {renderStatCard('Recently Viewed', stats.recentCount, 'time', '#FFA500')}
            {renderStatCard(
              'Avg Price',
              stats.priceRange.avg > 0 ? `€${stats.priceRange.avg.toFixed(2)}` : 'N/A',
              'cash',
              '#4CAF50'
            )}
          </View>
        </View>

        {/* Price Range */}
        {stats.priceRange.max > 0 && (
          <View style={styles.priceSection}>
            <View style={styles.categoryHeader}>
              <Ionicons name="pricetag" size={24} color="#4CAF50" />
              <Text style={styles.categoryTitle}>Price Range</Text>
            </View>
            <View style={styles.priceCard}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Minimum</Text>
                <Text style={[styles.priceValue, { color: '#4CAF50' }]}>
                  €{stats.priceRange.min.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Maximum</Text>
                <Text style={[styles.priceValue, { color: '#FF6B6B' }]}>
                  €{stats.priceRange.max.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Average</Text>
                <Text style={[styles.priceValue, { color: '#007AFF' }]}>
                  €{stats.priceRange.avg.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* By Season */}
        {renderCategorySection('By Season', stats.bySeason, 'sunny', '#FFA500')}

        {/* By Section */}
        {renderCategorySection('By Section', stats.bySection, 'grid', '#9C27B0')}

        {/* By Supplier */}
        {renderCategorySection('By Supplier', stats.bySupplier, 'business', '#2196F3')}

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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  overviewSection: {
    marginBottom: 24,
  },
  cardsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  priceSection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
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
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  categoryItem: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginLeft: 8,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomPadding: {
    height: 32,
  },
});