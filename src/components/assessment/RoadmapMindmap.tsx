import { useCallback, useMemo } from 'react';
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { verdictOf, type Analysis, type ChapterMastery, type Verdict } from '../../services/assessment.service';

const VERDICT: Record<Verdict, { label: string; group: string; node: string; dot: string; edge: string }> = {
  gap: {
    label: 'Đang hổng',
    group: 'Cần học lại',
    // Node đặc + viền đậm (kiểu roadmap.sh), không phải viền mảnh nền nhạt.
    node: 'border-burgundy bg-burgundy/85 text-cream',
    dot: 'bg-burgundy',
    edge: 'rgba(99,27,27,.5)',
  },
  shaky: {
    label: 'Chưa chắc',
    group: 'Cần luyện thêm',
    node: 'border-navy/70 bg-gold text-navy',
    dot: 'bg-gold',
    edge: 'rgba(212,180,131,.75)',
  },
  solid: {
    label: 'Đã vững',
    group: 'Đã nắm được',
    node: 'border-forest bg-forest/85 text-cream',
    dot: 'bg-forest',
    edge: 'rgba(61,74,62,.5)',
  },
};

const GROUPS: Verdict[] = ['gap', 'shaky', 'solid'];

// Node trung tâm: môn + lớp.
const RootNode = ({ data }: NodeProps) => (
  <>
    <Handle type="source" position={Position.Right} className="!border-0 !bg-navy/30" />
    <div className="rounded-md border-2 border-navy bg-navy px-6 py-4">
      <p className="font-serif text-lg font-bold text-cream">{String(data.label)}</p>
    </div>
  </>
);

// Node nhóm mức độ — nhãn trên trục, kiểu "Programming Fundamentals" của roadmap.sh.
const GroupNode = ({ data }: NodeProps) => {
  const style = VERDICT[data.verdict as Verdict];
  return (
    <>
      <Handle type="target" position={Position.Left} className="!border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!border-0 !bg-transparent" />
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${style.dot}`} />
        <p className="whitespace-nowrap text-[14px] font-bold text-navy">
          {style.group}
          <span className="ml-1.5 font-medium text-navy">({String(data.count)})</span>
        </p>
      </div>
    </>
  );
};

// Node 1 chương — bấm mở panel bên phải.
const ChapterNode = ({ data }: NodeProps) => {
  const item = data.item as ChapterMastery;
  const style = VERDICT[verdictOf(item)];
  const active = Boolean(data.active);
  return (
    <>
      <Handle type="target" position={Position.Left} className="!border-0 !bg-transparent" />
      <div
        className={`w-64 rounded-md border-2 px-4 py-2.5 text-center transition ${style.node} ${
          active ? 'ring-4 ring-navy/25' : 'hover:brightness-110'
        }`}
      >
        <p className="text-[13.5px] font-semibold leading-snug">{item.chapter}</p>
      </div>
    </>
  );
};

const nodeTypes = { root: RootNode, group: GroupNode, chapter: ChapterNode };

const ROW = 96;
const GROUP_GAP = 52;

/**
 * Mindmap Toán 9 -> nhóm mức độ -> từng chương, vẽ bằng React Flow (pan/zoom, edge bezier).
 * Bấm node chương mở modal gợi ý bài tập cải thiện.
 *
 * KHÔNG hiển thị % thông thạo: đề chỉ vài câu/chương nên phần trăm là con số ảo.
 */
export const RoadmapMindmap = ({
  subjectName,
  gradeName,
  analysis,
  selected,
  onSelect,
}: {
  subjectName: string;
  gradeName?: string | null;
  analysis: Analysis;
  /** Chương đang mở ở panel phải — để tô sáng node tương ứng. */
  selected: ChapterMastery | null;
  onSelect: (chapter: ChapterMastery) => void;
}) => {
  const grouped = useMemo(() => {
    const map = new Map<Verdict, ChapterMastery[]>(GROUPS.map((v) => [v, []]));
    const list = Array.isArray(analysis.chapter_mastery) ? analysis.chapter_mastery : [];
    list.forEach((item) => map.get(verdictOf(item))?.push(item));
    return GROUPS.map((verdict) => ({ verdict, items: map.get(verdict) ?? [] })).filter((g) => g.items.length > 0);
  }, [analysis.chapter_mastery]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const totalRows = grouped.reduce((sum, g) => sum + g.items.length, 0) + (grouped.length - 1) * (GROUP_GAP / ROW);

    nodes.push({
      id: 'root',
      type: 'root',
      // Căn giữa theo chiều dọc của toàn cây.
      position: { x: 0, y: (totalRows * ROW) / 2 - 30 },
      data: { label: `${subjectName}${gradeName ? ` · ${gradeName}` : ''}` },
      draggable: false,
    });

    let y = 0;
    grouped.forEach(({ verdict, items }) => {
      const groupId = `group-${verdict}`;
      const groupY = y + ((items.length - 1) * ROW) / 2;

      nodes.push({
        id: groupId,
        type: 'group',
        position: { x: 320, y: groupY },
        data: { verdict, count: items.length },
        draggable: false,
      });
      edges.push({
        id: `root-${groupId}`,
        source: 'root',
        target: groupId,
        type: 'smoothstep',
        style: { stroke: 'rgba(26,34,56,.45)', strokeWidth: 2 },
      });

      items.forEach((item, i) => {
        const id = `ch-${verdict}-${i}`;
        nodes.push({
          id,
          type: 'chapter',
          position: { x: 600, y: y + i * ROW },
          data: { item, active: selected?.chapter === item.chapter },
          draggable: false,
        });
        edges.push({
          id: `${groupId}-${id}`,
          source: groupId,
          target: id,
          type: 'smoothstep',
          // Nét đứt như roadmap.sh, màu theo nhóm để nhìn ra nhánh nào là nhánh nào.
          style: {
            stroke: VERDICT[verdict].edge,
            strokeWidth: 2,
            strokeDasharray: '2 5',
            strokeLinecap: 'round',
          },
        });
      });

      y += items.length * ROW + GROUP_GAP;
    });

    return { nodes, edges };
  }, [grouped, subjectName, gradeName, selected]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === 'chapter') onSelect(node.data.item as ChapterMastery);
    },
    [onSelect],
  );

  if (!analysis.chapter_mastery.length) {
    return (
      <p className="rounded-xl border border-navy/10 bg-white px-5 py-6 text-center text-[15px] text-navy">
        Bài đánh giá này chưa gắn chương nên chưa dựng được bản đồ kiến thức. Bạn xem phần lộ trình gợi ý bên dưới nhé.
      </p>
    );
  }

  return (
    <>
      <div className="h-[600px] overflow-hidden rounded-2xl border border-navy/10 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          edgesFocusable={false}
        >
          <Background color="rgba(26,34,56,.07)" gap={22} />
          <Controls showInteractive={false} className="!border-navy/10 !bg-white" />
        </ReactFlow>
      </div>
      <p className="mt-2 text-center text-[13px] text-navy">Bấm vào một chương để xem nhận xét và bài tập.</p>
    </>
  );
};
