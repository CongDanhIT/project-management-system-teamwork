'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, Paperclip, Smile, X, FileText } from 'lucide-react';
import { Announcement, Attachment } from '@/services/announcement.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import uploadService from '@/services/upload.service';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ImagePlus } from 'lucide-react';

interface FeedEditModalProps {
  announcement: Announcement;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { title?: string; content?: string; attachments?: Attachment[] }) => void;
  isLoading: boolean;
}

export function FeedEditModal({ announcement, isOpen, onClose, onUpdate, isLoading }: FeedEditModalProps) {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [formData, setFormData] = useState({ 
    title: announcement.title || '', 
    content: announcement.content || '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>(announcement.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { data: workspaceTags } = useQuery({
    queryKey: ['workspaceTags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId as string, 'TASK'),
    enabled: !!workspaceId && isOpen
  });

  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return;
    
    if (!url.startsWith('http')) {
       toast.error('Địa chỉ ảnh không hợp lệ!');
       return;
    }

    const newAttachment: Attachment = {
      fileUrl: url,
      fileName: 'Ảnh từ địa chỉ URL',
      fileType: 'IMAGE'
    };

    setAttachments(prev => [...prev, newAttachment]);
    toast.success('Đã thêm ảnh từ địa chỉ!');
  };

  // Sync state when open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
      });
      setAttachments(announcement.attachments || []);
    }
  }, [isOpen, announcement]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.content]);

  const insertToContent = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;

    const newContent = 
      currentContent.substring(0, start) + 
      textToInsert + 
      currentContent.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setFormData({ ...formData, content: value });

    const textBeforeCursor = value.substring(0, selectionStart);
    const words = textBeforeCursor.split(/[\s\n]/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('#')) {
      setShowTagSuggestions(true);
      setTagSearch(lastWord.substring(1));
    } else {
      setShowTagSuggestions(false);
    }
  };

  const selectTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const content = formData.content;
    const textBeforeCursor = content.substring(0, selectionStart);
    const hashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (hashIndex !== -1) {
      const newContent = 
        content.substring(0, hashIndex) + 
        `#${tagName} ` + 
        content.substring(selectionStart);
      
      setFormData(prev => ({ ...prev, content: newContent }));
      setShowTagSuggestions(false);
      
      setTimeout(() => {
        textarea.focus();
        const newPos = hashIndex + tagName.length + 2;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const result = await uploadService.uploadImage(file);
      setAttachments(prev => [...prev, result]);
      toast.success(`Đã thêm ảnh: ${file.name}`);
    } catch (error) {
      toast.error('Không thể upload ảnh.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast.error('File quá lớn! Giới hạn tối đa là 30MB.');
      return;
    }
    
    try {
      setIsUploading(true);
      const result = await uploadService.uploadDocToR2(file);
      setAttachments(prev => [...prev, result]);
      toast.success(`Đã thêm tài liệu: ${file.name}`);
    } catch (error) {
      toast.error('Không thể upload tài liệu.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.content.trim() && attachments.length === 0) return;
    onUpdate({ ...formData, attachments });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[32px] p-0 bg-white dark:bg-surface-secondary border-none">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Chỉnh sửa bản tin</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <input 
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Tiêu đề thảo luận..."
            className="w-full bg-transparent border-none outline-none text-[18px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Viết nội dung thay đổi..."
              className="w-full bg-transparent border-none outline-none resize-none text-[15px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed min-h-[150px]"
            />

            {/* Tag Suggestions Overlay */}
            {showTagSuggestions && workspaceTags && workspaceTags.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-surface-secondary rounded-2xl shadow-2xl border border-divider overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-2 max-h-[200px] overflow-y-auto no-scrollbar">
                  {workspaceTags
                    .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map(tag => (
                      <button
                        key={tag._id}
                        onClick={() => selectTag(tag.name)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                          #{tag.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
             <div className="flex gap-4 overflow-x-auto hidden-scrollbar py-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-surface-tertiary border border-divider group">
                    {att.fileType === 'IMAGE' ? (
                       <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                    ) : (
                       <div className="flex flex-col items-center justify-center w-full h-full text-[10px] font-bold text-slate-500 p-1 text-center bg-slate-50 dark:bg-surface-tertiary">
                         <FileText className="w-4 h-4 mb-1 text-slate-400" />
                         <span className="line-clamp-2">{att.fileName}</span>
                       </div>
                    )}
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} 
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {isUploading && (
                  <div className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-divider flex items-center justify-center bg-slate-50 dark:bg-surface-tertiary animate-pulse">
                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
             </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 dark:bg-white/5 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <input 
              ref={imageInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Popover>
              <PopoverTrigger className="p-2 rounded-full hover:bg-white dark:hover:bg-surface-tertiary transition-colors text-slate-400 outline-none" title="Đính kèm ảnh">
                <ImageIcon className="w-5 h-5" />
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-80 p-4 rounded-2xl bg-white dark:bg-surface-secondary border-divider shadow-2xl z-50">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dán địa chỉ ảnh</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 rounded-xl border-none bg-slate-100 dark:bg-surface-tertiary text-xs h-10 font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const url = (e.target as HTMLInputElement).value;
                            if (url.trim()) {
                              handleAddImageUrl(url);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleAddImageUrl(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase hover:opacity-90 transition-opacity"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-divider"></span></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-bold"><span className="bg-white dark:bg-surface-secondary px-2 text-slate-400">Hoặc</span></div>
                  </div>

                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-[11px] font-bold text-slate-600 dark:text-slate-300"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Tải ảnh từ máy tính
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Document Upload (Cloudflare R2) */}
            <input 
              ref={docInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              onChange={handleDocUpload}
            />
            <button 
              onClick={() => docInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-white dark:hover:bg-surface-tertiary transition-colors text-slate-400"
              title="Đính kèm tài liệu"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-full hover:bg-white dark:hover:bg-surface-tertiary transition-colors text-slate-400">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-full font-bold">Hủy</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || isUploading || (!formData.content.trim() && attachments.length === 0)}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 rounded-full font-bold shadow-glow-combined"
            >
              Cập nhật
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
