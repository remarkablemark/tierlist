import { TierListProvider } from '../../store/tierListContext';
import { TierList } from '../TierList';

export function App(): React.ReactElement {
  return (
    <main className="bg-slate-100 py-8 dark:bg-slate-950">
      <TierListProvider>
        <TierList />
      </TierListProvider>
    </main>
  );
}
