import { useState, useCallback } from 'react';
import { GitHubSettings, TrendFitSnapshot } from '../types';

export interface UseGitHubSyncReturn {
  isConfigured: boolean;
  syncing: boolean;
  syncStatus: { type: 'success' | 'error'; message: string } | null;
  syncPull: () => Promise<void>;
  syncPush: () => Promise<void>;
}

export function useGitHubSync(
  githubSettings: GitHubSettings,
  getSnapshotJSON: () => TrendFitSnapshot | Promise<TrendFitSnapshot>,
  importSnapshotJSON: (data: TrendFitSnapshot, mode?: 'merge' | 'replace') => Promise<void>
): UseGitHubSyncReturn {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isConfigured = Boolean(
    githubSettings?.owner &&
    githubSettings?.repo &&
    githubSettings?.token
  );

  // Helper to encode UTF-8 to Base64 in browser safely
  const utf8ToBase64 = (str: string): string => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  // Helper to decode Base64 to UTF-8 in browser safely
  const base64ToUtf8 = (str: string): string => {
    return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };

  const syncPull = useCallback(async () => {
    if (!isConfigured) {
      setSyncStatus({ type: 'error', message: 'Configuração do GitHub incompleta.' });
      return;
    }

    setSyncing(true);
    setSyncStatus(null);

    try {
      const { owner, repo, path = 'data.json', token } = githubSettings;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (res.status === 404) {
        setSyncStatus({ type: 'error', message: 'Arquivo de backup não encontrado no repositório.' });
        return;
      }

      if (!res.ok) {
        throw new Error(`Erro GitHub (${res.status}): ${res.statusText}`);
      }

      const fileData = await res.json();
      const contentUtf8 = base64ToUtf8(fileData.content);
      const parsedData: TrendFitSnapshot = JSON.parse(contentUtf8);

      await importSnapshotJSON(parsedData, 'merge');
      setSyncStatus({ type: 'success', message: 'Dados baixados e sincronizados com sucesso!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao sincronizar com GitHub.';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setSyncing(false);
    }
  }, [githubSettings, isConfigured, importSnapshotJSON]);

  const syncPush = useCallback(async () => {
    if (!isConfigured) {
      setSyncStatus({ type: 'error', message: 'Configuração do GitHub incompleta.' });
      return;
    }

    setSyncing(true);
    setSyncStatus(null);

    try {
      const { owner, repo, path = 'data.json', token } = githubSettings;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // 1. Get current SHA if file already exists
      let sha: string | undefined = undefined;
      const getRes = await fetch(url, { headers });
      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }

      // 2. Prepare snapshot & base64
      const snapshot = await getSnapshotJSON();
      const jsonString = JSON.stringify(snapshot, null, 2);
      const contentBase64 = utf8ToBase64(jsonString);

      // 3. PUT commit
      const body = {
        message: `trendfit: sync snapshot ${new Date().toISOString()}`,
        content: contentBase64,
        ...(sha ? { sha } : {})
      };

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Erro HTTP ${putRes.status}`);
      }

      setSyncStatus({ type: 'success', message: 'Snapshot salvo no GitHub com sucesso!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar no GitHub.';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setSyncing(false);
    }
  }, [githubSettings, isConfigured, getSnapshotJSON]);

  return {
    isConfigured,
    syncing,
    syncStatus,
    syncPull,
    syncPush
  };
}
