import { Suspense } from 'react';
import AnnualPrintContent from './AnnualPrintContent';

export default function AnnualPrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>جاري التحميل...</div>}>
      <AnnualPrintContent />
    </Suspense>
  );
}
