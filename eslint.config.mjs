/*
 * eslint-config-next 16 ships a native flat config, so it is spread directly.
 *
 * The FlatCompat wrapper that is still all over the internet is for the v8
 * era. Against v16 it throws "Converting circular structure to JSON" from
 * @eslint/eslintrc's config validator, because the plugin object it is asked
 * to serialise references itself. There is nothing to fix in the wrapper: it
 * simply is not needed any more.
 */
import next from 'eslint-config-next/core-web-vitals';

export default [
    ...next,
    { ignores: ['.next/**', 'node_modules/**', 'out/**'] },
    /*
     * VelBiz Cloud (the ERP, moved in from the Velcaryn repo) loads its data
     * with a `useEffect(() => { load(); }, [load])` on mount, where load()
     * sets a loading flag before it awaits. react-hooks 7.1 reports that as
     * set-state-in-effect; 7.0, which the code was written and tested
     * against, did not, and the pattern is correct for a client-side fetch.
     * Rewriting thirty working screens to satisfy a newly tightened rule is
     * the wrong trade, so it is off for the ERP's folders and nowhere else.
     * Every other rule still applies to that code.
     */
    {
        files: ['app/(erp)/**', 'components/cloud-app/**', 'components/dashboard/**', 'components/admin/**'],
        rules: { 'react-hooks/set-state-in-effect': 'off' },
    },
];
