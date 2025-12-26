import Anthropic from '@anthropic-ai/sdk';
import type { FinancialData, ICTransaction, TPAssessmentInsert } from '@/types/database';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TPAnalysisInput {
  companyId: string;
  fiscalYear: number;
  companyName: string;
  legalForm: string | null;
  isPartOfGroup: boolean;
  parentCompanyName: string | null;
  parentCountry: string | null;
  financialData: FinancialData | null;
  icTransactions: ICTransaction[];
}

export interface TPAnalysisResult {
  success: boolean;
  assessment: TPAssessmentInsert | null;
  error?: string;
}

interface RiskIndicators {
  hasIcFinancing: boolean;
  hasIcServices: boolean;
  hasIcRoyalties: boolean;
  hasCrossBorderIc: boolean;
  hasThinCapIndicators: boolean;
  hasRateAnomalies: boolean;
  likelyNeedsLocalFile: boolean;
  likelyNeedsMasterFile: boolean;
}

// Scoring thresholds
const THRESHOLDS = {
  HIGH_VALUE_THRESHOLD: 1000000, // EUR 1 million
  THIN_CAP_DE_RATIO: 3, // 3:1 debt to equity
  IC_DEBT_RATIO_HIGH: 0.7, // 70% IC debt
  MATERIAL_IC_VOLUME: 500000, // EUR 500k
  INTEREST_RATE_DEVIATION_BPS: 200, // 2% deviation
};

function calculateRiskIndicators(
  financialData: FinancialData | null,
  icTransactions: ICTransaction[]
): RiskIndicators {
  // Check for IC financing
  const hasIcFinancing = icTransactions.some(
    (tx) =>
      tx.transaction_type === 'ic_loan_granted' ||
      tx.transaction_type === 'ic_loan_received' ||
      tx.transaction_type === 'cash_pool'
  );

  // Check for IC services
  const hasIcServices = icTransactions.some(
    (tx) =>
      tx.transaction_type === 'management_fee' ||
      tx.transaction_type === 'service_fee'
  );

  // Check for IC royalties
  const hasIcRoyalties = icTransactions.some(
    (tx) => tx.transaction_type === 'royalty'
  );

  // Check for cross-border transactions
  const hasCrossBorderIc = icTransactions.some((tx) => tx.is_cross_border);

  // Check for thin capitalization indicators
  const hasThinCapIndicators =
    (financialData?.debt_to_equity_ratio || 0) > THRESHOLDS.THIN_CAP_DE_RATIO ||
    (financialData?.ic_debt_to_total_debt_ratio || 0) > THRESHOLDS.IC_DEBT_RATIO_HIGH;

  // Check for rate anomalies
  const hasRateAnomalies = icTransactions.some((tx) => tx.is_rate_anomaly);

  // Determine documentation requirements
  const estimatedIcVolume = icTransactions.reduce(
    (sum, tx) => sum + (tx.principal_amount || 0) + (tx.annual_flow || 0),
    0
  );

  const likelyNeedsLocalFile = estimatedIcVolume > THRESHOLDS.MATERIAL_IC_VOLUME;
  const likelyNeedsMasterFile =
    hasCrossBorderIc && estimatedIcVolume > THRESHOLDS.HIGH_VALUE_THRESHOLD;

  return {
    hasIcFinancing,
    hasIcServices,
    hasIcRoyalties,
    hasCrossBorderIc,
    hasThinCapIndicators,
    hasRateAnomalies,
    likelyNeedsLocalFile,
    likelyNeedsMasterFile,
  };
}

function calculateFinancingRiskScore(
  financialData: FinancialData | null,
  icTransactions: ICTransaction[]
): number {
  let score = 0;

  // IC loan volume
  const icLoans = icTransactions.filter(
    (tx) =>
      tx.transaction_type === 'ic_loan_granted' ||
      tx.transaction_type === 'ic_loan_received'
  );

  if (icLoans.length > 0) score += 20;

  const totalIcLoanAmount = icLoans.reduce(
    (sum, tx) => sum + (tx.principal_amount || 0),
    0
  );

  if (totalIcLoanAmount > THRESHOLDS.HIGH_VALUE_THRESHOLD) score += 15;
  if (totalIcLoanAmount > THRESHOLDS.HIGH_VALUE_THRESHOLD * 10) score += 15;

  // Thin cap risk
  if (financialData?.debt_to_equity_ratio) {
    if (financialData.debt_to_equity_ratio > THRESHOLDS.THIN_CAP_DE_RATIO) {
      score += 20;
    }
  }

  // IC debt concentration
  if (financialData?.ic_debt_to_total_debt_ratio) {
    if (financialData.ic_debt_to_total_debt_ratio > THRESHOLDS.IC_DEBT_RATIO_HIGH) {
      score += 15;
    }
  }

  // Interest rate anomalies
  const rateAnomalies = icLoans.filter((tx) => tx.is_rate_anomaly);
  if (rateAnomalies.length > 0) score += 15;

  return Math.min(score, 100);
}

function calculateServicesRiskScore(
  icTransactions: ICTransaction[]
): number {
  let score = 0;

  const serviceTransactions = icTransactions.filter(
    (tx) =>
      tx.transaction_type === 'management_fee' ||
      tx.transaction_type === 'service_fee' ||
      tx.transaction_type === 'royalty'
  );

  if (serviceTransactions.length > 0) score += 20;

  const totalServiceFees = serviceTransactions.reduce(
    (sum, tx) => sum + (tx.annual_flow || 0),
    0
  );

  if (totalServiceFees > THRESHOLDS.MATERIAL_IC_VOLUME) score += 20;
  if (totalServiceFees > THRESHOLDS.HIGH_VALUE_THRESHOLD) score += 20;

  // Cross-border services
  const crossBorderServices = serviceTransactions.filter((tx) => tx.is_cross_border);
  if (crossBorderServices.length > 0) score += 20;

  // Multiple service types
  const serviceTypes = new Set(serviceTransactions.map((tx) => tx.transaction_type));
  if (serviceTypes.size > 1) score += 10;

  // High value individual transactions
  const highValueServices = serviceTransactions.filter((tx) => tx.is_high_value);
  if (highValueServices.length > 0) score += 10;

  return Math.min(score, 100);
}

function calculateDocumentationRiskScore(
  companyInfo: {
    isPartOfGroup: boolean;
    parentCountry: string | null;
  },
  riskIndicators: RiskIndicators
): number {
  let score = 0;

  // Part of multinational group
  if (companyInfo.isPartOfGroup) score += 15;

  // Foreign parent
  if (companyInfo.parentCountry && companyInfo.parentCountry !== 'LU') {
    score += 15;
  }

  // Multiple IC transaction types
  let icTypeCount = 0;
  if (riskIndicators.hasIcFinancing) icTypeCount++;
  if (riskIndicators.hasIcServices) icTypeCount++;
  if (riskIndicators.hasIcRoyalties) icTypeCount++;

  score += icTypeCount * 10;

  // Cross-border complexity
  if (riskIndicators.hasCrossBorderIc) score += 20;

  // Documentation thresholds
  if (riskIndicators.likelyNeedsLocalFile) score += 15;
  if (riskIndicators.likelyNeedsMasterFile) score += 15;

  return Math.min(score, 100);
}

function determinePriorityTier(totalScore: number): 'A' | 'B' | 'C' {
  if (totalScore >= 70) return 'A';
  if (totalScore >= 40) return 'B';
  return 'C';
}

async function generateAISummary(
  input: TPAnalysisInput,
  riskIndicators: RiskIndicators,
  scores: {
    financingRisk: number;
    servicesRisk: number;
    documentationRisk: number;
    totalScore: number;
    priorityTier: string;
  }
): Promise<{ summary: string; recommendedApproach: string; keyFindings: string[] }> {
  const prompt = `You are a transfer pricing expert analyzing a Luxembourg company for advisory opportunities.

COMPANY INFORMATION:
- Name: ${input.companyName}
- Legal Form: ${input.legalForm || 'Unknown'}
- Part of Group: ${input.isPartOfGroup ? 'Yes' : 'No'}
- Parent Company: ${input.parentCompanyName || 'N/A'}
- Parent Country: ${input.parentCountry || 'N/A'}

FINANCIAL HIGHLIGHTS:
- Total Assets: ${input.financialData?.total_assets ? `EUR ${input.financialData.total_assets.toLocaleString()}` : 'N/A'}
- Total Equity: ${input.financialData?.total_equity ? `EUR ${input.financialData.total_equity.toLocaleString()}` : 'N/A'}
- Net Profit: ${input.financialData?.net_profit ? `EUR ${input.financialData.net_profit.toLocaleString()}` : 'N/A'}
- Debt/Equity Ratio: ${input.financialData?.debt_to_equity_ratio?.toFixed(2) || 'N/A'}
- IC Debt Ratio: ${input.financialData?.ic_debt_to_total_debt_ratio ? `${(input.financialData.ic_debt_to_total_debt_ratio * 100).toFixed(1)}%` : 'N/A'}

IC TRANSACTIONS DETECTED: ${input.icTransactions.length}
${input.icTransactions.slice(0, 5).map((tx) => `- ${tx.transaction_type}: ${tx.principal_amount ? `EUR ${tx.principal_amount.toLocaleString()}` : 'Amount unknown'} ${tx.counterparty_country ? `(${tx.counterparty_country})` : ''}`).join('\n')}

RISK INDICATORS:
- Has IC Financing: ${riskIndicators.hasIcFinancing ? 'Yes' : 'No'}
- Has IC Services: ${riskIndicators.hasIcServices ? 'Yes' : 'No'}
- Has IC Royalties: ${riskIndicators.hasIcRoyalties ? 'Yes' : 'No'}
- Has Cross-Border IC: ${riskIndicators.hasCrossBorderIc ? 'Yes' : 'No'}
- Thin Cap Indicators: ${riskIndicators.hasThinCapIndicators ? 'Yes' : 'No'}
- Rate Anomalies: ${riskIndicators.hasRateAnomalies ? 'Yes' : 'No'}

RISK SCORES:
- Financing Risk: ${scores.financingRisk}/100
- Services Risk: ${scores.servicesRisk}/100
- Documentation Risk: ${scores.documentationRisk}/100
- Total Score: ${scores.totalScore}/100
- Priority Tier: ${scores.priorityTier}

Please provide a JSON response with:
1. A concise 2-3 sentence executive summary of the TP opportunity
2. A recommended approach for outreach (1-2 sentences)
3. 3-5 key findings as bullet points

Response format:
{
  "summary": "...",
  "recommendedApproach": "...",
  "keyFindings": ["...", "...", "..."]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('AI summary generation failed', error);
    return {
      summary: `${input.companyName} shows transfer pricing exposure with a risk score of ${scores.totalScore}/100. Priority Tier ${scores.priorityTier} indicates ${scores.priorityTier === 'A' ? 'high' : scores.priorityTier === 'B' ? 'medium' : 'lower'} potential for TP advisory services.`,
      recommendedApproach: scores.priorityTier === 'A'
        ? 'Prioritize for immediate outreach with a comprehensive TP health check proposal.'
        : scores.priorityTier === 'B'
          ? 'Schedule follow-up contact to discuss specific TP documentation needs.'
          : 'Monitor for future opportunities as the company grows.',
      keyFindings: [
        riskIndicators.hasIcFinancing ? 'Intercompany financing arrangements detected' : 'Limited IC financing exposure',
        riskIndicators.hasCrossBorderIc ? 'Cross-border IC transactions present' : 'Primarily domestic transactions',
        riskIndicators.hasThinCapIndicators ? 'Potential thin capitalization concerns' : 'Capital structure appears acceptable',
      ],
    };
  }
}

export async function analyzeTPOpportunity(
  input: TPAnalysisInput
): Promise<TPAnalysisResult> {
  try {
    // Calculate risk indicators
    const riskIndicators = calculateRiskIndicators(
      input.financialData,
      input.icTransactions
    );

    // Calculate individual risk scores
    const financingRiskScore = calculateFinancingRiskScore(
      input.financialData,
      input.icTransactions
    );

    const servicesRiskScore = calculateServicesRiskScore(input.icTransactions);

    const documentationRiskScore = calculateDocumentationRiskScore(
      {
        isPartOfGroup: input.isPartOfGroup,
        parentCountry: input.parentCountry,
      },
      riskIndicators
    );

    // Calculate materiality score based on financial size
    let materialityScore = 0;
    if (input.financialData?.total_assets) {
      if (input.financialData.total_assets > 100000000) materialityScore = 100;
      else if (input.financialData.total_assets > 50000000) materialityScore = 75;
      else if (input.financialData.total_assets > 10000000) materialityScore = 50;
      else if (input.financialData.total_assets > 1000000) materialityScore = 25;
    }

    // Calculate complexity score
    let complexityScore = 0;
    complexityScore += input.icTransactions.length * 5;
    if (riskIndicators.hasCrossBorderIc) complexityScore += 20;
    if (riskIndicators.hasIcFinancing && riskIndicators.hasIcServices) complexityScore += 15;
    if (riskIndicators.hasIcRoyalties) complexityScore += 15;
    complexityScore = Math.min(complexityScore, 100);

    // Calculate total score (weighted average)
    const totalScore = Math.round(
      financingRiskScore * 0.35 +
      servicesRiskScore * 0.25 +
      documentationRiskScore * 0.20 +
      materialityScore * 0.10 +
      complexityScore * 0.10
    );

    // Determine priority tier
    const priorityTier = determinePriorityTier(totalScore);

    // Estimate IC volume
    const estimatedIcVolume = input.icTransactions.reduce(
      (sum, tx) => sum + (tx.principal_amount || 0) + (tx.annual_flow || 0),
      0
    );

    // Generate AI summary
    const aiAnalysis = await generateAISummary(input, riskIndicators, {
      financingRisk: financingRiskScore,
      servicesRisk: servicesRiskScore,
      documentationRisk: documentationRiskScore,
      totalScore,
      priorityTier,
    });

    // Build assessment record
    const assessment: TPAssessmentInsert = {
      company_id: input.companyId,
      fiscal_year: input.fiscalYear,
      total_score: totalScore,
      priority_tier: priorityTier,
      financing_risk_score: financingRiskScore,
      services_risk_score: servicesRiskScore,
      documentation_risk_score: documentationRiskScore,
      materiality_score: materialityScore,
      complexity_score: complexityScore,
      has_ic_financing: riskIndicators.hasIcFinancing,
      has_ic_services: riskIndicators.hasIcServices,
      has_ic_royalties: riskIndicators.hasIcRoyalties,
      has_cross_border_ic: riskIndicators.hasCrossBorderIc,
      has_thin_cap_indicators: riskIndicators.hasThinCapIndicators,
      has_rate_anomalies: riskIndicators.hasRateAnomalies,
      likely_needs_local_file: riskIndicators.likelyNeedsLocalFile,
      likely_needs_master_file: riskIndicators.likelyNeedsMasterFile,
      estimated_ic_volume: estimatedIcVolume,
      ai_summary: aiAnalysis.summary,
      ai_key_findings: aiAnalysis.keyFindings,
      ai_recommended_approach: aiAnalysis.recommendedApproach,
      outreach_status: 'new',
    };

    return {
      success: true,
      assessment,
    };
  } catch (error) {
    logger.error('TP analysis error', error);
    return {
      success: false,
      assessment: null,
      error: error instanceof Error ? error.message : 'Unknown analysis error',
    };
  }
}
