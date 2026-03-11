import { useState } from 'react';

import { brands } from './brands';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="max-w-(--breakpoint-xl) p-8 text-center dark:bg-slate-900 dark:text-slate-100">
      <div className="flex justify-center">
        {brands.map(({ alt, href, src }) => (
          <a key={href} href={href} rel="nofollow noopener" target="_blank">
            <img
              src={src}
              className="m-4 h-24 hover:drop-shadow-2xl"
              alt={alt}
            />
          </a>
        ))}
      </div>

      <h1 className="my-10 text-5xl font-bold">Vite + React + Tailwind</h1>

      <div className="p-8">
        <button
          className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-center text-sm font-medium text-slate-800 shadow-xs transition-all hover:border-slate-800 focus:border-slate-800 focus:bg-slate-50 active:border-slate-800 active:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:border-slate-500 dark:focus:bg-slate-800 dark:active:border-slate-500 dark:active:bg-slate-800"
          onClick={() => {
            setCount((count) => count + 1);
          }}
          type="button"
        >
          count is {count}
        </button>

        <p className="my-4 text-slate-600 dark:text-slate-400">
          Edit{' '}
          <code className="font-[monospace]">src/components/App/App.tsx</code>{' '}
          and save to test HMR
        </p>
      </div>

      <p className="text-slate-400 dark:text-slate-500">
        Click on the Vite, React, and Tailwind logos to learn more
      </p>
    </main>
  );
}
