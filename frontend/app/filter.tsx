import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useTheme } from './ThemeContext';

const STORAGE_KEY = 'article_registry';
const FILTER_KEY = 'article_filters';

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
    } else {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error writing to storage:', error);
      }
    }
  },
};

export default function FilterScreen() {
  const { theme, isDark } = useTheme();
  const [seasons, setSeasons] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [soldItemsOnly, setSoldItemsOnly] = useState(false);

  useEffect(() => {
    loadArticlesAndFilters();
  }, []);

  const loadArticlesAndFilters = async () => {
    try {
      // Load articles to get filter options
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const articles = JSON.parse(stored);
        
        const seasonSet = new Set<string>();
        const sectionSet = new Set<string>();
        const supplierSet = new Set<string>();
        
        articles.forEach((article: any) => {
          if (article.season) seasonSet.add(article.season);
          if (article.section) sectionSet.add(article.section);
          if (article.supplier) supplierSet.add(article.supplier);
        });
        
        setSeasons(Array.from(seasonSet).sort());
        setSections(Array.from(sectionSet).sort());
        setSuppliers(Array.from(supplierSet).sort());
      }

      // Load saved filters
      const savedFilters = await storage.getItem(FILTER_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setSelectedSeasons(filters.seasons || []);
        setSelectedSections(filters.sections || []);
        setSelectedSuppliers(filters.suppliers || []);
        setMinPrice(filters.minPrice || '');
        setMaxPrice(filters.maxPrice || '');
        setSoldItemsOnly(filters.soldItemsOnly || false);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const toggleSelection = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const applyFilters = async () => {
    const filters = {
      seasons: selectedSeasons,
      sections: selectedSections,
      suppliers: selectedSuppliers,
      minPrice,
      maxPrice,
      soldItemsOnly,
    };
    
    console.log('Saving filters:', filters);
    await storage.setItem(FILTER_KEY, JSON.stringify(filters));
    
    // Add a small delay to ensure the data is saved
    setTimeout(() => {
      router.back();
    }, 100);
  };

  const clearFilters = async () => {
    setSelectedSeasons([]);
    setSelectedSections([]);
    setSelectedSuppliers([]);
    setMinPrice('');
    setMaxPrice('');
    setSoldItemsOnly(false);
    await storage.setItem(FILTER_KEY, JSON.stringify({}));
    router.back();
  };

  const renderFilterSection = (
    title: string,
    items: string[],
    selected: string[],
    onToggle: (item: string) => void
  ) => (
    <View style={[styles.filterSection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.filterTitle, { color: theme.primary }]}>{title}</Text>
      <View style={styles.filterOptions}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterChip,
              { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
              selected.includes(item) && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => onToggle(item)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: theme.text },
                selected.includes(item) && { color: '#fff' },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Advanced Filters</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={[styles.clearText, { color: theme.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Sold Items Filter - First */}
        <View style={[styles.filterSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.filterTitle, { color: theme.primary }]}>Sales Filter</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                soldItemsOnly && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setSoldItemsOnly(!soldItemsOnly)}
            >
              <Ionicons 
                name={soldItemsOnly ? "cart" : "cart-outline"} 
                size={16} 
                color={soldItemsOnly ? "#fff" : theme.primary} 
                style={{marginRight: 6}}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: theme.text },
                  soldItemsOnly && { color: '#fff' },
                ]}
              >
                Show Only Sold Items
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Season Filter */}
        {renderFilterSection(
          'Season',
          seasons,
          selectedSeasons,
          (item) => toggleSelection(item, selectedSeasons, setSelectedSeasons)
        )}

        {/* Section Filter */}
        {renderFilterSection(
          'Section',
          sections,
          selectedSections,
          (item) => toggleSelection(item, selectedSections, setSelectedSections)
        )}

        {/* Supplier Filter */}
        {renderFilterSection(
          'Supplier',
          suppliers,
          selectedSuppliers,
          (item) => toggleSelection(item, selectedSuppliers, setSelectedSuppliers)
        )}

        {/* Price Range */}
        <View style={[styles.filterSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.filterTitle, { color: theme.primary }]}>Price Range (EUR)</Text>
          <View style={styles.priceInputs}>
            <TextInput
              style={[styles.priceInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Min"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.placeholder}
            />
            <Text style={[styles.priceSeparator, { color: theme.textSecondary }]}>-</Text>
            <TextInput
              style={[styles.priceInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Max"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.placeholder}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.footer, { backgroundColor: theme.headerBackground, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.primary }]} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
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
  clearText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#666',
  },
  soldItemsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  soldItemsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soldItemsToggleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  soldItemsToggleTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});