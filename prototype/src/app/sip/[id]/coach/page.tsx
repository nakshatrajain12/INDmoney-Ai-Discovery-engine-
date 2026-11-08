'use client';

import React, { useEffect, useState, use } from 'react';
import { useDemo } from '@/context/DemoContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { CoachCard } from '@/components/coach/CoachCard';
import type { CoachResponse } from '@/contracts/coach';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CoachPage({ params }: PageProps) {
  const { id } = use(params);
  const { asOf, llmEnabled } = useDemo();

  const [coachData, setCoachData] = useState<CoachResponse | null>(null);
  const [schemeName, setSchemeName] = useState<string>('Your SIP');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial coach response
  useEffect(() => {
    let cancelled = false;

    async function loadCoach() {
      setIsLoading(true);
      try {
        const [coachRes, sipRes] = await Promise.all([
          fetch(`/api/v1/sips/${id}/coach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intent: 'EXPLAIN_RETURN',
              asOf
            })
          }),
          fetch(`/api/v1/sips/${id}?asOf=${asOf}`)
        ]);

        if (coachRes.ok) {
          const json = await coachRes.json();
          if (!cancelled) setCoachData(json.data);
        }

        if (sipRes.ok) {
          const sJson = await sipRes.json();
          if (!cancelled && sJson.data?.sip?.schemeName) {
            setSchemeName(sJson.data.sip.schemeName);
          }
        }
      } catch (err) {
        console.error('Failed to load coach data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCoach();

    return () => {
      cancelled = true;
    };
  }, [id, asOf, llmEnabled]);

  const handleAskQuestion = async (question: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/sips/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'EXPLAIN_RETURN',
          prompt: question,
          asOf
        })
      });

      if (res.ok) {
        const json = await res.json();
        setCoachData(json.data);
      }
    } catch (err) {
      console.error('Failed to process follow-up question:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 px-4 py-3 space-y-4">
      <AppHeader
        title="Return Coach"
        eyebrow="Understand My Returns"
        showBack
        backHref={`/sip/${id}`}
      />

      {isLoading && !coachData ? (
        <div className="rounded-2xl border border-border bg-s1 p-12 text-center text-xs text-t2 space-y-2">
          <div className="h-4 w-32 mx-auto rounded bg-s2 animate-pulse" />
          <div>Explaining your SIP figures...</div>
        </div>
      ) : coachData ? (
        <CoachCard
          data={coachData}
          schemeName={schemeName}
          onAskQuestion={handleAskQuestion}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-s1 p-6 text-center text-xs text-t2">
          Could not load the return explanation.
        </div>
      )}
    </main>
  );
}

