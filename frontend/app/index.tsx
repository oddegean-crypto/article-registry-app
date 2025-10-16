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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STORAGE_KEY = 'article_registry';

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

export default function HomeScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load articles from local storage on mount
  useEffect(() => {
    loadLocalArticles();
  }, []);

  // Filter articles when search query changes
  useEffect(() => {
    filterArticles();
  }, [searchQuery, articles]);

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

  const filterArticles = () => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = articles.filter((article) => {
      return (
        article.articleCode?.toLowerCase().includes(query) ||
        article.articleName?.toLowerCase().includes(query) ||
        article.colorCode?.toLowerCase().includes(query) ||
        article.colorName?.toLowerCase().includes(query) ||
        article.treatmentName?.toLowerCase().includes(query) ||
        article.section?.toLowerCase().includes(query) ||
        article.season?.toLowerCase().includes(query)
      );
    });
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
      // For web, use native file input
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

              // Add unique IDs to articles
              const articlesWithIds = parsedArticles.map((article, index) => ({
                ...article,
                id: `${article.articleCode}-${article.colorCode}-${article.treatmentName}-${Date.now()}-${index}`,
              }));

              // Ask user: Append or Replace?
              const shouldReplace = window.confirm(`Found ${parsedArticles.length} articles. Click OK to REPLACE all data, or Cancel to APPEND to existing data.`);
              
              if (shouldReplace) {
                // Replace
                setArticles(articlesWithIds);
                await saveLocalArticles(articlesWithIds);
                window.alert(`Successfully imported ${parsedArticles.length} articles`);
              } else {
                // Append
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
        // For mobile, use DocumentPicker
        console.log('Using mobile DocumentPicker method');
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/comma-separated-values',
          copyToCacheDirectory: true,
        });

        if (result.canceled) return;

        setLoading(true);
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const parsedArticles = parseCSV(fileContent);

        if (parsedArticles.length === 0) {
          Alert.alert('Error', 'No valid articles found in CSV file');
          setLoading(false);
          return;
        }

        // Add unique IDs to articles
        const articlesWithIds = parsedArticles.map((article, index) => ({
          ...article,
          id: `${article.articleCode}-${article.colorCode}-${article.treatmentName}-${Date.now()}-${index}`,
        }));

        // Ask user: Append or Replace?
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
      onPress={() => router.push(`/article/${encodeURIComponent(item.id)}`)}
      activeOpacity={0.7}
    >
      <View style={styles.articleHeader}>
        <Text style={styles.articleCode}>{item.articleCode}</Text>
        {item.colorCode && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.colorCode}</Text>
          </View>
        )}
      </View>
      <Text style={styles.articleName} numberOfLines={1}>
        {item.articleName || 'No name'}
      </Text>
      <View style={styles.articleDetails}>
        {item.colorName && (
          <Text style={styles.detailText} numberOfLines={1}>
            Color: {item.colorName}
          </Text>
        )}
        {item.treatmentName && (
          <Text style={styles.detailText} numberOfLines={1}>
            Treatment: {item.treatmentName}
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
        <Text style={styles.headerTitle}>Article Registry</Text>
        <Text style={styles.headerSubtitle}>{articles.length} articles</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles, colors, treatments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
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
          <Text style={styles.primaryButtonText}>Import CSV</Text>
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
            <Text style={styles.secondaryButtonText}>Sync Cloud</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Articles List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : filteredArticles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {articles.length === 0
              ? 'No articles yet'
              : 'No articles match your search'}
          </Text>
          {articles.length === 0 && (
            <Text style={styles.emptySubtext}>
              Tap "Import CSV" to get started
            </Text>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  articleCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    flex: 1,
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
  articleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  articleDetails: {
    gap: 4,
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
});
