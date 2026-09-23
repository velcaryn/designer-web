'use client';
import { Suspense } from 'react';
import CloudDocFormV2 from '@/components/dashboard/CloudDocFormV2';

export default function CloudDocNewPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading form…</div>}>
            <CloudDocFormV2 />
        </Suspense>
    );
}
