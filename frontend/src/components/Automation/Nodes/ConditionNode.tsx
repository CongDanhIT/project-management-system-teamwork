import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';

export const ConditionNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => {
  const { updateNodeData, setNodes, setEdges } = useReactFlow();

  const onDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[24px] p-5 w-72 border-none shadow-[0_8px_32px_-4px_rgba(234,179,8,0.2)] dark:shadow-[0_8px_32px_-4px_rgba(234,179,8,0.15)] relative group">
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Xóa Node"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full"
      />
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500">
          ❓
        </div>
        <div className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Condition</div>
      </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phân loại (Context):</label>
            <select 
              className="w-full bg-slate-100 dark:bg-slate-800/80 border-none rounded-xl text-[13px] text-slate-600 dark:text-slate-400 font-bold p-2.5 focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-default"
              value={data.contextType as string || 'task'}
              onChange={(e) => updateNodeData(id, { contextType: e.target.value })}
            >
              <option value="task">Công việc (Task)</option>
              <option value="project" disabled>Dự án (Sắp ra mắt)</option>
              <option value="member" disabled>Thành viên (Sắp ra mắt)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trường (Field):</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-amber-500/50"
              value={data.field as string || 'priority'}
              onChange={(e) => updateNodeData(id, { field: e.target.value })}
            >
              <option value="priority">Độ ưu tiên</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Điều kiện:</label>
          <div className="flex gap-2">
            <select 
              className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-amber-500/50"
              value={data.operator as string || 'equals'}
              onChange={(e) => updateNodeData(id, { operator: e.target.value })}
            >
              <option value="equals">Bằng (=)</option>
              <option value="not_equals">Khác (!=)</option>
            </select>
            {data.field === 'priority' ? (
              <select
                className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-amber-500/50"
                value={data.value as string || 'LOW'}
                onChange={(e) => updateNodeData(id, { value: e.target.value })}
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            ) : data.field === 'status' ? (
              <select
                className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-amber-500/50"
                value={data.value as string || 'TODO'}
                onChange={(e) => updateNodeData(id, { value: e.target.value })}
              >
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
              </select>
            ) : (
              <input 
                type="text" 
                className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-[13px] text-slate-700 dark:text-slate-300 font-medium p-2.5 focus:ring-2 focus:ring-amber-500/50"
                placeholder="Giá trị..."
                value={data.value as string || ''}
                onChange={(e) => updateNodeData(id, { value: e.target.value })}
              />
            )}
          </div>
        </div>
      
      {/* Hai handle đầu ra cho True và False */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={isConnectable}
        className="w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
        style={{ left: '30%' }}
      />
      <div className="absolute -bottom-6 left-[28%] text-[10px] uppercase font-black tracking-widest text-emerald-600">True</div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={isConnectable}
        className="w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"
        style={{ left: '70%' }}
      />
      <div className="absolute -bottom-6 left-[68%] text-[10px] uppercase font-black tracking-widest text-red-600">False</div>
    </div>
  );
};
