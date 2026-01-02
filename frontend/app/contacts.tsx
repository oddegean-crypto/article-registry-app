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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from './ThemeContext';

const SUPPLIERS_KEY = 'suppliers_data';
const CUSTOMERS_KEY = 'customers_data';

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

interface Supplier {
  code: string;
  name: string;
  country: string;
  paymentTerms: string;
  currency: string;
  productType: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  notes: string;
}

interface Customer {
  code: string;
  name: string;
  country: string;
  paymentTerms: string;
  currency: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function ContactsScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const suppliersData = await storage.getItem(SUPPLIERS_KEY);
      const customersData = await storage.getItem(CUSTOMERS_KEY);
      
      if (suppliersData) {
        setSuppliers(JSON.parse(suppliersData));
      }
      if (customersData) {
        setCustomers(JSON.parse(customersData));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const parseCSV = (text: string, type: 'supplier' | 'customer'): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const item: any = {};
      
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        item[key] = values[index]?.trim() || '';
      });

      data.push(item);
    }

    return data;
  };

  const handleImportSuppliers = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const parsed = parseCSV(fileContent, 'supplier');
      
      const formattedSuppliers: Supplier[] = parsed.map(item => ({
        code: item.suppliercode || item.code || '',
        name: item.supplier || item.name || '',
        country: item.country || '',
        paymentTerms: item.paymentterms || '',
        currency: item.currency || '',
        productType: item.producttype || '',
        address: item.address || '',
        contactPerson: item.contactperson || '',
        email: item.email || '',
        phone: item.phone || '',
        notes: item.notes || '',
      }));

      setSuppliers(formattedSuppliers);
      await storage.setItem(SUPPLIERS_KEY, JSON.stringify(formattedSuppliers));
      
      Alert.alert('Success', `Imported ${formattedSuppliers.length} suppliers`);
      setLoading(false);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import suppliers');
      setLoading(false);
    }
  };

  const handleImportCustomers = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const parsed = parseCSV(fileContent, 'customer');
      
      const formattedCustomers: Customer[] = parsed.map(item => ({
        code: item.customercode || item.code || '',
        name: item.customername || item.name || '',
        country: item.country || '',
        paymentTerms: item.paymentterms || '',
        currency: item.currency || '',
        contactPerson: item.contactperson || '',
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
        notes: item.notes || '',
      }));

      setCustomers(formattedCustomers);
      await storage.setItem(CUSTOMERS_KEY, JSON.stringify(formattedCustomers));
      
      Alert.alert('Success', `Imported ${formattedCustomers.length} customers`);
      setLoading(false);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import customers');
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContact = (contact: Supplier | Customer, type: 'supplier' | 'customer') => (
    <View key={contact.code} style={[styles.contactCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.contactHeader}>
        <View style={styles.contactHeaderLeft}>
          <Text style={[styles.contactName, { color: theme.text }]}>{contact.name}</Text>
          <Text style={[styles.contactCode, { color: theme.textSecondary }]}>{contact.code}</Text>
        </View>
        <View style={[styles.countryBadge, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="location" size={12} color={theme.primary} />
          <Text style={[styles.countryText, { color: theme.primary }]}>{contact.country}</Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        {contact.contactPerson && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={14} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{contact.contactPerson}</Text>
          </View>
        )}
        {contact.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={14} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{contact.email}</Text>
          </View>
        )}
        {contact.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={14} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{contact.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.contactActions}>
        {contact.email && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
            onPress={() => {
              const mailto = `mailto:${contact.email}`;
              if (Platform.OS === 'web') {
                window.open(mailto, '_blank');
              }
            }}
          >
            <Ionicons name="mail" size={16} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Email</Text>
          </TouchableOpacity>
        )}
        {contact.phone && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.successLight, borderColor: theme.success }]}
            onPress={() => {
              const tel = `tel:${contact.phone}`;
              if (Platform.OS === 'web') {
                window.open(tel);
              }
            }}
          >
            <Ionicons name="call" size={16} color={theme.success} />
            <Text style={[styles.actionButtonText, { color: theme.success }]}>Call</Text>
          </TouchableOpacity>
        )}
      </View>

      {contact.notes && (
        <View style={[styles.notesSection, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
          <Text style={[styles.notesText, { color: theme.textSecondary }]}>{contact.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contacts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suppliers' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setActiveTab('suppliers')}
        >
          <Ionicons name="business" size={20} color={activeTab === 'suppliers' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'suppliers' && { color: theme.primary }]}>
            Suppliers ({suppliers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && { backgroundColor: theme.primaryLight }]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'customers' ? theme.primary : theme.textSecondary} />
          <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'customers' && { color: theme.primary }]}>
            Customers ({customers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.placeholder}
        />
      </View>

      {/* Import Button */}
      <View style={styles.importContainer}>
        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: theme.primary }]}
          onPress={activeTab === 'suppliers' ? handleImportSuppliers : handleImportCustomers}
          disabled={loading}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.importButtonText}>
            Import {activeTab === 'suppliers' ? 'Suppliers' : 'Customers'} CSV
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'suppliers' ? (
          filteredSuppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                {suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match your search'}
              </Text>
              {suppliers.length === 0 && (
                <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                  Import your suppliers CSV to get started
                </Text>
              )}
            </View>
          ) : (
            filteredSuppliers.map(supplier => renderContact(supplier, 'supplier'))
          )
        ) : (
          filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
              </Text>
              {customers.length === 0 && (
                <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
                  Import your customers CSV to get started
                </Text>
              )}
            </View>
          ) : (
            filteredCustomers.map(customer => renderContact(customer, 'customer'))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  importContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contactCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactHeaderLeft: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactCode: {
    fontSize: 14,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  countryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
