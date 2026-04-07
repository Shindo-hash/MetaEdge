export type Profile = {
  id: string
  name: string
  email: string
  current_bankroll: number
  created_at: string
}

export type Session = {
  id: string
  user_id: string
  date: string
  start_time: string | null
  end_time: string | null
  initial_bankroll: number
  final_bankroll: number
  result: 'win' | 'loss' | 'partial'
  profit: number
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  strategy: 'fixed' | 'compound'
  initial_bankroll: number
  target_bankroll: number | null
  daily_percentage: number | null
  weeks: number | null
  play_weekends: boolean
  start_date: string
  is_active: boolean
  created_at: string
}

export type GoalCalc = {
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
}

export type Cycle = {
  id: string
  user_id: string
  goal_id: string
  year: number
  month: number
  start_date: string
  end_date: string | null
  initial_bankroll: number
  daily_goal_fixed: number
  op_days_total: number
  status: 'active' | 'closed'
  created_at: string
}

export type MonthlyHistory = {
  id: string
  user_id: string
  cycle_id: string
  year: number
  month: number
  initial_bankroll: number
  final_bankroll: number
  total_profit: number
  return_pct: number
  daily_goal_fixed: number
  op_days_total: number
  days_operated: number
  days_positive: number
  days_negative: number
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  note: string | null
  date: string
  created_at: string
}
