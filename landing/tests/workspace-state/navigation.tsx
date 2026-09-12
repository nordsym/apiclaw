import React, { useSyncExternalStore } from 'react';
const listeners = new Set<()=>void>();
let query = new URLSearchParams(location.search);
export function navigate(url: string) { history.replaceState({}, '', url); query = new URLSearchParams(location.search); listeners.forEach(f=>f()); }
const router = {push:navigate,replace:navigate};
export const useRouter = () => router;
export const useSearchParams = () => useSyncExternalStore((f)=>{listeners.add(f);return()=>{listeners.delete(f);};},()=>query);
export const notFound = () => { throw new Error('Not found'); };
export default function Link({href,children,...props}:any) { return <a href={href} {...props}>{children}</a>; }
