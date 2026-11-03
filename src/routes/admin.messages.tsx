import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Trash2 } from "lucide-react";
import { useAdmin } from "../components/admin/AdminContext";
import { Empty, ErrorNote, PageTitle } from "../components/admin/AdminUi";
import { Button } from "../components/ui/button";
import { formatDateTime, timeAgo } from "../lib/admin";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessages,
});

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function AdminMessages() {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const messages = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const setRead = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => {
      const { error } = await supabase.from("messages").update({ is_read: isRead }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const list = (messages.data ?? []).filter((m) => !onlyUnread || !m.is_read);
  const unread = (messages.data ?? []).filter((m) => !m.is_read).length;

  const open = (m: Message) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.is_read) setRead.mutate({ id: m.id, isRead: true });
  };

  return (
    <div>
      <PageTitle
        title="Messages"
        description="Sent through the contact form. Reply by email."
        actions={
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
            />
            Unread only ({unread})
          </label>
        }
      />
      <ErrorNote error={messages.error || setRead.error || remove.error} />

      <div className="overflow-hidden rounded-lg border bg-white">
        {messages.isLoading ? (
          <Empty>Loading…</Empty>
        ) : list.length === 0 ? (
          <Empty>No messages.</Empty>
        ) : (
          <ul className="divide-y">
            {list.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => open(m)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-neutral-50"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.is_read ? "bg-transparent" : "bg-blue-600"}`}
                    aria-label={m.is_read ? undefined : "Unread"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <span className={`truncate ${m.is_read ? "" : "font-semibold"}`}>{m.name}</span>
                      <span className="shrink-0 text-xs text-neutral-400">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="truncate text-neutral-600">
                      <span className="font-medium text-neutral-800">{m.subject}</span> — {m.message}
                    </p>
                  </div>
                </button>
                {openId === m.id && (
                  <div className="border-t bg-neutral-50 px-4 py-4 text-sm sm:pl-9">
                    <p className="text-xs text-neutral-500">
                      {m.email} · {formatDateTime(m.created_at)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" asChild>
                        <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                          <Mail size={14} /> Reply
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRead.mutate({ id: m.id, isRead: false })}
                      >
                        Mark unread
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm("Delete this message?")) remove.mutate(m.id);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
