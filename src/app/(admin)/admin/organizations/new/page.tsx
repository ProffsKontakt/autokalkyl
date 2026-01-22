import { OrgForm } from '@/components/organizations/org-form';
import { Building2 } from 'lucide-react';

export const metadata = {
  title: 'Skapa organisation - Kalkyla.se Admin',
};

export default function NewOrganizationPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Skapa ny organisation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Lägg till en ny organisation i systemet
          </p>
        </div>
      </div>
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-6">
        <OrgForm />
      </div>
    </div>
  );
}
