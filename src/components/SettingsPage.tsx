import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '../theme/colors';
import { useFilteredSessionsContext } from '../contexts/SessionsContext';

// Storage key for hourly rate
const HOURLY_RATE_KEY = 'HOURLY_RATE';

type TimePeriod = 'thisWeek' | 'lastWeek' | 'all';

const TIME_PERIODS = [
  { value: 'thisWeek' as TimePeriod, label: 'This Week' },
  { value: 'lastWeek' as TimePeriod, label: 'Last Week' },
  { value: 'all' as TimePeriod, label: 'Total Hours' },
];

const SettingsPage: React.FC = () => {
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('thisWeek');
  const [menuVisible, setMenuVisible] = useState(false);

  // Get filtered sessions based on selected period
  const {
    totalHours,
    sessionCount,
    loading: sessionsLoading,
  } = useFilteredSessionsContext(selectedPeriod);

  // Load saved hourly rate on mount
  useEffect(() => {
    loadHourlyRate();
  }, []);

  const loadHourlyRate = async () => {
    try {
      setIsLoading(true);
      const savedRate = await AsyncStorage.getItem(HOURLY_RATE_KEY);
      if (savedRate) {
        setHourlyRate(savedRate);
      }
    } catch (error) {
      console.error('Failed to load hourly rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHourlyRate = async () => {
    if (!hourlyRate.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid hourly rate');
      return;
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid positive number');
      return;
    }

    try {
      setIsSaving(true);
      await AsyncStorage.setItem(HOURLY_RATE_KEY, hourlyRate);
      Alert.alert('Success', 'Hourly rate saved successfully!');
    } catch (error) {
      console.error('Failed to save hourly rate:', error);
      Alert.alert('Error', 'Failed to save hourly rate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalIncome = useCallback((): number => {
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) return 0;
    return totalHours * rate;
  }, [hourlyRate, totalHours]);

  const getPeriodLabel = (): string => {
    const period = TIME_PERIODS.find((p) => p.value === selectedPeriod);
    return period?.label || 'This Week';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePeriodSelect = (period: TimePeriod) => {
    setSelectedPeriod(period);
    setMenuVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure your work preferences
          </Text>
        </View>

        {/* Hourly Rate Input */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons
                name="cash-outline"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Hourly Rate</Text>
            </View>
            <Text style={styles.cardDescription}>
              Enter your hourly rate to calculate total income from your work
              sessions
            </Text>

            <TextInput
              mode="outlined"
              label="Hourly Rate (USD)"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="decimal-pad"
              style={styles.input}
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor={AppColors.primary}
              textColor="#FFFFFF"
              left={<TextInput.Icon icon="currency-usd" />}
              disabled={isSaving}
            />

            <Button
              mode="contained"
              onPress={saveHourlyRate}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
              labelStyle={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Rate'}
            </Button>
          </Card.Content>
        </Card>

        {/* Income Calculator */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons
                name="calculator-outline"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>Income Calculator</Text>
            </View>
            <Text style={styles.cardDescription}>
              Calculate your total income based on hours worked
            </Text>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              <Text style={styles.periodLabel}>Time Period:</Text>
              <TouchableOpacity
                style={styles.periodButton}
                onPress={() => {
                  console.log(
                    'Dropdown button pressed, current state:',
                    menuVisible
                  );
                  setMenuVisible(!menuVisible);
                }}>
                <Text style={styles.periodButtonText}>{getPeriodLabel()}</Text>
                <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Divider style={styles.divider} />

            {/* Stats Display */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Hours Worked</Text>
                <Text style={styles.statValue}>
                  {sessionsLoading ? '...' : `${totalHours.toFixed(2)} hrs`}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sessions</Text>
                <Text style={styles.statValue}>
                  {sessionsLoading ? '...' : sessionCount}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Hourly Rate</Text>
                <Text style={styles.statValue}>
                  {hourlyRate
                    ? formatCurrency(parseFloat(hourlyRate))
                    : '$0.00'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Total Income */}
            <View style={styles.totalIncomeContainer}>
              <Text style={styles.totalIncomeLabel}>
                Total Income ({getPeriodLabel()})
              </Text>
              <Text style={styles.totalIncomeValue}>
                {formatCurrency(calculateTotalIncome())}
              </Text>
              {!hourlyRate && (
                <Text style={styles.noRateText}>
                  Enter hourly rate above to calculate income
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Additional Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={AppColors.primary}
              />
              <Text style={styles.cardTitle}>App Settings</Text>
            </View>

            <List.Item
              title="Export Data"
              description="Export your work sessions"
              left={() => (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              )}
              right={() => (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              )}
              onPress={() =>
                Alert.alert(
                  'Coming Soon',
                  'Export functionality will be available soon!'
                )
              }
              style={styles.listItem}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Clear All Data"
              description="Reset all sessions and settings"
              left={() => (
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              )}
              right={() => (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              )}
              onPress={() =>
                Alert.alert(
                  'Clear All Data',
                  'This will permanently delete all your work sessions and settings. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: () => {
                        // TODO: Implement clear all data functionality
                        Alert.alert(
                          'Coming Soon',
                          'Clear data functionality will be available soon!'
                        );
                      },
                    },
                  ]
                )
              }
              style={styles.listItem}
              titleStyle={[styles.listItemTitle, { color: '#ef4444' }]}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Kaamko App v1.0.0</Text>
          <Text style={styles.versionSubtext}>
            Track your work, calculate your income
          </Text>
        </View>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Select Time Period</Text>
            {TIME_PERIODS.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.dropdownItem,
                  selectedPeriod === period.value &&
                    styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  console.log('Dropdown item selected:', period.label);
                  handlePeriodSelect(period.value);
                }}>
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedPeriod === period.value &&
                      styles.dropdownItemTextSelected,
                  ]}>
                  {period.label}
                </Text>
                {selectedPeriod === period.value && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={AppColors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingBottom: 100, // Account for bottom tabs
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  periodSelector: {
    marginBottom: 20,
  },
  menuContainer: {
    zIndex: 1000,
    elevation: 1000,
  },
  periodLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  periodButton: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  periodButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  menu: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 200,
    maxWidth: 250,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItemText: {
    color: '#FFFFFF',
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalIncomeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalIncomeLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalIncomeValue: {
    fontSize: 32,
    color: AppColors.primary,
    fontWeight: 'bold',
  },
  noRateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  listItem: {
    paddingVertical: 8,
  },
  listItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  listItemDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 200,
    maxWidth: 250,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    color: AppColors.primary,
    fontWeight: '600',
  },
});

export default SettingsPage;
