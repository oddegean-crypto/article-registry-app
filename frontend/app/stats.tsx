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
import { useTheme } from './ThemeContext';

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
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog'>('overview');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    bySeason: {},
    bySection: {},
    bySupplier: {},
    priceRange: { min: 0, max: 0, avg: 0 },
    favoritesCount: 0,
    recentCount: 0,
    sales: {
      totalOrders: 0,
      totalQuantity: 0,
      totalRevenue: { EUR: 0, USD: 0 },
      topSellingArticles: [],
      recentSales: [],
    },
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      const favStored = await storage.getItem(FAVORITES_KEY);
      const recentStored = await storage.getItem(RECENT_KEY);
      const salesStored = await storage.getItem(SALES_HISTORY_KEY);

      if (stored) {
        const articles = JSON.parse(stored);
        const favorites = favStored ? JSON.parse(favStored) : [];
        const recent = recentStored ? JSON.parse(recentStored) : [];
        const salesHistory = salesStored ? JSON.parse(salesStored) : {};

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

        // Calculate sales statistics
        let totalOrders = 0;
        let totalQuantity = 0;
        const revenueEUR = { total: 0 };
        const revenueUSD = { total: 0 };
        const articleSales: {[key: string]: { code: string; name: string; quantity: number; orders: number }} = {};
        const allSales: any[] = [];

        Object.entries(salesHistory).forEach(([articleId, sales]: [string, any]) => {
          sales.forEach((sale: any) => {
            totalOrders++;
            const qty = parseFloat(sale.quantity) || 0;
            const price = parseFloat(sale.price) || 0;
            totalQuantity += qty;

            // Calculate revenue
            const revenue = qty * price;
            if (sale.currency === 'EUR') {
              revenueEUR.total += revenue;
            } else if (sale.currency === 'USD') {
              revenueUSD.total += revenue;
            }

            // Track by article code
            if (!articleSales[sale.articleCode]) {
              articleSales[sale.articleCode] = {
                code: sale.articleCode,
                name: sale.articleId,
                quantity: 0,
                orders: 0,
              };
            }
            articleSales[sale.articleCode].quantity += qty;
            articleSales[sale.articleCode].orders++;

            // Add to all sales
            allSales.push({
              customer: sale.customer,
              articleCode: sale.articleCode,
              quantity: sale.quantity,
              price: sale.price,
              currency: sale.currency,
              timestamp: sale.timestamp,
            });
          });
        });

        // Get top 5 selling articles
        const topSellingArticles = Object.values(articleSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
          .map(item => ({
            articleCode: item.code,
            articleName: item.name,
            quantity: item.quantity,
            orders: item.orders,
          }));

        // Get recent 10 sales
        const recentSales = allSales
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

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
          sales: {
            totalOrders,
            totalQuantity,
            totalRevenue: {
              EUR: revenueEUR.total,
              USD: revenueUSD.total,
            },
            topSellingArticles,
            recentSales,
          },
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name={activeTab === 'overview' ? 'cart' : 'cart-outline'}
            size={20}
            color={activeTab === 'overview' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'catalog' && styles.tabActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Ionicons
            name={activeTab === 'catalog' ? 'albums' : 'albums-outline'}
            size={20}
            color={activeTab === 'catalog' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            Catalog
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' ? (
          // Overview Tab - Sales & Orders
          <>
            {stats.sales.totalOrders > 0 ? (
              <>
                {/* Sales Overview Cards */}
                <View style={styles.salesCardsGrid}>
                  <View style={styles.salesCard}>
                    <Ionicons name="receipt" size={24} color="#10B981" />
                    <Text style={styles.salesCardValue}>{stats.sales.totalOrders}</Text>
                    <Text style={styles.salesCardLabel}>Total Orders</Text>
                  </View>
                  <View style={styles.salesCard}>
                    <Ionicons name="cube" size={24} color="#007AFF" />
                    <Text style={styles.salesCardValue}>{stats.sales.totalQuantity.toFixed(1)}</Text>
                    <Text style={styles.salesCardLabel}>Units Sold</Text>
                  </View>
                </View>

                {/* Revenue Cards */}
                <View style={styles.revenueSection}>
                  <Text style={styles.revenueSectionTitle}>Total Revenue</Text>
                  <View style={styles.revenueCards}>
                    {stats.sales.totalRevenue.EUR > 0 && (
                      <View style={styles.revenueCard}>
                        <Text style={styles.revenueCurrency}>EUR</Text>
                        <Text style={styles.revenueAmount}>
                          €{stats.sales.totalRevenue.EUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    )}
                    {stats.sales.totalRevenue.USD > 0 && (
                      <View style={styles.revenueCard}>
                        <Text style={styles.revenueCurrency}>USD</Text>
                        <Text style={styles.revenueAmount}>
                          ${stats.sales.totalRevenue.USD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Top Selling Articles */}
                {stats.sales.topSellingArticles.length > 0 && (
                  <View style={styles.topSellingSection}>
                    <Text style={styles.revenueSectionTitle}>Top Selling Articles</Text>
                    {stats.sales.topSellingArticles.map((article, index) => (
                      <View key={index} style={styles.topSellingItem}>
                        <View style={styles.topSellingRank}>
                          <Text style={styles.topSellingRankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.topSellingInfo}>
                          <Text style={styles.topSellingCode}>{article.articleCode}</Text>
                          <Text style={styles.topSellingDetails}>
                            {article.quantity.toFixed(1)} units • {article.orders} orders
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent Sales */}
                {stats.sales.recentSales.length > 0 && (
                  <View style={styles.recentSalesSection}>
                    <Text style={styles.revenueSectionTitle}>Recent Sales</Text>
                    {stats.sales.recentSales.slice(0, 5).map((sale, index) => (
                      <View key={index} style={styles.recentSaleItem}>
                        <View style={styles.recentSaleHeader}>
                          <Text style={styles.recentSaleCustomer}>{sale.customer}</Text>
                          <Text style={styles.recentSaleAmount}>
                            {sale.currency === 'EUR' ? '€' : '$'}{parseFloat(sale.price).toFixed(2)}
                          </Text>
                        </View>
                        <Text style={styles.recentSaleDetails}>
                          {sale.articleCode} • {sale.quantity} units
                        </Text>
                        <Text style={styles.recentSaleDate}>
                          {new Date(sale.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Sales Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start recording sales to see your overview here
                </Text>
              </View>
            )}
          </>
        ) : (
          // Catalog Tab - Article Statistics
          <>
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
          </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
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
  salesSection: {
    marginBottom: 24,
  },
  salesCardsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  salesCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
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
  salesCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  salesCardLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  revenueSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  revenueSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  revenueCards: {
    flexDirection: 'row',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  revenueCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  topSellingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  topSellingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  topSellingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSellingRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  topSellingInfo: {
    flex: 1,
  },
  topSellingCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topSellingDetails: {
    fontSize: 13,
    color: '#666',
  },
  recentSalesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  recentSaleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentSaleCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  recentSaleAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  recentSaleDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  recentSaleDate: {
    fontSize: 12,
    color: '#999',
  },
  bottomPadding: {
    height: 32,
  },
});