// Configurações padrão para Gestão Evolutiva (Modo Safe)

export type EvolutiveTrigger = {
  threshold: number
  percentage: number
  label: string
  color: string
}

export const DEFAULT_EVOLUTIVE_TRIGGERS: EvolutiveTrigger[] = [
  { threshold: 1000, percentage: 15, label: 'Risco Moderado', color: 'yellow' },
  { threshold: 5000, percentage: 5, label: 'Preservação de Capital', color: 'blue' },
  { threshold: 10000, percentage: 2, label: 'Capital Seguro', color: 'green' },
]

export type RiskLevel = {
  level: number
  label: string
  color: string
  percentage: number
}

// Determina o nível de risco atual baseado na banca
export function getCurrentRiskLevel(
  bankroll: number,
  triggers: EvolutiveTrigger[] = DEFAULT_EVOLUTIVE_TRIGGERS
): RiskLevel {
  // Ordenar triggers do maior para o menor threshold
  const sortedTriggers = [...triggers].sort((a, b) => b.threshold - a.threshold)
  
  for (const trigger of sortedTriggers) {
    if (bankroll >= trigger.threshold) {
      return {
        level: trigger.percentage,
        label: trigger.label,
        color: trigger.color,
        percentage: trigger.percentage,
      }
    }
  }
  
  // Nível inicial (Alavancagem Máxima)
  return {
    level: 30,
    label: 'Alavancagem Máxima',
    color: 'red',
    percentage: 30,
  }
}

// Verifica se atingiu um novo gatilho
export function checkTriggerReached(
  previousBankroll: number,
  currentBankroll: number,
  triggers: EvolutiveTrigger[] = DEFAULT_EVOLUTIVE_TRIGGERS,
  dismissedTriggers: number[] = []
): EvolutiveTrigger | null {
  for (const trigger of triggers) {
    // Pular se já foi dispensado
    if (dismissedTriggers.includes(trigger.threshold)) continue
    
    // Verificar se acabou de atingir o threshold
    if (previousBankroll < trigger.threshold && currentBankroll >= trigger.threshold) {
      return trigger
    }
  }
  return null
}

// Calcula meta diária para estratégia evolutiva
export function getEvolutiveDailyGoal(
  bankroll: number,
  triggers: EvolutiveTrigger[] = DEFAULT_EVOLUTIVE_TRIGGERS
): number {
  const riskLevel = getCurrentRiskLevel(bankroll, triggers)
  return bankroll * (riskLevel.percentage / 100)
}

// Calcula projeção do calendário com Modo Safe
export function calculateEvolutiveProjection(
  initialBankroll: number,
  startDate: string,
  days: number,
  triggers: EvolutiveTrigger[] = DEFAULT_EVOLUTIVE_TRIGGERS,
  playWeekends: boolean = false
): Array<{
  date: string
  bankroll: number
  dailyGoal: number
  percentage: number
  riskLevel: RiskLevel
}> {
  const projection = []
  let currentBankroll = initialBankroll
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const dow = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    
    if (!playWeekends && isWeekend) {
      projection.push({
        date: date.toISOString().split('T')[0],
        bankroll: currentBankroll,
        dailyGoal: 0,
        percentage: 0,
        riskLevel: getCurrentRiskLevel(currentBankroll, triggers),
      })
      continue
    }
    
    const riskLevel = getCurrentRiskLevel(currentBankroll, triggers)
    const dailyGoal = currentBankroll * (riskLevel.percentage / 100)
    
    projection.push({
      date: date.toISOString().split('T')[0],
      bankroll: currentBankroll,
      dailyGoal,
      percentage: riskLevel.percentage,
      riskLevel,
    })
    
    // Simular crescimento para o próximo dia
    currentBankroll += dailyGoal
  }
  
  return projection
}
