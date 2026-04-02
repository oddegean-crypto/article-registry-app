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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STORAGE_KEY = 'article_registry';
const FAVORITES_KEY = 'article_favorites';
const RECENT_KEY = 'article_recent';
const SAVED_SEARCHES_KEY = 'saved_searches';
const FILTER_KEY = 'article_filters';
const SALES_HISTORY_KEY = 'sales_history';
const PHOTOS_KEY = 'article_photos';

// Platform-specific storage helper using AsyncStorage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
};

interface Article {
  id: string;
  articleCode: string;
  colorCode: string;
  colorHex?: string;
  treatmentName: string;
  articleName: string;
  colorName: string;
  supplier: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierNotes?: string;
  section: string;
  season: string;
  composition: string;
  weightGSM: string;
  widthCM: string;
  basePriceEUR: string;
  imageUrl?: string;
  images?: string[];
  [key: string]: any;
}

interface ArticleGroup {
  groupKey: string;
  mainArticle: Article;
  variants: Article[];
  variantCount: number;
}

type SortOption = 'name' | 'code' | 'date' | 'price';
type ViewMode = 'all' | 'favorites' | 'recent' | 'searches';

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
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
  const [salesHistory, setSalesHistory] = useState<any>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupedArticles, setGroupedArticles] = useState<ArticleGroup[]>([]);
  const [articlePhotos, setArticlePhotos] = useState<{[key: string]: string}>({});
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoArticle, setSelectedPhotoArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadLocalArticles();
    loadFavorites();
    loadRecentArticles();
    loadSavedSearches();
    loadSalesHistory();
    loadArticlePhotos();
  }, []);

  // Reload filters when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - reloading filters and sales');
      loadFilters();
      loadSalesHistory();
    }, [articles])
  );

  useEffect(() => {
    filterAndSortArticles();
  }, [searchQuery, articles, favorites, recentArticles, viewMode, currentSort, activeFilters]);

  useEffect(() => {
    const grouped = groupArticles(filteredArticles);
    setGroupedArticles(grouped);
  }, [filteredArticles]);

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
          filters.maxPrice ||
          filters.soldItemsOnly;
        
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

  const loadSalesHistory = async () => {
    try {
      const stored = await storage.getItem(SALES_HISTORY_KEY);
      if (stored) {
        setSalesHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sales history:', error);
    }
  };

    const loadArticlePhotos = async () => {
    try {
      const stored = await storage.getItem(PHOTOS_KEY);
      if (stored) {
        setArticlePhotos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading article photos:', error);
    }
  };

  const saveArticlePhoto = async (article: Article, photoUri: string) => {
    try {
      console.log('Saving photo for article:', article.id);
      const newPhotos = { ...articlePhotos, [article.id]: photoUri };
      setArticlePhotos(newPhotos);
      await storage.setItem(PHOTOS_KEY, JSON.stringify(newPhotos));
      Alert.alert('Success', 'Photo saved!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

    const takePhoto = async (article: Article) => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required to select photos');
          return;
        }

        Alert.alert(
          'Add Photo',
          'Choose an option',
          [
            {
              text: 'Take Photo',
              onPress: async () => {
                const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraStatus.status !== 'granted') {
                  Alert.alert('Permission needed', 'Camera permission is required');
                  return;
                }
                try {
                  const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    quality: 0.7,
                  });
                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    saveArticlePhoto(article, result.assets[0].uri);
                  }
                } catch (e) {
                  // Camera failed, fallback to gallery
                  Alert.alert('Camera Error', 'Please use gallery instead. Take a photo with your camera app first, then select it from gallery.');
                }
              },
            },
            {
              text: 'Choose from Gallery',
              onPress: async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.7,
                });
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  saveArticlePhoto(article, result.assets[0].uri);
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } catch (error: any) {
        console.error('Error with photo:', error);
        Alert.alert('Error', error.message || 'Failed to access photos');
      }
    };

  const viewPhoto = (article: Article) => {
    setSelectedPhotoArticle(article);
    setPhotoModalVisible(true);
  };

  const sharePhotoWithSummary = async (article: Article) => {
    try {
      const photoUri = articlePhotos[article.id];
      if (!photoUri) return;

      const summary = `Article Summary:\n` +
        `Name: ${article.articleName || 'N/A'}\n` +
        `Code: ${article.articleCode || 'N/A'}\n` +
        `Composition: ${article.composition || 'N/A'}\n` +
        `Weight: ${article.weightGSM || 'N/A'} GSM\n` +
        `Width: ${article.widthCM || 'N/A'} CM`;

      if (Platform.OS === 'web') {
        Alert.alert('Article Info', summary);
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', summary);
        return;
      }

      await Sharing.shareAsync(photoUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share ${article.articleName || 'Article'} Photo`,
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Error sharing photo:', error);
      Alert.alert('Error', 'Failed to share photo');
    }
  };

  const deletePhoto = async (articleId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const newPhotos = { ...articlePhotos };
              delete newPhotos[articleId];
              setArticlePhotos(newPhotos);
              await storage.setItem(PHOTOS_KEY, JSON.stringify(newPhotos));
              setPhotoModalVisible(false);
              Alert.alert('Success', 'Photo deleted');
            } catch (error) {
              console.error('Error deleting photo:', error);
            }
          },
        },
      ]
    );
  };

  const getTotalSalesForArticle = (articleId: string) => {
    const sales = salesHistory[articleId] || [];
    return sales.reduce((total: number, sale: any) => {
      return total + (parseFloat(sale.quantity) || 0);
    }, 0);
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

      // Filter by sold items only
      if (activeFilters.soldItemsOnly) {
        console.log('Filtering by sold items only');
        console.log('Sales history keys:', Object.keys(salesHistory));
        console.log('Sample article IDs:', filtered.slice(0, 3).map(a => a.id));
        filtered = filtered.filter(a => {
          const sales = salesHistory[a.id] || [];
          console.log(`Article ${a.id} has ${sales.length} sales`);
          return sales.length > 0;
        });
        console.log('Filtered count after sold items:', filtered.length);
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

  const groupArticles = (articlesToGroup: Article[]): ArticleGroup[] => {
    const groups = new Map<string, Article[]>();
    
    // Group articles by articleName + articleCode
    articlesToGroup.forEach(article => {
      const groupKey = `${article.articleName || 'Unknown'}_${article.articleCode || 'NoCode'}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(article);
    });

    // Convert to ArticleGroup array
    const grouped: ArticleGroup[] = [];
    groups.forEach((variants, groupKey) => {
      grouped.push({
        groupKey,
        mainArticle: variants[0], // First variant is the main one
        variants,
        variantCount: variants.length,
      });
    });

    return grouped;
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const parseCSV = (text: string): any[] => {
    try {
      // Remove BOM if present
      const cleanText = text.replace(/^\uFEFF/, '');
      
      const lines = cleanText.split(/\r?\n/);
      if (lines.length < 2) {
        console.log('CSV has less than 2 lines');
        return [];
      }

      // Parse headers - handle quoted values
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      console.log('CSV Headers:', headers);

      const articles: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, handling quoted values
        const values: string[] = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        const article: any = {};

        headers.forEach((header, index) => {
          const key = convertHeaderToKey(header);
          article[key] = values[index] || '';
        });

        // Only add if we have an article code
        if (article.articleCode && article.articleCode.trim()) {
          articles.push(article);
        }
      }

      console.log(`Parsed ${articles.length} articles`);
      return articles;
    } catch (error) {
      console.error('CSV Parse Error:', error);
      return [];
    }
  };

  const convertHeaderToKey = (header: string): string => {
    const mapping: { [key: string]: string } = {
      'Article Code': 'articleCode',
      'Article Name': 'articleName',
      'Color Code': 'colorCode',
      'Color Name': 'colorName',
      'Color Hex': 'colorHex',
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
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',  // Accept all files, filter by extension
          copyToCacheDirectory: true,  // This copies to cache automatically
        });

        if (result.canceled) return;

        // Check if file is CSV by extension
        const fileName = result.assets[0].name || '';
        if (!fileName.toLowerCase().endsWith('.csv')) {
          Alert.alert('Error', 'Please select a CSV file');
          return;
        }

        setLoading(true);
        
        // The file is already copied to cache by copyToCacheDirectory: true
        // Use the URI directly - it should be a file:// URI in the cache
        const fileUri = result.assets[0].uri;
        
        // Read the file content using fetch API (works with content:// and file:// URIs)
        const response = await fetch(fileUri);
        const fileContent = await response.text();
        
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web') {
        window.alert(`Failed to import CSV file: ${errorMessage}`);
      } else {
        Alert.alert('Error', `Failed to import CSV file: ${errorMessage}`);
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

  const renderArticleItem = ({ item }: { item: ArticleGroup }) => {
    const group = item;
    const isExpanded = expandedGroups.has(group.groupKey);
    const mainArticle = group.mainArticle;
    
    // Calculate total sales for all variants in the group
    const totalGroupSales = group.variants.reduce((sum, variant) => {
      return sum + getTotalSalesForArticle(variant.id);
    }, 0);
    const hasGroupSales = totalGroupSales > 0;
    
    return (
      <View style={styles.articleGroupContainer}>
        {/* Main Group Header */}
        <TouchableOpacity
          style={[styles.articleItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => {
            if (group.variantCount > 1) {
              toggleGroup(group.groupKey);
            } else {
              // If only one variant, navigate directly
              addToRecent(mainArticle.id);
              router.push(`/article/${encodeURIComponent(mainArticle.id)}`);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.articleHeader}>
            <View style={styles.articleLeft}>
              {mainArticle.imageUrl && (
                <View style={styles.articleThumbnail}>
                  <Ionicons name="image" size={16} color={theme.primary} />
                </View>
              )}
              <Text style={[styles.articleCode, { color: theme.primary }]}>{mainArticle.articleCode}</Text>
              {mainArticle.colorCode && (
                <View style={styles.colorCodeContainer}>
                  {mainArticle.colorHex && (
                    <View style={[styles.colorSwatch, { backgroundColor: mainArticle.colorHex }]} />
                  )}
                  <View style={[styles.badge, { backgroundColor: theme.badge }]}>
                    <Text style={[styles.badgeText, { color: theme.badgeText }]}>{mainArticle.colorCode}</Text>
                  </View>
                </View>
              )}
              {group.variantCount > 1 && (
                <View style={[styles.variantBadge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="layers" size={12} color={theme.primary} />
                  <Text style={[styles.variantBadgeText, { color: theme.primary }]}>{group.variantCount}</Text>
                </View>
              )}
              {hasGroupSales && (
                <View style={[styles.salesBadgeMain, { backgroundColor: theme.successLight }]}>
                  <Ionicons name="cart" size={14} color={theme.success} />
                  <Text style={[styles.salesBadgeMainText, { color: theme.success }]}>
                    {totalGroupSales.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerRightActions}>
              {group.variantCount > 1 && (
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                  style={{ marginRight: 8 }}
                />
              )}
              <TouchableOpacity
                onPress={() => toggleFavorite(mainArticle.id)}
                style={styles.favoriteBtn}
              >
                <Ionicons
                  name={favorites.includes(mainArticle.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favorites.includes(mainArticle.id) ? theme.error : theme.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.articleName, { color: theme.text }]} numberOfLines={1}>
            {mainArticle.articleName || 'No name'}
          </Text>
          <View style={styles.articleDetails}>
            {mainArticle.colorName && (
              <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                {mainArticle.colorName}
              </Text>
            )}
            {mainArticle.season && (
              <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                {mainArticle.season}
              </Text>
            )}
          </View>
          
          {/* Photo Icon / Thumbnail - Bottom Right */}
          <View style={styles.photoContainer}>
            {articlePhotos[mainArticle.id] ? (
              <TouchableOpacity onPress={() => viewPhoto(mainArticle)} style={styles.photoThumbnailBtn}>
                <Image 
                  source={{ uri: articlePhotos[mainArticle.id] }} 
                  style={styles.photoThumbnail}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => takePhoto(mainArticle)} style={styles.cameraBtn}>
                <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded Variants List */}
        {isExpanded && group.variantCount > 1 && (
          <View style={[styles.variantsContainer, { backgroundColor: theme.divider }]}>
            {group.variants.map((variant, index) => {
              const variantSales = getTotalSalesForArticle(variant.id);
              const hasVariantSales = variantSales > 0;
              
              return (
                <TouchableOpacity
                  key={variant.id}
                  style={[styles.variantItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => {
                    addToRecent(variant.id);
                    router.push(`/article/${encodeURIComponent(variant.id)}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.variantRow}>
                    <View style={styles.variantLeft}>
                      {variant.colorHex && (
                        <View style={[styles.colorSwatchVariant, { backgroundColor: variant.colorHex }]} />
                      )}
                      <View style={styles.variantInfo}>
                        <Text style={[styles.variantColorCode, { color: theme.primary }]}>{variant.colorCode || '-'}</Text>
                        <Text style={[styles.variantColorName, { color: theme.textSecondary }]} numberOfLines={1}>
                          {variant.colorName || 'No color name'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.variantRight}>
                      {variant.treatmentName && (
                        <View style={[styles.treatmentBadge, { backgroundColor: theme.badge }]}>
                          <Text style={[styles.treatmentBadgeText, { color: theme.badgeText }]} numberOfLines={1}>
                            {variant.treatmentName}
                          </Text>
                        </View>
                      )}
                      {hasVariantSales && (
                        <View style={[styles.salesBadgeVariant, { backgroundColor: theme.successLight }]}>
                          <Ionicons name="cart" size={12} color={theme.success} />
                          <Text style={[styles.salesBadgeVariantText, { color: theme.success }]}>
                            {variantSales.toFixed(1)}
                          </Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Article Registry</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{articles.length} articles</Text>
          </View>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
        {articles.length > 0 && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.statsButton, { backgroundColor: theme.primaryLight }]}
              onPress={() => router.push('/stats')}
            >
              <Ionicons name="stats-chart" size={20} color={theme.primary} />
              <Text style={[styles.statsButtonText, { color: theme.primary }]}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statsButton, { backgroundColor: theme.successLight }]}
              onPress={() => router.push('/contacts')}
            >
              <Ionicons name="people" size={20} color={theme.success} />
              <Text style={[styles.statsButtonText, { color: theme.success }]}>Contacts</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* View Mode Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'all' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'all' && { color: theme.primary }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'favorites' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setViewMode('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={viewMode === 'favorites' ? theme.primary : theme.textSecondary}
          />
          <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'favorites' && { color: theme.primary }]}>Favorite</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'recent' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setViewMode('recent')}
        >
          <Ionicons
            name="time"
            size={16}
            color={viewMode === 'recent' ? theme.primary : theme.textSecondary}
          />
          <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'recent' && { color: theme.primary }]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'searches' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setViewMode('searches')}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={viewMode === 'searches' ? theme.primary : theme.textSecondary}
          />
          <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'searches' && { color: theme.primary }]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.placeholder}
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
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleImportCSV}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>IMPORT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
          onPress={() => router.push('/filter')}
        >
          
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>FILTER</Text>
          {activeFilters && (
            (activeFilters.seasons?.length > 0 || 
             activeFilters.sections?.length > 0 || 
             activeFilters.suppliers?.length > 0 || 
             activeFilters.minPrice || 
             activeFilters.maxPrice ||
             activeFilters.soldItemsOnly) && (
              <View style={[styles.filterBadge, { backgroundColor: theme.error }]}>
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
           activeFilters.maxPrice ||
           activeFilters.soldItemsOnly) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton, { backgroundColor: theme.cardBackground, borderColor: theme.error }]}
              onPress={async () => {
                console.log('Clearing all filters...');
                await storage.setItem(FILTER_KEY, JSON.stringify({}));
                setActiveFilters(null);
                console.log('Filters cleared, activeFilters set to null');
              }}
            >
              <Ionicons name="refresh" size={20} color={theme.error} />
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
          onPress={() => setSortModalVisible(true)}
        >
          
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>SORT</Text>
        </TouchableOpacity>

        {articles.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
            onPress={syncToBackend}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="sync" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Saved Searches View */}
      {viewMode === 'searches' && savedSearches.length > 0 && (
        <View style={styles.savedSearchesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved Searches</Text>
          {savedSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.savedSearchItem, { backgroundColor: theme.cardBackground }]}
              onPress={() => {
                setSearchQuery(search);
                setViewMode('all');
              }}
            >
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <Text style={[styles.savedSearchText, { color: theme.text }]}>{search}</Text>
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
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading articles...</Text>
        </View>
      ) : viewMode === 'searches' && savedSearches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No saved searches yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>Tap bookmark icon while searching to save</Text>
        </View>
      ) : filteredArticles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
            {articles.length === 0
              ? 'No articles yet'
              : viewMode === 'favorites'
              ? 'No favorites yet'
              : viewMode === 'recent'
              ? 'No recent articles'
              : 'No articles match your search'}
          </Text>
          {articles.length === 0 && (
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>Tap "Import" to get started</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={groupedArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.groupKey}
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
          <View style={[styles.sortModal, { backgroundColor: theme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sort By</Text>
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
                <Ionicons name={option.icon as any} size={20} color={theme.primary} />
                <Text style={[styles.sortOptionText, { color: theme.text }]}>{option.label}</Text>
                {currentSort === option.key && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={[styles.photoModalContent, { backgroundColor: theme.cardBackground }]}>
            {/* Header */}
            <View style={[styles.photoModalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.photoModalTitle, { color: theme.text }]} numberOfLines={1}>
                {selectedPhotoArticle?.articleName || 'Photo'}
              </Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {/* Photo */}
            {selectedPhotoArticle && articlePhotos[selectedPhotoArticle.id] && (
              <View style={styles.photoViewContainer}>
                <Image 
                  source={{ uri: articlePhotos[selectedPhotoArticle.id] }} 
                  style={styles.photoFullView}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {/* Article Summary */}
            {selectedPhotoArticle && (
              <View style={[styles.photoSummary, { backgroundColor: theme.background }]}>
                <Text style={[styles.photoSummaryTitle, { color: theme.primary }]}>Article Summary</Text>
                <Text style={[styles.photoSummaryText, { color: theme.text }]}>
                  Name: {selectedPhotoArticle.articleName || 'N/A'}
                </Text>
                <Text style={[styles.photoSummaryText, { color: theme.text }]}>
                  Code: {selectedPhotoArticle.articleCode || 'N/A'}
                </Text>
                <Text style={[styles.photoSummaryText, { color: theme.text }]}>
                  Composition: {selectedPhotoArticle.composition || 'N/A'}
                </Text>
                <Text style={[styles.photoSummaryText, { color: theme.text }]}>
                  Weight: {selectedPhotoArticle.weightGSM || 'N/A'} GSM
                </Text>
                <Text style={[styles.photoSummaryText, { color: theme.text }]}>
                  Width: {selectedPhotoArticle.widthCM || 'N/A'} CM
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.photoModalActions}>
              <TouchableOpacity 
                style={[styles.photoActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => selectedPhotoArticle && sharePhotoWithSummary(selectedPhotoArticle)}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.photoActionBtnText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.photoActionBtn, { backgroundColor: theme.error }]}
                onPress={() => selectedPhotoArticle && deletePhoto(selectedPhotoArticle.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.photoActionBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 8,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  statsButtonText: {
    fontSize: 14,
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
    textAlign: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  clearButton: {
    flex: 0,
    paddingHorizontal: 12,
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
  colorCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  salesBadgeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  salesBadgeMainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
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
  // Grouped Article Styles
  articleGroupContainer: {
    marginBottom: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  variantBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  variantsContainer: {
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e0e0e0',
    marginTop: -12,
    paddingTop: 8,
  },
  variantItem: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  variantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  colorSwatchVariant: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variantInfo: {
    flex: 1,
  },
  variantColorCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  variantColorName: {
    fontSize: 13,
    color: '#666',
  },
  variantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treatmentBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 100,
  },
  treatmentBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  salesBadgeVariant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  salesBadgeVariantText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  articleThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pasteModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    marginTop: 'auto',
  },
  pasteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pasteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  pasteModalBody: {
    flex: 1,
    padding: 20,
  },
  pasteInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  pasteModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pasteModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pasteModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo feature styles
  photoContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  cameraBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  photoThumbnailBtn: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  photoViewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  photoFullView: {
    width: '100%',
    height: '100%',
  },
  photoSummary: {
    padding: 16,
    margin: 12,
    borderRadius: 10,
  },
  photoSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  photoSummaryText: {
    fontSize: 13,
    marginBottom: 4,
  },
  photoModalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  photoActionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});