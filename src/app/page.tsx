import DrumSequencer from '../components/DrumSequencer';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function Home() {
  return (
    <main>
      <ErrorBoundary>
        <DrumSequencer />
      </ErrorBoundary>
    </main>
  );
}
