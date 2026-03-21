const fs = require('fs');
let c = fs.readFileSync('lib/craft/components/TronCTA.tsx', 'utf8');

// 1. Vertical centering on section
c = c.replace(
  "      minHeight: `${sectionHeight}vh`,\n      position: 'relative',\n    }}\n  >",
  "      minHeight: `${sectionHeight}vh`,\n      position: 'relative',\n      display: 'flex',\n      alignItems: 'center',\n    }}\n  >"
);

// 2. Default 70vh in craft config (the one in tronCTACraft.props)
c = c.replace(
  "    sectionHeight: 60,\n    showGrid: true,\n    label: 'Ready to start?',",
  "    sectionHeight: 70,\n    showGrid: true,\n    label: 'Ready to start?',"
);

// 3. Add cardTitle, cardText, cardBadge to TronCTAProps interface
c = c.replace(
  "  glowIntensity?: number;\n  animationType?: string;\n  animateDelay?: string;\n}",
  "  glowIntensity?: number;\n  cardTitle?: string;\n  cardText?: string;\n  cardBadge?: string;\n  animationType?: string;\n  animateDelay?: string;\n}"
);

// 4. Replace static decorative card content with editable
const oldCard = `              {/* Decorative lines */}
              {[
                { w: '70%', opacity: 0.4 },
                { w: '90%', opacity: 0.25 },
                { w: '55%', opacity: 0.3 },
              ].map((line, i) => (
                <div key={i} style={{
                  height: 3, borderRadius: 2, marginBottom: i < 2 ? 14 : 0,
                  width: line.w,
                  background: \`rgba(\${rgb}, \${line.opacity})\`,
                }} />
              ))}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: \`rgba(\${rgb}, 0.15)\`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <div style={{ height: 8, width: 80, borderRadius: 4, background: \`rgba(\${rgb}, 0.3)\`, marginBottom: 6 }} />
                  <div style={{ height: 6, width: 120, borderRadius: 3, background: \`rgba(\${rgb}, 0.15)\` }} />
                </div>
              </div>`;

const newCard = `              {/* Editable card content */}
              <div style={{ marginBottom: 20 }}>
                <EditableText
                  value={props.cardTitle ?? 'Fast & reliable'}
                  fieldKey="cardTitle"
                  tag="div"
                  style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 10 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardTitle = val; }, 0)}
                />
                <EditableText
                  value={props.cardText ?? 'Deploy in minutes, not months. Our platform handles everything so you can focus on your business.'}
                  fieldKey="cardText"
                  tag="p"
                  style={{ fontSize: 14, lineHeight: 1.65, color: t.textSecondary }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardText = val; }, 0)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: \`1px solid rgba(\${rgb}, 0.12)\` }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: \`rgba(\${rgb}, 0.15)\`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <EditableText
                  value={props.cardBadge ?? 'No credit card required'}
                  fieldKey="cardBadge"
                  tag="span"
                  style={{ fontSize: 13, color: t.textSecondary, fontWeight: 500 }}
                  enabled={enabled}
                  onSave={(val) => setProp((p: Record<string, unknown>) => { p.cardBadge = val; }, 0)}
                />
              </div>`;

if (c.includes(oldCard)) {
  c = c.replace(oldCard, newCard);
  console.log('card replaced OK');
} else {
  console.log('card NOT found - checking snippet...');
  const idx = c.indexOf('Decorative lines');
  console.log('Decorative lines at index:', idx);
  console.log('Context:', c.slice(idx - 20, idx + 100));
}

// 5. Add cardTitle/cardText/cardBadge to craft default props
c = c.replace(
  "    layoutStyle: 'centered' as const,\n    glowIntensity: 12,",
  "    layoutStyle: 'centered' as const,\n    glowIntensity: 12,\n    cardTitle: 'Fast & reliable',\n    cardText: 'Deploy in minutes, not months. Our platform handles everything so you can focus on your business.',\n    cardBadge: 'No credit card required',"
);

fs.writeFileSync('lib/craft/components/TronCTA.tsx', c);

// Verify
const hasCenter = c.includes("alignItems: 'center'");
const has70 = c.includes('sectionHeight: 70');
const hasCardTitle = c.includes('cardTitle');
console.log('centering:', hasCenter, '| 70vh:', has70, '| editable card:', hasCardTitle);
