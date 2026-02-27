'use client';

import React from 'react';

// ── EditableText (double-click to edit on canvas) ───────────────────────────
export function EditableText({
  value,
  fieldKey,
  tag = 'span',
  style,
  enabled,
  onSave,
}: {
  value: string;
  fieldKey: string;
  tag?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  enabled: boolean;
  onSave: (val: string) => void;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [editing, setEditing] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  const Tag = tag as 'span';

  React.useEffect(() => {
    if (editing && ref.current) {
      ref.current.innerText = value;
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing, value]);

  const handleDoubleClick = () => {
    if (!enabled) return;
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    const newVal = ref.current?.innerText ?? value;
    if (newVal !== value) onSave(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tag !== 'p') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      if (ref.current) ref.current.innerText = value;
      ref.current?.blur();
    }
  };

  const el = (
    <Tag
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => enabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...style,
        outline: editing ? '2px solid rgba(255,107,53,0.6)' : 'none',
        borderRadius: editing ? 4 : 0,
        cursor: enabled ? 'text' : 'inherit',
        minWidth: editing ? 20 : 'auto',
      }}
    >
      {!editing ? value : undefined}
    </Tag>
  );

  if (!enabled) return el;

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {hover && !editing && (
        <span
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            fontSize: 10,
            color: 'rgba(255,107,53,0.6)',
            pointerEvents: 'none',
          }}
        >
          Double-click to edit
        </span>
      )}
      {el}
    </span>
  );
}
