export type User = {
  id: string;
  name: string;
};

export type Group = {
  id: string;
  name: string;
  memberIds: string[];
};

export type SplitType = "equal" | "percentage" | "exact";

export type SplitInput = {
  userId: string;
  value: number;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidByUserId: string;
  splitType: SplitType;
  splits: SplitInput[];
  createdAt: string;
};

export type BalanceMap = Record<string, number>;

export type Settlement = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};
