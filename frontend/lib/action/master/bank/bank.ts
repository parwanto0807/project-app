// frontend/lib/action/master/bank/bank.ts
import {
  BankAccount,
  BankAccountCreateSchema,
  BankAccountUpdateSchema,
} from "@/schemas/bank/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get all bank accounts
export async function getBankAccounts(): Promise<BankAccount[]> {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/getAllBankAccounts`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Gagal fetch bank accounts");
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("getBankAccounts error:", error);
    throw error;
  }
}

// Get one bank account by ID
export async function getBankAccountById(id: string): Promise<BankAccount> {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/getBankAccountById/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Gagal fetch bank account id=${id}`);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("getBankAccountById error:", error);
    throw error;
  }
}

// Create bank account
export async function createBankAccount(
  payload: BankAccountCreateSchema
): Promise<BankAccount> {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/createBankAccount`, {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal create bank account");
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("createBankAccount error:", error);
    throw error;
  }
}

// Update bank account
export async function updateBankAccount(
  id: string,
  payload: BankAccountUpdateSchema
): Promise<BankAccount> {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/updateBankAccount/${id}`, {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Gagal update bank account id=${id}`);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("updateBankAccount error:", error);
    throw error;
  }
}

// Delete bank account
export async function deleteBankAccount(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/deleteBankAccount/${id}`, {
      method: "DELETE",
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Gagal delete bank account id=${id}`);
  } catch (error) {
    console.error("deleteBankAccount error:", error);
    throw error;
  }
}
