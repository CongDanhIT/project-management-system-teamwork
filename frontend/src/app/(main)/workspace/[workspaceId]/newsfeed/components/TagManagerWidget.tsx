"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Tags, Plus, Check, Trash2, X, Pencil } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
];

export function TagManagerWidget() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['workspaceTags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId),
    enabled: !!workspaceId,
  });

  const [activeTab, setActiveTab] = useState<'TASK' | 'MEMBER'>('TASK');
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [newTagType, setNewTagType] = useState<'TASK' | 'MEMBER'>('TASK');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Filter tags by tab
  const displayedTags = tags.filter((t: any) => t.type === activeTab || (activeTab === 'TASK' && !t.type));
  const availableTaskTags = tags.filter((t: any) => t.type === 'TASK' || !t.type);

  // Sync newTagType with activeTab when not editing
  useEffect(() => {
    if (!editingTagId) {
      setNewTagType(activeTab);
    }
  }, [activeTab, editingTagId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (tag: { name: string; color: string; type: 'TASK' | 'MEMBER'; taskTags?: string[] }) => tagService.createTag(workspaceId, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTags', workspaceId] });
      handleCancelEdit();
      toast.success('Đã tạo Nhãn mới!');
    },
    onError: () => toast.error('Lỗi khi tạo Nhãn'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tag }: { id: string, tag: { name: string; color: string; type: 'TASK' | 'MEMBER'; taskTags?: string[] } }) => tagService.updateTag(workspaceId, id, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTags', workspaceId] });
      handleCancelEdit();
      toast.success('Đã cập nhật Nhãn!');
    },
    onError: () => toast.error('Lỗi cập nhật Nhãn'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagService.deleteTag(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTags', workspaceId] });
      toast.success('Đã xóa Nhãn!');
    },
    onError: () => toast.error('Lỗi khi xóa Nhãn'),
  });

  // Close color picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setNewTagName('');
    setNewTagColor('#3b82f6');
    setNewTagType(activeTab);
    setNewTaskTags([]);
  };

  const handleCreateOrUpdateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    const tagData = { 
      name: newTagName.trim(), 
      color: newTagColor, 
      type: newTagType,
      taskTags: newTagType === 'MEMBER' ? newTaskTags : [] 
    };

    if (editingTagId) {
      updateMutation.mutate({ id: editingTagId, tag: tagData });
    } else {
      createMutation.mutate(tagData);
    }
    setIsColorPickerOpen(false);
  };

  const handleDeleteTag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
    if (editingTagId === id) handleCancelEdit();
  };

  const handleEditClick = (tag: any) => {
    setEditingTagId(tag._id);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagType(tag.type || 'TASK');
    setNewTaskTags(tag.taskTags?.map((t: any) => t._id || t) || []);
    setIsColorPickerOpen(false);
  };

  const toggleTaskTag = (id: string) => {
    setNewTaskTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/10">
          <Tags className="w-5 h-5 text-indigo-500" />
        </div>
        <h3 className="text-[16px] font-extrabold text-slate-800 dark:text-white">Quản lý Nhãn (Tags)</h3>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-surface-tertiary p-1 rounded-xl mb-5">
        <button
          onClick={() => { setActiveTab('TASK'); handleCancelEdit(); }}
          className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'TASK' ? 'bg-white dark:bg-surface-secondary text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Loại Công việc
        </button>
        <button
          onClick={() => { setActiveTab('MEMBER'); handleCancelEdit(); }}
          className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${activeTab === 'MEMBER' ? 'bg-white dark:bg-surface-secondary text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Vai trò / Kỹ năng
        </button>
      </div>

      {/* Form tạo/chỉnh sửa Tag */}
      <form onSubmit={handleCreateOrUpdateTag} className="mb-5 relative">
        <div className="flex items-center gap-2">
          <div className="relative group shrink-0 z-50" ref={colorPickerRef}>
            <div 
              className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: newTagColor }}
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              title="Chọn màu nhãn"
            />

            {isColorPickerOpen && (
              <div className="absolute top-10 -left-2 p-4 bg-white dark:bg-[#1C2128] shadow-2xl rounded-2xl border border-divider w-[240px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <HexColorPicker color={newTagColor} onChange={setNewTagColor} style={{ width: '100%', height: '160px' }} />
                
                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Màu đề xuất</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTagColor(c)}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: c }}
                      >
                        {newTagColor.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-500">HEX</span>
                  <input 
                    type="text" 
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-surface-tertiary border border-divider px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-primary uppercase"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>

          <input 
            type="text" 
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={editingTagId ? "Lưu thay đổi..." : `Tên ${newTagType === 'TASK' ? 'công việc' : 'vai trò'}...`}
            className="flex-1 min-w-0 bg-transparent border-b border-slate-200 dark:border-surface-tertiary focus:border-brand-primary dark:focus:border-brand-primary px-1 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-all"
          />

          {editingTagId ? (
            <div className="flex items-center gap-1 shrink-0">
              <button 
                type="submit"
                disabled={!newTagName.trim() || updateMutation.isPending}
                title="Lưu (Save)"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 disabled:opacity-50 transition-all"
                style={{ opacity: updateMutation.isPending ? 0.5 : 1 }}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={handleCancelEdit}
                title="Huỷ (Cancel)"
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-tertiary hover:text-slate-600 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              type="submit"
              disabled={!newTagName.trim() || createMutation.isPending}
              title="Thêm nhãn (Add)"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-surface-tertiary text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ opacity: createMutation.isPending ? 0.5 : 1 }}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Multi-select for MEMBER tags to map TASK tags */}
        {newTagType === 'MEMBER' && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-surface-tertiary rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-[11px] font-bold text-slate-500 mb-2">Vai trò này làm những công việc gì?</div>
            <div className="flex flex-wrap gap-1.5">
              {availableTaskTags.length > 0 ? availableTaskTags.map((t: any) => {
                const isSelected = newTaskTags.includes(t._id);
                return (
                  <div 
                    key={t._id} 
                    onClick={() => toggleTaskTag(t._id)}
                    className={`cursor-pointer px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      isSelected 
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm' 
                        : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {t.name}
                  </div>
                );
              }) : (
                <div className="text-[10px] text-slate-400 italic">Hãy tạo Nhãn Công việc trước</div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Danh sách Tags */}
      {isLoading ? (
        <p className="text-center text-[12px] text-slate-500 py-4">Đang tải nhãn...</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar p-1">
          {displayedTags.map((tag: any) => (
            <div 
              key={tag._id}
              onClick={() => handleEditClick(tag)}
              className={`group cursor-pointer flex flex-col pl-3 pr-2 py-2 rounded-xl transition-all opacity-90 hover:opacity-100 ${
                editingTagId === tag._id ? 'ring-2 ring-brand-primary shadow-sm scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{ backgroundColor: `${tag.color}1A` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-[13px] font-bold tracking-wide truncate" style={{ color: tag.color }}>
                    {tag.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEditClick(tag); }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-brand-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteTag(tag._id, e)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Show linked taskTags if this is a MEMBER tag */}
              {tag.type === 'MEMBER' && tag.taskTags && tag.taskTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 ml-4">
                  {tag.taskTags.map((tt: any) => (
                    <span key={tt._id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-300">
                      • {tt.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {displayedTags.length === 0 && (
            <p className="text-center text-[12px] text-slate-500 font-medium py-4">
              Chưa có nhãn {activeTab === 'TASK' ? 'Công việc' : 'Vai trò'} nào.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
