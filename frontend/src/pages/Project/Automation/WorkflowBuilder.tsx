import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from '../../../components/Automation/Nodes/TriggerNode';
import { ConditionNode } from '../../../components/Automation/Nodes/ConditionNode';
import { ActionNode } from '../../../components/Automation/Nodes/ActionNode';
import { workflowApi } from '../../../services/workflow.api';

const nodeTypes = {
  trigger_task_status: TriggerNode,
  logic_condition: ConditionNode,
  action_update_task: ActionNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger_task_status',
    data: { triggerType: 'task_status_changed' },
    position: { x: 250, y: 5 },
  },
];

const getId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const WorkflowBuilder = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const params = useParams();
  const projectId = params?.projectId as string;
  const workspaceId = params?.workspaceId as string;
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      workflowApi.getWorkflowsByProject(projectId)
        .then((workflows) => {
          if (workflows && workflows.length > 0) {
            const wf = workflows[0];
            setWorkflowId(wf._id);
            if (wf.nodes && wf.nodes.length > 0) setNodes(wf.nodes);
            if (wf.edges) setEdges(wf.edges);
          }
        })
        .catch(err => console.error("Failed to load workflows:", err));
    }
  }, [projectId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = async () => {
    if (!projectId || !workspaceId) {
      alert("Không tìm thấy thông tin dự án!");
      return;
    }

    try {
      const data = {
        name: 'Automation Workflow',
        projectId: projectId,
        workspaceId: workspaceId,
        isActive: true,
        nodes,
        edges,
      };

      if (workflowId) {
        await workflowApi.updateWorkflow(workflowId, data);
        alert('Đã cập nhật Workflow thành công!');
      } else {
        const newWf = await workflowApi.createWorkflow(data);
        setWorkflowId(newWf._id);
        alert('Đã tạo mới Workflow thành công!');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu Workflow');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#04100E]">
      {/* Sidebar - No borders, just Tonal Shift and Ambient Shadow */}
      <div className="w-72 bg-white/80 dark:bg-[#071613]/80 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,68,66,0.03)] dark:shadow-none z-10 p-6 flex flex-col border-none">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-primary mb-6 transition-colors"
        >
          <span>←</span> Quay lại Dự án
        </button>

        <h2 className="text-[20px] font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Nodes</h2>
        <div className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 font-medium">Kéo thả các node vào màn hình để thiết kế kịch bản tự động</div>
        
        {/* Trigger Node Item */}
        <div 
          className="group relative p-4 mb-4 rounded-2xl cursor-grab font-bold flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-white/5 border-none shadow-[0_8px_20px_rgba(59,130,246,0.08)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(59,130,246,0.15)] text-blue-600 dark:text-blue-400"
          onDragStart={(event) => onDragStart(event, 'trigger_task_status')}
          draggable
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500">
            ⚡
          </div>
          <span className="text-[13px] uppercase tracking-wider">Trigger</span>
        </div>
        
        {/* Condition Node Item */}
        <div 
          className="group relative p-4 mb-4 rounded-2xl cursor-grab font-bold flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-white/5 border-none shadow-[0_8px_20px_rgba(234,179,8,0.08)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(234,179,8,0.15)] text-amber-600 dark:text-amber-400"
          onDragStart={(event) => onDragStart(event, 'logic_condition')}
          draggable
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500">
            ❓
          </div>
          <span className="text-[13px] uppercase tracking-wider">Condition</span>
        </div>
        
        {/* Action Node Item */}
        <div 
          className="group relative p-4 mb-4 rounded-2xl cursor-grab font-bold flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-white/5 border-none shadow-[0_8px_20px_rgba(16,185,129,0.08)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)] text-emerald-600 dark:text-emerald-400"
          onDragStart={(event) => onDragStart(event, 'action_update_task')}
          draggable
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
            ▶️
          </div>
          <span className="text-[13px] uppercase tracking-wider">Action</span>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-br from-brand-primary to-[#004442] text-white text-[13px] font-bold py-3.5 px-6 rounded-full hover:shadow-[0_20px_40px_-10px_rgba(3,93,91,0.4)] transition-all duration-300 hover:-translate-y-0.5 tracking-wider uppercase"
          >
            Lưu Workflow
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Panel position="top-right" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold mb-1">💡 Mẹo thao tác:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li><b>Lăn chuột:</b> Phóng to / Thu nhỏ</li>
                <li><b>Kéo thả nền:</b> Di chuyển vùng nhìn (Pan)</li>
                <li>Không gian vẽ là vô hạn!</li>
              </ul>
            </Panel>
            <Controls position="bottom-left" className="bg-white dark:bg-slate-800 border-none shadow-lg rounded-xl overflow-hidden" />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
