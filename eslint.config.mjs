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
];
