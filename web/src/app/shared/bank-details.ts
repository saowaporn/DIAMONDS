export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// TODO: replace with the real receiving bank account(s) before launch.
export const BANK_ACCOUNTS: BankAccount[] = [
  {
    bankName: 'Bank Name (TODO)',
    accountNumber: '000-0-00000-0',
    accountName: 'YANIGA DIAMOND',
  },
];
