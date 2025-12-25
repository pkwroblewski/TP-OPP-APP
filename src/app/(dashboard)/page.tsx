import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  AlertTriangle,
  Clock,
  Upload,
  FileText,
  ArrowRight,
  Inbox
} from 'lucide-react';

export default function DashboardPage() {
  // Placeholder stats - will be replaced with real data in later steps
  const stats = [
    {
      title: 'Total Companies',
      value: '0',
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-[#1e3a5f]',
    },
    {
      title: 'High Priority - Tier A',
      value: '0',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Pending Processing',
      value: '0',
      icon: Clock,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: "This Month's Uploads",
      value: '0',
      icon: Upload,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  // Pipeline summary - placeholder values
  const pipeline = [
    { tier: 'Tier A', count: 0, color: 'bg-emerald-500' },
    { tier: 'Tier B', count: 0, color: 'bg-amber-500' },
    { tier: 'Tier C', count: 0, color: 'bg-gray-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl border-0 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-[#1e3a5f]">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.iconBg} shadow-sm`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          asChild
          size="lg"
          className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white px-8 py-6 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Link href="/upload" className="flex items-center gap-3">
            <Upload className="h-5 w-5" />
            Upload Financial Accounts
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white px-8 py-6 text-base font-medium rounded-lg transition-all"
        >
          <Link href="/companies" className="flex items-center gap-3">
            <Building2 className="h-5 w-5" />
            View All Companies
          </Link>
        </Button>
      </div>

      {/* Two Column Layout: Pipeline Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Summary */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Pipeline Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipeline.map((item) => (
              <div key={item.tier} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                  <span className="text-sm font-medium text-gray-700">{item.tier}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-semibold px-3 rounded-lg"
                >
                  {item.count}
                </Badge>
              </div>
            ))}
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Opportunities</span>
                <span className="text-xl font-bold text-[#1e3a5f]">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
                Recent Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#1e3a5f] hover:text-[#d4a853] hover:bg-transparent p-0 h-auto font-medium transition-colors duration-200"
                asChild
              >
                <Link href="/processing" className="flex items-center gap-1">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-4 shadow-sm">
                <Inbox className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No recent activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                Upload your first batch of annual accounts to start identifying transfer pricing opportunities.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#d4a853] text-[#1e3a5f] hover:bg-[#d4a853]/10 rounded-lg transition-all duration-200"
              >
                <Link href="/upload" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips Section */}
      <Card className="bg-gradient-to-r from-[#1e3a5f] via-[#254670] to-[#2d4a6f] text-white shadow-lg rounded-xl border-0 overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to identify TP opportunities?</h3>
              <p className="text-white/80 text-sm max-w-md">
                Upload Luxembourg annual accounts in PDF format to automatically detect intercompany transactions.
              </p>
            </div>
            <Button
              asChild
              className="bg-[#d4a853] hover:bg-[#c49843] text-[#1e3a5f] font-semibold px-8 py-5 whitespace-nowrap rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Start Upload
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
