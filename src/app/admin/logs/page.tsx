'use client';

import { LogsView } from '@/components/admin/logs/logs-view';
import { PageHeader } from '@/components/shell/app-shell';

export default function LogsPage() {
  return (
    <>
      <PageHeader
        title="Logs"
        description="Requisições que mudaram dados ou deram erro, e o histórico de alterações."
      />
      <LogsView />
    </>
  );
}
