import { useState, useEffect, useRef } from 'react';
import { useGridFilter } from 'ag-grid-react';
import type { CustomFilterProps, CustomFilterCallbacks } from 'ag-grid-react';

/* ── Types ────────────────────────────────── */

type Model = string | null;

/* ── UI Component ─────────────────────────── */

export default function DropdownFilter(
  props: CustomFilterProps<any, any, Model>,
) {
  const { model, onModelChange, colDef, getValue } = props;
  const [value, setValue] = useState(model ?? '');

  /* Keep a mutable ref so useGridFilter callbacks always read
   * the latest model, avoiding stale‑closure bugs. */
  const modelRef = useRef(model);
  modelRef.current = model;

  /* ── Provide doesFilterPass via legacy hook.
   *   isFilterActive / getModel / setModel are handled by
   *   FilterComponentWrapper internally via model + onModelChange. ── */
  useGridFilter({
    doesFilterPass(params) {
      const m = modelRef.current;
      if (m == null || m === '') return true;
      const raw = getValue(params.node);
      return String(raw ?? '') === m;
    },
  } satisfies CustomFilterCallbacks);

  /* Sync when model changes externally (e.g. Clear button). */
  useEffect(() => {
    setValue(model ?? '');
  }, [model]);

  /* Read the live value list — getValues() is a closure over
   *  the cross‑filter cache, so it always returns current data. */
  const fp = (colDef as any).filterParams;
  const values: string[] =
    typeof fp?.getValues === 'function' ? fp.getValues() : fp?.values ?? [];

  return (
    <div style={{ padding: '8px 12px', minWidth: 200 }}>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          const m = v === '' ? null : v;
          setValue(v);
          modelRef.current = m; // immediate, so useGridFilter sees it
          onModelChange(m);
        }}
        style={{
          width: '100%',
          padding: '4px 8px',
          fontSize: 13,
          border: '1px solid #e20074',
          borderRadius: 4,
          background: '#fff',
        }}
      >
        <option value="">(All)</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
