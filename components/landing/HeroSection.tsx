'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ParticleField } from '@/components/motion/Particles';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function HeroSection() {
  const t = useTranslations('Landing.hero');
  const locale = useLocale();
  const isRTL = locale === 'he';
  const { isAuthenticated, canUseChat, canAccessEditor, role } = useAuth();
  const router = useRouter();

  const handleEditorClick = (e: React.MouseEvent) => {
    console.log('🖱️ Editor button clicked');
    console.log('🔐 Auth state:', { 
      isAuthenticated, 
      canAccessEditor, 
      role 
    });
    
    if (!isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login');
      e.preventDefault();
      router.push('/auth/login?redirect=/editor');
      return;
    }
    
    if (!canAccessEditor) {
      console.log(`🚫 No editor access (role: ${role}), redirecting to pricing`);
      e.preventDefault();
      router.push('/pricing?reason=editor_access&current_role=' + role);
      return;
    }
    
    console.log('✅ Editor access OK, navigating...');
    router.push('/editor');
  };

  const handleChatClick = () => {
    // Navigate to dedicated chat page
    router.push('/chat');
  };

  return (
    <header 
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#FF4500] via-[#FF6B35] to-[#FF4500] text-white flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_40%)]" />
      </div>

      {/* Header Nav */}
      <nav className="relative z-20 w-full px-6 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
        >
          <div className="text-xl font-black tracking-wide">I AM RUNNING</div>
          <div className="text-xs text-white/80">AI-Powered Builder</div>
        </motion.div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <UserAvatar />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-white hover:bg-white/20 font-semibold px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base"
              >
                <Link href="/auth/login">
                  {t('login')}
                </Link>
              </Button>
              <Button
                asChild
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 font-semibold rounded-full px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base"
              >
                <Link href="/auth/signup">
                  {t('signUp')}
                  <ArrowRight className={`h-3 w-3 sm:h-4 sm:w-4 ${isRTL ? 'mr-1 sm:mr-2 rotate-180' : 'ml-1 sm:ml-2'}`} />
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-6">
        <div className="w-full max-w-5xl mx-auto text-center space-y-8">
          {/* Intro text */}
          <motion.p
            className="text-lg sm:text-xl text-white/90 font-normal max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t('intro')}
          </motion.p>

          {/* Main headline */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          >
            {t('headline')} <span className="text-[#FFA500] drop-shadow-[0_0_20px_rgba(255,165,0,0.5)]">{t('headlineHighlight')}</span>
          </motion.h1>

          {/* Subheadline with highlighted keywords */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {t('subheadline')}{' '}
            <span className="text-[#FFA500] drop-shadow-[0_0_20px_rgba(255,165,0,0.5)] font-black text-2xl">{t('quality')}</span>{' '}
            {t('subheadlineMid')}{' '}
            <span className="text-[#FFA500] drop-shadow-[0_0_20px_rgba(255,165,0,0.5)] font-black text-2xl">{t('speed')}</span>{' '}
            {t('subheadlineMid2')}{' '}
            <span className="text-[#FFA500] drop-shadow-[0_0_20px_rgba(255,165,0,0.5)] font-black text-2xl">{t('price')}</span>
            {t('subheadlineEnd')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Chat button - show for registered users (role >= 1) */}
            {canUseChat && (
              <Button
                onClick={handleChatClick}
                size="lg"
                className="px-8 py-6 text-lg font-bold bg-[#ffa500] text-white hover:bg-[#8f4701] shadow-lg hover:shadow-[0_0_30px_rgba(143,71,1,0.5)] transition-all duration-300 rounded-full min-w-[200px]"
              >
                {t('enterChat')}
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            )}

            {/* Editor button - only for role >= 2 */}
            {canAccessEditor && (
              <Button
                onClick={handleEditorClick}
                size="lg"
                className="px-8 py-6 text-lg font-bold bg-[#ffa500] text-white hover:bg-[#8f4701] shadow-lg hover:shadow-[0_0_30px_rgba(143,71,1,0.5)] transition-all duration-300 rounded-full min-w-[200px]"
              >
                {t('enterEditor')}
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            )}

            {/* Upgrade CTA for role 1 who can't access editor */}
            {isAuthenticated && !canAccessEditor && (
              <Button
                onClick={() => router.push('/pricing?reason=editor_access&current_role=1')}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold border-2 border-[#ffa500] text-[#ffa500] hover:bg-[#ffa500] hover:text-white shadow-lg transition-all duration-300 rounded-full min-w-[200px]"
              >
                ⭐ Upgrade to Create Websites
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            )}

            {/* Sign up CTA for guests */}
            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                className="px-8 py-6 text-lg font-bold bg-[#ffa500] text-white hover:bg-[#8f4701] shadow-lg hover:shadow-[0_0_30px_rgba(143,71,1,0.5)] transition-all duration-300 rounded-full min-w-[200px]"
              >
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to white/black */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
    </header>
  );
}


