import { RegistrationForm } from '@/components/auth/RegistrationForm';

export function JoinTheRace() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-200">Join the race</p>
            <h2 className="text-3xl sm:4xl font-bold mt-3">Run with us toward effortless web development</h2>
            <p className="text-white/80 mt-3">
              Sign up to start building. We’ll guide you through the sprint: describe, generate, customize — all under 30
              minutes.
            </p>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              <li>• Email + password signup (socials coming next phase)</li>
              <li>• Profiles ready for roles, interests, and subscription tier</li>
              <li>• Built on Supabase Auth with verification support</li>
            </ul>
          </div>
          <div className="bg-white text-foreground rounded-2xl shadow-xl p-6">
            <div className="mb-4">
              <div className="text-sm font-semibold text-primary uppercase tracking-wide">Create account</div>
              <p className="text-sm text-muted-foreground">Start free — no credit card required.</p>
            </div>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}


