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

export type DailyProgress = {
  id: string
  user_id: string
  date: string
  bankroll: number
  daily_goal: number
  result: 'win' | 'loss' | 'partial' | null
}

export type GoalCalc = {
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
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
