import { User, Product, Customer, CashRegisterSession, Sale, CartItem, Payment } from '../types';
import { supabase } from './supabase';

// Helper to generate UUIDs compatible with all environments (replaces crypto.randomUUID which might fail in some CI/Build envs)
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const initDB = async () => {
  console.log("DB Service Initialized");
};

// --- PRODUCTS ---

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
};

export const saveProduct = async (product: Product) => {
  const productToSave = { ...product };
  // Ensure ID exists
  if (!productToSave.id || productToSave.id.length < 10) { 
     productToSave.id = generateUUID();
  }

  const { error } = await supabase.from('products').upsert(productToSave);
  if (error) console.error('Error saving product:', error);
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) console.error('Error deleting product:', error);
};

// --- USERS ---

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data || [];
};

export const saveUser = async (user: User) => {
  const userToSave = { ...user };
  if (!userToSave.id || userToSave.id.length < 10) userToSave.id = generateUUID();
  
  const { error } = await supabase.from('users').upsert(userToSave);
  if (error) console.error('Error saving user:', error);
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) console.error('Error deleting user:', error);
};

// --- CUSTOMERS ---

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data || [];
};

export const saveCustomer = async (customer: Customer) => {
  const custToSave = { ...customer };
  if (!custToSave.id || custToSave.id.length < 10) custToSave.id = generateUUID();

  const { error } = await supabase.from('customers').upsert(custToSave);
  if (error) console.error('Error saving customer:', error);
};

// --- SESSIONS & SALES ---

const mapSessionData = (sessionData: any, salesData: any[]): CashRegisterSession | null => {
    if (!sessionData) return null;

    const sales: Sale[] = salesData.map((s: any) => ({
        id: s.id,
        timestamp: s.timestamp,
        total: s.total,
        change: s.change,
        operatorId: s.operator_id,
        customerId: s.customer_id,
        items: s.sale_items ? s.sale_items.map((i: any) => ({
            id: i.product_id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            category: '',
            description: '',
            active: true
        })) : [],
        payments: s.sale_payments ? s.sale_payments.map((p: any) => ({
            method: p.method,
            amount: p.amount
        })) : []
    }));

    return {
        id: sessionData.id,
        openedAt: sessionData.opened_at,
        closedAt: sessionData.closed_at,
        openingBalance: sessionData.opening_balance,
        closingBalance: sessionData.closing_balance,
        operatorId: sessionData.operator_id,
        status: sessionData.status,
        sales: sales,
        expectedBalance: sessionData.expected_balance,
        difference: sessionData.difference,
        observations: sessionData.observations
    };
};

export const getCurrentSession = async (): Promise<CashRegisterSession | null> => {
  // 1. Find Open Session
  const { data: sessionData, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'OPEN')
    .single();

  if (error || !sessionData) return null;

  // 2. Fetch Sales for this session (relational)
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select(`
        *,
        sale_items (*),
        sale_payments (*)
    `)
    .eq('session_id', sessionData.id);

  if (salesError) {
      console.error("Error fetching sales for session", salesError);
      // If we can't get sales, return session with empty sales to avoid UI crash
      const session = mapSessionData(sessionData, []);
      return session;
  }

  return mapSessionData(sessionData, salesData);
};

export const saveCurrentSession = async (session: CashRegisterSession) => {
  const sessionRecord = {
      id: session.id,
      opened_at: session.openedAt,
      closed_at: session.closedAt,
      opening_balance: session.openingBalance,
      closing_balance: session.closingBalance,
      operator_id: session.operatorId,
      status: session.status,
      expected_balance: session.expectedBalance,
      difference: session.difference,
      observations: session.observations
  };

  const { error } = await supabase.from('cash_sessions').upsert(sessionRecord);
  if (error) console.error('Error saving session:', error);
};

export const saveSale = async (sale: Sale, sessionId: string) => {
    // 1. Insert Sale Header
    const saleRecord = {
        id: sale.id,
        timestamp: sale.timestamp,
        total: sale.total,
        change: sale.change,
        operator_id: sale.operatorId,
        customer_id: sale.customerId,
        session_id: sessionId
    };

    const { error: saleError } = await supabase.from('sales').insert(saleRecord);
    if (saleError) {
        console.error('Error saving sale header:', saleError);
        throw saleError;
    }

    // 2. Insert Items
    const itemsRecords = sale.items.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));
    const { error: itemsError } = await supabase.from('sale_items').insert(itemsRecords);
    if(itemsError) console.error('Error saving items', itemsError);

    // 3. Insert Payments
    const paymentsRecords = sale.payments.map(p => ({
        sale_id: sale.id,
        method: p.method,
        amount: p.amount
    }));
    const { error: payError } = await supabase.from('sale_payments').insert(paymentsRecords);
    if(payError) console.error('Error saving payments', payError);
};

export const getSessionHistory = async (): Promise<CashRegisterSession[]> => {
    const { data: sessions, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .order('opened_at', { ascending: false });

    if(error) return [];
    
    const { data: allSales } = await supabase
        .from('sales')
        .select(`*, sale_items(*), sale_payments(*)`);
    
    const salesBySession: Record<string, any[]> = {};
    if(allSales) {
        allSales.forEach((s: any) => {
            if(!salesBySession[s.session_id]) salesBySession[s.session_id] = [];
            salesBySession[s.session_id].push(s);
        });
    }

    // Filter out nulls safely
    const result = sessions.map((s: any) => mapSessionData(s, salesBySession[s.id] || []));
    return result.filter((s): s is CashRegisterSession => s !== null);
};