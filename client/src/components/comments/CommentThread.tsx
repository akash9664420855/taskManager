import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { commentsApi } from '@/api/comments.api';
import { extractApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { fmtRelative } from '@/lib/format';

export function CommentThread({ taskId }: { taskId: string }) {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId, { limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (text: string) => commentsApi.create(taskId, text),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (err) => toast.error(extractApiError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: (err) => toast.error(extractApiError(err).message),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [commentsQuery.data]);

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  return (
    <div className="flex flex-col">
      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto scrollbar-thin pr-1">
        {commentsQuery.isLoading ? (
          <>
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3" />
          </>
        ) : commentsQuery.data && commentsQuery.data.items.length > 0 ? (
          commentsQuery.data.items.map((c) => {
            const canDelete = me?.role === 'admin' || me?._id === c.author._id;
            return (
              <div key={c._id} className="group flex gap-3">
                <UserAvatar user={c.author} size="sm" />
                <div className="min-w-0 flex-1 rounded-lg border bg-card/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{c.author.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground" title={c.createdAt}>
                        {fmtRelative(c.createdAt)}
                      </span>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => {
                          if (confirm('Delete this comment?')) deleteMutation.mutate(c._id);
                        }}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
            No comments yet — start the conversation.
          </p>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 border-t pt-3">
        <UserAvatar user={me} size="sm" />
        <Textarea
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
          }}
          rows={2}
          className="flex-1"
        />
        <Button onClick={submit} disabled={createMutation.isPending || !body.trim()}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only sm:not-sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
