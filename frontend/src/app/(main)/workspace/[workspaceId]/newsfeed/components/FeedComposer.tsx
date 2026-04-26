import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, Paperclip, Smile, FileText, X, Hash, ImagePlus } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/stores/auth.store';
import EmojiPicker from 'emoji-picker-react';
import uploadService from '@/services/upload.service';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import { Attachment } from '@/services/announcement.service';

interface FeedComposerProps {
  onCreate: (data: { title: string; content: string; type: string; attachments?: Attachment[] }) => void;
  isLoading: boolean;
}

export function FeedComposer({ onCreate, isLoading }: FeedComposerProps) {
  const { user } = useAuthStore();
  const { workspaceId } = useParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'GENERAL' });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { data: workspaceTags } = useQuery({
    queryKey: ['workspaceTags', workspaceId],
    queryFn: () => tagService.getTags(workspaceId as string),
    enabled: !!workspaceId
  });

  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return;
    
    // Simple validation
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
    setIsExpanded(true);
    toast.success('Đã thêm ảnh từ địa chỉ!');
  };

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
    
    // Đặt lại focus và caret position
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

    // Kiểm tra hashtag suggestions
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
    
    // Tìm vị trí của dấu # gần nhất trước con trỏ
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
        const newPos = hashIndex + tagName.length + 2; // +2 cho # và khoẳng trắng
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
      setIsExpanded(true);
      toast.success(`Đã đính kèm ảnh: ${file.name}`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Không thể upload ảnh.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra dung lượng 30MB ở phía client
    if (file.size > 30 * 1024 * 1024) {
      toast.error('File quá lớn! Giới hạn tối đa là 30MB.');
      return;
    }
    
    try {
      setIsUploading(true);
      // Upload trực tiếp lên Cloudflare R2
      const result = await uploadService.uploadDocToR2(file);
      
      setAttachments(prev => [...prev, result]);
      setIsExpanded(true);
      toast.success(`Đã đính kèm tài liệu: ${file.name}`);
    } catch (error) {
      console.error('Doc Upload failed:', error);
      toast.error('Không thể upload tài liệu.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleEmojiSelect = (emoji: string) => {
    insertToContent(emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = () => {
    if (!formData.content.trim() && attachments.length === 0) return;
    onCreate({ ...formData, attachments });
    setFormData({ title: '', content: '', type: 'GENERAL' });
    setAttachments([]);
    setIsExpanded(false);
  };

  const handleFocus = () => {
    if (!isExpanded) setIsExpanded(true);
  };

  return (
    <div className="mb-8 p-6 rounded-[32px] bg-white dark:bg-surface-secondary shadow-ambient dark:shadow-none transition-all duration-300 relative">
      
      {/* Decorative Gradient Line at Top if Expanded */}
      {isExpanded && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-50 rounded-t-[32px]" />
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          <UserAvatar user={user as any} size="default" />
        </div>

        {/* Input Area */}
        <div className="flex-1">
          {/* Title input (Only visible when expanded) */}
          {isExpanded && (
            <input 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Tiêu đề thảo luận..."
              className="w-full bg-transparent border-none outline-none text-[18px] font-bold text-slate-900 dark:text-white mb-3 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={isExpanded ? 3 : 1}
              value={formData.content}
              onChange={handleContentChange}
              onFocus={handleFocus}
              placeholder={isExpanded ? "Viết chi tiết ở đây..." : `Cập nhật tình hình, chia sẻ ý tưởng với nhóm...`}
              className="w-full bg-transparent border-none outline-none resize-none text-[15px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed overflow-hidden"
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
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                          #{tag.name}
                        </span>
                      </button>
                    ))}
                  {workspaceTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                    <div className="p-4 text-center">
                      <p className="text-[12px] text-slate-500">Không tìm thấy nhãn phù hợp</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
             <div className="mt-4 flex gap-4 overflow-x-auto hidden-scrollbar">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-surface-tertiary border border-divider group">
                    {att.fileType === 'IMAGE' ? (
                       <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                    ) : (
                       <div className="flex flex-col items-center justify-center w-full h-full text-[11px] font-bold text-slate-500 p-2 text-center break-words bg-slate-50 dark:bg-surface-tertiary">
                         <FileText className="w-6 h-6 mb-1 text-slate-400" />
                         <span className="line-clamp-2 px-1">{att.fileName}</span>
                       </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)} 
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {/* Uploading Placeholder */}
                {isUploading && (
                  <div className="flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-divider flex flex-col items-center justify-center bg-slate-50 dark:bg-surface-tertiary animate-pulse">
                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-slate-400">Đang tải...</span>
                  </div>
                )}
             </div>
          )}

          {/* Action Bar (Expanded Mode) */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              
              <div className="flex items-center gap-1">
                {/* Type Selectors */}
                {['GENERAL', 'MILESTONE', 'ALERT'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFormData({...formData, type: t})}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all uppercase tracking-wider ${
                      formData.type === t 
                        ? 'bg-slate-800 text-white dark:bg-brand-secondary/20 dark:text-brand-secondary' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-surface-tertiary dark:hover:bg-white/5'
                    }`}
                  >
                    {t === 'GENERAL' ? 'Thông báo' : t === 'MILESTONE' ? '🚩 Cột mốc' : '⚠️ Cảnh báo'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 relative">
                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                  {/* Image Tool (New: Popover with URL + File options) */}
                  <input 
                    ref={imageInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Popover>
                    <PopoverTrigger className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-surface-tertiary transition-colors outline-none" title="Đính kèm ảnh">
                      <ImageIcon className="w-4 h-4" />
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
                  
                  {/* Document Tool (Cloudflare R2) */}
                  <input 
                    ref={docInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    onChange={handleDocUpload}
                  />
                  <button onClick={() => docInputRef.current?.click()} className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-surface-tertiary transition-colors" title="Đính kèm tài liệu">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  {/* Emoji Tool & Popover */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-surface-tertiary transition-colors outline-none" title="Cảm xúc">
                      <Smile className="w-4 h-4" />
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="w-auto p-0 border-none bg-transparent shadow-none z-(--z-index-popover)">
                      <EmojiPicker 
                        onEmojiClick={(e) => handleEmojiSelect(e.emoji)} 
                        lazyLoadEmojis={true}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsExpanded(false)}
                    className="rounded-full px-4 h-9 text-[13px] font-bold"
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading || isUploading || (!formData.content.trim() && attachments.length === 0)}
                    className="rounded-full px-5 h-9 bg-brand-primary hover:bg-brand-primary/90 text-white text-[13px] font-bold shadow-glow-combined"
                  >
                    {isLoading ? 'Đang gửi...' : 'Đăng bài'}
                    <Send className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
