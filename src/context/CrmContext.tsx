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
  CreditApplication,
  ProspectFollowUpStatus,
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
  INITIAL_CREDIT_APPLICATIONS,
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
  creditApplications: CreditApplication[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  templates: MessageTemplate[];
  loading: boolean;
  metrics: DashboardMetrics;

  // Authentication
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Transactions & Credit Applications
  createCashTransaction: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerSource: any;
    vehicleStockId: string;
    dealPrice: number;
    notes?: string;
    transactionDate?: string;
    prospectFollowUpId?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  createCreditApplication: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerSource: any;
    vehicleStockId: string;
    targetLeasing: string;
    dealPrice: number;
    initialDp: number;
    notes?: string;
    applicationDate?: string;
    prospectFollowUpId?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  approveCreditApplication: (payload: {
    applicationId: string;
    finalDp: number;
    approvedLeasing: string;
    approvalNotes?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  rejectCreditApplication: (payload: {
    applicationId: string;
    rejectionReason: string;
  }) => Promise<{ success: boolean; error?: string }>;

  addProspectFollowUp: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerSource?: any;
    searchBrand: string;
    searchModel: string;
    searchYear?: number | string;
    searchBudget?: number | string;
    notes?: string;
    firstInquiryDate?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  updateProspectFollowUpStatus: (id: string, status: any, notes?: string) => Promise<{ success: boolean; error?: string }>;

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
  logFollowUpCommunication: (payload: { id: string; outcome: any; status?: any; periodicStep?: any; notes?: string; scheduleNextDate?: string; scheduleNextCategory?: any; scheduleNextTime?: string; scheduleNextChannel?: any; scheduleNextPriority?: any; scheduleNextReason?: string; scheduleNextNotes?: string }) => Promise<{ success: boolean; error?: string }>;
  
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
  registerUser: (data: { name: string; email: string; role: User['role']; phone?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
  const [creditApplications, setCreditApplications] = useState<CreditApplication[]>(INITIAL_CREDIT_APPLICATIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [templates] = useState<MessageTemplate[]>(MESSAGE_TEMPLATES);
  const [loading, setLoading] = useState(true);

  // Sync with API on mount & Restore session
  useEffect(() => {
    // Purge persistent localStorage so user is required to authenticate on new sessions
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hr_motor_session');
        const sessionStr = sessionStorage.getItem('hr_motor_session');
        if (sessionStr) {
          const parsed = JSON.parse(sessionStr) as User;
          if (parsed && parsed.email) {
            setCurrentUser(parsed);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (e) {
      console.warn('Session check failed:', e);
    }

    async function loadData() {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            const custList = d.customers || [];
            const leadList = d.leads || [];
            const sanitizedFollowUps = (d.followUps || []).map((f: FollowUp) => {
              if (!f.customerPhone) {
                const lead = leadList.find((l: Lead) => l.id === f.leadId);
                const cust = custList.find((c: Customer) => c.id === f.customerId || (lead && c.id === lead.customerId));
                const phone = (lead && (lead.contactNumber || lead.customerPhone)) || (cust && cust.whatsapp) || '';
                return { ...f, customerPhone: phone };
              }
              return f;
            });

            if (d.users) {
              setUsers(d.users);
              // Refresh current user data if session active
              if (typeof window !== 'undefined') {
                const sessionStr = sessionStorage.getItem('hr_motor_session');
                if (sessionStr) {
                  const parsed = JSON.parse(sessionStr) as User;
                  const fresh = d.users.find((u: User) => u.email.toLowerCase() === parsed.email.toLowerCase());
                  if (fresh) {
                    if (!fresh.isApproved) {
                      // Account was revoked/unapproved
                      setIsAuthenticated(false);
                      sessionStorage.removeItem('hr_motor_session');
                    } else {
                      setCurrentUser(fresh);
                    }
                  }
                }
              }
            }
            if (d.customers) setCustomers(d.customers);
            if (d.leads) setLeads(d.leads);
            if (d.followUps) setFollowUps(sanitizedFollowUps);
            if (d.communications) setCommunications(d.communications);
            if (d.purchases) setPurchases(d.purchases);
            if (d.feedback) setFeedback(d.feedback);
            if (d.complaints) setComplaints(d.complaints);
            if (d.referrals) setReferrals(d.referrals);
            if (d.repairClaims) setRepairClaims(d.repairClaims);
            if (d.stocks) setStocks(d.stocks);
            if (d.creditApplications) setCreditApplications(d.creditApplications);
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
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('hr_motor_session', JSON.stringify(user));
      } catch (e) {}
    }
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
        const custList = d.customers || customers;
        const leadList = d.leads || leads;
        const sanitizedFollowUps = (d.followUps || []).map((f: FollowUp) => {
          if (!f.customerPhone) {
            const lead = leadList.find((l: Lead) => l.id === f.leadId);
            const cust = custList.find((c: Customer) => c.id === f.customerId || (lead && c.id === lead.customerId));
            const phone = (lead && (lead.contactNumber || lead.customerPhone)) || (cust && cust.whatsapp) || '';
            return { ...f, customerPhone: phone };
          }
          return f;
        });

        if (d.users) setUsers(d.users);
        if (d.customers) setCustomers(d.customers);
        if (d.leads) setLeads(d.leads);
        if (d.followUps) setFollowUps(sanitizedFollowUps);
        if (d.communications) setCommunications(d.communications);
        if (d.purchases) setPurchases(d.purchases);
        if (d.feedback) setFeedback(d.feedback);
        if (d.complaints) setComplaints(d.complaints);
        if (d.referrals) setReferrals(d.referrals);
        if (d.repairClaims) setRepairClaims(d.repairClaims);
        if (d.stocks) setStocks(d.stocks);
        if (d.creditApplications) setCreditApplications(d.creditApplications);
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

  const createCashTransaction = async (data: any) => {
    return executeApiMutation('CREATE_CASH_TRANSACTION', data);
  };

  const createCreditApplication = async (data: any) => {
    return executeApiMutation('CREATE_CREDIT_APPLICATION', data);
  };

  const approveCreditApplication = async (payload: { applicationId: string; finalDp: number; approvedLeasing: string; approvalNotes?: string }) => {
    return executeApiMutation('APPROVE_CREDIT_APPLICATION', payload);
  };

  const rejectCreditApplication = async (payload: { applicationId: string; rejectionReason: string }) => {
    return executeApiMutation('REJECT_CREDIT_APPLICATION', payload);
  };

  const addProspectFollowUp = async (data: any) => {
    return executeApiMutation('ADD_PROSPECT_FOLLOW_UP', data);
  };

  const updateProspectFollowUpStatus = async (id: string, status: any, notes?: string) => {
    return executeApiMutation('UPDATE_PROSPECT_FOLLOW_UP_STATUS', { id, status, notes });
  };

  const addCustomer = async (data: Partial<Customer>) => {
    return executeApiMutation('ADD_CUSTOMER', data);
  };

  const updateCustomer = async (data: Partial<Customer> & { id: string }) => {
    return executeApiMutation('UPDATE_CUSTOMER', data);
  };

  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN_USER',
          payload: { email, password },
          currentUser,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const cleanEmail = email.trim().toLowerCase();
        const isOwner = cleanEmail === 'farhanhizri8@gmail.com' || cleanEmail === 'farhanhizri8gmail.com';

        const currentUsers = data.data?.users || users;
        let loggedUser: User | undefined;
        if (isOwner) {
          loggedUser = currentUsers.find((u: User) => u.email.toLowerCase() === 'farhanhizri8@gmail.com' || u.role === 'Owner') || {
            id: 'USR-001',
            name: 'Farhan Hizri',
            email: 'farhanhizri8@gmail.com',
            role: 'Owner',
            phone: '081223450001',
            password: 'Garut2005',
            isApproved: true,
            isActive: true,
            createdAt: '2026-01-01T08:00:00Z',
            updatedAt: new Date().toISOString(),
          };
        } else {
          loggedUser = currentUsers.find((u: User) => u.email.toLowerCase() === cleanEmail);
        }

        if (!loggedUser) {
          return { success: false, error: 'User tidak ditemukan' };
        }

        if (!loggedUser.isApproved) {
          return {
            success: false,
            error: 'Akun Anda sedang menunggu persetujuan (approval) dari Owner (farhanhizri8@gmail.com). Silakan hubungi Owner untuk aktivasi akun login.'
          };
        }

        setCurrentUser(loggedUser);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('hr_motor_session', JSON.stringify(loggedUser));
            localStorage.removeItem('hr_motor_session');
          } catch (e) {}
        }

        if (data.data) {
          const d = data.data;
          if (d.users) setUsers(d.users);
          if (d.customers) setCustomers(d.customers);
          if (d.leads) setLeads(d.leads);
          if (d.stocks) setStocks(d.stocks);
          if (d.notifications) setNotifications(d.notifications);
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Email atau kata sandi tidak valid' };
      }
    } catch (e) {
      return { success: false, error: 'Gagal terhubung ke server CRM' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('hr_motor_session');
        localStorage.removeItem('hr_motor_session');
      } catch (e) {}
      window.location.href = '/';
    }
  };

  const approveUser = async (id: string) => {
    if (currentUser.role !== 'Owner' && !currentUser.email.toLowerCase().includes('farhanhizri8')) {
      return {
        success: false,
        error: 'Akses Ditolak: Hanya akun Owner (farhanhizri8@gmail.com) yang berhak menyetujui akun login karyawan.'
      };
    }
    return executeApiMutation('APPROVE_USER', { id });
  };

  const changeUserRole = async (id: string, role: User['role']) => {
    return executeApiMutation('CHANGE_USER_ROLE', { id, role });
  };

  const registerUser = async (data: { name: string; email: string; role: User['role']; phone?: string; password?: string }) => {
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
        creditApplications,
        notifications,
        activityLogs,
        templates,
        loading,
        metrics,
        isAuthenticated,
        login,
        logout,
        createCashTransaction,
        createCreditApplication,
        approveCreditApplication,
        rejectCreditApplication,
        addProspectFollowUp,
        updateProspectFollowUpStatus,
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
