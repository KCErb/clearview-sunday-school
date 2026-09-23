import { useEffect, useState } from 'react';
import type { PollApi, Stage as StageState } from '@/polling/types';
import { useRefresh } from '@/polling/useRefresh';
import { SlideFrame } from './SlideFrame';

/** The screen in the room. No chrome, no controls — it only follows the teacher's phone. */
export function Stage({ api }: { api: PollApi }) {
  const [stage, setStage] = useState<StageState | null>(null);
  const [started, setStarted] = useState(false);
  useRefresh(async () => {
    try {
      setStage(await api.stage());
      setStarted(true);
    } catch {
      // A blip on the chapel wi-fi must never blank the screen mid-lesson.
    }
  });
  useEffect(() => {
    document.title = stage ? stage.deck.title : 'Clearview Ward Sunday School';
  }, [stage]);
  return (
    <div className="stage">
      {stage ? (
        <SlideFrame key={`${stage.deck.id}:${stage.slide.idx}`} html={stage.slide.html} fit="contain" />
      ) : (
        <div className="stage-idle">
          <span>Clearview Ward</span>
          <p>{started ? 'Ready when you are.' : 'Connecting…'}</p>
        </div>
      )}
    </div>
  );
}
