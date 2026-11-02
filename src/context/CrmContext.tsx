'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  User,
  Customer,
  Lead,
  FollowUp,
  CommunicationRecord,
  CustomerPurchase,
  CustomerFeedback,
  CustomerComplaint,
  ReferralRecord,
  NotificationItem,
  ActivityLog,
  MessageTemplate,
  PipelineStage,
  DashboardMetrics,
  RepairClaim,
  VehicleStock,
} from '@/types/crm';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_LEADS,
  INITIAL_FOLLOW_UPS,
  INITIAL_COMMUNICATIONS,
  INITIAL_PURCHASES,
  INITIAL_FEEDBACK,
  INITIAL_COMPLAINTS,
  INITIAL_REFERRALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  MESSAGE_TEMPLATES,
  INITIAL_REPAIR_CLAIMS,
  INITIAL_STOCKS,
} from '@/lib/seedData';

interface CrmContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  users: User[];
  customers: Customer[];
  leads: Lead[];
  followUps: FollowUp[];
  communications: CommunicationRecord[];
  purchases: CustomerPurchase[];
  feedback: CustomerFeedback[];
  complaints: CustomerComplaint[];
  referrals: ReferralRecord[];
  repairClaims: RepairClaim[];
  stocks: VehicleStock[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  templates: MessageTemplate[];
  loading: boolean;
  metrics: DashboardMetrics;

  // Actions
  addCustomer: (data: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  updateCustomer: (data: Partial<Customer> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  addLead: (data: Partial<Lead>) => Promise<{ success: boolean; error?: string }>;
  updateLead: (data: Partial<Lead> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  updateLeadStage: (id: string, stage: PipelineStage, extras?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  
  addFollowUp: (data: Partial<FollowUp>) => Promise<{ success: boolean; error?: string }>;
  updateFollowUp: (data: Partial<FollowUp> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  deleteFollowUp: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeFollowUp: (id: string, extras: { resultNotes: string; scheduleNextDate?: string; scheduleNextTime?: string; scheduleNextChannel?: any; scheduleNextPriority?: any; scheduleNextNotes?: string }) => Promise<{ success: boolean; error?: string }>;
  logFollowUpCommunication: (payload: { id: string; outcome: any; notes?: string; scheduleNextDate?: string; scheduleNextCategory?: any; scheduleNextTime?: string; scheduleNextChannel?: any; scheduleNextPriority?: any; scheduleNextReason?: string; scheduleNextNotes?: string }) => Promise<{ success: boolean; error?: string }>;
  
  // Stock Management
  addStock: (data: Partial<VehicleStock>) => Promise<{ success: boolean; error?: string }>;
  updateStock: (data: Partial<VehicleStock> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  deleteStock: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  logCommunication: (data: Partial<CommunicationRecord>) => Promise<{ success: boolean; error?: string }>;
  
  addFeedback: (data: Partial<CustomerFeedback>) => Promise<{ success: boolean; error?: string }>;
  addComplaint: (data: Partial<CustomerComplaint>) => Promise<{ success: boolean; error?: string }>;
  resolveComplaint: (id: string, resolutionNotes: string, status?: any) => Promise<{ success: boolean; error?: string }>;
  
  addRepairClaim: (data: Partial<RepairClaim>) => Promise<{ success: boolean; error?: string }>;
  updateRepairClaim: (data: Partial<RepairClaim> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  deleteRepairClaim: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  approveUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  changeUserRole: (id: string, role: User['role']) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: { name: string; email: string; role: User['role']; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  
  resetToDemo: () => Promise<void>;
  markNotificationAsRead: (id: string) => void;

  // Utilities
  formatRupiah: (amount: number) => string;
  formatDate: (dateString?: string, includeTime?: boolean) => string;
  formatWhatsAppLink: (phone?: string, message?: string) => string;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default to Owner
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [followUps, setFollowUps] = useState<FollowUp[]>(INITIAL_FOLLOW_UPS);
  const [communications, setCommunications] = useState<CommunicationRecord[]>(INITIAL_COMMUNICATIONS);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>(INITIAL_PURCHASES);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>(INITIAL_FEEDBACK);
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(INITIAL_COMPLAINTS);
  const [referrals, setReferrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);
  const [repairClaims, setRepairClaims] = useState<RepairClaim[]>(INITIAL_REPAIR_CLAIMS);
  const [stocks, setStocks] = useState<VehicleStock[]>(INITIAL_STOCKS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [templates] = useState<MessageTemplate[]>(MESSAGE_TEMPLATES);
  const [loading, setLoading] = useState(true);

  // Sync with API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            if (d.users) setUsers(d.users);
            if (d.customers) setCustomers(d.customers);
            if (d.leads) setLeads(d.leads);
            if (d.followUps) setFollowUps(d.followUps);
            if (d.communications) setCommunications(d.communications);
            if (d.purchases) setPurchases(d.purchases);
            if (d.feedback) setFeedback(d.feedback);
            if (d.complaints) setComplaints(d.complaints);
            if (d.referrals) setReferrals(d.referrals);
            if (d.repairClaims) setRepairClaims(d.repairClaims);
            if (d.stocks) setStocks(d.stocks);
            if (d.notifications) setNotifications(d.notifications);
            if (d.activityLogs) setActivityLogs(d.activityLogs);
          }
        }
      } catch (e) {
        console.warn('Could not fetch server store, using local state defaults.', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const switchUser = (user: User) => {
    setCurrentUser(user);
  };

  const executeApiMutation = async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, currentUser }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.users) setUsers(d.users);
        if (d.customers) setCustomers(d.customers);
        if (d.leads) setLeads(d.leads);
        if (d.followUps) setFollowUps(d.followUps);
        if (d.communications) setCommunications(d.communications);
        if (d.purchases) setPurchases(d.purchases);
        if (d.feedback) setFeedback(d.feedback);
        if (d.complaints) setComplaints(d.complaints);
        if (d.referrals) setReferrals(d.referrals);
        if (d.repairClaims) setRepairClaims(d.repairClaims);
        if (d.stocks) setStocks(d.stocks);
        if (d.notifications) setNotifications(d.notifications);
        if (d.activityLogs) setActivityLogs(d.activityLogs);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Terjadi kesalahan sistem' };
      }
    } catch (e) {
      return { success: false, error: 'Gagal terhubung ke server CRM' };
    }
  };

  const addCustomer = async (data: Partial<Customer>) => {
    return executeApiMutation('ADD_CUSTOMER', data);
  };

  const updateCustomer = async (data: Partial<Customer> & { id: string }) => {
    return executeApiMutation('UPDATE_CUSTOMER', data);
  };

  const deleteCustomer = async (id: string) => {
    return executeApiMutation('DELETE_CUSTOMER', { id });
  };

  const addLead = async (data: Partial<Lead>) => {
    return executeApiMutation('ADD_LEAD', data);
  };

  const updateLead = async (data: Partial<Lead> & { id: string }) => {
    return executeApiMutation('UPDATE_LEAD', data);
  };

  const updateLeadStage = async (id: string, stage: PipelineStage, extras: Record<string, any> = {}) => {
    return executeApiMutation('UPDATE_LEAD_STAGE', { id, stage, ...extras });
  };

  const addFollowUp = async (data: Partial<FollowUp>) => {
    return executeApiMutation('ADD_FOLLOW_UP', data);
  };

  const updateFollowUp = async (data: Partial<FollowUp> & { id: string }) => {
    return executeApiMutation('UPDATE_FOLLOW_UP', data);
  };

  const deleteFollowUp = async (id: string) => {
    return executeApiMutation('DELETE_FOLLOW_UP', { id });
  };

  const completeFollowUp = async (id: string, extras: any) => {
    return executeApiMutation('COMPLETE_FOLLOW_UP', { id, ...extras });
  };

  const logFollowUpCommunication = async (payload: {
    id: string;
    outcome: any;
    notes?: string;
    scheduleNextDate?: string;
    scheduleNextCategory?: any;
    scheduleNextTime?: string;
    scheduleNextChannel?: any;
    scheduleNextPriority?: any;
    scheduleNextReason?: string;
    scheduleNextNotes?: string;
  }) => {
    return executeApiMutation('LOG_FOLLOW_UP_COMMUNICATION', payload);
  };

  const addStock = async (data: Partial<VehicleStock>) => {
    return executeApiMutation('ADD_STOCK', data);
  };

  const updateStock = async (data: Partial<VehicleStock> & { id: string }) => {
    return executeApiMutation('UPDATE_STOCK', data);
  };

  const deleteStock = async (id: string) => {
    return executeApiMutation('DELETE_STOCK', { id });
  };

  const logCommunication = async (data: Partial<CommunicationRecord>) => {
    return executeApiMutation('LOG_COMMUNICATION', data);
  };

  const addFeedback = async (data: Partial<CustomerFeedback>) => {
    return executeApiMutation('ADD_FEEDBACK', data);
  };

  const addComplaint = async (data: Partial<CustomerComplaint>) => {
    return executeApiMutation('ADD_COMPLAINT', data);
  };

  const resolveComplaint = async (id: string, resolutionNotes: string, status: any = 'Selesai') => {
    return executeApiMutation('RESOLVE_COMPLAINT', { id, resolutionNotes, status });
  };

  const addRepairClaim = async (data: Partial<RepairClaim>) => {
    return executeApiMutation('ADD_REPAIR_CLAIM', data);
  };

  const updateRepairClaim = async (data: Partial<RepairClaim> & { id: string }) => {
    return executeApiMutation('UPDATE_REPAIR_CLAIM', data);
  };

  const deleteRepairClaim = async (id: string) => {
    return executeApiMutation('DELETE_REPAIR_CLAIM', { id });
  };

  const approveUser = async (id: string) => {
    return executeApiMutation('APPROVE_USER', { id });
  };

  const changeUserRole = async (id: string, role: User['role']) => {
    return executeApiMutation('CHANGE_USER_ROLE', { id, role });
  };

  const registerUser = async (data: { name: string; email: string; role: User['role']; phone?: string }) => {
    return executeApiMutation('REGISTER_USER', data);
  };

  const resetToDemo = async () => {
    setLoading(true);
    await executeApiMutation('RESET_DEMO_DATA', {});
    setLoading(false);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Utilities
  const formatRupiah = (amount: number = 0): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string, includeTime = false): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Jakarta',
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    } catch {
      return dateString || '-';
    }
  };

  const formatWhatsAppLink = (phone?: string, message?: string): string => {
    if (!phone || typeof phone !== 'string') return '#';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return '#';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }
    const encodedMessage = message ? encodeURIComponent(message) : '';
    return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
  };

  // Calculate live CRM Dashboard Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    const totalCustomers = customers.length;
    const newCustomersThisMonth = customers.filter(
      (c) => c.registeredDate && c.registeredDate.startsWith(currentMonth)
    ).length;

    const totalLeads = leads.length;
    const activeLeads = leads.filter(
      (l) => l.status !== 'Deal' && l.status !== 'Lost'
    ).length;

    const followUpsToday = followUps.filter(
      (f) => f.scheduledDate === today && f.status !== 'Selesai' && f.status !== 'Dibatalkan'
    ).length;

    const followUpsOverdue = followUps.filter((f) => {
      if (f.status === 'Terlambat') return true;
      if (f.status !== 'Selesai' && f.status !== 'Dibatalkan' && f.scheduledDate < today) {
        return true;
      }
      return false;
    }).length;

    const totalDeals = leads.filter((l) => l.status === 'Deal').length;
    const totalLeadsLost = leads.filter((l) => l.status === 'Lost').length;
    const resolvedLeads = totalDeals + totalLeadsLost;
    const conversionRate = resolvedLeads > 0 ? Math.round((totalDeals / resolvedLeads) * 100) : 0;

    const totalDealValue = purchases.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);

    return {
      totalCustomers,
      newCustomersThisMonth,
      totalLeads,
      activeLeads,
      followUpsToday,
      followUpsOverdue,
      totalDeals,
      totalLeadsLost,
      conversionRate,
      totalDealValue,
    };
  }, [customers, leads, followUps, purchases]);

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        switchUser,
        users,
        customers,
        leads,
        followUps,
        communications,
        purchases,
        feedback,
        complaints,
        referrals,
        repairClaims,
        stocks,
        notifications,
        activityLogs,
        templates,
        loading,
        metrics,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addLead,
        updateLead,
        updateLeadStage,
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,
        completeFollowUp,
        logFollowUpCommunication,
        addStock,
        updateStock,
        deleteStock,
        logCommunication,
        addFeedback,
        addComplaint,
        resolveComplaint,
        addRepairClaim,
        updateRepairClaim,
        deleteRepairClaim,
        approveUser,
        changeUserRole,
        registerUser,
        resetToDemo,
        markNotificationAsRead,
        formatRupiah,
        formatDate,
        formatWhatsAppLink,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
