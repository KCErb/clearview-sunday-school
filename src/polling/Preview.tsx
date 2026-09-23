import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { demoApi, resetDemo, setDemoOffline } from './demo';
import { Teacher } from './Teacher';
import { Participant } from './Participant';
import { Stage } from '@/decks/Stage';
export default function PollPreview() {
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(false);
  const [version, setVersion] = useState(0);
  const teacher = pathname.endsWith('/manage');
  const stage = pathname.endsWith('/stage');
  return (
    <>
      <div className="preview-toolbar">
        <strong>Design preview · Sample data</strong>
        <Link to="/preview/polls">Participant</Link>
        <Link to="/preview/polls/manage">Teacher + phone</Link>
        <Link to="/preview/polls/stage">Screen</Link>
        <label>
          <input
            type="checkbox"
            checked={offline}
            onChange={(e) => {
              setOffline(e.target.checked);
              setDemoOffline(e.target.checked);
            }}
          />
          Pause connection
        </label>
        <button
          onClick={() => {
            resetDemo();
            setVersion((v) => v + 1);
          }}
        >
          Reset sample questions
        </button>
      </div>
      <div key={version} className={teacher ? 'preview-layout' : ''}>
        {stage ? (
          <Stage api={demoApi} />
        ) : teacher ? (
          <>
            <Teacher api={demoApi} preview />
            <Participant api={demoApi} preview embedded />
          </>
        ) : (
          <Participant api={demoApi} preview />
        )}
      </div>
    </>
  );
}
