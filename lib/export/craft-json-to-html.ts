import { CraftJson, ExportResult } from './types';

// Базовые стили которые всегда включаются в экспорт
const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; }
img { max-width: 100%; height: auto; }
`;

// Рендер одного нода в HTML строку
function renderNode(nodeId: string, nodes: CraftJson): string {
  const node = nodes[nodeId];
  if (!node) return '';

  const { resolvedName } = node.type;
  const props = node.props;
  const children = (node.nodes || []).map((id) => renderNode(id, nodes)).join('\n');

  switch (resolvedName) {
    case 'Container':
      return `<div style="position:relative">${children}</div>`;

    case 'Text':
      return `<p style="${propsToInlineStyle(props as Record<string, string>)}">${String(props.text ?? '')}</p>`;

    case 'Button':
      return `<a href="${String(props.href ?? '#')}" style="${propsToInlineStyle(props as Record<string, string>)}">${String(props.text ?? 'Button')}</a>`;

    case 'Image':
      return `<img src="${String(props.src ?? '')}" alt="${String(props.alt ?? '')}" style="${propsToInlineStyle(props as Record<string, string>)}" />`;

    case 'Divider':
      return '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:16px 0;" />';

    case 'HtmlBlock':
      return `<div>${String(props.html ?? '')}</div>`;

    // Tron компоненты — заглушки которые будут заменены в следующем шаге
    case 'HeaderTron':
    case 'HeroTron':
    case 'TronFeatures':
    case 'TronStats':
    case 'TronPortfolio':
    case 'TronTestimonials':
    case 'TronPricing':
    case 'TronFAQ':
    case 'TronShowcase':
    case 'TronContact':
    case 'TronFooter':
      return renderTronSection(resolvedName, props as Record<string, unknown>, children);

    // Дочерние ноды Tron — пропускаем, рендерятся внутри родителя
    case 'HeroTronHeading':
    case 'HeroTronSubheading':
    case 'HeroTronButton':
    case 'FeatureCard':
    case 'StatItem':
    case 'TestimonialCard':
    case 'PricingCard':
    case 'FAQItem':
    case 'FooterColumn':
    case 'SectionBlock':
    case 'LayoutBlock':
    case 'CardBlock':
    case 'PricingCardBlock':
      return '';

    default:
      return children;
  }
}

// Временный рендер Tron секций — placeholder
function renderTronSection(name: string, props: Record<string, unknown>, _children: string): string {
  const bg = String(props.darkBg ?? '#0a0a0a');
  const title = String(props.title ?? '');
  const subtitle = String(props.subtitle ?? '');
  const minH = `${String(props.sectionHeight ?? 80)}vh`;
  return `
<section style="background:${bg};min-height:${minH};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;" data-component="${name}">
  ${title ? `<h2 style="color:#fff;font-size:clamp(28px,4vw,48px);font-weight:700;text-align:center;margin-bottom:16px;">${title}</h2>` : ''}
  ${subtitle ? `<p style="color:rgba(255,255,255,0.6);font-size:18px;text-align:center;">${subtitle}</p>` : ''}
</section>`;
}

// Конвертация props в inline style строку
function propsToInlineStyle(props: Record<string, string>): string {
  const styleProps: Record<string, string> = {};
  if (props.color) styleProps.color = props.color;
  if (props.fontSize) styleProps.fontSize = `${String(props.fontSize)}px`;
  if (props.textAlign) styleProps.textAlign = props.textAlign;
  if (props.fontWeight) styleProps.fontWeight = props.fontWeight;
  if (props.margin) styleProps.margin = props.margin;
  if (props.padding) styleProps.padding = props.padding;
  return Object.entries(styleProps).map(([k, v]) => `${k}:${v}`).join(';');
}

// Собираем все media URL из всех нодов (для скачивания в assets/)
export function extractMediaUrls(nodes: CraftJson): Array<{ filename: string; url: string }> {
  const assets: Array<{ filename: string; url: string }> = [];

  Object.values(nodes).forEach((node) => {
    const props = node.props as Record<string, unknown>;
    // Поля которые могут содержать Supabase Storage URL
    const mediaFields = ['imageUrl', 'videoUrl', 'backgroundImage', 'src', 'logoSrc'];
    mediaFields.forEach((field) => {
      const val = props[field];
      if (typeof val === 'string' && val.startsWith('http') && val.includes('supabase')) {
        const filename = val.split('/').pop()?.split('?')[0] ?? `asset-${Date.now()}`;
        // Избегаем дублей
        if (!assets.find((a) => a.url === val)) {
          assets.push({ filename, url: val });
        }
      }
    });

    // items массив (TronPortfolio, TronTestimonials и др.)
    if (Array.isArray(props.items)) {
      (props.items as Array<Record<string, unknown>>).forEach((item, i) => {
        ['imageUrl', 'videoUrl', 'imageBase64'].forEach((field) => {
          const val = item[field];
          if (typeof val === 'string' && val.startsWith('http') && val.includes('supabase')) {
            const filename = `item-${i}-${val.split('/').pop()?.split('?')[0] ?? Date.now()}`;
            if (!assets.find((a) => a.url === val)) {
              assets.push({ filename, url: val });
            }
          }
        });
      });
    }
  });

  return assets;
}

// Главная функция — Craft.js JSON → ExportResult
export function craftJsonToHtml(craftJsonString: string): ExportResult {
  const nodes: CraftJson = JSON.parse(craftJsonString) as CraftJson;

  // Обходим от ROOT
  const rootNode = nodes.ROOT;
  if (!rootNode) throw new Error('No ROOT node found in Craft.js JSON');

  const bodyContent = (rootNode.nodes || []).map((id) => renderNode(id, nodes)).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Site</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${bodyContent}
</body>
</html>`;

  const assets = extractMediaUrls(nodes);

  return { html, css: BASE_CSS, assets };
}
