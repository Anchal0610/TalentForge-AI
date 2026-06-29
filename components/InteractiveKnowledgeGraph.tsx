'use client';

import React, { useEffect, useState, useRef } from 'react';

interface GraphNode {
  id: string;
  category: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  relationship: string;
  isGap?: boolean;
}

interface InteractiveKnowledgeGraphProps {
  userName: string;
  targetRole: string;
  skills: string[];
  gaps: string[];
  projects: string[];
}

export default function InteractiveKnowledgeGraph({
  userName,
  targetRole,
  skills,
  gaps,
  projects
}: InteractiveKnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const draggedNodeIndex = useRef<number | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User': return '#FF4B4B';       // Neon Red
      case 'Role': return '#00C0F2';       // Neon Blue
      case 'Skill': return '#00F294';      // Neon Green
      case 'Technology': return '#FFAA00'; // Orange
      case 'Resource': return '#D946EF';   // Pink
      case 'Question': return '#A855F7';   // Purple
      case 'Project': return '#EAB308';    // Yellow
      default: return '#E2E8F0';
    }
  };

  const getCategorySize = (category: string) => {
    switch (category) {
      case 'User': return 24;
      case 'Role': return 20;
      case 'Skill': return 15;
      case 'Technology': return 16;
      case 'Project': return 15;
      default: return 12;
    }
  };

  // 1. Build initial nodes and edges lists
  useEffect(() => {
    const width = 700;
    const height = 450;

    const initialNodes: GraphNode[] = [];
    const initialLinks: GraphLink[] = [];

    // Helper to add nodes
    const addNode = (id: string, category: string) => {
      if (initialNodes.some(n => n.id === id)) return;
      initialNodes.push({
        id,
        category,
        x: width / 2 + (Math.random() - 0.5) * 150,
        y: height / 2 + (Math.random() - 0.5) * 150,
        vx: 0,
        vy: 0,
        size: getCategorySize(category),
        color: getCategoryColor(category)
      });
    };

    // Base user and target
    addNode(userName, 'User');
    addNode(targetRole, 'Role');
    initialLinks.push({ source: userName, target: targetRole, relationship: 'aims_for' });

    // Existing skills
    skills.forEach(skill => {
      addNode(skill, 'Skill');
      initialLinks.push({ source: targetRole, target: skill, relationship: 'requires', isGap: false });
    });

    // Gap skills
    gaps.forEach(gap => {
      addNode(gap, 'Skill');
      initialLinks.push({ source: targetRole, target: gap, relationship: 'missing_for', isGap: true });

      // Add resource nodes for gaps
      const resource = `Accelerated ${gap} Guide`;
      addNode(resource, 'Resource');
      initialLinks.push({ source: resource, target: gap, relationship: 'teaches' });

      // Add question nodes for gaps
      const question = `Tests: ${gap}`;
      addNode(question, 'Question');
      initialLinks.push({ source: question, target: gap, relationship: 'tests' });
    });

    // Projects
    projects.forEach(project => {
      addNode(project, 'Project');
      initialLinks.push({ source: userName, target: project, relationship: 'built' });
      if (skills.length > 0) {
        initialLinks.push({ source: project, target: skills[0], relationship: 'implements' });
      }
    });

    setNodes(initialNodes);
    setLinks(initialLinks);
  }, [userName, targetRole, skills, gaps, projects]);

  // 2. Physics Simulation Animation Loop
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationFrameId: number;

    const width = 700;
    const height = 450;
    
    // Physics coefficients
    const kRepel = 2200;      // Node repulsion strength
    const kAttract = 0.04;    // Spring tension coefficient
    const restLength = 90;    // Ideal spring link distance
    const damping = 0.85;      // Friction/air resistance damping
    const gravity = 0.015;    // Force drawing nodes back to center

    const tick = () => {
      setNodes(currentNodes => {
        const nextNodes = currentNodes.map(n => ({ ...n }));

        // A. Apply repulsion forces between all node pairs
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];

            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            
            if (dist < 300) {
              const force = kRepel / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Apply push
              if (draggedNodeIndex.current !== i) {
                n1.vx += fx;
                n1.vy += fy;
              }
              if (draggedNodeIndex.current !== j) {
                n2.vx -= fx;
                n2.vy -= fy;
              }
            }
          }
        }

        // B. Apply attraction forces along links
        links.forEach(link => {
          const sourceIdx = nextNodes.findIndex(n => n.id === link.source);
          const targetIdx = nextNodes.findIndex(n => n.id === link.target);

          if (sourceIdx !== -1 && targetIdx !== -1) {
            const source = nextNodes[sourceIdx];
            const target = nextNodes[targetIdx];

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;

            const force = kAttract * (dist - restLength);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNodeIndex.current !== sourceIdx) {
              source.vx += fx;
              source.vy += fy;
            }
            if (draggedNodeIndex.current !== targetIdx) {
              target.vx -= fx;
              target.vy -= fy;
            }
          }
        });

        // C. Update positions, apply center gravity and bounds
        nextNodes.forEach((node, idx) => {
          if (draggedNodeIndex.current === idx) return; // Skip updating currently dragged node

          // Center gravity pull
          node.vx += (width / 2 - node.x) * gravity;
          node.vy += (height / 2 - node.y) * gravity;

          // Apply velocity & damping
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= damping;
          node.vy *= damping;

          // Constrain inside bounds
          node.x = Math.max(node.size, Math.min(width - node.size, node.x));
          node.y = Math.max(node.size, Math.min(height - node.size, node.y));
        });

        return nextNodes;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [links, nodes.length]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    let foundIdx = -1;
    let minDistance = 25;

    nodes.forEach((node, idx) => {
      const dist = Math.sqrt((node.x - x) * (node.x - x) + (node.y - y) * (node.y - y));
      if (dist < minDistance) {
        minDistance = dist;
        foundIdx = idx;
      }
    });

    if (foundIdx !== -1) {
      draggedNodeIndex.current = foundIdx;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNodeIndex.current !== null) {
      const idx = draggedNodeIndex.current;
      setNodes(prev => {
        const next = [...prev];
        next[idx].x = x;
        next[idx].y = y;
        next[idx].vx = 0;
        next[idx].vy = 0;
        return next;
      });
    }

    // Hover check
    let hoverHit: GraphNode | null = null;
    nodes.forEach(node => {
      const dist = Math.sqrt((node.x - x) * (node.x - x) + (node.y - y) * (node.y - y));
      if (dist < node.size + 4) {
        hoverHit = node;
      }
    });
    setHoveredNode(hoverHit);
  };

  const handleMouseUp = () => {
    draggedNodeIndex.current = null;
  };

  // Helper to draw link lines
  const getLinkCoordinates = (link: GraphLink) => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);
    if (!sourceNode || !targetNode) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    return {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y
    };
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        width="100%"
        height="450px"
        viewBox="0 0 700 450"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          background: 'rgba(10, 15, 30, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          display: 'block'
        }}
      >
        {/* Draw Link Lines */}
        {links.map((link, idx) => {
          const coords = getLinkCoordinates(link);
          const color = link.isGap === undefined 
            ? '#4A5568' 
            : link.isGap 
              ? '#FF3E3E' // Neon Red for gaps
              : '#00F294'; // Neon Green for acquired skills
          
          return (
            <line
              key={idx}
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke={color}
              strokeWidth={link.isGap ? 1.5 : 1}
              strokeDasharray={link.relationship === 'aims_for' ? '5,5' : '0'}
              opacity={0.8}
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node, idx) => (
          <g key={node.id} style={{ cursor: 'pointer' }}>
            {/* Outer Glow ring */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size + 4}
              fill="none"
              stroke={node.color}
              strokeWidth={1.5}
              opacity={hoveredNode?.id === node.id ? 0.6 : 0.15}
              style={{ transition: 'opacity 0.2s' }}
            />
            {/* Core Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              opacity={0.9}
            />
            {/* Text Label */}
            <text
              x={node.x}
              y={node.y - (node.size + 8)}
              fill="#E2E8F0"
              fontSize={node.category === 'User' || node.category === 'Role' ? '10px' : '8px'}
              fontWeight={node.category === 'User' || node.category === 'Role' ? 'bold' : 'normal'}
              textAnchor="middle"
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {node.id.split(' Guides: ').pop()?.split('Tests: ').pop() || node.id}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${hoveredNode.color}`,
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          color: '#E2E8F0',
          fontFamily: 'Inter',
          fontSize: '11px',
          pointerEvents: 'none',
          zIndex: 10,
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#FFF', marginBottom: '2px' }}>{hoveredNode.id}</div>
          <div>Category: <span style={{ color: hoveredNode.color, fontWeight: 600 }}>{hoveredNode.category}</span></div>
          {hoveredNode.category === 'Resource' && (
            <div style={{ color: '#94A3B8', marginTop: '4px' }}>Recommended guide course material to close missing technical competency skill gap.</div>
          )}
          {hoveredNode.category === 'Question' && (
            <div style={{ color: '#94A3B8', marginTop: '4px' }}>Interactive evaluation tests to measure capabilities.</div>
          )}
        </div>
      )}
    </div>
  );
}
