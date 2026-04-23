import { Suspense } from 'react';
import PrintContent from './PrintContent';

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'Arial' }}>جاري التحميل...</div>}>
      <PrintContent />
    </Suspense>
  );
}
