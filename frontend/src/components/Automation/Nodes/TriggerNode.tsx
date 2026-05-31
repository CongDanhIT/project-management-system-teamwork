import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export const TriggerNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => {
  const { updateNodeData, setNodes, setEdges } = useReactFlow();
  
  const onDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[24px] p-5 w-72 border-none shadow-[0_8px_32px_-4px_rgba(59,130,246,0.2)] dark:shadow-[0_8px_32px_-4px_rgba(59,130,246,0.15)] relative group">
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Xóa Node"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500">
          ⚡
        </div>
        <div className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Trigger</div>
      </div>
      <div className="text-sm text-gray-600 space-y-4">
        <div>
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phân loại (Context):</label>
          <select 
            className="w-full bg-slate-100 dark:bg-slate-800/80 border-none rounded-xl text-[13px] text-slate-600 dark:text-slate-400 font-bold p-2.5 focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-default"
            value={data.contextType as string || 'task'}
            onChange={(e) => updateNodeData(id, { contextType: e.target.value })}
          >
            <option value="task">Công việc (Task)</option>
            <option value="project" disabled>Dự án (Sắp ra mắt)</option>
            <option value="member" disabled>Thành viên (Sắp ra mắt)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Khi sự kiện xảy ra:</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-blue-500/50"
            value={data.triggerType as string || 'task_status_changed'}
            onChange={(e) => updateNodeData(id, { triggerType: e.target.value })}
          >
            <option value="task_status_changed">Trạng thái Task thay đổi</option>
            <option value="task_created">Task mới được tạo</option>
          </select>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full"
      />
    </div>
  );
};
