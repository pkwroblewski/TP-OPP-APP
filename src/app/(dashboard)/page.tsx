import { redirect } from 'next/navigation';

// Per redesign spec: Companies page is the main dashboard
// Root path redirects to /companies
export default function DashboardPage() {
  redirect('/companies');
}
