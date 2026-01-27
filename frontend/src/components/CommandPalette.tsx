/**
 * Command Palette - Quick navigation and actions with keyboard shortcuts
 * Activate with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Type,
  Image,
  Share2,
  TrendingUp,
  Users,
  BookOpen,
  Wallet,
  Search,
  Sparkles,
} from 'lucide-react';
import { scaleVariants } from '../utils/animations';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Toggle command palette with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on escape
  useEffect(() => {
    if (open) {
      const down = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };
      document.addEventListener('keydown', down);
      return () => document.removeEventListener('keydown', down);
    }
  }, [open]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      setOpen(false);
      setSearch('');
    },
    [navigate]
  );

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Go to dashboard home',
      icon: Home,
      action: () => handleNavigate('/dashboard'),
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'script',
      label: 'Script Generator',
      description: 'Generate video scripts with AI',
      icon: FileText,
      action: () => handleNavigate('/dashboard/script'),
      keywords: ['script', 'video', 'generate', 'ai'],
    },
    {
      id: 'titles',
      label: 'Title Generator',
      description: 'Create catchy titles',
      icon: Type,
      action: () => handleNavigate('/dashboard/titles'),
      keywords: ['title', 'headline', 'generate'],
    },
    {
      id: 'thumbnails',
      label: 'Thumbnail Ideas',
      description: 'Get thumbnail design ideas',
      icon: Image,
      action: () => handleNavigate('/dashboard/thumbnails'),
      keywords: ['thumbnail', 'image', 'design', 'visual'],
    },
    {
      id: 'social',
      label: 'Social Captions',
      description: 'Generate social media captions',
      icon: Share2,
      action: () => handleNavigate('/dashboard/social'),
      keywords: ['social', 'caption', 'instagram', 'twitter', 'facebook'],
    },
    {
      id: 'seo',
      label: 'SEO Optimizer',
      description: 'Optimize content for search engines',
      icon: TrendingUp,
      action: () => handleNavigate('/dashboard/seo'),
      keywords: ['seo', 'search', 'optimize', 'ranking'],
    },
    {
      id: 'personas',
      label: 'My Personas',
      description: 'Manage your content personas',
      icon: Users,
      action: () => handleNavigate('/dashboard/personas'),
      keywords: ['persona', 'character', 'voice', 'profile'],
    },
    {
      id: 'marketplace',
      label: 'Brand Marketplace',
      description: 'Connect with brands',
      icon: Users,
      action: () => handleNavigate('/dashboard/marketplace'),
      keywords: ['brand', 'collaboration', 'sponsor', 'partnership'],
    },
    {
      id: 'courses',
      label: 'Learning Center',
      description: 'Access courses and tutorials',
      icon: BookOpen,
      action: () => handleNavigate('/dashboard/courses'),
      keywords: ['course', 'learn', 'tutorial', 'education'],
    },
    {
      id: 'wallet',
      label: 'Wallet',
      description: 'Manage your wallet and transactions',
      icon: Wallet,
      action: () => handleNavigate('/dashboard/wallet'),
      keywords: ['wallet', 'money', 'transactions', 'earnings'],
    },
  ];

  return (
    <>
      {/* Trigger Button (optional - can be placed in header) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Quick search</span>
        <kbd className="ml-auto px-2 py-0.5 text-xs bg-white rounded border border-gray-300">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Command Dialog */}
            <motion.div
              variants={scaleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl z-50"
            >
              <Command
                className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                shouldFilter={true}
              >
                <div className="flex items-center border-b border-gray-200 px-4">
                  <Search className="h-5 w-5 text-gray-400 mr-3" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Type a command or search..."
                    className="w-full py-4 text-base bg-transparent border-none outline-none placeholder:text-gray-400"
                  />
                  <kbd className="hidden sm:block px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-96 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-gray-500">
                    No results found.
                  </Command.Empty>

                  <Command.Group heading="Navigation" className="px-2 py-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">NAVIGATION</div>
                    {commands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={`${command.label} ${command.description} ${command.keywords?.join(' ')}`}
                        onSelect={() => command.action()}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white group-hover:scale-110 transition-transform">
                          <command.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{command.label}</div>
                          {command.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{command.description}</div>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>

                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↵</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white rounded border border-gray-300">ESC</kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500" />
                    <span className="text-indigo-600 font-medium">CreatorX</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
