import { getAdminMetrics, getRecentTransactions } from "./actions"
import {
  getCreditCosts,
  getTopupPackages,
  getReferralConfig,
  getFreeTierConfig,
  getProTierConfig,
} from "@/lib/queries/config"
import AdminDashboardClient from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [
    metricsResult,
    transactionsResult,
    creditCosts,
    topupPackages,
    referral,
    freeTier,
    proTier,
  ] = await Promise.all([
    getAdminMetrics(),
    getRecentTransactions(20),
    getCreditCosts(),
    getTopupPackages(),
    getReferralConfig(),
    getFreeTierConfig(),
    getProTierConfig(),
  ])

  const metrics = metricsResult.ok
    ? metricsResult.metrics
    : {
        totalUsers: 0,
        usersThisMonth: 0,
        activeUsersLast7Days: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        totalQuestionsAttempted: 0,
        questionsAttemptedToday: 0,
        proSubscribers: 0,
        totalCreditsInCirculation: 0,
        creditsPurchasedToday: 0,
        creditsSpentToday: 0,
        referralCreditsTotal: 0,
      }

  const transactions = transactionsResult.ok ? transactionsResult.transactions : []

  return (
    <AdminDashboardClient
      metrics={metrics}
      transactions={transactions}
      configs={{
        creditCosts,
        freeTier,
        proTier,
        topupPackages,
        referral,
      }}
    />
  )
}
