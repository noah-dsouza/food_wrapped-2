import React, { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

const DEMO_EMAIL = 'demo@foodwrapped.app';
const DEMO_PASSWORD = 'wrapitup';

interface SignInProps {
  onSuccess: () => void;
}

export function SignIn({ onSuccess }: SignInProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const emailMatch = form.email.trim().toLowerCase() === DEMO_EMAIL;
      const passwordMatch = form.password === DEMO_PASSWORD;

      if (emailMatch && passwordMatch) {
        localStorage.setItem('food-wrapped-demo-auth', 'true');
        onSuccess();
      } else {
        setError('Use the provided demo credentials to sign in.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-semibold">Food Wrapped</h1>
            <p className="text-muted-foreground">
              A meal journal with a yearly wrapped experience.
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Demo credentials</p>
            <p>
              <span className="text-foreground">Email:</span> {DEMO_EMAIL}
            </p>
            <p>
              <span className="text-foreground">Password:</span> {DEMO_PASSWORD}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Enter
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
