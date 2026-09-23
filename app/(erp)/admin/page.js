import { redirect } from 'next/navigation';

/** /admin has one area today; send the bare path to it. */
export default function AdminIndex() {
    redirect('/admin/cloud');
}
