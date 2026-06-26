'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ScatterNode {
  label: string;
  category: string;
  coords: number[]; // [x, y, z] normalized or raw
}

interface Interactive3DScatterProps {
  labels: string[];
  categories: string[];
  embeddings: number[][]; // 1024-dim vectors
}

export default function Interactive3DScatter({
  labels,
  categories,
  embeddings
}: Interactive3DScatterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<ScatterNode[]>([]);
  const [angleX, setAngleX] = useState<number>(0.2); // Rotation angle around X axis
  const [angleY, setAngleY] = useState<number>(-0.4); // Rotation angle around Y axis
  const [zoom, setZoom] = useState<number>(140);
  const [hoveredNode, setHoveredNode] = useState<ScatterNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Perform a simple dimensionality reduction (PCA-like) on client-side to convert 1024-dim to 3D coords [-1, 1]
  useEffect(() => {
    if (!embeddings || embeddings.length === 0) return;
    
    // For visualization consistency, let's map embeddings to a deterministic 3D projection
    // We compute three distinct projection vectors based on sinusoidal seeds so that similar texts cluster.
    const mapped: ScatterNode[] = labels.map((lbl, idx) => {
      const emb = embeddings[idx] || Array(1024).fill(0);
      
      // Compute 3 dimensions
      let x = 0;
      let y = 0;
      let z = 0;
      
      // Seed projection dimensions using distinct halves of the embedding space
      for (let i = 0; i < emb.length; i++) {
        if (i < 340) x += emb[i] * Math.sin(i);
        else if (i < 680) y += emb[i] * Math.cos(i);
        else z += emb[i] * Math.sin(i * 2);
      }
      
      // Double check scale
      const length = Math.sqrt(x*x + y*y + z*z) || 1;
      return {
        label: lbl,
        category: categories[idx] || 'General',
        coords: [x / length, y / length, z / length]
      };
    });

    setNodes(mapped);
  }, [labels, categories, embeddings]);

  // Color mapper
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'User': return '#FF4B4B';       // Neon Red
      case 'Role': return '#00C0F2';       // Neon Blue
      case 'Skill': return '#00F294';      // Neon Green
      case 'Technology': return '#FFAA00'; // Orange
      case 'Resource': return '#D946EF';   // Pink
      case 'Question': return '#A855F7';   // Purple
      default: return '#E2E8F0';
    }
  };

  // Canvas redraw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset resolution for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw coordinate axis background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      // Grid lines
      ctx.moveTo(centerX + i * 50, 0);
      ctx.lineTo(centerX + i * 50, height);
      ctx.moveTo(0, centerY + i * 50);
      ctx.lineTo(width, centerY + i * 50);
    }
    ctx.stroke();

    if (nodes.length === 0) return;

    // 1. Transform all node coordinates using current angles
    const projectedNodes = nodes.map(node => {
      const [x, y, z] = node.coords;

      // Rotate around Y axis
      let x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
      let z1 = x * Math.sin(angleY) + z * Math.cos(angleY);

      // Rotate around X axis
      let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
      let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

      // Perspective projection values
      const perspective = 3; 
      const scale = perspective / (perspective + z2);
      const screenX = centerX + x1 * scale * zoom;
      const screenY = centerY + y2 * scale * zoom;

      return {
        ...node,
        screenX,
        screenY,
        depth: z2, // Save depth for drawing ordering (painters algorithm)
        scale
      };
    });

    // 2. Sort nodes by depth (draw back nodes first, front nodes last)
    projectedNodes.sort((a, b) => b.depth - a.depth);

    // 3. Draw connection vector between User and Target Role
    const userNode = projectedNodes.find(n => n.category === 'User');
    const roleNode = projectedNodes.find(n => n.category === 'Role');
    if (userNode && roleNode) {
      ctx.strokeStyle = '#F59E0B'; // Proximity color
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(userNode.screenX, userNode.screenY);
      ctx.lineTo(roleNode.screenX, roleNode.screenY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw Proximity Badge near line center
      const midX = (userNode.screenX + roleNode.screenX) / 2;
      const midY = (userNode.screenY + roleNode.screenY) / 2;
      
      // Calculate 3D distance
      const dx = userNode.coords[0] - roleNode.coords[0];
      const dy = userNode.coords[1] - roleNode.coords[1];
      const dz = userNode.coords[2] - roleNode.coords[2];
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(midX - 25, midY - 10, 50, 20);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.strokeRect(midX - 25, midY - 10, 50, 20);
      ctx.fillStyle = '#F59E0B';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${distance.toFixed(2)}`, midX, midY);
    }

    // 4. Draw projected points & text
    projectedNodes.forEach(node => {
      const radius = node.category === 'User' || node.category === 'Role' ? 9 : 5;
      const color = getCategoryColor(node.category);

      // Node Glow effect
      ctx.shadowBlur = node.category === 'User' || node.category === 'Role' ? 12 : 4;
      ctx.shadowColor = color;

      // Draw node circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.screenX, node.screenY, radius * node.scale, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadows for lines and labels
      ctx.shadowBlur = 0;

      // Draw Text Labels
      ctx.fillStyle = '#E2E8F0';
      ctx.font = node.category === 'User' || node.category === 'Role' ? 'bold 11px Inter' : '9px Inter';
      ctx.textAlign = 'center';
      
      // Show short label
      const displayLabel = node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label;
      ctx.fillText(displayLabel, node.screenX, node.screenY - (radius * node.scale + 6));
    });

  }, [nodes, angleX, angleY, zoom]);

  // Handle Dragging / Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      setAngleY(prev => prev + dx * 0.007);
      setAngleX(prev => prev + dy * 0.007);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover detection logic
    if (nodes.length === 0) return;
    
    // Transform coordinates under mouse to find hit
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    let hit: ScatterNode | null = null;
    let minDistance = 15; // Hit tolerance radius

    nodes.forEach(node => {
      const [x, y, z] = node.coords;
      let x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
      let z1 = x * Math.sin(angleY) + z * Math.cos(angleY);
      let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
      let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
      const perspective = 3;
      const scale = perspective / (perspective + z2);
      const screenX = centerX + x1 * scale * zoom;
      const screenY = centerY + y2 * scale * zoom;

      const dist = Math.sqrt((clientX - screenX) * (clientX - screenX) + (clientY - screenY) * (clientY - screenY));
      if (dist < minDistance) {
        minDistance = dist;
        hit = node;
      }
    });

    if (hit) {
      setHoveredNode(hit);
      setHoverPos({ x: clientX, y: clientY });
    } else {
      setHoveredNode(null);
      setHoverPos(null);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(50, Math.min(400, prev - e.deltaY * 0.2)));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', cursor: isDragging.current ? 'grabbing' : 'grab' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '16px', background: 'rgba(10, 15, 30, 0.95)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {hoveredNode && hoverPos && (
        <div style={{
          position: 'absolute',
          left: `${hoverPos.x + 10}px`,
          top: `${hoverPos.y + 10}px`,
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${getCategoryColor(hoveredNode.category)}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          padding: '12px',
          pointerEvents: 'none',
          color: '#E2E8F0',
          fontSize: '11px',
          fontFamily: 'Inter',
          maxWidth: '220px',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 'bold', color: '#FFF', marginBottom: '4px' }}>{hoveredNode.label}</div>
          <div>Category: <span style={{ color: getCategoryColor(hoveredNode.category), fontWeight: 600 }}>{hoveredNode.category}</span></div>
          <div style={{ color: '#94A3B8', marginTop: '4px' }}>
            X: {hoveredNode.coords[0].toFixed(2)}<br />
            Y: {hoveredNode.coords[1].toFixed(2)}<br />
            Z: {hoveredNode.coords[2].toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
