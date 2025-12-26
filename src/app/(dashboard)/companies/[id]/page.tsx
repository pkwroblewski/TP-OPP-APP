'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Loader2, ArrowLeft, LayoutDashboard, Wallet, BarChart3, ShieldCheck, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import {
  CompanyHeader,
  ExecutiveSummary,
  KeyFindings,
  QuickStats,
  ICTransactionTree,
  FinancialSummary,
  RiskAnalysis,
  RecommendedServices,
  OutreachCard,
  EmailDraftModal,
} from '@/components/company';
import type { Company, Filing, FinancialData, TPAssessment, ICTransaction } from '@/types/database';

interface CompanyDetails extends Company {
  filings: Filing[];
  financial_data: FinancialData[];
  tp_assessments: TPAssessment[];
  ic_transactions: ICTransaction[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        filings(*),
        financial_data(*),
        tp_assessments(*),
        ic_transactions(*)
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      setIsLoading(false);
      return;
    }

    setCompany(data as CompanyDetails);
    setIsLoading(false);
  };

  const getLatestAssessment = (): TPAssessment | null => {
    if (!company?.tp_assessments?.length) return null;
    return company.tp_assessments.sort((a, b) => b.fiscal_year - a.fiscal_year)[0];
  };

  const getLatestFinancials = (): FinancialData | null => {
    if (!company?.financial_data?.length) return null;
    return company.financial_data.sort((a, b) => b.fiscal_year - a.fiscal_year)[0];
  };

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-2">Company not found</h3>
        <p className="text-sm text-gray-500 mb-4">
          The company you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  const latestAssessment = getLatestAssessment();
  const latestFinancials = getLatestFinancials();

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <CompanyHeader
        company={company}
        assessment={latestAssessment}
        onExport={handleExport}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white shadow-tp border-0 rounded-xl p-1.5 h-auto flex-wrap">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-4 py-2.5 font-medium transition-all data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg px-4 py-2.5 font-medium transition-all data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
          >
            <Wallet className="h-4 w-4" />
            IC Transactions
          </TabsTrigger>
          <TabsTrigger
            value="financials"
            className="rounded-lg px-4 py-2.5 font-medium transition-all data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="rounded-lg px-4 py-2.5 font-medium transition-all data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="rounded-lg px-4 py-2.5 font-medium transition-all data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
          >
            <Megaphone className="h-4 w-4" />
            Actions & Outreach
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary */}
          <ExecutiveSummary summary={latestAssessment?.ai_summary || null} />

          {/* Key Findings */}
          <KeyFindings findings={latestAssessment?.ai_key_findings || null} />

          {/* Quick Stats Row */}
          <QuickStats assessment={latestAssessment} financialData={latestFinancials} />
        </TabsContent>

        {/* TAB 2: IC Transactions */}
        <TabsContent value="transactions" className="space-y-6">
          <ICTransactionTree
            transactions={company.ic_transactions || []}
            financialData={latestFinancials}
          />
        </TabsContent>

        {/* TAB 3: Financials */}
        <TabsContent value="financials" className="space-y-6">
          <FinancialSummary financialData={latestFinancials} />
        </TabsContent>

        {/* TAB 4: Risk Analysis */}
        <TabsContent value="risk" className="space-y-6">
          <RiskAnalysis assessment={latestAssessment} financialData={latestFinancials} />
        </TabsContent>

        {/* TAB 5: Actions & Outreach */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecommendedServices
              assessment={latestAssessment}
              financialData={latestFinancials}
            />
            <OutreachCard
              company={company}
              assessment={latestAssessment}
              financialData={latestFinancials}
              onGenerateEmail={() => setShowEmailModal(true)}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Draft Modal */}
      <EmailDraftModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        company={company}
        assessment={latestAssessment}
      />
    </div>
  );
}
