import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STORAGE_KEY = 'article_registry';
const FAVORITES_KEY = 'article_favorites';
const RECENT_KEY = 'article_recent';
const SAVED_SEARCHES_KEY = 'saved_searches';
const FILTER_KEY = 'article_filters';

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
      return;
    }
    const filePath = `${FileSystemLegacy.documentDirectory}${key}.json`;
    await FileSystemLegacy.writeAsStringAsync(filePath, value);
  },
};

interface Article {
  id: string;
  articleCode: string;
  colorCode: string;
  treatmentName: string;
  articleName: string;
  colorName: string;
  supplier: string;
  section: string;
  season: string;
  composition: string;
  weightGSM: string;
  widthCM: string;
  basePriceEUR: string;
  [key: string]: any;
}

type SortOption = 'name' | 'code' | 'date' | 'price';
type ViewMode = 'all' | 'favorites' | 'recent' | 'searches';

export default function HomeScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentArticles, setRecentArticles] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('name');
  const [activeFilters, setActiveFilters] = useState<any>(null);

  useEffect(() => {
    loadLocalArticles();
    loadFavorites();
    loadRecentArticles();
    loadSavedSearches();
  }, []);

  // Reload filters when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFilters();
    }, [])
  );

  useEffect(() => {
    filterAndSortArticles();
  }, [searchQuery, articles, favorites, recentArticles, viewMode, currentSort, activeFilters]);

  const loadFilters = async () => {
    try {
      const stored = await storage.getItem(FILTER_KEY);
      console.log('Raw stored filters:', stored);
      if (stored && stored !== '{}') {
        const filters = JSON.parse(stored);
        console.log('Parsed filters:', filters);
        
        // Check if filters actually have values
        const hasFilters = 
          (filters.seasons && filters.seasons.length > 0) ||
          (filters.sections && filters.sections.length > 0) ||
          (filters.suppliers && filters.suppliers.length > 0) ||
          filters.minPrice ||
          filters.maxPrice;
        
        if (hasFilters) {
          setActiveFilters(filters);
          console.log('Active filters set:', filters);
        } else {
          setActiveFilters(null);
          console.log('No active filters - empty object');
        }
      } else {
        setActiveFilters(null);
        console.log('No filters found in storage');
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadLocalArticles = async () => {
    try {
      setLoading(true);
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setArticles(data);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLocalArticles = async (data: Article[]) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving articles:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const stored = await storage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (favs: string[]) => {
    try {
      await storage.setItem(FAVORITES_KEY, JSON.stringify(favs));
      setFavorites(favs);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = (articleId: string) => {
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter(id => id !== articleId)
      : [...favorites, articleId];
    saveFavorites(newFavorites);
  };

  const loadRecentArticles = async () => {
    try {
      const stored = await storage.getItem(RECENT_KEY);
      if (stored) {
        setRecentArticles(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent articles:', error);
    }
  };

  const addToRecent = async (articleId: string) => {
    try {
      const newRecent = [articleId, ...recentArticles.filter(id => id !== articleId)].slice(0, 10);
      await storage.setItem(RECENT_KEY, JSON.stringify(newRecent));
      setRecentArticles(newRecent);
    } catch (error) {
      console.error('Error saving recent:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const stored = await storage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const saveSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const newSearches = [searchQuery, ...savedSearches.filter(s => s !== searchQuery)].slice(0, 10);
      await storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches));
      setSavedSearches(newSearches);
      Alert.alert('Success', 'Search saved!');
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const filterAndSortArticles = () => {
    let filtered = [...articles];

    // Filter by view mode
    if (viewMode === 'favorites') {
      filtered = filtered.filter(a => favorites.includes(a.id));
    } else if (viewMode === 'recent') {
      const recentIds = new Set(recentArticles);
      filtered = filtered.filter(a => recentIds.has(a.id));
      // Sort by recent order
      filtered.sort((a, b) => recentArticles.indexOf(a.id) - recentArticles.indexOf(b.id));
    }

    // Apply advanced filters - only if filters exist and are not empty
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      console.log('Applying filters:', activeFilters);
      
      // Filter by seasons
      if (activeFilters.seasons && activeFilters.seasons.length > 0) {
        console.log('Filtering by seasons:', activeFilters.seasons);
        filtered = filtered.filter(a => 
          a.season && activeFilters.seasons.includes(a.season)
        );
      }

      // Filter by sections
      if (activeFilters.sections && activeFilters.sections.length > 0) {
        console.log('Filtering by sections:', activeFilters.sections);
        filtered = filtered.filter(a => 
          a.section && activeFilters.sections.includes(a.section)
        );
      }

      // Filter by suppliers
      if (activeFilters.suppliers && activeFilters.suppliers.length > 0) {
        console.log('Filtering by suppliers:', activeFilters.suppliers);
        filtered = filtered.filter(a => 
          a.supplier && activeFilters.suppliers.includes(a.supplier)
        );
      }

      // Filter by price range
      if (activeFilters.minPrice || activeFilters.maxPrice) {
        console.log('Filtering by price:', activeFilters.minPrice, '-', activeFilters.maxPrice);
        filtered = filtered.filter(a => {
          const price = parseFloat(a.basePriceEUR || '0');
          const min = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : 0;
          const max = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : Infinity;
          return price >= min && price <= max;
        });
      }
    } else {
      console.log('No filters active');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((article) => {
        return (
          article.articleCode?.toLowerCase().includes(query) ||
          article.articleName?.toLowerCase().includes(query) ||
          article.colorCode?.toLowerCase().includes(query) ||
          article.colorName?.toLowerCase().includes(query) ||
          article.treatmentName?.toLowerCase().includes(query) ||
          article.section?.toLowerCase().includes(query) ||
          article.season?.toLowerCase().includes(query) ||
          article.supplier?.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    if (viewMode !== 'recent') {
      filtered.sort((a, b) => {
        switch (currentSort) {
          case 'name':
            return (a.articleName || '').localeCompare(b.articleName || '');
          case 'code':
            return (a.articleCode || '').localeCompare(b.articleCode || '');
          case 'price':
            return parseFloat(a.basePriceEUR || '0') - parseFloat(b.basePriceEUR || '0');
          case 'date':
          default:
            return 0;
        }
      });
    }

    console.log('Filtered articles count:', filtered.length);
    setFilteredArticles(filtered);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const articles: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const article: any = {};

      headers.forEach((header, index) => {
        const key = convertHeaderToKey(header);
        article[key] = values[index] || '';
      });

      if (article.articleCode) {
        articles.push(article);
      }
    }

    return articles;
  };

  const convertHeaderToKey = (header: string): string => {
    const mapping: { [key: string]: string } = {
      'Article Code': 'articleCode',
      'Article Name': 'articleName',
      'Color Code': 'colorCode',
      'Color Name': 'colorName',
      'Treatment Name': 'treatmentName',
      'Treatment Code': 'treatmentCode',
      'Supplier': 'supplier',
      'Supplier Code': 'supplierCode',
      'Section': 'section',
      'Season': 'season',
      'Supp.Art.Code': 'suppArtCode',
      'Composition': 'composition',
      'Weave': 'weave',
      'Stretch': 'stretch',
      'Construction': 'construction',
      'Weight GSM': 'weightGSM',
      'Width CM': 'widthCM',
      'Dye Type': 'dyeType',
      'Care Label': 'careLabel',
      'Barcode/QR': 'barcodeQR',
      'Base Price EUR': 'basePriceEUR',
    };

    return mapping[header] || header.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const handleImportCSV = async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('Using web file input method');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          
          setLoading(true);
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const fileContent = event.target?.result as string;
              const parsedArticles = parseCSV(fileContent);

              if (parsedArticles.length === 0) {
                window.alert('No valid articles found in CSV file');
                setLoading(false);
                return;
              }

              const articlesWithIds = parsedArticles.map((article, index) => ({
                ...article,
                id: `${article.articleCode}-${article.colorCode}-${article.treatmentName}-${Date.now()}-${index}`,
              }));

              const shouldReplace = window.confirm(`Found ${parsedArticles.length} articles. Click OK to REPLACE all data, or Cancel to APPEND to existing data.`);
              
              if (shouldReplace) {
                setArticles(articlesWithIds);
                await saveLocalArticles(articlesWithIds);
                window.alert(`Successfully imported ${parsedArticles.length} articles`);
              } else {
                const merged = [...articles, ...articlesWithIds];
                setArticles(merged);
                await saveLocalArticles(merged);
                window.alert(`Successfully added ${parsedArticles.length} articles`);
              }
              setLoading(false);
            } catch (error) {
              console.error('Error parsing CSV:', error);
              window.alert('Failed to parse CSV file');
              setLoading(false);
            }
          };
          reader.readAsText(file);
        };
        input.click();
      } else {
        console.log('Using mobile DocumentPicker method');
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/comma-separated-values',
          copyToCacheDirectory: true,
        });

        if (result.canceled) return;

        setLoading(true);
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystemLegacy.readAsStringAsync(fileUri);
        const parsedArticles = parseCSV(fileContent);

        if (parsedArticles.length === 0) {
          Alert.alert('Error', 'No valid articles found in CSV file');
          setLoading(false);
          return;
        }

        const articlesWithIds = parsedArticles.map((article, index) => ({
          ...article,
          id: `${article.articleCode}-${article.colorCode}-${article.treatmentName}-${Date.now()}-${index}`,
        }));

        Alert.alert(
          'Import Mode',
          `Found ${parsedArticles.length} articles. How would you like to import?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setLoading(false),
            },
            {
              text: 'Replace All',
              style: 'destructive',
              onPress: async () => {
                setArticles(articlesWithIds);
                await saveLocalArticles(articlesWithIds);
                setLoading(false);
                Alert.alert('Success', `Imported ${parsedArticles.length} articles`);
              },
            },
            {
              text: 'Append',
              onPress: async () => {
                const merged = [...articles, ...articlesWithIds];
                setArticles(merged);
                await saveLocalArticles(merged);
                setLoading(false);
                Alert.alert('Success', `Added ${parsedArticles.length} articles`);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to import CSV file');
      } else {
        Alert.alert('Error', 'Failed to import CSV file');
      }
      setLoading(false);
    }
  };

  const syncToBackend = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${BACKEND_URL}/api/articles/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: articles,
          mode: 'replace',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Synced ${result.total} articles to cloud`);
      } else {
        throw new Error(result.detail || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Failed', 'Could not sync to backend. Data is saved locally.');
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocalArticles();
    setRefreshing(false);
  }, []);

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => {
        addToRecent(item.id);
        router.push(`/article/${encodeURIComponent(item.id)}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.articleHeader}>
        <View style={styles.articleLeft}>
          <Text style={styles.articleCode}>{item.articleCode}</Text>
          {item.colorCode && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.colorCode}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteBtn}
        >
          <Ionicons
            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={favorites.includes(item.id) ? '#FF6B6B' : '#999'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.articleName} numberOfLines={1}>
        {item.articleName || 'No name'}
      </Text>
      <View style={styles.articleDetails}>
        {item.colorName && (
          <Text style={styles.detailText} numberOfLines={1}>
            {item.colorName}
          </Text>
        )}
        {item.season && (
          <Text style={styles.detailText} numberOfLines={1}>
            {item.season}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Article Registry</Text>
          <Text style={styles.headerSubtitle}>{articles.length} articles</Text>
        </View>
        {articles.length > 0 && (
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => router.push('/stats')}
          >
            <Ionicons name="stats-chart" size={24} color="#007AFF" />
            <Text style={styles.statsButtonText}>Stats</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* View Mode Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'all' && styles.activeTab]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.tabText, viewMode === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'favorites' && styles.activeTab]}
          onPress={() => setViewMode('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={viewMode === 'favorites' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, viewMode === 'favorites' && styles.activeTabText]}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'recent' && styles.activeTab]}
          onPress={() => setViewMode('recent')}
        >
          <Ionicons
            name="time"
            size={16}
            color={viewMode === 'recent' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, viewMode === 'recent' && styles.activeTabText]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'searches' && styles.activeTab]}
          onPress={() => setViewMode('searches')}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={viewMode === 'searches' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, viewMode === 'searches' && styles.activeTabText]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <>
            <TouchableOpacity onPress={saveSearch} style={styles.saveSearchBtn}>
              <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleImportCSV}
          disabled={loading}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Import</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push('/filter')}
        >
          <Ionicons name="filter" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Filter</Text>
          {activeFilters && (
            (activeFilters.seasons?.length > 0 || 
             activeFilters.sections?.length > 0 || 
             activeFilters.suppliers?.length > 0 || 
             activeFilters.minPrice || 
             activeFilters.maxPrice) && (
              <View style={styles.filterBadge}>
                <View style={styles.filterDot} />
              </View>
            )
          )}
        </TouchableOpacity>

        {activeFilters && (
          (activeFilters.seasons?.length > 0 || 
           activeFilters.sections?.length > 0 || 
           activeFilters.suppliers?.length > 0 || 
           activeFilters.minPrice || 
           activeFilters.maxPrice) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={async () => {
                await storage.setItem(FILTER_KEY, JSON.stringify({}));
                setActiveFilters(null);
              }}
            >
              <Ionicons name="refresh" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setSortModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Sort</Text>
        </TouchableOpacity>

        {articles.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={syncToBackend}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="sync" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Saved Searches View */}
      {viewMode === 'searches' && savedSearches.length > 0 && (
        <View style={styles.savedSearchesContainer}>
          <Text style={styles.sectionTitle}>Saved Searches</Text>
          {savedSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.savedSearchItem}
              onPress={() => {
                setSearchQuery(search);
                setViewMode('all');
              }}
            >
              <Ionicons name="search" size={16} color="#666" />
              <Text style={styles.savedSearchText}>{search}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newSearches = savedSearches.filter((_, i) => i !== index);
                  storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches));
                  setSavedSearches(newSearches);
                }}
              >
                <Ionicons name="close" size={16} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Articles List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : viewMode === 'searches' && savedSearches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No saved searches yet</Text>
          <Text style={styles.emptySubtext}>Tap bookmark icon while searching to save</Text>
        </View>
      ) : filteredArticles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {articles.length === 0
              ? 'No articles yet'
              : viewMode === 'favorites'
              ? 'No favorites yet'
              : viewMode === 'recent'
              ? 'No recent articles'
              : 'No articles match your search'}
          </Text>
          {articles.length === 0 && (
            <Text style={styles.emptySubtext}>Tap "Import" to get started</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModal}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {[
              { key: 'name', label: 'Article Name', icon: 'text' },
              { key: 'code', label: 'Article Code', icon: 'barcode' },
              { key: 'price', label: 'Price', icon: 'cash' },
              { key: 'date', label: 'Date Added', icon: 'calendar' },
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={styles.sortOption}
                onPress={() => {
                  setCurrentSort(option.key as SortOption);
                  setSortModalVisible(false);
                }}
              >
                <Ionicons name={option.icon as any} size={20} color="#007AFF" />
                <Text style={styles.sortOptionText}>{option.label}</Text>
                {currentSort === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  statsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  saveSearchBtn: {
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  savedSearchesContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  savedSearchText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  articleItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  articleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  articleCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  favoriteBtn: {
    padding: 4,
  },
  articleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  articleDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
});