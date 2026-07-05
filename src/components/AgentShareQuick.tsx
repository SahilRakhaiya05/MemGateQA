import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { getUserId } from '../lib/userId';
import { useToast } from './Toast';

export interface AgentShareTarget {
  id: string;
  agent: string;
  publishSlug?: string;
  visibility?: string;
  sharePath?: string | null;
}

interface AgentShareQuickProps {
  agent: AgentShareTarget;
  onUpdated?: () => void;
  compact?: boolean;
}

export function AgentShareQuick({ agent, onUpdated, compact }: AgentShareQuickProps) {
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>(
    agent.visibility === 'unlisted' ? 'unlisted' : 'public',
  );
  const [busy, setBusy] = useState(false);
  const [webhookOn, setWebhookOn] = useState(false);
  const [sharePath, setSharePath] = useState(
    agent.sharePath ?? (agent.publishSlug && agent.visibility !== 'private' ? `/share/${agent.publishSlug}` : ''),
  );

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setWebhookOn(Boolean(s.settings.webhooks?.enabled && s.settings.webhooks?.url)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const path =
      agent.sharePath ??
      (agent.publishSlug && agent.visibility !== 'private' ? `/share/${agent.publishSlug}` : '');
    setSharePath(path);
    if (agent.visibility === 'unlisted') setVisibility('unlisted');
    else if (agent.visibility === 'public') setVisibility('public');
  }, [agent.sharePath, agent.publishSlug, agent.visibility]);

  const shareUrl = sharePath ? `${window.location.origin}${sharePath}` : '';

  const publish = async () => {
    setBusy(true);
    try {
      const res = await api.publishAgent(agent.id, {
        ownerId: getUserId(),
        visibility,
      });
      setSharePath(res.sharePath);
      const url = `${window.location.origin}${res.sharePath}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast('Published — share link copied', 'success');
      onUpdated?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Publish failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      await api.publishAgent(agent.id, { visibility: 'private' });
      setSharePath('');
      toast('Agent is private', 'info');
      onUpdated?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unpublish failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast('Link copied', 'success');
  };

  const testWebhook = async () => {
    try {
      const res = await api.testWebhook('agent.publish', {
        caseId: agent.id,
        agent: agent.agent,
        sharePath: sharePath || '(not published yet)',
      });
      const msg = res.skipped
        ? `Webhook skipped: ${res.reason ?? 'disabled'}`
        : res.ok
          ? 'Webhook delivered'
          : res.error ?? 'Webhook failed';
      toast(msg, res.ok && !res.skipped ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Webhook test failed', 'error');
    }
  };

  if (compact) {
    return (
      <div className="agent-share-quick compact">
        {sharePath ? (
          <>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" onClick={copyLink} type="button">
              Copy link
            </button>
            <Link className="ent-btn ent-btn-ghost ent-btn-sm" target="_blank" to={sharePath}>
              Preview
            </Link>
          </>
        ) : (
          <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy} onClick={publish} type="button">
            {busy ? '…' : 'Publish link'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="agent-share-quick">
      <div className="flex flex-wrap gap-2">
        <button
          className={`ent-btn ent-btn-sm ${visibility === 'public' ? 'ent-btn-primary' : 'ent-btn-secondary'}`}
          onClick={() => setVisibility('public')}
          type="button"
        >
          Public
        </button>
        <button
          className={`ent-btn ent-btn-sm ${visibility === 'unlisted' ? 'ent-btn-primary' : 'ent-btn-secondary'}`}
          onClick={() => setVisibility('unlisted')}
          type="button"
        >
          Unlisted
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy} onClick={publish} type="button">
          {busy ? 'Publishing…' : sharePath ? 'Update link' : 'Publish & copy'}
        </button>
        {sharePath ? (
          <>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" onClick={copyLink} type="button">
              Copy
            </button>
            <Link className="ent-btn ent-btn-ghost ent-btn-sm" target="_blank" to={sharePath}>
              Preview
            </Link>
            <button className="ent-btn ent-btn-ghost ent-btn-sm" disabled={busy} onClick={unpublish} type="button">
              Private
            </button>
          </>
        ) : null}
      </div>

      {shareUrl ? (
        <div className="agent-publish-url-box">
          <p className="font-hud text-[9px] uppercase text-emerald-400">Share URL</p>
          <p className="mt-1 break-all font-mono text-xs text-emerald-200">{shareUrl}</p>
        </div>
      ) : null}

      <div className="agent-publish-webhook-row">
        <p className="text-xs text-slate-500">
          Webhook {webhookOn ? 'on' : 'off'}
          {webhookOn ? ' · fires on publish & ship-clear' : ' — '}
          <Link className="text-cyan-400" to="/settings">
            Settings
          </Link>
        </p>
        {webhookOn ? (
          <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={testWebhook} type="button">
            Test
          </button>
        ) : null}
      </div>
    </div>
  );
}