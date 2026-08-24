export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// TODO: replace with the real receiving bank account(s) before launch.
export const BANK_ACCOUNTS: BankAccount[] = [
  {
    bankName: 'Kasikorn Bank',
    accountNumber: '237-1-02300-6',
    accountName: 'YANIGA DIAMOND',
  },
];
