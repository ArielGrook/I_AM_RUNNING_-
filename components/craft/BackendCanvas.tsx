'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  getSmoothStepPath,
  BaseEdge,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── Global CSS keyframes ──────────────────────────────────────────────────────
const TRON_STYLES = `
@keyframes iso-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
@keyframes tron-glow-orange {
  0%, 100% { box-shadow: 0 0 8px rgba(255,107,53,0.3), 0 0 20px rgba(255,107,53,0.1); }
  50%       { box-shadow: 0 0 20px rgba(255,107,53,0.7), 0 0 50px rgba(255,107,53,0.25); }
}
@keyframes tron-glow-blue {
  0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.1); }
  50%       { box-shadow: 0 0 20px rgba(59,130,246,0.7), 0 0 50px rgba(59,130,246,0.25); }
}
@keyframes tron-pulse {
  0%, 100% { opacity: 1;   transform: scale(1);   box-shadow: 0 0 4px currentColor; }
  50%       { opacity: 0.5; transform: scale(1.5); box-shadow: 0 0 10px currentColor; }
}
`;

// ─── IsoBlock — reusable 3D isometric block ────────────────────────────────────
// The 3D transform is applied ONLY to the visual interior.
// ReactFlow Handles must be placed outside, on the flat parent wrapper.
interface IsoBlockProps {
  faceW: number;
  faceH: number;
  depth: number;
  topBg: string;
  topBorder: string;
  topGlow?: string;
  frontBg: string;
  rightBg: string;
  floatDelay?: string;
  children?: React.ReactNode;
}

function IsoBlock({
  faceW,
  faceH,
  depth,
  topBg,
  topBorder,
  topGlow,
  frontBg,
  rightBg,
  floatDelay = '0s',
  children,
}: IsoBlockProps) {
  return (
    <div style={{ animation: `iso-float 4s ease-in-out ${floatDelay} infinite` }}>
      {/* perspective container — flat, no 3d */}
      <div style={{ perspective: '700px' }}>
        {/* 3D rotation root */}
        <div
          style={{
            width: faceW,
            height: faceH,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(25deg) rotateY(-18deg)',
          }}
        >
          {/* ── Top face (content lives here) ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: topBg,
              border: `1px solid ${topBorder}`,
              boxShadow: topGlow ?? `inset 0 0 20px ${topBorder}20`,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>

          {/* ── Front / bottom extrusion ── */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: faceH,
              width: faceW,
              height: depth,
              background: frontBg,
              borderLeft: `1px solid ${topBorder}25`,
              borderRight: `1px solid ${topBorder}25`,
              borderBottom: `1px solid ${topBorder}10`,
              transformOrigin: 'top center',
              transform: 'rotateX(90deg)',
            }}
          />

          {/* ── Right extrusion ── */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: faceW,
              width: depth,
              height: faceH,
              background: rightBg,
              borderTop: `1px solid ${topBorder}15`,
              borderRight: `1px solid ${topBorder}10`,
              borderBottom: `1px solid ${topBorder}08`,
              transformOrigin: 'left center',
              transform: 'rotateY(-90deg)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── AnimatedTronEdge (unchanged from previous version) ───────────────────────
function AnimatedTronEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color: string = (data as { color?: string } | undefined)?.color ?? '#FF6B35';

  return (
    <>
      <path id={`edge-path-${id}`} d={edgePath} fill="none" stroke="none" />
      <BaseEdge path={edgePath} style={{ stroke: color, strokeWidth: 1, opacity: 0.2 }} />
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.45}
        style={{ filter: `drop-shadow(0 0 3px ${color})`, pointerEvents: 'none' }}
      />
      {([0, 1, 2] as const).map((i) => (
        <circle
          key={i}
          r={2.5}
          fill={color}
          style={{ filter: `drop-shadow(0 0 5px ${color})`, opacity: 0.9 }}
        >
          <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${i * 0.83}s`} path={edgePath} />
        </circle>
      ))}
    </>
  );
}

// ─── TronSiteNode ──────────────────────────────────────────────────────────────
function TronSiteNode({ data }: { data: { label?: string; sublabel?: string } }) {
  return (
    // Outer flat wrapper — ReactFlow drag + Handle live here
    <div
      style={{
        width: 190,
        height: 130,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{TRON_STYLES}</style>

      <IsoBlock
        faceW={160}
        faceH={90}
        depth={35}
        topBg="linear-gradient(135deg, #1a0800 0%, #0f0f0f 100%)"
        topBorder="#FF6B35"
        topGlow="inset 0 0 30px rgba(255,107,53,0.12), 0 0 22px rgba(255,107,53,0.45)"
        frontBg="#0a0700"
        rightBg="#080500"
        floatDelay="0s"
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono text-xs text-orange-400 uppercase tracking-widest">
              {data.label ?? 'YOUR SITE'}
            </span>
            {/* Online indicator */}
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#FF6B35',
                boxShadow: '0 0 8px #FF6B35',
                flexShrink: 0,
                animation: 'tron-pulse 2s ease-in-out infinite',
              }}
            />
          </div>
          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-wider">
            {data.sublabel ?? 'FRONTEND'}
          </span>
        </div>
      </IsoBlock>

      {/* Handle outside 3D transform */}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// ─── TronDatabaseNode ──────────────────────────────────────────────────────────
function TronDatabaseNode({ data }: { data: { label?: string; sublabel?: string } }) {
  return (
    <div
      style={{
        width: 170,
        height: 115,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{TRON_STYLES}</style>

      <IsoBlock
        faceW={140}
        faceH={80}
        depth={22}
        topBg="linear-gradient(135deg, #00001a 0%, #0f0f0f 100%)"
        topBorder="#1e40af"
        topGlow="inset 0 0 30px rgba(30,64,175,0.12), 0 0 22px rgba(59,130,246,0.35)"
        frontBg="#06060e"
        rightBg="#04040c"
        floatDelay="2s"
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono text-xs text-blue-400 uppercase tracking-widest">
              {data.label ?? 'SUPABASE'}
            </span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#3b82f6',
                boxShadow: '0 0 8px #3b82f6',
                flexShrink: 0,
              }}
            />
          </div>
          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-wider">
            {data.sublabel ?? 'DATABASE'}
          </span>
        </div>
      </IsoBlock>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
}

// ─── TronBlockNode ─────────────────────────────────────────────────────────────
type BlockStatus = 'pending' | 'active' | 'locked';

function TronBlockNode({
  data,
}: {
  data: { label?: string; icon?: string; status?: BlockStatus; price?: string };
}) {
  const status = data.status ?? 'pending';

  const topBorder =
    status === 'pending' ? '#2a2a2a' : status === 'active' ? '#FF6B35' : '#1e3a5f';

  const topBg =
    status === 'active'
      ? 'linear-gradient(135deg, #100800 0%, #0f0f0f 100%)'
      : status === 'locked'
        ? 'linear-gradient(135deg, #080818 0%, #0f0f0f 100%)'
        : '#0f0f0f';

  const topGlow =
    status === 'active'
      ? 'inset 0 0 20px rgba(255,107,53,0.1)'
      : status === 'locked'
        ? 'inset 0 0 20px rgba(30,64,175,0.06)'
        : 'none';

  const frontBg = status === 'active' ? '#0a0600' : '#090909';
  const rightBg = status === 'active' ? '#080500' : '#070707';

  const statusBadge = () => {
    if (status === 'pending')
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#2a2a2a',
              flexShrink: 0,
            }}
          />
          <span className="font-mono text-[8px] text-zinc-600">NOT CONFIGURED</span>
        </div>
      );
    if (status === 'active')
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#FF6B35',
              boxShadow: '0 0 6px #FF6B35',
              flexShrink: 0,
              animation: 'tron-pulse 1.5s ease-in-out infinite',
            }}
          />
          <span className="font-mono text-[8px] text-orange-400">ACTIVE</span>
        </div>
      );
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#1e3a5f',
            flexShrink: 0,
          }}
        />
        <span className="font-mono text-[8px] text-blue-800">LOCKED</span>
      </div>
    );
  };

  return (
    <div
      style={{
        width: 155,
        height: 115,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{TRON_STYLES}</style>

      <IsoBlock
        faceW={120}
        faceH={80}
        depth={25}
        topBg={topBg}
        topBorder={topBorder}
        topGlow={topGlow}
        frontBg={frontBg}
        rightBg={rightBg}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{data.icon ?? '▢'}</span>
            <span
              className="font-mono text-[9px] text-zinc-300 uppercase tracking-wider"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {data.label ?? 'Block'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {statusBadge()}
            <span className="font-mono text-[9px] text-zinc-600">{data.price ?? ''}</span>
          </div>
        </div>
      </IsoBlock>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// ─── Node & edge type maps ─────────────────────────────────────────────────────
const nodeTypes: NodeTypes = {
  site: TronSiteNode,
  database: TronDatabaseNode,
  block: TronBlockNode,
};

const edgeTypes: EdgeTypes = {
  animatedTron: AnimatedTronEdge,
};

// ─── Initial nodes ─────────────────────────────────────────────────────────────
const initialNodes: Node[] = [
  {
    id: 'site',
    type: 'site',
    position: { x: 300, y: 30 },
    data: { label: 'YOUR SITE', sublabel: 'Frontend' },
    draggable: false,
  },
  {
    id: 'database',
    type: 'database',
    position: { x: 300, y: 470 },
    data: { label: 'SUPABASE', sublabel: 'Database' },
    draggable: false,
  },
  {
    id: 'block-1',
    type: 'block',
    position: { x: 80, y: 250 },
    data: { label: 'USER AUTH', icon: '🔐', status: 'pending', price: '$40' },
  },
  {
    id: 'block-2',
    type: 'block',
    position: { x: 300, y: 250 },
    data: { label: 'CONTACT FORM', icon: '📋', status: 'active', price: '$25' },
  },
  {
    id: 'block-3',
    type: 'block',
    position: { x: 520, y: 250 },
    data: { label: 'STRIPE', icon: '💳', status: 'locked', price: '$80' },
  },
];

// ─── Initial edges ─────────────────────────────────────────────────────────────
const initialEdges: Edge[] = [
  { id: 'e-site-1', source: 'site',    target: 'block-1',  type: 'animatedTron', data: { color: '#FF6B35' } },
  { id: 'e-site-2', source: 'site',    target: 'block-2',  type: 'animatedTron', data: { color: '#FF6B35' } },
  { id: 'e-site-3', source: 'site',    target: 'block-3',  type: 'animatedTron', data: { color: '#FF6B35' } },
  { id: 'e-1-db',   source: 'block-1', target: 'database', type: 'animatedTron', data: { color: '#3b82f6' } },
  { id: 'e-2-db',   source: 'block-2', target: 'database', type: 'animatedTron', data: { color: '#3b82f6' } },
  { id: 'e-3-db',   source: 'block-3', target: 'database', type: 'animatedTron', data: { color: '#3b82f6' } },
];

// ─── Sidebar blocks ────────────────────────────────────────────────────────────
const BACKEND_BLOCKS = [
  { icon: '🔐', name: 'User Auth',     price: '$40' },
  { icon: '📋', name: 'Contact Form',  price: '$25' },
  { icon: '💳', name: 'Stripe',        price: '$80' },
  { icon: '🛒', name: 'Shopping Cart', price: '$40' },
  { icon: '📊', name: 'Analytics',     price: '$30' },
];

// ─── BackendCanvas ─────────────────────────────────────────────────────────────
export function BackendCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const defaultEdgeOptions = useMemo(() => ({ type: 'animatedTron' }), []);

  return (
    <div className="h-full w-full flex relative" style={{ background: '#0a0a0a' }}>
      {/* Left sidebar */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex flex-col"
        style={{ width: 240, background: '#0a0a0a', borderRight: '1px solid #1a1a1a' }}
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
      <div className="flex-1" style={{ marginLeft: 240, background: '#0a0a0a' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={48}
            color="#111111"
            style={{ opacity: 0.5 }}
          />
          <Background
            id="dots-layer"
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e1e1e"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
