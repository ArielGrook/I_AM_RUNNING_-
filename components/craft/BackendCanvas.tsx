'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── Custom node: TronSiteNode ─────────────────────────────────────────────
function TronSiteNode({ data }: { data: { label?: string; sublabel?: string } }) {
  return (
    <div
      style={{
        width: 200,
        height: 60,
        background: 'linear-gradient(180deg, #1a0a00 0%, #0f0f0f 100%)',
        border: '1px solid #FF6B35',
        boxShadow: '0 0 20px rgba(255, 107, 53, 0.15)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <span className="font-mono text-sm text-orange-400 uppercase tracking-widest">
        {data.label ?? 'YOUR SITE'}
      </span>
      <span className="font-mono text-[9px] text-zinc-600 uppercase">
        {data.sublabel ?? 'Frontend'}
      </span>
    </div>
  );
}

// ─── Custom node: TronDatabaseNode ──────────────────────────────────────────
function TronDatabaseNode({ data }: { data: { label?: string; sublabel?: string } }) {
  return (
    <div
      style={{
        width: 200,
        height: 60,
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f0f 100%)',
        border: '1px solid #1e40af',
        boxShadow: '0 0 20px rgba(30, 64, 175, 0.15)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <span className="font-mono text-sm text-blue-400 uppercase tracking-widest">
        {data.label ?? 'SUPABASE'}
      </span>
      <span className="font-mono text-[9px] text-zinc-600 uppercase">
        {data.sublabel ?? 'Database'}
      </span>
    </div>
  );
}

// ─── Custom node: TronBlockNode ───────────────────────────────────────────────
type BlockStatus = 'pending' | 'active' | 'locked';

function TronBlockNode({
  data,
}: {
  data: { label?: string; icon?: string; status?: BlockStatus; price?: string };
}) {
  const status = data.status ?? 'pending';
  const borderColor =
    status === 'pending'
      ? '#3f3f3f'
      : status === 'active'
        ? '#FF6B35'
        : '#1a1a2e';

  const statusBadge = () => {
    if (status === 'pending') {
      return (
        <>
          <span
            className="shrink-0 rounded-full"
            style={{ width: 6, height: 6, background: '#3f3f3f' }}
          />
          <span className="font-mono text-[9px] text-zinc-600">NOT CONFIGURED</span>
        </>
      );
    }
    if (status === 'active') {
      return (
        <>
          <span
            className="shrink-0 rounded-full animate-pulse"
            style={{ width: 6, height: 6, background: '#FF6B35' }}
          />
          <span className="font-mono text-[9px] text-orange-400">ACTIVE</span>
        </>
      );
    }
    return (
      <>
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: '#1e3a5f' }}
        />
        <span className="font-mono text-[9px] text-blue-900">LOCKED</span>
      </>
    );
  };

  return (
    <div
      style={{
        width: 160,
        height: 80,
        background: '#0f0f0f',
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <div className="flex items-center gap-2">
        <span className="text-lg">{data.icon ?? '▢'}</span>
        <span className="font-mono text-xs text-zinc-300 uppercase tracking-widest truncate">
          {data.label ?? 'Block'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">{statusBadge()}</div>
        <span className="font-mono text-[10px] text-zinc-500 ml-auto">{data.price ?? ''}</span>
      </div>
    </div>
  );
}

// ─── Node types map ────────────────────────────────────────────────────────
const nodeTypes: NodeTypes = {
  site: TronSiteNode,
  database: TronDatabaseNode,
  block: TronBlockNode,
};

// ─── Initial nodes (hardcoded MVP) ───────────────────────────────────────────
const initialNodes: Node[] = [
  {
    id: 'site',
    type: 'site',
    position: { x: 350, y: 50 },
    data: { label: 'YOUR SITE', sublabel: 'Frontend' },
    draggable: false,
  },
  {
    id: 'database',
    type: 'database',
    position: { x: 350, y: 500 },
    data: { label: 'SUPABASE', sublabel: 'Database' },
    draggable: false,
  },
  {
    id: 'block-1',
    type: 'block',
    position: { x: 100, y: 270 },
    data: {
      label: 'USER AUTH',
      icon: '🔐',
      status: 'pending',
      price: '$40',
    },
  },
  {
    id: 'block-2',
    type: 'block',
    position: { x: 350, y: 270 },
    data: {
      label: 'CONTACT FORM',
      icon: '📋',
      status: 'active',
      price: '$25',
    },
  },
  {
    id: 'block-3',
    type: 'block',
    position: { x: 600, y: 270 },
    data: {
      label: 'STRIPE',
      icon: '💳',
      status: 'locked',
      price: '$80',
    },
  },
];

// ─── Initial edges ───────────────────────────────────────────────────────────
const initialEdges: Edge[] = [
  { id: 'e-site-1', source: 'site', target: 'block-1', type: 'smoothstep', animated: true, style: { stroke: '#FF6B35', strokeWidth: 1, opacity: 0.4 } },
  { id: 'e-site-2', source: 'site', target: 'block-2', type: 'smoothstep', animated: true, style: { stroke: '#FF6B35', strokeWidth: 1, opacity: 0.4 } },
  { id: 'e-site-3', source: 'site', target: 'block-3', type: 'smoothstep', animated: true, style: { stroke: '#FF6B35', strokeWidth: 1, opacity: 0.4 } },
  { id: 'e-1-db', source: 'block-1', target: 'database', type: 'smoothstep', animated: true, style: { stroke: '#1e40af', strokeWidth: 1, opacity: 0.3 } },
  { id: 'e-2-db', source: 'block-2', target: 'database', type: 'smoothstep', animated: true, style: { stroke: '#1e40af', strokeWidth: 1, opacity: 0.3 } },
  { id: 'e-3-db', source: 'block-3', target: 'database', type: 'smoothstep', animated: true, style: { stroke: '#1e40af', strokeWidth: 1, opacity: 0.3 } },
];

// ─── Backend blocks list (hardcoded MVP) ─────────────────────────────────────
const BACKEND_BLOCKS = [
  { icon: '🔐', name: 'User Auth', price: '$40' },
  { icon: '📋', name: 'Contact Form', price: '$25' },
  { icon: '💳', name: 'Stripe', price: '$80' },
  { icon: '🛒', name: 'Shopping Cart', price: '$40' },
  { icon: '📊', name: 'Analytics', price: '$30' },
];

// ─── BackendCanvas component ──────────────────────────────────────────────────
export function BackendCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'smoothstep', animated: true }),
    []
  );

  return (
    <div className="h-full w-full flex relative" style={{ background: '#0a0a0a' }}>
      {/* Left panel */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex flex-col"
        style={{
          width: 240,
          background: '#0a0a0a',
          borderRight: '1px solid #1a1a1a',
        }}
      >
        <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest px-4 py-3">
          BACKEND BLOCKS
        </div>
        <div className="flex-1 overflow-y-auto">
          {BACKEND_BLOCKS.map((block, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-zinc-900 transition-colors"
            >
              <span className="text-sm">{block.icon}</span>
              <span className="font-mono text-xs text-zinc-400 flex-1">{block.name}</span>
              <span className="font-mono text-[10px] text-zinc-600">{block.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ReactFlow canvas */}
      <div
        className="flex-1"
        style={{ marginLeft: 240, background: '#0a0a0a' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1a1a1a"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
