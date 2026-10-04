import React, { useState, useEffect } from 'react';
import { Download, Upload, Github, RefreshCw, Database, CheckCircle, AlertCircle, Sparkles, Scale, Check, KeyRound, Lock } from 'lucide-react';
import { GitHubSettings, UserProfile, TrendFitSnapshot } from '../types';
import { UseGitHubSyncReturn } from '../hooks/useGitHubSync';

export interface DataSyncPanelProps {
  getSnapshotJSON: () => TrendFitSnapshot | Promise<TrendFitSnapshot>;
  importSnapshotJSON: (data: TrendFitSnapshot, mode?: 'merge' | 'replace') => Promise<void>;
  githubSettings: GitHubSettings;
  updateGithubSettings: (settings: Partial<GitHubSettings>) => Promise<void>;
  gitHubSync: UseGitHubSyncReturn;
  seedMockData: () => Promise<void>;
  profile?: UserProfile;
  updateProfile?: (profile: Partial<UserProfile>) => Promise<void>;
}

export default function DataSyncPanel({
  getSnapshotJSON,
  importSnapshotJSON,
  githubSettings,
  updateGithubSettings,
  gitHubSync,
  seedMockData,
  profile,
  updateProfile
}: DataSyncPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'github'>('profile');
  const [targetWeight, setTargetWeight] = useState<string>(profile?.targetWeightKg ? String(profile.targetWeightKg) : '75.0');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for GitHub Credentials with Bitwarden / Auto-fill support
  const [ownerInput, setOwnerInput] = useState<string>(githubSettings.owner || '');
  const [repoInput, setRepoInput] = useState<string>(githubSettings.repo || '');
  const [tokenInput, setTokenInput] = useState<string>(githubSettings.token || '');

  useEffect(() => {
    if (profile?.targetWeightKg) {
      setTargetWeight(String(profile.targetWeightKg));
    }
  }, [profile]);

  useEffect(() => {
    setOwnerInput(githubSettings.owner || '');
    setRepoInput(githubSettings.repo || '');
    setTokenInput(githubSettings.token || '');
  }, [githubSettings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetWeight);
    if (isNaN(val) || val <= 0) {
      setStatusMsg({ type: 'error', text: 'Informe um valor de peso de meta válido.' });
      return;
    }
    try {
      if (updateProfile) {
        await updateProfile({ targetWeightKg: val });
        setStatusMsg({ type: 'success', text: `Meta de peso atualizada para ${val} kg!` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar meta.';
      setStatusMsg({ type: 'error', text: msg });
    }
  };

  const handleSaveGithubCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateGithubSettings({
        owner: ownerInput.trim(),
        repo: repoInput.trim(),
        token: tokenInput.trim()
      });
      setStatusMsg({ type: 'success', text: 'Credenciais do GitHub salvas com sucesso no banco local!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar credenciais.';
      setStatusMsg({ type: 'error', text: msg });
    }
  };

  // Download manual JSON
  const handleDownloadBackup = async () => {
    const data = await getSnapshotJSON();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `trendfit-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMsg({ type: 'success', text: 'Backup JSON baixado com sucesso!' });
  };

  // Upload file restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        await importSnapshotJSON(parsed, importMode);
        setStatusMsg({ type: 'success', text: 'Backup restaurado com sucesso!' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao restaurar backup.';
        setStatusMsg({ type: 'error', text: msg });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm space-y-5">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" /> Configurar Meta
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'backup'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" /> Backup Manual (JSON)
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`text-xs font-bold pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'github'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Github className="w-4 h-4" /> GitHub Sync (Bitwarden)
        </button>
      </div>

      {/* Alert banner */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span className="flex items-center gap-1.5">
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {statusMsg.text}
          </span>
          <button onClick={() => setStatusMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Profile & Target Weight Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-teal-600" /> Sua Meta de Peso Corporal
            </h3>
            <p className="text-xs text-slate-600">
              Defina o peso que você deseja alcançar. Este valor aparecerá no topo do app e como uma linha verde pontilhada de referência no gráfico de tendência.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-32 text-center text-xl font-bold bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-slate-600 font-bold text-sm ml-2">kg</span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" /> Salvar Meta
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
              Exportar Snapshot Local
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Gera um arquivo JSON completo com seus registros de peso, metas e treinos.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Baixar Backup (.json)
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Restaurar Backup
            </h3>

            <div className="flex gap-4 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="accent-teal-600"
                />
                Mesclar com dados existentes
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="accent-teal-600"
                />
                Substituir dados atuais
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer flex items-center gap-2 justify-center">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Selecionar Arquivo .json</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Seed demo data */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Quer testar o app com dados de exemplo?
            </div>
            <button
              onClick={seedMockData}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-xl hover:bg-amber-100 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Carregar Dados Demo
            </button>
          </div>
        </div>
      )}

      {/* GitHub Sync Tab with Bitwarden / Password Manager Integration */}
      {activeTab === 'github' && (
        <div className="space-y-4">
          {/* Password Manager Autocomplete Info Box */}
          <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl text-xs text-teal-900 leading-relaxed flex items-start gap-2.5">
            <KeyRound className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-teal-950 font-bold mb-0.5">Suporte a Autopreenchimento (Bitwarden, 1Password, Chrome)</strong>
              Este formulário usa tags semânticas padronizadas. Se você salvar seu token e usuário no Bitwarden ou gerenciador de senhas, o aplicativo autopreencherá os campos na hora. Uma vez salvas, as chaves ficam gravadas no seu dispositivo local.
            </div>
          </div>

          {/* Semantic Form wrapper for Password Manager detection */}
          <form
            id="github-sync-credentials-form"
            name="github-sync-credentials-form"
            onSubmit={handleSaveGithubCredentials}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="github-owner" className="text-xs font-semibold text-slate-700 block mb-1">
                  Dono / Usuário GitHub (Username):
                </label>
                <input
                  id="github-owner"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="ex: matheus (Bitwarden)"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="github-repo" className="text-xs font-semibold text-slate-700 block mb-1">
                  Repositório de Backup (Repo):
                </label>
                <input
                  id="github-repo"
                  name="github-repo"
                  type="text"
                  autoComplete="off"
                  placeholder="ex: trendfit-data"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="github-token" className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Personal Access Token (Fine-grained):</span>
                  <span className="text-[10px] text-slate-500 font-normal">Permissão: Contents (Read & write)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="github-token"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="github_pat_... (Bitwarden / Autopreencher)"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar Credenciais no Banco Local
              </button>
            </div>
          </form>

          {/* Sync actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={gitHubSync.syncPull}
              disabled={gitHubSync.syncing}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-teal-600" /> Baixar do GitHub
            </button>

            <button
              onClick={gitHubSync.syncPush}
              disabled={gitHubSync.syncing}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${gitHubSync.syncing ? 'animate-spin' : ''}`} /> Enviar ao GitHub
            </button>
          </div>

          {gitHubSync.syncStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              gitHubSync.syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {gitHubSync.syncStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
