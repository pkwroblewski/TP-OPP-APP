'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  LogOut,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Settings2,
  Mail,
  Building2,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserSettings {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  highPriorityAlerts: boolean;
  defaultFiscalYear: string;
  displayCurrency: string;
  compactView: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  weeklyDigest: false,
  highPriorityAlerts: true,
  defaultFiscalYear: 'auto',
  displayCurrency: 'EUR',
  compactView: false,
  darkMode: false,
};

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      // Load settings from localStorage (in production, use database)
      const savedSettings = localStorage.getItem('tp-app-settings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    };
    getUser();
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
      // Save to localStorage (in production, save to database)
      localStorage.setItem('tp-app-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Password update failed:', error);
      setPasswordError('Failed to update password. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[#1e3a5f]" />
            </div>
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-[#1e3a5f]">{user?.email}</p>
              <p className="text-sm text-slate-500">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Input
                id="role"
                value="Administrator"
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <p className="text-sm text-slate-500">
                Receive email updates about new opportunities
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                handleSettingChange('emailNotifications', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest">Weekly Digest</Label>
              <p className="text-sm text-slate-500">
                Get a weekly summary of pipeline activity
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) =>
                handleSettingChange('weeklyDigest', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <Label htmlFor="high-priority">High Priority Alerts</Label>
              </div>
              <p className="text-sm text-slate-500">
                Immediate alerts for Tier A opportunities
              </p>
            </div>
            <Switch
              id="high-priority"
              checked={settings.highPriorityAlerts}
              onCheckedChange={(checked) =>
                handleSettingChange('highPriorityAlerts', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Palette className="h-4 w-4 text-purple-600" />
            </div>
            Display Preferences
          </CardTitle>
          <CardDescription>Customize your viewing experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fiscal-year">Default Fiscal Year</Label>
              <Select
                value={settings.defaultFiscalYear}
                onValueChange={(value) =>
                  handleSettingChange('defaultFiscalYear', value)
                }
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
              <Label htmlFor="currency">Display Currency</Label>
              <Select
                value={settings.displayCurrency}
                onValueChange={(value) =>
                  handleSettingChange('displayCurrency', value)
                }
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-view">Compact View</Label>
              <p className="text-sm text-slate-500">
                Show more items in lists with reduced spacing
              </p>
            </div>
            <Switch
              id="compact-view"
              checked={settings.compactView}
              onCheckedChange={(checked) =>
                handleSettingChange('compactView', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            Security
          </CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="text-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Password updated successfully
              </p>
            )}

            <Button
              onClick={handlePasswordChange}
              variant="outline"
              disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              <Key className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Database className="h-4 w-4 text-amber-600" />
            </div>
            Data Management
          </CardTitle>
          <CardDescription>Manage your data and exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="font-medium text-[#1e3a5f]">Export All Data</p>
                <p className="text-sm text-slate-500">
                  Download all companies, assessments, and transactions
                </p>
              </div>
            </div>
            <Button variant="outline" className="rounded-lg">
              Export CSV
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <Settings2 className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="font-medium text-[#1e3a5f]">API Access</p>
                <p className="text-sm text-slate-500">
                  Manage API keys for integrations
                </p>
              </div>
            </div>
            <Button variant="outline" disabled className="rounded-lg">
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-0 shadow-lg rounded-xl border-l-4 border-l-red-500 bg-red-50/30">
        <CardHeader className="border-b border-red-100">
          <CardTitle className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-slate-500">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-slate-500">
                Permanently delete your account and all data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pb-8">
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
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
