'use client';

import React, { useEffect, useRef } from 'react';

const AIBackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sidebar width in pixels
    const sidebarWidth = 256; // 16rem = 256px

    // Resize handler to make the canvas responsive
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial setup
    handleResize();
    window.addEventListener('resize', handleResize);

    // Track mouse position
    let mouse = {
      x: undefined as number | undefined,
      y: undefined as number | undefined,
      radius: 150
    };

    // Mouse move event handler
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Mouse leave event handler
    const handleMouseLeave = () => {
      mouse.x = undefined;
      mouse.y = undefined;
    };
    
    window.addEventListener('mouseleave', handleMouseLeave);

    // Neural network nodes
    class Node {
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      color: string;
      velocity: { x: number; y: number };
      connections: Node[];
      pulseSpeed: number;
      pulseOffset: number;
      lastConnectionTime?: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseRadius = Math.random() * 3 + 3;
        this.radius = this.baseRadius;
        const blueVariation = Math.random() * 20 - 10;
        this.color = `rgba(${30 + blueVariation}, ${144 + blueVariation}, ${255 - blueVariation}, 0.7)`;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.05,
          y: (Math.random() - 0.5) * 0.05
        };
        this.connections = [];
        this.pulseSpeed = 0.02 + Math.random() * 0.02;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }
      
      update() {
        // Apply velocity to position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Add a small deceleration to make movement more natural
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        
        // Add some random movement to keep things interesting even without mouse interaction
        // Only apply if velocity becomes too small (particles are nearly stopped)
        if (Math.abs(this.velocity.x) < 0.02 && Math.abs(this.velocity.y) < 0.02) {
          this.velocity.x += (Math.random() - 0.5) * 0.15;
          this.velocity.y += (Math.random() - 0.5) * 0.15;
        }
        
        // Occasionally add a small jitter even to moving particles (1% chance per frame)
        if (Math.random() < 0.01) {
          this.velocity.x += (Math.random() - 0.5) * 0.3;
          this.velocity.y += (Math.random() - 0.5) * 0.3;
        }
        
        // Add forces to keep nodes spread across the canvas
        if (canvas) {
          // Get node position relative to center (0,0 to 1,1)
          const relX = this.x / canvas.width;
          const relY = this.y / canvas.height;
          
          // Create force that pushes nodes away from center and towards edges
          // Stronger when closer to center, weaker when closer to edges
          const centerForceX = (relX - 0.5) * 0.0015;
          const centerForceY = (relY - 0.5) * 0.0015;
          
          this.velocity.x += centerForceX;
          this.velocity.y += centerForceY;
          
          // Add sidebar avoidance force (prevent nodes from moving into the sidebar)
          if (this.x < sidebarWidth + 50) {
            this.velocity.x += 0.05 * (1 - (this.x - sidebarWidth) / 50);
          }
          
          // Add boundary avoidance force (prevent nodes from hitting the edges)
          const edgeMargin = 50;
          if (this.x < sidebarWidth + edgeMargin) {
            this.velocity.x += 0.02 * (1 - (this.x - sidebarWidth) / edgeMargin);
          } else if (this.x > canvas.width - edgeMargin) {
            this.velocity.x -= 0.02 * (1 - (canvas.width - this.x) / edgeMargin);
          }
          
          if (this.y < edgeMargin) {
            this.velocity.y += 0.02 * (1 - this.y / edgeMargin);
          } else if (this.y > canvas.height - edgeMargin) {
            this.velocity.y -= 0.02 * (1 - (canvas.height - this.y) / edgeMargin);
          }
        }
        
        // Bounce off the edges and sidebar
        if (canvas && (this.x + this.radius > canvas.width || this.x - this.radius < sidebarWidth)) {
          this.velocity.x = -this.velocity.x;
          
          // Add a small random component when bouncing to avoid getting stuck
          this.velocity.x += (Math.random() - 0.5) * 0.05;
          this.velocity.y += (Math.random() - 0.5) * 0.05;
          
          // Ensure we're not stuck at the edge or sidebar
          if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
          } else if (this.x - this.radius < sidebarWidth) {
            this.x = sidebarWidth + this.radius;
          }
        }
        
        if (canvas && (this.y + this.radius > canvas.height || this.y - this.radius < 0)) {
          this.velocity.y = -this.velocity.y;
          
          // Add a small random component when bouncing to avoid getting stuck
          this.velocity.x += (Math.random() - 0.5) * 0.05;
          this.velocity.y += (Math.random() - 0.5) * 0.05;
          
          // Ensure we're not stuck at the edge
          if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
          } else if (this.y - this.radius < 0) {
            this.y = this.radius;
          }
        }

        // Update the pulsing effect
        this.radius = this.baseRadius + Math.sin(Date.now() * this.pulseSpeed + this.pulseOffset) * 0.5;

        // Mouse interaction - nodes will be pushed away from mouse cursor
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            // Calculate force direction based on distance
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            
            // The force is stronger the closer the mouse is
            const force = (mouse.radius - distance) / mouse.radius;
            
            // Apply force to velocity with reduced multiplier (changed from 1.5 to 0.6)
            // Further reduce the force to 0.4 to prevent connections from breaking
            const directionX = forceDirectionX * force * 0.4;
            const directionY = forceDirectionY * force * 0.4;
            
            this.velocity.x += directionX;
            this.velocity.y += directionY;
            
            // Limit maximum velocity with reduced max speed
            const maxVel = 1;
            this.velocity.x = Math.min(Math.max(this.velocity.x, -maxVel), maxVel);
            this.velocity.y = Math.min(Math.max(this.velocity.y, -maxVel), maxVel);
          }
        }
        
        // Add a spring-like force to pull connected nodes back together
        // This helps maintain the network structure during mouse interaction
        this.connections.forEach(node => {
          const dx = node.x - this.x;
          const dy = node.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only apply the force if nodes are getting too far apart
          if (distance > 160) {
            const force = (distance - 160) / 500; // Gentle force that increases with distance
            
            this.velocity.x += (dx / distance) * force;
            this.velocity.y += (dy / distance) * force;
          }
        });
      }
      
      draw() {
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      
      // Connect this node to nearby nodes
      connectNodes(nodes: Node[]) {
        // Don't reset connections too aggressively in the first few seconds
        // This creates more stability in the initial view
        const now = Date.now();
        if (!this.lastConnectionTime) {
          this.lastConnectionTime = now;
        }
        const timeSinceStart = now - this.lastConnectionTime;
        const isInitialPhase = timeSinceStart < 3000; // First 3 seconds
        
        // Store original connections to restore them if needed
        const originalConnections = [...this.connections];
        
        // During initial phase, only add connections, don't remove existing ones
        if (!isInitialPhase) {
          this.connections = [];
        }
        
        // Define a max number of connections per node to prevent over-connection
        const maxConnections = 4 + Math.floor(Math.random() * 3); // 4-6 connections max
        const potentialConnections: {node: Node, distance: number}[] = [];
        
        nodes.forEach(node => {
          if (node === this) return;
          
          const distance = Math.hypot(this.x - node.x, this.y - node.y);
          const wasConnected = originalConnections.includes(node);
          
          // Calculate connection probability based on distance
          // Use a smaller threshold to create multiple smaller clusters
          if ((wasConnected && distance < 220) || distance < 150) {
            potentialConnections.push({node, distance});
          }
        });
        
        // Sort by distance (closest first)
        potentialConnections.sort((a, b) => a.distance - b.distance);
        
        // Take the closest nodes up to maxConnections
        const closestNodes = potentialConnections.slice(0, maxConnections);
        
        // Add to connections
        closestNodes.forEach(connection => {
          if (!this.connections.includes(connection.node)) {
            this.connections.push(connection.node);
          }
        });
      }
      
      drawConnections() {
        if (!ctx) return;
        
        this.connections.forEach(node => {
          // Skip drawing connections that cross the sidebar
          if (this.x < sidebarWidth && node.x < sidebarWidth) {
            return;
          }
          
          const distance = Math.hypot(this.x - node.x, this.y - node.y);
          const opacity = 1 - distance / (distance > 150 ? 250 : 150);
          
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(node.x, node.y);
          
          // Use a different color for extended connections (ones that would normally disconnect)
          if (distance > 150) {
            ctx.strokeStyle = `rgba(100, 180, 255, ${opacity * 0.4})`;
          } else {
            ctx.strokeStyle = `rgba(30, 144, 255, ${opacity * 0.4})`;
          }
          
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });
      }
    }

    // Create nodes and data packets
    const nodeCount = Math.floor(canvas.width * canvas.height / 10000);
    const nodes: Node[] = [];
    const dataPackets: { x: number; y: number; targetX: number; targetY: number; speed: number; size: number; alpha: number; }[] = [];
    
    // Create nodes with better distribution across the entire canvas
    // Instead of purely random positioning, use a grid-based approach with some randomness
    const gridCols = Math.ceil(Math.sqrt(nodeCount * canvas.width / canvas.height));
    const gridRows = Math.ceil(nodeCount / gridCols);
    
    const cellWidth = canvas.width / gridCols;
    const cellHeight = canvas.height / gridRows;
    
    // Create structured patterns for initial node placement
    // This creates a more organized initial state
    const createInitialNetwork = () => {
      // Create a balanced network with structured pattern clusters
      const clusters = 6; // Number of initial clusters
      const nodesPerCluster = Math.floor(nodeCount / clusters);
      
      // Create clusters at different strategic positions
      for (let c = 0; c < clusters; c++) {
        // Calculate cluster center position
        let centerX, centerY;
        
        // Place clusters at visually balanced positions
        if (c === 0) {
          // Top left (adjusted to be right of sidebar)
          centerX = Math.max(canvas.width * 0.25, sidebarWidth + 100);
          centerY = canvas.height * 0.25;
        } else if (c === 1) {
          // Top right
          centerX = canvas.width * 0.75;
          centerY = canvas.height * 0.25;
        } else if (c === 2) {
          // Center left (adjusted to be right of sidebar)
          centerX = Math.max(canvas.width * 0.25, sidebarWidth + 100);
          centerY = canvas.height * 0.5;
        } else if (c === 3) {
          // Center right
          centerX = canvas.width * 0.75;
          centerY = canvas.height * 0.5;
        } else if (c === 4) {
          // Bottom left (adjusted to be right of sidebar)
          centerX = Math.max(canvas.width * 0.25, sidebarWidth + 100);
          centerY = canvas.height * 0.75;
        } else {
          // Bottom right
          centerX = canvas.width * 0.75;
          centerY = canvas.height * 0.75;
        }
        
        // Create nodes in a circular pattern around the cluster center
        for (let i = 0; i < nodesPerCluster; i++) {
          // Calculate position in a circular/spiral pattern
          const angle = (i / nodesPerCluster) * Math.PI * 2;
          const radius = 50 + (i % 5) * 30; // Create concentric circles
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Ensure node is within canvas bounds and not in sidebar
          const boundedX = Math.min(Math.max(x, sidebarWidth + 20), canvas.width - 20);
          const boundedY = Math.min(Math.max(y, 20), canvas.height - 20);
          
          nodes.push(new Node(boundedX, boundedY));
        }
      }
      
      // Add remaining nodes randomly but within a reasonable distribution
      const remainingNodes = nodeCount - nodes.length;
      if (remainingNodes > 0) {
        for (let i = 0; i < remainingNodes; i++) {
          // Use a modified grid-based approach for the remaining nodes
          const col = Math.floor(Math.random() * gridCols);
          const row = Math.floor(Math.random() * gridRows);
          
          const baseX = col * cellWidth;
          const baseY = row * cellHeight;
          
          // Ensure nodes are not placed in the sidebar area
          const randX = Math.max(baseX + cellWidth * 0.3 + Math.random() * cellWidth * 0.4, sidebarWidth + 20);
          const randY = baseY + cellHeight * 0.3 + Math.random() * cellHeight * 0.4;
          
          nodes.push(new Node(randX, randY));
        }
      }
    };
    
    // Initialize the network with an organized pattern
    createInitialNetwork();
    
    // Create pre-connected pairs to establish initial connections that look good
    const establishInitialConnections = () => {
      // Connect nodes within the same cluster and occasionally between clusters
      nodes.forEach((node, index) => {
        // For each node, connect to 2-4 nearest nodes
        const nearestNodes = nodes
          .filter(n => n !== node)
          .map(n => ({ node: n, distance: Math.hypot(node.x - n.x, node.y - n.y) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2 + Math.floor(Math.random() * 3));
        
        // Pre-establish connections for faster rendering of a nice network
        nearestNodes.forEach(({ node: nearNode }) => {
          if (!node.connections.includes(nearNode)) {
            node.connections.push(nearNode);
          }
        });
      });
    };
    
    // Establish initial connections before animation starts
    establishInitialConnections();

    // Periodically add random movement to all nodes
    const randomMovementInterval = setInterval(() => {
      nodes.forEach(node => {
        // 30% chance to change direction for each node
        if (Math.random() < 0.3) {
          node.velocity.x += (Math.random() - 0.5) * 0.4;
          node.velocity.y += (Math.random() - 0.5) * 0.4;
          
          // Ensure velocity doesn't exceed maximum
          const maxVel = 0.7;
          node.velocity.x = Math.min(Math.max(node.velocity.x, -maxVel), maxVel);
          node.velocity.y = Math.min(Math.max(node.velocity.y, -maxVel), maxVel);
        }
      });
    }, 2000); // Every 2 seconds

    // Create a new data packet
    const createDataPacket = (startNode: Node, endNode: Node) => {
      const speed = 0.4 + Math.random() * 0.6; // Increased from 0.25-0.75 to 0.4-1.0
      const size = 1 + Math.random();
      dataPackets.push({
        x: startNode.x,
        y: startNode.y,
        targetX: endNode.x,
        targetY: endNode.y,
        speed,
        size,
        alpha: 0.7 + Math.random() * 0.3
      });
    };

    // Update data packets
    const updateDataPackets = () => {
      for (let i = dataPackets.length - 1; i >= 0; i--) {
        const packet = dataPackets[i];
        
        // Calculate direction vector
        const dx = packet.targetX - packet.x;
        const dy = packet.targetY - packet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If packet has reached target, remove it
        if (distance < 5) {
          dataPackets.splice(i, 1);
          continue;
        }
        
        // Move packet along the connection line
        packet.x += (dx / distance) * packet.speed;
        packet.y += (dy / distance) * packet.speed;
      }
    };

    // Draw data packets
    const drawDataPackets = () => {
      if (!ctx) return;
      
      dataPackets.forEach(packet => {
        // Don't draw packets that are in the sidebar area
        if (packet.x < sidebarWidth) return;
        
        ctx.beginPath();
        ctx.arc(packet.x, packet.y, packet.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 191, 255, ${packet.alpha})`;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = 'rgba(0, 191, 255, 0.6)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    // Periodically create new data packets
    const packetInterval = setInterval(() => {
      if (nodes.length > 1) {
        // Generate multiple packets per interval to ensure activity across the canvas
        for (let i = 0; i < 3; i++) {
          const startNodeIndex = Math.floor(Math.random() * nodes.length);
          const startNode = nodes[startNodeIndex];
          
          // Find a connected node to send a packet to
          if (startNode.connections.length > 0) {
            const endNode = startNode.connections[Math.floor(Math.random() * startNode.connections.length)];
            createDataPacket(startNode, endNode);
          }
        }
      }
    }, 300);  // Increased interval from 200ms to 300ms to reduce packet frequency

    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply clipping to exclude sidebar area
      ctx.save();
      ctx.beginPath();
      ctx.rect(sidebarWidth, 0, canvas.width - sidebarWidth, canvas.height);
      ctx.clip();
      
      // Update and draw nodes
      nodes.forEach(node => {
        node.update();
        node.connectNodes(nodes);
        node.draw();
        node.drawConnections();
      });
      
      // Update and draw data packets
      updateDataPackets();
      drawDataPackets();
      
      ctx.restore();
      
      requestAnimationFrame(animate);
    };
    
    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(packetInterval);
      clearInterval(randomMovementInterval);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.35 }}
    />
  );
};

export default AIBackgroundAnimation; 