import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ArrowBigUpDash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isApple);

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the customized install prompt
      if (!isStandaloneMode) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS and not standalone, show banner after a delay
    if (isApple && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 left-4 right-4 z-[200] md:left-auto md:right-8 md:max-w-sm">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-gold/20 relative overflow-hidden"
        >
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-900/20">
              <Download size={24} className="text-black" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Instale o BarberPro</h3>
              <p className="text-zinc-400 text-sm leading-snug">Tenha acesso rápido e use offline como um aplicativo nativo.</p>
            </div>
          </div>

          {isIos ? (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-3">
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center">
                    <Share size={14} className="text-blue-400" />
                  </div>
                  <span>1. Toque no botão de <strong>Compartilhar</strong> abaixo</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center">
                    <PlusSquare size={14} className="text-zinc-300" />
                  </div>
                  <span>2. Role e selecione <strong>"Tela de Início"</strong></span>
                </div>
              </div>
              <div className="flex justify-center">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-gold"
                >
                  <ArrowBigUpDash size={24} />
                </motion.div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform"
            >
              <Download size={18} />
              ADICIONAR À TELA DE INÍCIO
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
