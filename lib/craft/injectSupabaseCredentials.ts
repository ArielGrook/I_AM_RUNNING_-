/**
 * Injects supabaseUrl and supabaseAnonKey into TronLogin, TronRegister, and HeaderTron
 * nodes in a Craft.js serialized JSON string.
 * Used after backend-auth Connect to propagate credentials to auth components on all pages.
 */

const AUTH_COMPONENT_NAMES = new Set([
  'Tron Login',
  'Tron Register',
  'Header Tron',
  'Tron Hub',
  'TronLogin',
  'TronRegister',
  'HeaderTron',
  'TronHub',
]);

interface CraftNodeLike {
  type?: { resolvedName?: string };
  data?: { type?: { resolvedName?: string }; props?: Record<string, unknown> };
  props?: Record<string, unknown>;
  nodes?: string[];
}

function getResolvedName(node: CraftNodeLike): string | undefined {
  return node.type?.resolvedName ?? node.data?.type?.resolvedName;
}

function getProps(node: CraftNodeLike): Record<string, unknown> | undefined {
  if (node.props && typeof node.props === 'object') return node.props;
  if (node.data?.props && typeof node.data.props === 'object') return node.data.props;
  return undefined;
}

function setProps(node: CraftNodeLike, url: string, anonKey: string): void {
  const props = getProps(node);
  if (props) {
    props.supabaseUrl = url;
    props.supabaseAnonKey = anonKey;
  }
  if (node.data?.props && typeof node.data.props === 'object') {
    node.data.props.supabaseUrl = url;
    node.data.props.supabaseAnonKey = anonKey;
  }
}

/**
 * Mutates the parsed state: injects url and anonKey into every node whose
 * resolvedName is Tron Login, Tron Register, or Header Tron.
 */
function injectIntoParsed(parsed: Record<string, CraftNodeLike>, url: string, anonKey: string): void {
  for (const node of Object.values(parsed)) {
    if (!node || typeof node !== 'object') continue;
    const name = getResolvedName(node);
    if (name && AUTH_COMPONENT_NAMES.has(name)) {
      setProps(node, url, anonKey);
    }
  }
}

/**
 * Gets the nodes map from parsed Craft state (handles both flat nodes and state.nodes).
 */
function getNodesMap(parsed: Record<string, unknown>): Record<string, CraftNodeLike> | null {
  if (parsed.nodes && typeof parsed.nodes === 'object' && !Array.isArray(parsed.nodes)) {
    return parsed.nodes as Record<string, CraftNodeLike>;
  }
  if (parsed.ROOT || Object.keys(parsed).some((k) => typeof (parsed[k] as CraftNodeLike)?.type === 'object')) {
    return parsed as Record<string, CraftNodeLike>;
  }
  return null;
}

/**
 * Takes a Craft.js serialized JSON string (one page's canvas state),
 * parses it, injects supabaseUrl and supabaseAnonKey into auth components,
 * and returns the modified JSON string.
 */
export function injectSupabaseCredentialsIntoCraftJson(
  serializedJson: string,
  url: string,
  anonKey: string
): string {
  if (!serializedJson || !url || !anonKey) return serializedJson;
  try {
    const parsed = JSON.parse(serializedJson) as Record<string, unknown>;
    const nodes = getNodesMap(parsed);
    if (nodes) injectIntoParsed(nodes, url, anonKey);
    return JSON.stringify(parsed);
  } catch {
    return serializedJson;
  }
}
