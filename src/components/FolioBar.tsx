'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FolioBar() {
  const pathname = usePathname();

  return (
    <nav className="folio-bar">
      <Link href="/" className="folio-brand">
        nl→sql
      </Link>
      <ul className="folio-nav">
        <li>
          <Link href="/" data-active={pathname === '/'}>
            console
          </Link>
        </li>
        <li>
          <Link href="/how-it-works" data-active={pathname === '/how-it-works'}>
            how it works
          </Link>
        </li>
        <li>
          <a
            href="https://github.com/0CCHacker"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tai Huynh
          </a>
        </li>
      </ul>
    </nav>
  );
}
