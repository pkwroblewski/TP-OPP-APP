'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Database,
  LogOut,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Mail,
  Building2,
  Download,
  Info,
  ExternalLink,
  Loader2,
  Sliders,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserSettings {
  displayName: string;
  companyName: string;
  defaultFiscalYear: string;
  displayCurrency: string;
  tierAThreshold: number;
  tierBThreshold: number;
  emailOnComplete: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  companyName: '',
  defaultFiscalYear: 'auto',
  displayCurrency: 'EUR',
  tierAThreshold: 70,
  tierBThreshold: 40,
  emailOnComplete: false,
  weeklyDigest: false,
};

const APP_VERSION = '1.0.0';
const LAST_UPDATED = 'December 2024';

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [companyCount, setCompanyCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Get company count
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      setCompanyCount(count || 0);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('tp-app-settings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }

      setLoading(false);
    };
    initialize();
  }, [supabase]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem('tp-app-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tp-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearAllData = async () => {
    setClearing(true);
    try {
      // Delete all data in order (respect foreign keys)
      await supabase.from('tp_assessments').delete().neq('id', '');
      await supabase.from('financial_data').delete().neq('id', '');
      await supabase.from('filings').delete().neq('id', '');
      await supabase.from('companies').delete().neq('id', '');

      setCompanyCount(0);
      alert('All data has been cleared successfully.');
    } catch (error) {
      console.error('Clear data error:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Section 1: Profile */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[#1e3a5f]" />
            </div>
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => handleSettingChange('displayName', e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company / Firm Name</Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e) => handleSettingChange('companyName', e.target.value)}
              placeholder="e.g., KPMG Luxembourg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Preferences */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sliders className="h-4 w-4 text-purple-600" />
            </div>
            Preferences
          </CardTitle>
          <CardDescription>Customize application behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fiscal-year">Default Fiscal Year</Label>
              <Select
                value={settings.defaultFiscalYear}
                onValueChange={(value) => handleSettingChange('defaultFiscalYear', value)}
              >
                <SelectTrigger id="fiscal-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency Display</Label>
              <Select
                value={settings.displayCurrency}
                onValueChange={(value) => handleSettingChange('displayCurrency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                  <SelectItem value="GBP">GBP (Pound)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Score Threshold for Tier A</Label>
                <Badge className="bg-emerald-100 text-emerald-700 font-bold">
                  {settings.tierAThreshold}+
                </Badge>
              </div>
              <Slider
                value={[settings.tierAThreshold]}
                onValueChange={(value) => handleSettingChange('tierAThreshold', value[0])}
                min={50}
                max={90}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Companies with scores at or above this threshold are classified as Tier A (High Priority)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Score Threshold for Tier B</Label>
                <Badge className="bg-amber-100 text-amber-700 font-bold">
                  {settings.tierBThreshold}+
                </Badge>
              </div>
              <Slider
                value={[settings.tierBThreshold]}
                onValueChange={(value) => handleSettingChange('tierBThreshold', value[0])}
                min={20}
                max={settings.tierAThreshold - 10}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Companies with scores from {settings.tierBThreshold} to {settings.tierAThreshold - 1} are classified as Tier B (Medium)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Notifications (Future) */}
      <Card className="border-0 shadow-lg rounded-xl opacity-75">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              Notifications
            </CardTitle>
            <Badge variant="outline" className="text-gray-500">Coming Soon</Badge>
          </div>
          <CardDescription>Email notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Label className="text-gray-500">Email on Extraction Complete</Label>
              </div>
              <p className="text-sm text-gray-400">
                Receive an email when document processing finishes
              </p>
            </div>
            <Switch
              checked={settings.emailOnComplete}
              onCheckedChange={(checked) => handleSettingChange('emailOnComplete', checked)}
              disabled
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-500">Weekly Digest</Label>
              <p className="text-sm text-gray-400">
                Get a weekly summary of your pipeline activity
              </p>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Data Management */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Database className="h-4 w-4 text-amber-600" />
            </div>
            Data Management
          </CardTitle>
          <CardDescription>Export and manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="font-medium text-[#1e3a5f]">Export All Data</p>
                <p className="text-sm text-gray-500">
                  Download companies, assessments, and financial data as CSV
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-700">Clear All Companies</p>
                <p className="text-sm text-red-600/70">
                  Delete all {companyCount} companies and related data
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={companyCount === 0 || clearing}>
                  {clearing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Clear All Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {companyCount} companies, their financial data,
                    assessments, and uploaded files. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: About */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Info className="h-4 w-4 text-gray-600" />
            </div>
            About
          </CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">App Version</p>
              <p className="font-medium text-[#1e3a5f]">v{APP_VERSION}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-[#1e3a5f]">{LAST_UPDATED}</p>
            </div>
          </div>

          <a
            href="https://docs.example.com/tp-opportunity-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="font-medium text-[#1e3a5f]">Documentation</p>
                <p className="text-sm text-gray-500">
                  Learn how to use the TP Opportunity Finder
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#1e3a5f]" />
          </a>
        </CardContent>
      </Card>

      {/* Sign Out Button */}
      <Card className="border-0 shadow-lg rounded-xl border-l-4 border-l-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Sign Out</p>
              <p className="text-sm text-gray-500">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Fixed at bottom */}
      <div className="sticky bottom-6 flex items-center justify-end gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border">
        {saved && (
          <p className="text-sm text-emerald-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Settings saved
          </p>
        )}
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
