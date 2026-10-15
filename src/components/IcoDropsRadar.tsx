import React, { useState } from 'react';
import {
  Flame,
  Clock,
  ExternalLink,
  TrendingUp,
  FileText,
  Filter,
  Globe,
  ArrowRight
} from 'lucide-react';
import { icoProjects, type IcoProject } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

export const IcoDropsRadar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'ended'>('active');
  const [selectedChain, setSelectedChain] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<IcoProject | null>(null);

  const chains = ['All', 'Ethereum', 'Solana', 'Base', 'Sui', 'Arbitrum'];

  // Filter projects by status and chain
  const filteredProjects = icoProjects.filter((p) => {
    if (p.status !== activeTab) return false;
    if (selectedChain !== 'All' && p.platform !== selectedChain) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner: ICO Drops Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/20 to-purple-950/20 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              ICO Drops Radar
            </span>
            <span className="text-slate-400 text-[10px] sm:text-[11px]">Curated Web3 Launchpad & Presale Database</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Token Presales, IDOs & Launchpad Radar
          </h2>
          <p className="text-slate-400 text-[11px] sm:text-xs">
            Track active token offerings, upcoming whitelist stages, and all-time ROI on public sales.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex w-full sm:w-auto p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveTab('active');
              cypherSound.playBlip(600);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition font-bold whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active ICOs
          </button>
          <button
            onClick={() => {
              setActiveTab('upcoming');
              cypherSound.playBlip(600);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition font-bold whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'upcoming'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Upcoming
          </button>
          <button
            onClick={() => {
              setActiveTab('ended');
              cypherSound.playBlip(600);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition font-bold whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'ended'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Ended & ROI
          </button>
        </div>
      </div>

      {/* Platform / Chain Filter Chips */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[10px] sm:text-[11px]">Chain:</span>
          {chains.map((chain) => (
            <button
              key={chain}
              onClick={() => {
                setSelectedChain(chain);
                cypherSound.playBlip(550, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] whitespace-nowrap transition font-bold ${
                selectedChain === chain
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block shrink-0">
          Showing <strong>{filteredProjects.length}</strong> {activeTab} offerings
        </div>
      </div>

      {/* ICO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const progressPercent = Math.min(
            100,
            Math.round((project.raisedAmount / project.targetRaise) * 100)
          );

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition duration-200 cursor-pointer space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header row: Icon, Name, Symbol, Hype */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={project.icon}
                      alt={project.name}
                      className="w-10 h-10 rounded-xl bg-slate-900 p-1 border border-slate-800 group-hover:scale-105 transition"
                    />
                    <div>
                      <div className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition">
                        {project.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {project.symbol}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[10px] text-cyan-400 font-semibold">
                          {project.platform}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interest Hype Badge */}
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                      project.interestHype === 'Very High'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : project.interestHype === 'High'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {project.interestHype} Hype
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                {/* Sale Details Strip */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Token Price:</span>
                    <span className="text-amber-300 font-bold">${project.tokenPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Fundraising Goal:</span>
                    <span className="text-white font-bold">
                      ${(project.targetRaise / 1e6).toFixed(2)}M
                    </span>
                  </div>
                </div>

                {/* Status-specific progress or ROI */}
                {activeTab === 'active' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">
                        Raised: ${(project.raisedAmount / 1e6).toFixed(2)}M
                      </span>
                      <span className="text-cyan-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Start: {project.startDate}</span>
                      <span>Ends: {project.endDate}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'upcoming' && (
                  <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] space-y-1">
                    <div className="flex justify-between text-amber-300">
                      <span>Whitelist: {project.whitelist ? 'Required' : 'Open'}</span>
                      <span>KYC: {project.kyc ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Sale starts: {project.startDate}</div>
                  </div>
                )}

                {activeTab === 'ended' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-center">
                      <span className="text-[10px] text-slate-400 block">USD ROI:</span>
                      <span className="text-emerald-400 font-extrabold text-sm">
                        {project.roiUsd || 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-center">
                      <span className="text-[10px] text-slate-400 block">ETH ROI:</span>
                      <span className="text-indigo-300 font-extrabold text-sm">
                        {project.roiEth || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{project.category}</span>
                <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition text-[11px]">
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#090b11] border border-slate-800 shadow-2xl p-6 space-y-5 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProject.icon}
                  alt={selectedProject.name}
                  className="w-12 h-12 rounded-xl bg-slate-900 p-1 border border-slate-800"
                />
                <div>
                  <h3 className="text-lg font-extrabold text-white">{selectedProject.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {selectedProject.symbol}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {selectedProject.platform}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedProject.stage}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">{selectedProject.description}</p>

            {/* Sale Specification Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Token Price:</span>
                <span className="text-amber-400 font-bold">${selectedProject.tokenPrice}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Hard Cap:</span>
                <span className="text-white font-bold">
                  ${(selectedProject.targetRaise / 1e6).toFixed(2)}M
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Whitelist:</span>
                <span className="text-slate-300">{selectedProject.whitelist ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">KYC Required:</span>
                <span className="text-slate-300">{selectedProject.kyc ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Official Links */}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={selectedProject.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:underline flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" /> Project Website
              </a>
              <a
                href={selectedProject.whitepaper}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:underline flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Whitepaper
              </a>
              <a
                href={selectedProject.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Official X (Twitter)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
